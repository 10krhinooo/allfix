#!/usr/bin/env python3
"""
Turn the AllFix WooCommerce export into a clean catalogue.

The source store cannot sell: every product is priced 0 in USD, five rows are
junk, the taxonomy is corrupt, and the browse axis is the wrong one. This script
produces the catalogue the new storefront and backend are built on.

    python3 migrate.py [--images] [--prices prices.csv]

Writes ../../data/catalogue.json. With --images, also downloads and optimises
the product photography into ../../public/products/.

Two sources, and they answer different questions. The WooCommerce export holds
the rail parts and their photography but no usable price. The client's product
sheet holds the money, the unit each price is quoted in, and the entire rod
line, which never appeared on the old site.
"""

import argparse
import csv
import html
import json
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from systems import SYSTEMS, system_for_sku, UNIVERSAL_PREFIXES, curtain_side_systems, stock_length_for
from components import component_for_name, component_for_category, PURPOSE, PER_METRE, MINIMUM
from variants import VARIANT_GROUPS, group_for_sku
from ranges import RANGES, ROD_PREFIX, range_for_sku
from sheet import load_sheet

HERE = Path(__file__).parent
REPO = HERE.parent.parent
RAW = HERE / "raw"
OUT = REPO / "data" / "catalogue.json"
IMG_OUT = REPO / "public" / "products"


# ---------------------------------------------------------------- specs

SPEC_LINE = re.compile(r"^\s*([A-Za-z][A-Za-z /&-]{1,30}?)\s*:\s*(.+?)\s*$")


def parse_specs(*html_blobs):
    """
    Pull a specification table out of the WooCommerce description HTML.

    The shop wrote these as `Label: value<br />Label: value`, which is real
    structured data trapped in a paragraph. Recovering it is what lets the new
    product page treat specs as a feature instead of a wall of text. Anything
    that does not parse as `Label: value` is kept as prose so no copy is lost.
    """
    specs, prose = [], []
    seen = set()
    for blob in html_blobs:
        if not blob:
            continue
        text = re.sub(r"<br\s*/?>", "\n", blob)
        text = re.sub(r"</?p[^>]*>", "\n", text)
        text = re.sub(r"<[^>]+>", "", text)
        for line in html.unescape(text).split("\n"):
            line = line.strip()
            if not line:
                continue
            match = SPEC_LINE.match(line)
            if match:
                label, value = match.group(1).strip(), match.group(2).strip()
                key = label.lower()
                if key not in seen:
                    seen.add(key)
                    specs.append({"label": label, "value": value})
            elif line not in prose:
                prose.append(line)
    return specs, " ".join(prose)


def slugify(text):
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", text.lower())).strip("-")


# ---------------------------------------------------------------- prices

def load_prices(path):
    """
    Read the client price list: a CSV of `sku,price_kes[,trade_price_kes,stock]`.

    Prices are the one thing that cannot be recovered from the old site, because
    every product there is priced zero. Until the client supplies this file the
    catalogue is built with prices marked null, and the storefront shows the part
    as "price on request" rather than inventing a number.
    """
    if not path:
        return {}
    prices = {}
    with open(path, newline="") as handle:
        for row in csv.DictReader(handle):
            sku = (row.get("sku") or "").strip()
            if not sku:
                continue
            def num(field):
                raw = (row.get(field) or "").strip().replace(",", "")
                return int(round(float(raw))) if raw else None
            prices[sku] = {
                "retail": num("price_kes"),
                "trade": num("trade_price_kes"),
                "stock": num("stock"),
            }
    return prices


# ---------------------------------------------------------------- rods

DIAMETER = re.compile(r"\b(\d{2})\s*mm\b", re.IGNORECASE)


def diameter_for(name):
    """
    The bore a rod part is cut for, in millimetres.

    Only the parts that have to match the pole carry one: a 28mm ring will not
    go over a 28mm rod's finial unless both are 28. A finial or a bracket is
    sold by finish alone, and says so by leaving this null rather than by
    guessing at a size.
    """
    found = DIAMETER.search(name or "")
    return int(found.group(1)) if found else None


