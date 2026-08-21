# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project rule: no em dashes

`project_requirments.md` bans em dashes anywhere in this project: source comments, UI copy,
docs, README files, commit messages, PRs, emails, generated documents, everything. Use a
comma, colon, parentheses, or a period instead. This applies to output you write in this
repo too, not just files you edit.

## Project

AllFix By Kipekee: a storefront for a Nairobi curtain-hardware supplier, replacing a
WooCommerce site (`allfix.co.ke`) that could not take an order (every product priced 0 in
USD). This repo is the frontend only. A second repo, `Projects/allfix-backend` (Quarkus,
PostgreSQL, Flyway), will own authorization, pricing and transactions, and does not exist
yet. Until it lands, `src/lib/catalogue.ts` reads the migrated catalogue JSON directly and
is the seam where API calls will slot in later without touching any page.

`PROJECT_PLAN.md` and `project_requirments.md` are the source of truth for the full plan
(data model, auth, backend, client requirements) and should be kept in sync as the system
evolves. Both are gitignored working documents, so they exist locally but won't appear in a
fresh clone. `README.md` covers the catalogue migration story and the SKU-prefix to
rail-system mapping.

## Commands

```bash
npm run dev      # next dev, starts the storefront
npm run build    # next build
npm run start    # next start (production)
npm run lint     # eslint
```

No JS/TS test suite exists yet. The Python catalogue migration has its own tests:

```bash
python3 -m unittest discover -s tools/migrate -t tools/migrate
```

## The organising idea

Browse is organized by what the customer already owns, not by component type. SKUs encode
this directly, and there are two families with two axes:

- **Rails** (`RL#` prefixes: `RL#20_004`, `RL#28_008`, `RL#KS_003`) browse by **rail
  system**. A customer owns a rail and needs parts that fit it. Driven by `fitsSystems` on
  every product, and by `/systems`, the home page picker, `partsForSystem()`.
- **Rods** (`RD#` prefixes: `RD#AB_`, `RD#BL_`) browse by **finish**, then diameter. Nothing
  that fits a #20 fits a 28mm pole, so rods carry `range` and `diameter` and an empty
  `fitsSystems`, never a `system`. Driven by `partsForRange()`.

Component type (bracket, stopper, finial...) is a filter within either axis, never the
primary one.

**The home page does not lead with this.** It is a marketing page whose job is converting a
visitor into a customer: it opens on the outcome (curtains measured, sewn and fitted) with a
WhatsApp quote as the primary action, because the highest-value jobs (motorisation, full
curtain work) need a site survey rather than a checkout. "Which rail do you already have?"
is a question only an existing rail owner can answer, so the section matcher sits further
down the page for the repeat parts customer. Keep the axes for merchandising; do not put
them back in the hero.

## Architecture

```
src/app/          routes, layouts, metadata, structured data (App Router)
src/components/   UI, including the rail cross-section "Profile" drawings
src/lib/          data access, formatting, commerce logic
data/             migrated catalogue (catalogue.json, committed)
public/products/  optimised product photography, one file per SKU
tools/migrate/    WooCommerce to catalogue.json migration, plus its Python tests
```

## The console, and its door

`/admin` is staff only and gated in two places. `src/proxy.ts` turns a signed out request
away before a route renders, and `requireConsole()` in `src/lib/admin/guard.ts` checks again
on the server. Both, not either: the Next 16 proxy documentation is explicit that Server
Functions are not separate routes in the matcher chain, so a matcher typo can silently drop
coverage. The proxy is for the redirect, the guard is authoritative.

Sign in is at `/sign-in`, against the demo table in `src/lib/admin/accounts.ts`. That file is
the seam: it is written to the contract `allfix-backend` already implements on
`feature/authentication`, refusal messages included, so pointing it at the real service is a
change to one function. The session is an HttpOnly SameSite=Lax cookie carrying a signed
payload (`src/lib/admin/session.ts`), which stops a role being edited in devtools but is
explicitly **not** a revocable session: that needs the backend's token table.

Roles are `ADMIN | STAFF | TRADE | CUSTOMER`, and `src/lib/admin/roles.ts` is the single
answer to what each may do. The split follows `ROLE_NOTE` in `desk.ts` rather than one
invented for the demo: staff price parts because that is counter work, and only admin sees
People. Trade has no console at all and lands on `/trade/account`.

Four console screens, not five: prices and the shot list were two lenses on one part and are
now one worksheet at `/admin/parts`, filtered by what is missing. The old paths redirect.
`src/components/admin/parts.tsx` holds the console's own primitives; reach for those rather
than the storefront's, which assume a page that is selling something.

Built: `/`, `/systems`, `/systems/[slug]`, `/shop`, `/product/[slug]`, plus the
layout/header/footer chrome. **Still missing, and linked from the header and footer:**
`/build`, `/services`, `/trade`, `/privacy`, `/terms`. Those nav links 404 today. Routes are
being filled in incrementally; check what actually has a `page.tsx` before assuming a page
exists, and do not add a call to action that points at a route which does not.

