# AllFix By Kipekee

Storefront for a Nairobi curtain-hardware supplier on Njugu Lane, CBD: rails, rods,
motorised systems and the parts that fit them.

Replaces `allfix.co.ke`, a WooCommerce store that could not take an order. Every one of
its 67 products was priced 0 in USD, the browse pages were disconnected from the shop, and
the catalogue carried no structured data at all.

## The organising idea: shop by system, not by part

The old site browsed by component type (Brackets, Stoppers, Runners), which makes every
customer solve compatibility themselves, and is why people buy a track and forget the
stoppers. But the SKUs already encode the answer: `RL#20_004`, `RL#28_008`, `RL#KS_003`.

So **rail system is the primary browse axis**. You arrive knowing you own a #20 rail, and
the site shows you every part that fits it. Component type stays as a filter.

| System | SKU prefix | Parts |
| --- | --- | --- |
| Motorised | `RL#MOTOR_` | 16 |
| #20 | `RL#20_` | 7 |
| #20 with rubber | `RL#20R_` | 4 |
| #28 | `RL#28_` | 7 |
| #15 bendable | `RL#15_` | 5 |
| #17 groove rubber | `RL#17_` | 3 |
| KS | `RL#KS_` | 4 |
| Double rail | `RL#DR_` | 2 |
| Roman blind | `RL#ROMAN_` | 1 |
| Curtain-side parts (fit any system) | `RL#ACC_` | 13 |

## Rods browse by finish, not by system

Rods are the other half of the shop, and the old site did not carry a single one. They do
not belong on the rail axis: nothing that fits a #20 fits a 28mm pole. What a rod customer
matches on is finish first, then diameter, so finish is the browse axis and the bore filters
within it.

| Range | SKU prefix | Parts | Diameters |
| --- | --- | --- | --- |
| Antique brass | `RD#AB_` | 27 | 19, 25, 28mm |
| Antique black | `RD#BL_` | 18 | 19, 25, 28mm |
| Antique copper | `RD#AC_` | 17 | 19, 25, 28mm |
| Antique silver | `RD#MN_` | 12 | 19, 25, 28mm |

## The storefront

Next.js (App Router) with Tailwind, TypeScript throughout. Until the Quarkus backend lands,
`src/lib/catalogue.ts` reads the migrated catalogue directly and is the seam the API slots
into later without a page changing.

```bash
npm run dev      # start the storefront
npm run build    # production build
npm run lint     # eslint
```

| Route | What it is |
| --- | --- |
| `/` | Marketing front door, with a WhatsApp quote as the primary action |
| `/systems`, `/systems/[slug]` | Browse by rail system, the primary axis, drawn in cross-section |
| `/shop` | Faceted browser over every part, filtered in the client for an instant feel |
| `/product/[slug]` | Gallery, variants, price, spec table, and the systems a part fits |
| `/build` | The rail configurator: a window in, a bill of materials out |
| `/services`, `/services/[slug]` | Installation, assembly, curtaining, motorisation, consultation |
| `/book` | Measure-up and site-survey booking |
| `/trade` | The wholesale proposition and account application |
| `/cart`, `/checkout` | The basket, and buying with or without an account |
| `/privacy`, `/terms` | Legal pages |
| `/sign-in`, `/auth/*` | The door, registration, and the password reset |
| `/account/*` | A shopper's orders, saved rails, addresses, documents and details |
| `/trade/account/*` | The trade desk: orders, quotes, details |
| `/admin/*` | The counter console, staff only |

A price resolves to a real figure, to the client's pricing rule in words, or to "price on
request", and never to "KES 0", the bug that left the old store unable to sell. The
configurator computes quantities only and hands the finished list to WhatsApp for a quote,
because a priced bill of materials belongs on the backend that resolves it against the
caller's account tier.

## Buying something

The basket lives in the browser, because a basket is not worth an account and asking somebody
to sign in before they can put a bracket in one loses the sale. Quantities are set on the
product page, where the customer is already working out that a four metre run at ten runners
to the metre needs forty.

