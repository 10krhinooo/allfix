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

```bash
npm test         # node --test over src/lib, no bundler and no dependency
npm run test:e2e # playwright, against a production build
```

`test/` is a unit layer for the pure logic in `src/lib`, which is where a wrong answer is one
character and an end to end test is an expensive way to find it: the bill of materials, the
price rules, the tier rules that mirror the backend's `unitPriceFor`, the password meter, the
rate limiter's arithmetic and the shop's own filtering. It runs on Node's own test
runner with type stripping, so there is no transform step and nothing to keep current;
`test/alias.mts` is the twenty lines that teach Node the `@/` path mapping and the JSON import
attribute Next adds for itself. The Python catalogue migration has its own tests:

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

**The headers, the key and the knocking.** `next.config.ts` sets a CSP and the four headers
that go with it on every response. `script-src` keeps `'unsafe-inline'` and that is a decision
rather than an oversight: a nonce requires dynamic rendering on every page, and Next inlines
its own flight payload into prerendered HTML, so hardening it would cost the prerendering the
catalogue exists for. What remains still holds: no third party script, no framing, no form
posting elsewhere. `ALLFIX_SESSION_SECRET` now **fails closed**: outside development a missing
key means no session can be sealed or opened, because signing with the fallback that is
committed here would let anybody forge the owner's cookie, and a documented "must be set" is
not a control when the failure looks exactly like success. `src/lib/rate-limit.ts` guards the
POST routes; it is in memory, so it is per instance and a courtesy at the edge rather than the
control, which is the backend's. A limit can be raised per route with `ALLFIX_LIMIT_<ROUTE>`
(`hits/seconds`), which is what the e2e config does for the routes the suite uses in bulk.

**There is no password in the source.** `ALLFIX_SEED_PASSWORD` is honoured when set, and
when it is not, any non-empty password opens a seeded account. Do not reintroduce a shared
literal: a checked in credential fails the repository's secret scan, and the refusals worth
demonstrating (suspended, unregistered address) are decided by role anyway.
`ALLFIX_SESSION_SECRET` signs the cookie and must be set wherever the console is real.

Roles are `ADMIN | STAFF | TRADE | CUSTOMER`, and `src/lib/admin/roles.ts` is the single
answer to what each may do. The split follows `ROLE_NOTE` in `desk.ts` rather than one
invented for the demo: staff price parts because that is counter work, and only admin sees
People. Trade has no console at all and lands on `/trade/account`, and a customer lands on
`/account`. `landing()` and `owns()` are the one place that decides which desk a role
belongs to; `HOME` there had no `CUSTOMER` entry until phase 3, which fell through to the
trade desk and was invisible only because the door refused customers outright.

**Three desks, one shell.** `/admin`, `/trade/account` and `/account` are the same furniture
with different things on it (`ConsoleShell` plus the rail), and the proxy gates all three.
A shopper's account area is at `/account`: overview, orders, saved rails, addresses,
receipts, details. Orders and receipts are seeded in `src/lib/account.ts` because the order
pipeline is phase 4. Addresses and saved rails are records the backend owns
(`customer_address`, `saved_rail` on `feature/account-book`), kept in `localStorage` via
`src/lib/account-book.ts` until that service is deployed.

**The way in, and back in.** `/auth/register`, `/auth/forgot`, `/auth/reset` and
`/auth/verify` sit on the same drawing sheet as `/sign-in` (`src/components/auth/Sheet.tsx`).
`src/lib/admin/registration.ts` is their seam, the sibling of `accounts.ts`: with
`ALLFIX_API_URL` set it calls Quarkus server to server, and without it it says plainly that
no account was created rather than accepting a registration and dropping it.
`src/lib/password.ts` is the strength meter. It **mirrors** the backend's `PasswordPolicy`
and deliberately does not share code with it: the meter is a courtesy shown as somebody
types, the server is the control. The wording is copied so both read identically, so change
them together.

Prices and the shot list were two lenses on one part and are now one worksheet at
`/admin/parts`, filtered by what is missing. The old paths redirect.
`src/components/admin/parts.tsx` holds the console's own primitives; reach for those rather
than the storefront's, which assume a page that is selling something.

Two screens are admin's alone, and for the same reason: People decides who gets in, and
`/admin/settings` decides what the shop says to everybody who does not. Settings owns the
social accounts and the sending of the shop's messages, both true of the whole shop rather
than of one part, which is why a member of staff prices a bracket and does not touch these.
`capabilities().settings` is the answer, checked on the rail, again in the page (which
`notFound()`s rather than redirecting, so a guessed URL does not confirm the screen exists),
and a third time at the top of the server action that saves. That third check is the one that
matters: a Server Function is not a route in the matcher chain, so the proxy never sees the
save at all.

`src/lib/settings.ts` is the shape (client safe, imported by the form) and
`src/lib/settings-service.ts` is the seam: with `ALLFIX_API_URL` set it reads and writes the
console API server to server, and without it it reads `ALLFIX_SOCIAL_*` and `ALLFIX_MAIL_*`
from the environment and says plainly that a save was not kept, the same answer
`registration.ts` gives. The two differ in when a change lands: the footer is on every
prerendered page, so an environment variable is read at build and changing one is a redeploy,
while the service is a tagged fetch that revalidates on a timer and at once on a save
(`updateTag`, not `revalidateTag`, because the person who just changed a link is going to go
and look at it). **The social links are not hardcoded anywhere.** None are set today, so
`SocialRow` renders nothing rather than six icons pointing at accounts that do not exist.

