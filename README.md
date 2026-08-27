# AllFix By Kipekee

Storefront for a Nairobi curtain-hardware supplier on Njugu Lane, CBD: rails, rods,
motorised systems and the parts that fit them.

Replaces `allfix.co.ke`, a WooCommerce store that could not take an order. Every one of
its 67 products was priced 0 in USD, the browse pages were disconnected from the shop, and
the catalogue carried no structured data at all.

## The organising idea: shop by what is above the window

The old site browsed by component type (Brackets, Stoppers, Runners), which makes every
customer solve compatibility themselves, and is why people buy a track and forget the
stoppers. But the SKUs already encode the answer: `RL#20_004`, `RL#28_008`, `RL#KS_003`.

So the top axis is what somebody already has above the window, which is the one thing they
know before anything else: **a rail, a blind, or a rod**. Within rails you pick the system
and get every part that fits it. Component type stays as a filter, never the way in.

Each is a page of its own at `/shop/rail`, `/shop/blind` and `/shop/rod`, prerendered and in
the sitemap, because a category reachable only by filtering is a category no search engine
ever sees. That was half the catalogue until recently: rails had eleven landing pages at
`/systems/[slug]` and rods had none at all.

**A blind is not a rail**, and the catalogue says so with `kind` on every system. They share
an axis because they answer the same question, and almost nothing else is shared: a blind
takes no runners, no stoppers and no tape, it is quoted by the metre with its fittings
included rather than sold as parts, and it has no cross-section to draw. The configurator
used to exclude the roman blind by name, and when the August sheet added two more blinds
they walked straight past it and got quoted ten runners to the metre.

| System | Kind | SKU prefix | Parts |
| --- | --- | --- | --- |
| Motorised | rail | `RL#MOTOR_` | 20 |
| #20 with rubber | rail | `RL#20R_` | 8 |
| #20 | rail | `RL#20_` | 7 |
| #28 | rail | `RL#28_` | 9 |
| #10 bendable | rail | `RL#10_` | 13 |
| #17 groove rubber | rail | `RL#17_`, `RL#GROOVE_` | 5 |
| KS | rail | `RL#KS_` | 4 |
| Double rail | rail | `RL#DR_` | 3 |
| Roman blind | blind | `RL#ROMAN_` | 11 |
| Roller blind | blind | `RL#ROLLER_` | 12 |
| Zebra blind | blind | `RL#ZEBRA_` | 10 |
| Curtain-side parts | rail | `RL#ACC_`, `RL#RIPPLE_` | 12 |

The bendable line was `#15` until the client renumbered it to `#10` in the August workbook.
`/systems/15-bendable` redirects permanently, because the old URL is indexed and there is
still a page doing its job.

Curtain-side parts (tapes, hooks, buckles) fit every system **a curtain hangs on**, which is
nine of the eleven rather than all of them. A roman blind is a blind and does carry a
curtain; a roller blind does not, and listing a tape as fitting one would be the shop saying
a part will work when it will not.

## Rods browse by finish, not by system

Rods are the other half of the shop, and the old site did not carry a single one. They do
not belong on the rail axis: nothing that fits a #20 fits a 28mm pole. What a rod customer
matches on is finish first, then diameter, so finish is the browse axis and the bore filters
within it. A 25mm finial will not go on a 19mm pole, and parts with no bore of their own, a
bracket say, are never filtered out by it.

| Range | SKU prefix | Parts | Diameters |
| --- | --- | --- | --- |
| Antique brass | `RD#AB_` | 27 | 19, 25, 28mm |
| Antique black | `RD#BL_` | 18 | 19, 25, 28mm |
| Antique copper | `RD#AC_` | 17 | 19, 25, 28mm |
| Antique silver | `RD#MN_` | 12 | 19, 25, 28mm |

## The storefront

