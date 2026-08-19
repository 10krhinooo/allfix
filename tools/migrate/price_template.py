"""
Generate the price list the client fills in.

This is the single hard blocker on launch: the old store prices everything at 0
in USD, so there is no price data to recover. The template lists every SKU with
the name, system and part type already filled in, so the shop only has to type
numbers into three columns.
"""

import csv
import json
import sys
from pathlib import Path

REPO = Path(__file__).parent.parent.parent
OUT = REPO / "data" / "price-list-template.csv"


def main():
    catalogue = json.loads((REPO / "data" / "catalogue.json").read_text())
    systems = {s["slug"]: s["name"] for s in catalogue["systems"]}

    rows = []
    for product in catalogue["products"]:
        for entry in product.get("variants") or [product]:
            label = f" ({entry['label']})" if "label" in entry else ""
            rows.append({
                "sku": entry["sku"],
                "product": product["name"] + label,
                "system": systems.get(product["system"], "Fits any system"),
                "part": product["componentLabel"],
                "price_kes": "",
                "trade_price_kes": "",
                "stock": "",
            })

    rows.sort(key=lambda r: (r["system"], r["part"], r["product"]))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT, "w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    print(f"{len(rows)} SKUs -> {OUT.relative_to(REPO)}")


if __name__ == "__main__":
    main()
