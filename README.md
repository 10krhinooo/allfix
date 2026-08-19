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