def build_rods(sheet):
    """Every rod SKU in the client sheet, as catalogue products."""
    items = []
    for code, entry in sheet.items():
        if not code.startswith(ROD_PREFIX):
            continue
        component = component_for_category(entry["categories"])
        if not component:
            continue
        component_slug, component_label = component
        items.append({
            "sku": code,
            "name": entry["name"],
            "slug": slugify(entry["name"]),
            "family": "rod",
            "system": None,
            "range": range_for_sku(code),
            "diameter": diameter_for(entry["name"]),
            "universal": False,
            "fitsSystems": [],
            "component": component_slug,
            "componentLabel": component_label,
            "specs": entry["specs"],
            "summary": entry["headline"],
            "description": entry["description"],
            "priceKes": entry["priceKes"],
            "priceBasis": entry["priceBasis"],
            "priceNote": entry["priceNote"],
            "tradePriceKes": None,
            "stock": entry["stock"],
            # The rod line has never been photographed for the site. The sheet
            # names the shot it expects, so the name is carried and the card
            # draws a placeholder until the file arrives.
            "image": None,
            "imageName": entry["imageName"],
            "legacyUrl": None,
        })
    return items


def build_sheet_rails(sheet, seen, prices):
    """
    Rail parts the client sells that the old site never listed.

    The WooCommerce export is the source of the rail catalogue, but it is not a
    complete one: the sheet carries 25 rail SKUs it never had, including most of
    the roman blind line. Left out, a system page would show a track with no
    stoppers and no rings, which is the empty-shelf problem the old site had.

    These rows have never been photographed, so they carry the shot name the
    sheet asks for and no image, exactly as the rods do.
    """
    items, unplaced = [], []
    for code, entry in sheet.items():
        if code.startswith(ROD_PREFIX) or code in seen:
            continue
        universal = code.startswith(UNIVERSAL_PREFIXES)
        system_slug = system_for_sku(code)
        if not universal and not system_slug:
            # A prefix this table has never seen. It used to be dropped without a
            # word, which is how a sheet adding five product lines could be run
            # through the migration and report the same count as before: forty
            # two parts went in and nothing came out to say they had not landed.
            # Named here and printed at the end, so a new prefix is a line of
            # output rather than a silence.
            unplaced.append(code)
            continue
        component_slug, component_label = component_for_name(entry["name"])
        override = prices.get(code, {})
        items.append({
            "sku": code,
            "name": entry["name"],
            "slug": slugify(entry["name"]),
            "family": "rail",
            "system": system_slug,
            "range": None,
            "diameter": None,
            "universal": universal,
            "fitsSystems": curtain_side_systems() if universal else [system_slug],
            "component": component_slug,
            "componentLabel": component_label,
            "specs": entry["specs"],
            "summary": entry["headline"],
            "description": entry["description"],
            "priceKes": override.get("retail", entry["priceKes"]),
            "priceBasis": entry["priceBasis"],
            "priceNote": entry["priceNote"],
            "tradePriceKes": override.get("trade"),
            "stock": override.get("stock", entry["stock"]),
            "image": None,
            "imageName": entry["imageName"],
            "legacyUrl": None,
        })
    return items, unplaced


# ---------------------------------------------------------------- build

