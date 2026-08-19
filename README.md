# AllFix By Kipekee

Storefront for a Nairobi curtain-hardware supplier on Njugu Lane, CBD: rails, rods,
motorised systems and the parts that fit them.

Replaces `allfix.co.ke`, a WooCommerce store that could not take an order — every one of
its 67 products was priced 0 in USD, the browse pages were disconnected from the shop, and
the catalogue carried no structured data at all.

## The organising idea: shop by system, not by part

The old site browsed by component type — Brackets, Stoppers, Runners — which makes every
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

## Migration

`tools/migrate/` rebuilds the catalogue from the old store's WooCommerce Store API. The raw
export is committed under `tools/migrate/raw/` so the migration is reproducible offline.

```bash
python3 tools/migrate/migrate.py --images --prices data/price-list.csv
python3 -m unittest discover -s tools/migrate -t tools/migrate
```

What it does:

- drops the 5 placeholder rows named "Product" that carry no SKU, image or category
- derives the rail system from the SKU prefix, and the part type from the product name
  (the WooCommerce categories are corrupt — `Tapes` is its own parent, 5 products sit in
  `Uncategorized`)
- recovers a specification table from the `Label: value<br/>` HTML the shop wrote into the
  descriptions, so specs render as data instead of prose
- collapses declared colour and material duplicates into variants — the six buckle colours
  were six separate products
- resolves `fitsSystems` for every part
- trims, squares and compresses the photography: 62 images, 18 KB average, down from
  70–120 KB unoptimised JPEG

Result: **56 products across 62 SKUs**, from 67 source rows.

## Prices

Prices are the one thing that cannot be recovered — the source store prices everything at
zero. `data/price-list-template.csv` lists all 62 SKUs with the product, system and part
type pre-filled for the client to complete. Until it comes back, the catalogue builds with
prices null and the storefront shows "price on request" rather than inventing a number.