Checkout does not require an account either. A guest gives a name and a phone, the two things
the shop cannot deliver without, and keeps the reference; they find the order again with that
reference and the same phone number. Signing in is offered rather than demanded, because it
genuinely helps: a saved address to pick from, and the order kept on the account.

**No price ever leaves the browser.** A basket names SKUs and quantities, and there is no
price field on the request or on the API behind it. What a line costs is resolved server side
from the catalogue and the caller's tier, and the total shown after ordering is the one that
came back. An unpriced part cannot be checked out at all: "price on request" is a real state
in this catalogue and it means ask the counter, not sell at zero.

Three ways to settle, and they are the three the shop actually trades on: M-Pesa now, a
proforma for a trade account paying by transfer, and paying at the counter on collection. The
last two need no payment provider, so an order can be placed whatever M-Pesa is doing.

## Documents

The shop issues four, and they differ in three ways and no more: what they are called,
whether the money on them is paid or owed, and whether they carry money at all.

| Sheet | Money | Issued when |
| --- | --- | --- |
| Receipt | Paid | The money has arrived |
| Tax invoice | Due | It has not |
| Proforma | Due | Asked for before paying |
| Delivery note | None | Something is being delivered |

So the differences are data and there is one template. Four templates drift, and the first
thing to go is the address block; an invoice wearing a receipt's footer is worse than no
invoice. Each carries the logo and the full trading details, which a web page can leave to
its header and a document cannot: it gets printed, filed and handed to an accountant, and by
then nobody can click anything to find out who issued it.

A delivery note carries no money at all, and that is the entire reason it exists. It travels
with the goods, and the rider, the gateman and whoever signs for it have no business seeing
what the customer paid. It gets somewhere to sign instead of a total.

Saving one is `window.print()`. The browser is already a typesetter with a PDF writer in it,
so the customer gets a real PDF they named themselves, on any platform, with nothing to
download and trust.

## Tests

```bash
npm run test:e2e     # Playwright, desktop and a phone, against a production build
```

The interesting parts of this storefront cannot be checked any other way: a session is an
HttpOnly cookie no script can plant, a basket is in localStorage the server never sees, and
the three desks are told apart by a redirect that only happens in a browser. The suite covers
every public page, the facets, the price rules, the sitemap and the nine legacy redirects,
both consoles with their role gates, the auth screens, the account area with its documents,
the configurator, and the buy flow with and without an account.

## The console, and its door

`/admin` is the staff console and `/sign-in` is the way in. Roles are `ADMIN`, `STAFF`,
`TRADE` and `CUSTOMER`, and `src/lib/admin/roles.ts` is the single answer to what each may
do: staff price parts because that is counter work, only an admin sees People, and trade
gets no console at all and lands on `/trade/account`.

### There is no password in this repository

`src/lib/admin/accounts.ts` holds no credential, on purpose. A checked in string that a
secret scanner reads as a password costs more to explain every time than it saves, and the
refusals worth demonstrating are decided by role rather than by password anyway.

So the door has two modes, and it says out loud which one it is in:

- **`ALLFIX_SEED_PASSWORD` set.** The password is required and checked against it. This is
  the only mode fit for a deployment anybody else can reach.
- **`ALLFIX_SEED_PASSWORD` unset.** The password is not looked at, so any value opens a
  seeded account, the empty string included. The sign-in sheet stops making the field
  compulsory and says so, because a field that is asked for and never checked teaches
  people to type anything into it. This is the default, so a bare clone is usable.

> **Set `ALLFIX_SEED_PASSWORD` on anything reachable from the internet.** Unset, anybody
> who knows one of the addresses below walks into the console, and those addresses are
> printed here. Preview deployments included.

### The seeded accounts

Derived from `PEOPLE` in `src/lib/admin/desk.ts` rather than a second list, so the roster
cannot fork. The last two are there to be refused: the refusals are the half of the model
worth exercising while working on the screens. Trade is not refused, it signs in and is sent
to `/trade/account`, because trade has no console.

