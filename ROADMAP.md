# Roadmap

Where the two repositories have got to, and what is left. `PROJECT_PLAN.md` is the original
plan and stays the fuller document; this is the working programme, kept short enough to be
read before deciding what to do next.

The rule that shapes the ordering: **a seam is not finished until something reads it back.**
Most of what went wrong here was written, tested and merged in one direction only, and the
fault only appeared the first time the two halves were run together.

---

## Done

### The scan that started this

Both repositories were run side by side for the first time. Unconnected, every test passed.
Connected, 23 failed, and the two that mattered would have taken the shop down on the day
the service was switched on:

- **Every enquiry was refused.** The storefront spelled the kind lowercase and the service's
  enum is uppercase, and `sendEnquiry` spread the draft straight onto the wire. That one
  line carried every booking, service enquiry and trade quote.
- **A signed in customer could not buy anything.** Two notions of "signed in" that had never
  met: the storefront's cookie was its own, the service had never issued anything it could
  show back, so the call was anonymous and the order was refused for want of a name and a
  phone number the customer had given when they registered. A guest could buy.

Both fixed, along with **CORS being switched off entirely** (`quarkus.http.cors` is the
Quarkus 2 key; Quarkus 3 logs it as unrecognized and carries on), which had to be fixed
before a browser could reach the service at all.

### Phase 1, the shop

- Three categories, rails, blinds and rods, each a real page at `/shop/[category]`,
  prerendered and in the sitemap. Rails had eleven landing pages already and rods had none,
  so half the catalogue was reachable only by filtering.
- Facet counts computed against the live query. They used to be counted once over the whole
  catalogue, so "Rods" and "Tracks 11" sat side by side and the second returned nothing.
- A blind is not a rail: `kind` on every system, so `/build` stopped quoting a roller blind
  ten runners to the metre.
- Two products that showed a price and had no basket button, because they have no SKU of
  their own and are sold as one of their finishes.
- The privacy policy stopped saying the site runs no accounts and takes no payments.

### Phase 2, the spine

- The service's catalogue brought up to the August sheet (it was 154 products against the
  shop's 188, still calling the bendable line `#15`).
- One session rather than two, so an order is placed **as** the customer and the trade rate
  resolves from the account.
- The counter reads the shop's own enquiry queue rather than the browser's `localStorage`.

### Phase 3, the orders desk

- `order_channel` and `taken_by`, and `POST /api/admin/orders` for an order that arrived
  over the counter, on WhatsApp or by phone, which is most of them.
- `/admin/orders`: every order on one screen, filterable by channel, with a form to write
  one down. Priced by the service, attributed to whoever keyed it in.
- The paper sales book, read in two phases with a checksum, refusing anything it would have
  had to guess at.

### Along the way

- **CI on both repositories**, which did not exist. It found two things on its first run: the
  storefront could not type check from a clean clone, and the catalogue migration had always
  needed Pillow without saying so.
- The service moved off port 8087 so 8080 is free for other work.

**Where that leaves the suites:** storefront 104 unit, 289 browser, 20 migration; service
375 tests behind a 90% coverage gate; schema at `V19`.

---

## Left to do

### Phase 4, stock

`Product.stock` exists on both sides, is seeded null for every row, is written only by the
importer and read by nothing.

1. Schema: a per-product threshold, and stock that moves. Decrement on an order, restore on
   a cancellation, and a correction path for after a stock take, which is the
   auto-decrement-with-a-hand-on-it that was asked for.
2. The storefront already treats `stock: null` as unknown rather than zero
   (`src/lib/commerce.ts`), and that distinction has to survive: nobody has counted most of
   this shelf yet.
3. Console: stock on the worksheet, a low-stock filter, a count on the rail.
4. A low-stock notice by email as a daily digest. `SettingsService` iterates `Notice.values()`
   so a new kind appears on the settings screen by itself, but a digest needs
   `quarkus-scheduler`, which would be the first scheduled job in the service.

### Phase 5, the dashboard

There is no `GROUP BY` or `SUM` anywhere in the service today, and no CSV writer
(`sheet/Csv.java` is parse-only). The indexes on `(status, created_at DESC)` are already the
right shape for it.

1. A reporting endpoint: revenue over time, orders by channel and status, customers
   acquired, top parts.
2. `/admin` becomes a dashboard rather than a list of counts.
3. Charts as hand-written inline SVG, following `Profile.tsx`. There is no charting library
   in `package.json` and adding one for four charts is a poor trade in a repository that
   draws its own.
4. Export as CSV from the service, and print-to-PDF for a sheet, which is the argument
   `PrintButton` already makes.

**This phase depends on the sales book being loaded.** Until the book is in, every figure a
dashboard can show is a figure about the minority of the trade that arrived online, and that
is worse than no figure because it looks like an answer.

### The catalogue read seam

`src/lib/catalogue.ts` is the one seam not yet moved, and it is the largest single change
left. Nineteen files import it, and `configurator.ts` reads it at module scope four times to
build its rate constants, so an async seam ripples into every consumer and every unit test
that imports them synchronously.

It is what makes a part created in the console appear on the shop, so it comes before any
console screen that creates one, and after Phase 4 has said what stock a product carries.

### The add-product console

The service has had `POST /api/admin/products` and the three-step catalogue import since
August; nothing in the storefront calls either. It waits on the read seam above, or a part
created through it would not appear on the shop.

---

## Not started, and not ours to decide

These are the top of the readiness report and they are the owner's call.

1. **The seeded credentials are live.** `ALLFIX_SEED_PASSWORD` is set in Vercel Production,
   and `V5__seed_accounts.sql` is an unguarded migration that puts six accounts with one
   shared password into any new database, the owner's among them.
2. **Production has no service.** Vercel holds two environment variables and neither is an
   API address, so orders are priced locally and never persisted, registrations are
   discarded, and enquiries are written to the customer's own browser.
3. **The domain has not moved.** `allfix.co.ke` still serves the old WooCommerce site while
   the deployed sitemap already advertises it.
4. **Live M-Pesa credentials**, delivery rates by county, and the last few prices are still
   with the client.

---

## Two things worth not relearning

**Run it wired before believing it.** Everything in the scan section above passed its own
tests in isolation. The failures only exist at the join, which is why each piece here is
verified against a running service as well as against CI.

**The suite at full parallelism against a wired stack is not stable yet**, and it is not the
code: `main` shows the same failures as any branch, and they are the service's own rate
limits plus a single `next start` under load. CI runs unwired and is green. Worth its own
look before it is used as a signal.