Every route the header and footer link to is now built: `/`, `/systems`, `/systems/[slug]`,
`/shop`, `/product/[slug]`, `/build`, `/services`, `/services/[slug]`, `/book`, `/trade`,
`/privacy`, `/terms`, plus `/sign-in`, `/auth/*`, `/admin/*`, `/trade/account/*` and
`/account/*`. This section previously said the last five 404ed, which stopped being true
without the note being updated. The rule it existed for still holds: check what actually has
a `page.tsx` before assuming a page exists, and do not add a call to action that points at a
route which does not. `/build` reading only `?system=` and ignoring the rest of a saved
window was exactly that bug in miniature.

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
- **`src/lib/tiers.ts`**: what an account pays, and the one place the trade rate (20% off
  list) is stated. A tier is a property of an account and never of a request: there is no
  tier field on an order body for the same reason there is no price field. `unitFor()`
  mirrors `OrderService.unitPriceFor` on the backend the way `password.ts` mirrors
  `PasswordPolicy`, so a part the counter has priced for trade (`tradeKes`) is sold at that
  figure and everything else comes off the rate. The backend's copy still falls back to list
  rather than to the rate and has to be brought in step, or a trade account is shown 320 and
  charged 400. Product pages are prerendered, so the storefront reads the visitor's tier
  through `/api/session` and `useTier()` (`src/lib/tier-client.ts`), one fetch per page load
  however many components ask; it starts at retail and never the other way round, so nobody
  is shown a discount for a frame and has it taken away. `TradeRate` draws nothing at all for
  a retail visitor. The figure shown is always display only: the order route re-prices from
  the cookie.
- **Bulk entry** is `BulkAdd` on `/systems/[slug]`: the same part list the page already
  shows, taking quantities, adding the lot in one action. A part priced on request gets no
  quantity field, because the order endpoint refuses to check one out.
- **A proforma can be issued against a quote, not only an order.** `sheetFor()` in
  `documents.ts` builds a sheet from any record with lines and a reference, and
  `/trade/account/quotes/[reference]/proforma` is what a trade account hands to an accounts
  department for a bank transfer. A quote the counter has not priced yet has no figures to
  hold, so it is not found rather than printed blank.
- **Not everything is photographed.** Only the parts that came off the old site have images.
  `imageFor()` returns `null` for the rest, which carry `imageName` (the shot they are
  waiting for); callers must render a placeholder rather than a broken image.
- **`src/lib/enquiry.ts`**: the enquiry seam, and the one place both ways of reaching the
  shop are composed. `sendEnquiry()` files an enquiry (into `admin/store.ts` today,
  `POST /api/enquiries` once `NEXT_PUBLIC_API_URL` is set) and `enquiryMessage()` writes the
  same draft out for a chat window. Every form goes through
  `src/components/enquiry/EnquiryForm.tsx`, which owns the contact fields, both send paths
  and the confirmation panel; a page passes the `summary` and `detail` it composes plus any
  fields particular to it as children. `/book` and `/services/[slug]` are the two, and
  `SendList` (configurator) and `QuoteBuilder` (trade) call `sendEnquiry` directly.
  The phone number is required and the email is not: the counter rings people back, and an
  address only decides whether the reference also arrives in writing. `enquiryKind` on a
  service decides which queue it lands in, because the kind is what decides who picks it up.
- **`src/lib/format.ts`**: `price()`/`priceOrAsk()` money formatting, the `SHOP` constant
  (address/phone), and `whatsapp()` for wa.me deep links.
- **Animation**: anime.js (`animejs` v4) is the animation library, used sparingly and gated
  behind `prefers-reduced-motion`. See `src/components/TraceOnView.tsx`: it draws the rail
  "Profile" SVG strokes on scroll into view via `animate(svg.createDrawable(...), ...)`,
  with `stagger()` for sequencing. The markup itself is always fully drawn, so the animation
  is progressive enhancement, not a load-bearing part of the page.
- **The two curtains, and both are the home page's.** `Curtain.tsx` is the hero's motorised
  reveal (track, motor, panels, runners bunching). `PageCurtain.tsx` is the wipe, mounted
  from `src/app/(shop)/template.tsx`: a template remounts on every navigation while a layout
  does not, so mounting *is* the navigation and nothing watches the router. The template
  still spans the shop group, because the component has to be alive on the page being left,
  but the wipe now only plays on the way to `/`, and on the way out of a desk, which is the
  same arrival: `painted()` in `motion.ts` is set by `Painted` in the **root** layout rather
  than by the curtain itself, so "this document has drawn a page" stays true across the
  crossing from `/admin` into the shop. Asked from inside the shop group it answered "this is
  a page load" on exactly that navigation and suppressed the wipe where it was most wanted. It used to run between every pair of shop
  routes, which put a curtain between a product and the part list it belongs to; a customer
  working through the catalogue wants the next page, not a performance on the way to it.
  Neither ever renders on a fresh document, so no server-rendered page is hidden behind a
  script-only overlay. Both read their gate from `src/lib/motion.ts` (`reducedMotion()`,
  `heroReveals()`), which is the one place that decides which of the two owns the arrival at
  home. The console has no template and gets no wipe.
- **Accessibility is checked, not assumed.** `e2e/accessibility.spec.ts` runs axe over every
  public page and the three console screens, failing on serious and critical only, plus the
  things axe cannot check: the skip link, the phone menu's Escape and focus return, an
  announced refusal. It runs with reduced motion asked for, because a contrast reading taken
  mid-animation is a reading of a colour nobody ever sees. Two rules came out of it and are
  worth keeping: `.callout` lives in `@layer components` so a page can recolour it (an
  unlayered rule beats every utility whatever its specificity, which is why breadcrumbs on the
  oxblood band were grey on oxblood and no class would move them), and a panel that stays
  mounted while closed uses `inert`, never `aria-hidden`, which hides it from a screen reader
  while leaving its controls in the tab order.
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
