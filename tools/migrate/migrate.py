#!/usr/bin/env python3
"""
Turn the AllFix WooCommerce export into a clean catalogue.

The source store cannot sell: every product is priced 0 in USD, five rows are
junk, the taxonomy is corrupt, and the browse axis is the wrong one. This script
produces the catalogue the new storefront and backend are built on.

    python3 migrate.py [--images] [--prices prices.csv]

Writes ../../data/catalogue.json. With --images, also downloads and optimises
the product photography into ../../public/products/.
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
from systems import SYSTEMS, system_for_sku, UNIVERSAL_PREFIX
from components import component_for_name, PURPOSE
from variants import VARIANT_GROUPS, group_for_sku

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


# ---------------------------------------------------------------- build

def build(prices):
    products = json.loads((RAW / "wc-products.json").read_text())

    system_by_slug = {s["slug"]: s for s in SYSTEMS}
    all_system_slugs = [s["slug"] for s in SYSTEMS]

    dropped, items = [], []

    for source in products:
        sku = (source.get("sku") or "").strip()
        # The five rows named "Product" carry no SKU, no image and no category.
        # They are placeholder rows, not stock, and are dropped outright.
        if not sku:
            dropped.append(source.get("name") or f"id:{source.get('id')}")
            continue

        system_slug = system_for_sku(sku)
        component_slug, component_label = component_for_name(source["name"])
        specs, prose = parse_specs(source.get("short_description"), source.get("description"))
        price = prices.get(sku, {})

        # A part made for one system fits that system. Curtain-side parts --
        # tapes, hooks, buckles -- attach to the curtain rather than the track,
        # so they fit every system.
        universal = sku.startswith(UNIVERSAL_PREFIX)
        fits = all_system_slugs if universal else [system_slug]

        items.append({
            "sku": sku,
            "name": source["name"],
            "slug": slugify(source["name"]),
            "system": system_slug,
            "universal": universal,
            "fitsSystems": fits,
            "component": component_slug,
            "componentLabel": component_label,
            "specs": specs,
            "summary": prose,
            "priceKes": price.get("retail"),
            "tradePriceKes": price.get("trade"),
            "stock": price.get("stock"),
            "image": source["images"][0]["src"] if source.get("images") else None,
            "legacyUrl": source.get("permalink"),
        })

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
        catalogue.append({
            "sku": None,
            "name": group["name"],
            "slug": group["slug"],
            "system": lead["system"],
            "universal": lead["universal"],
            "fitsSystems": lead["fitsSystems"],
            "component": lead["component"],
            "componentLabel": lead["componentLabel"],
            "specs": lead["specs"],
            "summary": lead["summary"],
            "priceKes": lead["priceKes"],
            "tradePriceKes": lead["tradePriceKes"],
            "stock": None,
            "image": lead["image"],
            "legacyUrl": lead["legacyUrl"],
            "variantAxis": group["axis"],
            "variants": [
                {
                    "sku": m["sku"],
                    "label": group["members"][m["sku"]]["label"],
                    "swatch": group["members"][m["sku"]]["swatch"],
                    "priceKes": m["priceKes"],
                    "tradePriceKes": m["tradePriceKes"],
                    "stock": m["stock"],
                    "image": m["image"],
                    "legacyUrl": m["legacyUrl"],
                }
                for m in members
            ],
        })

    catalogue.sort(key=lambda p: (p["system"] or "zzz", p["component"], p["name"]))

    # ------------------------------------------------ derived collections
    components_used = {}
    for product in catalogue:
        components_used.setdefault(
            product["component"],
            {
                "slug": product["component"],
                "name": product["componentLabel"],
                "purpose": PURPOSE.get(product["component"], ""),
            },
        )

    systems_out = []
    for system in SYSTEMS:
        parts = [p for p in catalogue if system["slug"] in p["fitsSystems"]]
        systems_out.append({
            **{k: v for k, v in system.items() if k != "prefixes"},
            "skuPrefixes": system["prefixes"],
            "partCount": len(parts),
            "components": sorted({p["component"] for p in parts}),
        })

    return {
        "generatedFrom": "allfix.co.ke WooCommerce Store API",
        "systems": systems_out,
        "components": sorted(components_used.values(), key=lambda c: c["name"]),
        "products": catalogue,
        "dropped": dropped,
        "skuCount": sum(len(p.get("variants", [])) or 1 for p in catalogue),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--prices", help="CSV of sku,price_kes,trade_price_kes,stock")
    parser.add_argument("--images", action="store_true", help="download and optimise photography")
    args = parser.parse_args()

    catalogue = build(load_prices(args.prices))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(catalogue, indent=2) + "\n")

    priced = sum(1 for p in catalogue["products"] if p["priceKes"] is not None)
    print(f"products      {len(catalogue['products'])} ({catalogue['skuCount']} SKUs)")
    print(f"dropped       {len(catalogue['dropped'])}  {catalogue['dropped']}")
    print(f"systems       {len(catalogue['systems'])}")
    print(f"components    {len(catalogue['components'])}")
    print(f"priced        {priced}/{len(catalogue['products'])}")
    print(f"-> {OUT.relative_to(REPO)}")

    if args.images:
        from images import process_all
        process_all(catalogue, IMG_OUT)


if __name__ == "__main__":
    main()
