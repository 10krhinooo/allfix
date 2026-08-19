"""
The client's product sheet: prices, units, copy, and the rod line.

This is the second source the catalogue is built from, and the only source of
money in the project. The WooCommerce export priced everything at zero, so
without this sheet nothing can be bought. It also carries 74 curtain rod SKUs
that never made it onto the old site at all.

Read straight out of the workbook zip rather than through a spreadsheet library,
so the migration keeps running on a bare Python install like the rest of it.

Two columns need judgement rather than parsing:

  Price  is usually a number, but sometimes prose ("Included in the cost of the
         track per mtr") and once two numbers, a rate and a full-length price.
         A price that is not a number is never guessed at: it is carried through
         as a note and the SKU stays unpriced, because a wrong number here is
         worse than no number.
  Unit   says what the price buys. A track at 400 is 400 per metre and a tie
         back at 300 is 300 for the pair, so a bare figure would misprice both.
"""

import re
import xml.etree.ElementTree as ET
import zipfile
from io import BytesIO
from pathlib import Path

MAIN = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"

COLUMNS = {
    "A": "code",
    "B": "name",
    "C": "specs",
    "D": "headline",
    "E": "description",
    "F": "stock",
    "G": "price",
    "H": "unit",
    "I": "categories",
    "J": "image",
}

# What a price buys. The sheet writes these by hand, so they are matched loosely.
BASES = [
    ("metre", ["per meter", "per metre", "per mtr"]),
    ("pair", ["pair"]),
    ("box", ["box"]),
    ("roll", ["roll"]),
    ("length", ["full length"]),
]

SPEC_LINE = re.compile(r"^\s*([A-Za-z][A-Za-z /&-]{1,30}?)\s*:\s*(.+?)\s*$")


def _parse(payload):
    """
    Parse one part of the workbook.

    A workbook is a file someone emails you, so it is treated as untrusted input
    even though this one is committed. ElementTree does not resolve external
    entities, which rules out XXE, but it will happily expand nested internal
    ones, so a declared doctype is refused outright rather than parsed. A real
    spreadsheet does not carry one.
    """
    head = payload[:1024].lstrip()
    if b"<!DOCTYPE" in head.upper():
        raise ValueError("workbook declares a doctype, which a spreadsheet has no reason to do")
    return ET.parse(BytesIO(payload)).getroot()


def _cells(path):
    """Every row of the first worksheet, as {column letter: text}."""
    with zipfile.ZipFile(path) as book:
        strings = [
            "".join(node.text or "" for node in item.iter(MAIN + "t"))
            for item in _parse(book.read("xl/sharedStrings.xml")).findall(MAIN + "si")
        ]
        sheet = _parse(book.read("xl/worksheets/sheet1.xml"))

    for row in sheet.iter(MAIN + "row"):
        values = {}
        for cell in row:
            value = cell.find(MAIN + "v")
            if value is None:
                continue
            letter = "".join(ch for ch in cell.get("r") if ch.isalpha())
            values[letter] = strings[int(value.text)] if cell.get("t") == "s" else value.text
        if values:
            yield values


def _number(text):
    try:
        return int(round(float(text.replace(",", "").strip())))
    except (AttributeError, ValueError):
        return None


def read_price(raw, unit):
    """
    Resolve one price cell into an amount, what it buys, and anything left over.

    A cell holding two figures is a rate plus a full length, which is a real
    thing a rail shop quotes and not a mistake. The rate is the price and the
    length is kept as a note, because a customer buying 3 metres needs the rate
    and a customer buying a stock length needs to be told the other figure
    exists.
    """
    text = (raw or "").strip()
    units = [part.strip() for part in (unit or "").split("\n") if part.strip()]
    figures = [part.strip() for part in text.split("\n") if part.strip()]

    amounts = [_number(figure) for figure in figures]
    basis = _basis(units[0]) if units else "each"

    if not figures:
        return None, basis, None

    if amounts[0] is None:
        # Prose in the price column: a pricing rule, not a figure.
        return None, basis, text.replace("\n", " ").strip()

    note = None
    if len(amounts) > 1 and amounts[1] is not None:
        second = _basis(units[1]) if len(units) > 1 else "length"
        note = f"KES {amounts[1]:,} per {second}" if second != "each" else f"KES {amounts[1]:,}"

    return amounts[0], basis, note


def _basis(unit):
    lowered = (unit or "").strip().lower()
    for slug, keywords in BASES:
        if any(keyword in lowered for keyword in keywords):
            return slug
    return "each"


def read_specs(text):
    """The sheet writes specs one per line as `Label: value`, same as the old site."""
    specs, prose, seen = [], [], set()
    for line in (text or "").split("\n"):
        line = line.strip()
        if not line:
            continue
        match = SPEC_LINE.match(line)
        if match and match.group(1).strip().lower() not in seen:
            seen.add(match.group(1).strip().lower())
            specs.append({"label": match.group(1).strip(), "value": match.group(2).strip()})
        elif not match:
            prose.append(line)
    return specs, " ".join(prose)


def load_sheet(path=None):
    """Every priced row in the client sheet, keyed by SKU."""
    path = Path(path or Path(__file__).parent / "raw" / "product-upload.xlsx")
    if not path.exists():
        return {}

    rows = _cells(path)
    next(rows, None)                      # the header

    entries = {}
    for values in rows:
        row = {name: (values.get(letter) or "").strip() for letter, name in COLUMNS.items()}
        if not row["code"]:
            continue
        price, basis, note = read_price(row["price"], row["unit"])
        specs, prose = read_specs(row["specs"])
        entries[row["code"]] = {
            "sku": row["code"],
            "name": re.sub(r"\s+", " ", row["name"]).strip(),
            "specs": specs,
            "headline": row["headline"] or prose,
            "description": row["description"],
            "priceKes": price,
            "priceBasis": basis,
            "priceNote": note,
            "stock": _number(row["stock"]),
            "categories": row["categories"],
            "imageName": row["image"].strip() or None,
        }
    return entries