def build(prices, sheet):
    products = json.loads((RAW / "wc-products.json").read_text())

    system_by_slug = {s["slug"]: s for s in SYSTEMS}
    all_system_slugs = curtain_side_systems()

    dropped, retired, items = [], [], []

    for source in products:
        sku = (source.get("sku") or "").strip()
        # The five rows named "Product" carry no SKU, no image and no category.
        # They are placeholder rows, not stock, and are dropped outright.
        if not sku:
            dropped.append(source.get("name") or f"id:{source.get('id')}")
            continue

        # The sheet is the list of what the shop sells, and the export is a
        # record of what it sold. Until the August sheet every SKU in the export
        # was on the sheet as well, so the difference never arose; that sheet
        # renumbers the #15 line to #10 and withdraws two more parts, and
        # without this they would stay in the catalogue as the export left them,
        # priced at nothing because the sheet no longer quotes them. A part
        # quietly losing its price is the fault this whole project exists to
        # correct, so a part the sheet has dropped leaves with it. Guarded on
        # the sheet having loaded at all, because an absent workbook must not
        # read as every part being withdrawn.
        if sheet and sku not in sheet:
            retired.append(sku)
            continue

        system_slug = system_for_sku(sku)
        component_slug, component_label = component_for_name(source["name"])
        specs, prose = parse_specs(source.get("short_description"), source.get("description"))
        # The sheet is the price of record. An explicit --prices CSV still wins,
        # so a correction can be made without waiting on a new workbook.
        quoted = sheet.get(sku, {})
        price = prices.get(sku) or {"retail": quoted.get("priceKes"), "trade": None, "stock": quoted.get("stock")}

        # A part made for one system fits that system. Curtain-side parts --
        # tapes, hooks, buckles -- attach to the curtain rather than the track,
        # so they fit every system.
        universal = sku.startswith(UNIVERSAL_PREFIXES)
        fits = all_system_slugs if universal else [system_slug]

        # The sheet's name wins where it has one, and that is a change worth
        # stating. The export is what the old site called a part; the sheet is
        # what the shop calls it now, and the August sheet renames four of them,
        # one of which had gone badly wrong: RL#28_008 is listed in the export
        # as "#28 Runners" and is a double ceiling bracket, which collided with
        # the real runners the sheet adds as RL#28_009 and would have put two
        # different parts on one product URL. Another moves a motorised corner
        # joint from 45 degrees to 90, and somebody ordering the wrong one finds
        # out on site. Only four of the sixty two differ, so this is a
        # correction rather than a rewrite.
        name = quoted.get("name") or source["name"]

        items.append({
            "sku": sku,
            "name": name,
            "slug": slugify(name),
            "family": "rail",
            "system": system_slug,
            "range": None,
            "diameter": None,
            "universal": universal,
            "fitsSystems": fits,
            "component": component_slug,
            "componentLabel": component_label,
            # The export's specs are richer than the sheet's, so they lead, and
            # the sheet fills in anything the export never carried.
            "specs": specs or quoted.get("specs") or [],
            "summary": prose or quoted.get("headline") or "",
            "description": quoted.get("description") or "",
            "priceKes": price.get("retail"),
            "priceBasis": quoted.get("priceBasis") or "each",
            "priceNote": quoted.get("priceNote"),
            "tradePriceKes": price.get("trade"),
            "stock": price.get("stock"),
            "image": source["images"][0]["src"] if source.get("images") else None,
            "imageName": quoted.get("imageName"),
            "legacyUrl": source.get("permalink"),
        })

    # The sheet knows rail parts the export never carried. They join here, ahead
    # of the variant pass, so a colour the export never listed still collapses
    # into its group rather than standing alone beside it.
    from_sheet, unplaced = build_sheet_rails(sheet, {i["sku"] for i in items}, prices)
    items.extend(from_sheet)

    # ------------------------------------------------ collapse variants
    grouped, standalone = defaultdict(list), []
    for item in items:
        group = group_for_sku(item["sku"])
        (grouped[group["slug"]] if group else standalone).append(item)

    catalogue = list(standalone)
    for group in VARIANT_GROUPS:
        members = grouped.get(group["slug"])
        if not members:
            continue
        order = list(group["members"].keys())
        members.sort(key=lambda m: order.index(m["sku"]))
        lead = members[0]
        # A group is priced by the cheapest of its members that has a price, so
        # a card can say "from KES x" honestly when only some colours are
        # quoted, rather than inheriting whichever colour happens to lead.
        quotes = [m["priceKes"] for m in members if m["priceKes"]]
        catalogue.append({
            "sku": None,
            "name": group["name"],
            "slug": group["slug"],
            "family": lead["family"],
            "system": lead["system"],
            "range": None,
            "diameter": None,
            "universal": lead["universal"],
            "fitsSystems": lead["fitsSystems"],
            "component": lead["component"],
            "componentLabel": lead["componentLabel"],
            "specs": lead["specs"],
            "summary": lead["summary"],
            "description": lead["description"],
            "priceKes": min(quotes) if quotes else None,
            "priceBasis": lead["priceBasis"],
            "priceNote": lead["priceNote"],
            "tradePriceKes": lead["tradePriceKes"],
            "stock": None,
            "image": lead["image"],
            "imageName": lead["imageName"],
            "legacyUrl": lead["legacyUrl"],
            "variantAxis": group["axis"],
            "variants": [
                {
                    "sku": m["sku"],
                    "label": group["members"][m["sku"]]["label"],
                    "swatch": group["members"][m["sku"]]["swatch"],
                    "priceKes": m["priceKes"],
                    "priceBasis": m["priceBasis"],
                    "tradePriceKes": m["tradePriceKes"],
                    "stock": m["stock"],
                    "image": m["image"],
                    "legacyUrl": m["legacyUrl"],
                }
                for m in members
            ],
        })

    catalogue.extend(build_rods(sheet))
    catalogue.sort(key=lambda p: (p["family"], p["system"] or p["range"] or "zzz", p["component"], p["name"]))

    # ------------------------------------------------ derived collections
    components_used = {}
    for product in catalogue:
        components_used.setdefault(
            product["component"],
            {
                "slug": product["component"],
                "name": product["componentLabel"],
                "purpose": PURPOSE.get(product["component"], ""),
                # The fitting rates travel with the data so the configurator
                # counts with the same numbers the copy beside it quotes.
                "perMetre": PER_METRE.get(product["component"]),
                "minimum": MINIMUM.get(product["component"]),
            },
        )

    systems_out = []
    for system in SYSTEMS:
        parts = [p for p in catalogue if system["slug"] in p["fitsSystems"]]
        systems_out.append({
            **{k: v for k, v in system.items() if k != "prefixes"},
            "skuPrefixes": system["prefixes"],
            # Stated on every system rather than only on the unusual ones, so a
            # reader of the catalogue never has to know the default.
            "kind": system.get("kind", "rail"),
            "partCount": len(parts),
            "components": sorted({p["component"] for p in parts}),
            "stockLengthM": stock_length_for(system["slug"]),
        })

    ranges_out = []
    for entry in RANGES:
        parts = [p for p in catalogue if p.get("range") == entry["slug"]]
        ranges_out.append({
            **{k: v for k, v in entry.items() if k != "prefixes"},
            "skuPrefixes": entry["prefixes"],
            "partCount": len(parts),
            "components": sorted({p["component"] for p in parts}),
            "diameters": sorted({p["diameter"] for p in parts if p["diameter"]}),
        })

    return {
        "generatedFrom": "allfix.co.ke WooCommerce Store API, and the client product sheet",
        "systems": systems_out,
        "ranges": ranges_out,
        "components": sorted(components_used.values(), key=lambda c: c["name"]),
        "products": catalogue,
        "dropped": dropped,
        "retired": retired,
        "unplaced": unplaced,
        "skuCount": sum(len(p.get("variants", [])) or 1 for p in catalogue),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--prices", help="CSV of sku,price_kes,trade_price_kes,stock, overrides the sheet")
    parser.add_argument("--sheet", help="the client product workbook, defaults to raw/product-upload.xlsx")
    parser.add_argument("--images", action="store_true", help="download and optimise photography")
    args = parser.parse_args()

    sheet = load_sheet(args.sheet)
    catalogue = build(load_prices(args.prices), sheet)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(catalogue, indent=2) + "\n")

    products = catalogue["products"]
    rails = [p for p in products if p["family"] == "rail"]
    rods = [p for p in products if p["family"] == "rod"]
    priced = sum(1 for p in products if p["priceKes"] is not None)
    quoted = sum(1 for p in products if p["priceNote"])
    print(f"products      {len(products)} ({catalogue['skuCount']} SKUs)")
    print(f"  rails       {len(rails)}")
    print(f"  rods        {len(rods)} from the client sheet")
    print(f"dropped       {len(catalogue['dropped'])}  {catalogue['dropped']}")
    print(f"retired       {len(catalogue['retired'])}  {catalogue['retired']}")
    if catalogue["unplaced"]:
        # Loud, and last of the counts, because it is the one line here that
        # means the sheet said something this migration did not understand.
        print(f"UNPLACED      {len(catalogue['unplaced'])} sku prefixes are not in systems.py, "
              f"so these were left out: {catalogue['unplaced']}")
    print(f"systems       {len(catalogue['systems'])}")
    print(f"ranges        {len(catalogue['ranges'])}")
    print(f"components    {len(catalogue['components'])}")
    print(f"priced        {priced}/{len(products)}, {quoted} carry a pricing note")
    # Beside the price count, because it is the same kind of gap and it lands on
    # the same worksheet: /admin/parts is filtered by what is missing.
    waiting = [p["sku"] or p["slug"] for p in products if not p["image"] and not p["imageName"]]
    print(f"no shot yet   {len(waiting)}  {waiting}")
    print(f"unpriced      {[p['sku'] or p['slug'] for p in products if p['priceKes'] is None]}")
    print(f"-> {OUT.relative_to(REPO)}")

    if args.images:
        from images import process_all
        process_all(catalogue, IMG_OUT)


if __name__ == "__main__":
    main()