Next.js (App Router) with Tailwind, TypeScript throughout. The Quarkus service in
`allfix-backend` owns accounts, orders, pricing and the enquiry queue; see
[Talking to the service](#talking-to-the-service) for which seams are wired and what each
falls back to. `src/lib/catalogue.ts` still reads the migrated catalogue directly, and is
the one seam not yet moved.

```bash
npm run dev      # start the storefront
npm run build    # production build
npm run lint     # eslint
```

| Route | What it is |
| --- | --- |
| `/` | Marketing front door, with a WhatsApp quote as the primary action |
| `/systems`, `/systems/[slug]` | Browse by rail system, the primary axis, drawn in cross-section |
| `/shop`, `/shop/[category]` | Faceted browser over every part, filtered in the client for an instant feel. Rails, blinds and rods each have their own page |
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
npm test             # node --test over src/lib, no bundler and no dependency
npm run test:e2e     # Playwright, desktop and a phone, against a production build
npm run typecheck    # next typegen, then tsc --noEmit
npm run lint         # eslint

python3 -m unittest discover -s tools/migrate -t tools/migrate   # the catalogue migration
```

**283 browser tests**, 104 unit tests and 20 migration tests, all run on every push and
pull request by `.github/workflows/ci.yml`. The service runs its own 359 against a real
PostgreSQL behind a 90% coverage gate.

The unit layer is for the logic where a wrong answer is one character and a browser test is
an expensive way to find it: the bill of materials, the price rules, the tier rules that
mirror the service's `unitPriceFor`, the password meter, the rate limiter's arithmetic, the
shop's filtering, and the wire shape of an enquiry. It runs on Node's own runner with type
stripping, so there is no transform step to keep current.

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

These are the door **without a service**. With `ALLFIX_API_URL` set the door is the
service's, and these addresses open only if it has them too.

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

`.env.example` names every variable and carries a value for none, which is why it is the
one env file that is committed: copy it to `.env.local` and fill it in. Everything below is
server side except where marked, and a server-side value never reaches the browser.

| Variable | Effect if unset |
| --- | --- |
| `ALLFIX_SEED_PASSWORD` | The password is not checked, so any value opens a seeded account |
| `ALLFIX_SESSION_SECRET` | In production, sign in is refused outright: there is no key, so no session can be signed and the door answers 503. Outside production the key is a stand-in generated per process, so restarting the server signs you out |
| `ALLFIX_API_URL` | Orders, sign in, registration and settings fall back to local data and say plainly what they could not keep. Locally the service is on `http://localhost:8087` |
| `ALLFIX_SERVICE_TOKEN` | The console's reads of the service go anonymous and come back 401, so settings and the enquiry queue silently fall back. It grants ADMIN: treat it as a password, at least 32 characters, distinct per environment, and it must match `allfix.service.token` on the service |
| `NEXT_PUBLIC_API_URL` | **Reaches the browser.** The enquiry form files into this browser's own storage instead of the shop's records. It is the one call a browser makes to the service directly |
| `ALLFIX_SESSION_IDLE_MINUTES` | Twenty. Anything that is not a whole number between 5 and 480 is ignored rather than substituted |

`ALLFIX_SESSION_SECRET` fails closed rather than falling back, because a key committed here
would be a key anybody could read, and signing with it is not signing. It must be at least
32 characters, and a shorter one is refused exactly as an absent one is, because a key with
less in it than the signature it produces is not a key. Generate one with
`openssl rand -base64 32`. It is a Vercel project environment variable, set per environment
(see Deployment below), and each environment should have its own value so a leaked preview
key cannot forge a production session. Adding it does not reach the deployments already
built: environment variables are read at build, so redeploy afterwards.

The session is an HttpOnly SameSite=Lax cookie carrying a signed payload, which stops a
role being edited in devtools. It is deliberately not a revocable session: revocation needs
the token table in `allfix-backend`.

The gate is enforced twice, in `src/proxy.ts` before a route renders and again in
`requireConsole()` on the server, which is the authoritative check. Both, because Server
Functions are not separate routes in the matcher chain, so a matcher typo would otherwise
drop coverage silently.

## Talking to the service

The Quarkus service in `allfix-backend` owns accounts, orders, pricing, the enquiry queue
and the shop's settings. Each seam is one file, and each says plainly what it could not keep
rather than reporting a success it did not have.

| Seam | Reads or writes | Without a service |
| --- | --- | --- |
| `src/lib/admin/accounts.ts` | `POST /api/auth/login` | The seeded roster in `desk.ts` |
| `src/lib/orders-api.ts` | `POST /api/orders`, as the signed in customer | Priced locally and not persisted |
| `src/lib/enquiry.ts` | `POST /api/enquiries` | Filed into this browser's storage |
| `src/lib/admin/enquiries-service.ts` | `GET /api/enquiries` | The browser's own store, and the screen says so |
| `src/lib/admin/registration.ts` | `POST /api/auth/register` and the reset pair | Says no account was created |
| `src/lib/settings-service.ts` | `GET`/`PUT /api/admin/settings` | Reads the environment, refuses to save |
| `src/lib/catalogue.ts` | not yet wired | Always the migrated `data/catalogue.json` |

**There is one session, not two.** Signing in calls the service, and the session it issues
is sealed inside this server's own cookie rather than handed to the browser: nothing in a
browser calls the service directly except the enquiry form, which needs no session at all.
That held token is what lets an order be placed *as* the customer. Before it existed the
call was anonymous, the service saw neither an account nor a guest, and a registered
customer was the one person who could not buy anything.

**A price is never sent.** The tier is a property of an account, so there is no tier field
on an order body and no price field either: the service resolves both from the account and
the storefront's figure is display only.

## Deployment

Hosted on Vercel, git-connected to this repo. `main` is the production branch and deploys to
[allfix-vkimanga-8886s-projects.vercel.app](https://allfix-vkimanga-8886s-projects.vercel.app);
every other branch gets its own preview URL.

`.github/workflows/ci.yml` runs lint, types, the unit layer and the migration tests in about
a minute, and the browser suite in its own job. Both repositories have one, and both gate a
pull request.

## Migration

`tools/migrate/` rebuilds the catalogue from two sources, both committed under
`tools/migrate/raw/` so the migration is reproducible offline. It is reproducible in the
strict sense: running it against an unchanged workbook rewrites `data/catalogue.json` byte
for byte, which is what makes a catalogue diff worth reading. They answer different
questions: the WooCommerce Store API export holds the rail parts and their photography but
no usable price, and the client's product workbook holds the money, the unit each price is
quoted in, and the entire rod line.

```bash
python3 -m pip install -r tools/migrate/requirements.txt   # Pillow, for the photography only
python3 tools/migrate/migrate.py --images
python3 -m unittest discover -s tools/migrate -t tools/migrate
```

The catalogue is read out of the workbook zip with the standard library, deliberately, so a
rebuild needs nothing installed. `images.py` is the one exception and the only reason there
is a requirements file at all.

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
- squares and compresses the photography as shot, background included: 49 images, 18 KB
  average, down from 70 to 120 KB unoptimised JPEG. Nothing is cropped or cut out, and the
  square is padded with the shot's own edge colour so the pad is invisible
- adds the stock the old site never listed: the 74 rod SKUs, 25 rail SKUs including most of
  the roman blind system, and a seventh buckle colour that joins the existing group
- refuses to place a SKU whose prefix it does not recognise, and says which. It used to skip
  them silently, which is how the August workbook's 42 new parts were dropped while the run
  still reported success

Result: **188 products across 195 SKUs**, 114 rail and 74 rod.

### The service reads the same catalogue

`allfix-backend/tools/seed/` holds a committed copy of `data/catalogue.json` and generates
the SQL that seeds it, so both halves are built from the one workbook. They drifted once,
when the August sheet was migrated here and never there: the service served 154 products
against this shop's 188, still called the bendable line `#15`, and had never heard of a
roller blind. Switching the catalogue seam on at that point would have rolled the shop back
a third of its range.

A catalogue change reaches the service as a migration until it is deployed, and through the
service's own importer (upload, preview, apply, audited) after that.

## Prices

Prices could not be recovered from the old store, which quoted everything at zero. They come
instead from the client's workbook, which prices 156 of the 188 products.

Two things about that workbook drive the data model:

- **A price says what it buys.** Track is quoted per metre, tie backs per pair, and there are
  box and roll prices too. A bare figure would misprice both a 400 per metre track and a 300
  per pair tie back, so `priceBasis` is carried on every product and rendered with the money.
- **Some rows price in words.** Twenty nine blind fittings read "Included in the cost of the
  track per mtr", which is how a blind is sold: one line by the metre with its fittings in
  it. Those are pricing rules, not numbers. They are carried verbatim as `priceNote` and the
  part stays unpriced, because a wrong number here is worse than no number.

Three products are still genuinely unpriced, so the storefront shows "price on request" for
them rather than inventing a figure. Stock is not quoted at all, so it stays untracked.

**49 of the 188 are photographed.** Only the parts that came off the old site have a shot;
the rod line and everything the workbook added are waiting on one, and each carries the shot
name the sheet asks for so the shoot list is already in the data. A part with no photograph
renders a placeholder and never a broken image.