`/shop` is a faceted browser. The server (`src/app/shop/page.tsx`) builds a compact projection
of the catalogue (`shopData()` in `src/lib/shop.ts`, so the 200 KB of specs and copy never
reach the client) and hands it to a client component (`src/components/shop/ShopBrowser.tsx`)
that filters in memory for an instant feel. State lives in React and the URL mirrors it,
debounced, via `history.replaceState` rather than a navigation, so a shared or reloaded link
opens on the same view without re-running the server each keystroke. Params: `family` (single),
`system`/`range`/`part` (comma lists, multi select), `price` (band), `buy=1` (has a price),
`q` (search over name and SKU), `sort`, `page`. Unknown values are dropped rather than
filtering to an empty grid. All filter/sort/search logic is pure functions in `src/lib/shop.ts`.
The cards (`ShopCard`) show product photos as shot, so a black-field shot is a black tile;
there is no "in stock" badge because stock is not tracked yet.

- **`src/lib/catalogue.ts`**: the data-access seam described above. Exposes `systems`,
  `components`, `products` plus lookups (`getProduct`, `getSystem`, `partsForSystem`,
  `universalParts`). Parts within a system are ordered by assembly order (track, bracket,
  runner, stopper, ...), not alphabetically, so a part list reads like instructions.
- **`src/lib/commerce.ts`**: `sellable()` is the single source of truth for whether a price
  is real. **A `null` price must never render as "KES 0"**, that exact bug is what made the
  old store unable to sell. Anything that shows a price or a buy action must branch through
  `priceLine()`/`sellable()`/`priceOrAsk()`, not check `priceKes` directly. `priceLine()`
  resolves the three states a part can be in: a figure, the client's own pricing rule in
  words (`priceNote`), or "price on request".
- **Prices carry a basis.** `priceBasis` (`each`, `metre`, `pair`, `box`, `roll`, `length`)
  says what the figure buys. A track at 400 is 400 per metre, so anything rendering money
  must pass the basis through `price()`/`priceOrAsk()`, and the eventual configurator's bill
  of materials depends on it.
- **Not everything is photographed.** Only the parts that came off the old site have images.
  `imageFor()` returns `null` for the rest, which carry `imageName` (the shot they are
  waiting for); callers must render a placeholder rather than a broken image.
- **`src/lib/format.ts`**: `price()`/`priceOrAsk()` money formatting, the `SHOP` constant
  (address/phone), and `whatsapp()` for wa.me deep links.
- **Animation**: anime.js (`animejs` v4) is the animation library, used sparingly and gated
  behind `prefers-reduced-motion`. See `src/components/TraceOnView.tsx`: it draws the rail
  "Profile" SVG strokes on scroll into view via `animate(svg.createDrawable(...), ...)`,
  with `stagger()` for sequencing. The markup itself is always fully drawn, so the animation
  is progressive enhancement, not a load-bearing part of the page.
- **Theming**: CSS custom properties in `src/app/globals.css`, toggled via `data-theme` on
  `<html>` (opt-in dark mode only, never OS-driven; see the comment block there). The inline
  `<Script>` in `src/app/layout.tsx` applies the stored theme before first paint to avoid a
  flash.
- **Styling**: Tailwind 4 via `@theme inline` in `globals.css`, no separate
  `tailwind.config.*`. Reusable primitives (`Button`, `Breadcrumbs`, `Empty`, `WhatsAppIcon`)
  live in `src/components/ui.tsx`.
- **Structured data**: `RootLayout` injects a `HardwareStore` JSON-LD schema; the old site
  had none, and local search visibility is a stated project goal.

## Data migration (`tools/migrate/`)

`migrate.py` rebuilds `data/catalogue.json` from two committed sources under
`tools/migrate/raw/` (offline-reproducible), which answer different questions:

- `wc-products.json`, the WooCommerce Store API export: the rail parts and the only
  photography, but no usable price (everything was 0).
- `product-upload.xlsx`, the client's workbook (`sheet.py`): the prices, the unit each is
  quoted in, the whole rod line, and 25 rail SKUs the old site never listed. Read straight
  out of the workbook zip so the migration still runs on a bare Python install.

It derives rail system from SKU prefix, rod range from SKU prefix (`ranges.py`), recovers
spec tables from HTML descriptions, collapses colour/material duplicates into variants, and
resolves `fitsSystems` per part. A price stated in prose is never guessed into a number: it
is carried as `priceNote` and the part stays unpriced.

```bash
python3 tools/migrate/migrate.py --images
python3 tools/migrate/migrate.py --prices data/price-list.csv   # per-SKU override
```

## Conventions

- No semicolons, `interface` over `type` for object shapes (see `catalogue.ts`).
- **Never add a `middleware.ts`.** Next 16 renamed the convention to `proxy.ts`, and having
  both files present is a hard build error. The gate lives in `src/proxy.ts`.
- `@/*` path alias resolves to `src/*` (`tsconfig.json`).
- Comments in this codebase explain *why*, not *what*. Follow that pattern; don't add
  comments describing obvious code.
- No em dashes, anywhere (see top of this file).