| Address | Role | What it opens |
| --- | --- | --- |
| `hafsah@allfix.co.ke` | ADMIN | Everything, including People |
| `counter@allfix.co.ke` | STAFF | The counter, without People |
| `workshop@allfix.co.ke` | STAFF | The counter, without People |
| `njoroge@interiors.co.ke` | TRADE | Trade rates and `/trade/account`, no console |
| `p.ochieng@gmail.com` | CUSTOMER | Refused: the shopper account area is phase 3 |
| `old.counter@allfix.co.ke` | STAFF, suspended | Refused: suspended account |

An unregistered address and a wrong password are refused identically, so the door cannot be
used to enumerate the shop's customers.

### Configuration

Both variables are server side and neither is `NEXT_PUBLIC_`, so neither reaches the
browser. `.env.example` carries them, but it is gitignored, so it will not be in a fresh
clone.

| Variable | Effect if unset |
| --- | --- |
| `ALLFIX_SEED_PASSWORD` | The password is not checked, so any value opens a seeded account |
| `ALLFIX_SESSION_SECRET` | The session cookie is signed with a known development string, which is not a signature |

The session is an HttpOnly SameSite=Lax cookie carrying a signed payload, which stops a
role being edited in devtools. It is deliberately not a revocable session: revocation needs
the token table in `allfix-backend`.

The gate is enforced twice, in `src/proxy.ts` before a route renders and again in
`requireConsole()` on the server, which is the authoritative check. Both, because Server
Functions are not separate routes in the matcher chain, so a matcher typo would otherwise
drop coverage silently.

## Deployment

Hosted on Vercel, git-connected to this repo. `main` is the production branch and deploys to
[allfix-vkimanga-8886s-projects.vercel.app](https://allfix-vkimanga-8886s-projects.vercel.app);
every other branch gets its own preview URL.

## Migration

`tools/migrate/` rebuilds the catalogue from two sources, both committed under
`tools/migrate/raw/` so the migration is reproducible offline. They answer different
questions: the WooCommerce Store API export holds the rail parts and their photography but
no usable price, and the client's product workbook holds the money, the unit each price is
quoted in, and the entire rod line.

```bash
python3 tools/migrate/migrate.py --images
python3 -m unittest discover -s tools/migrate -t tools/migrate
```

The workbook is the price of record. `--prices data/price-list.csv` still overrides it per
SKU, so a correction can be made without waiting on a new workbook.

What it does:

- drops the 5 placeholder rows named "Product" that carry no SKU, image or category
- derives the rail system from the SKU prefix, and the part type from the product name
  (the WooCommerce categories are corrupt: `Tapes` is its own parent, 5 products sit in
  `Uncategorized`)
- recovers a specification table from the `Label: value<br/>` HTML the shop wrote into the
  descriptions, so specs render as data instead of prose
- collapses declared colour and material duplicates into variants. The six buckle colours
  were six separate products
- resolves `fitsSystems` for every part
- squares and compresses the photography as shot, background included: 62 images, 18 KB
  average, down from 70 to 120 KB unoptimised JPEG. Nothing is cropped or cut out, and the
  square is padded with the shot's own edge colour so the pad is invisible
- adds the stock the old site never listed: the 74 rod SKUs, 25 rail SKUs including most of
  the roman blind system, and a seventh buckle colour that joins the existing group

Result: **154 products across 161 SKUs**, 80 rail and 74 rod.

## Prices

Prices could not be recovered from the old store, which quoted everything at zero. They come
instead from the client's workbook, which prices 138 of the 154 products.

Two things about that workbook drive the data model:

- **A price says what it buys.** Track is quoted per metre, tie backs per pair, and there are
  box and roll prices too. A bare figure would misprice both a 400 per metre track and a 300
  per pair tie back, so `priceBasis` is carried on every product and rendered with the money.
- **Some rows price in words.** Nine roman blind fittings read "Included in the cost of the
  track per mtr", and the double rail track quotes a metre rate alongside a full length. Those
  are pricing rules, not numbers. They are carried verbatim as `priceNote` and the part stays
  unpriced, because a wrong number here is worse than no number.

Seven products are still genuinely unpriced, so the storefront shows "price on request" for
them rather than inventing a figure. Stock is not quoted at all, so it stays untracked.
