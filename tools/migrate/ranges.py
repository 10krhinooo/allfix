"""
The curtain rod ranges, and the SKU prefix that identifies each one.

Rods are the second half of the shop and were missing from the old site
entirely: the WooCommerce export has no rod SKU at all, while the client's
sheet carries 74 of them, every one priced. They do not belong on the rail
system axis, because a rod is not a track and nothing that fits a #20 fits a
28mm pole.

What a rod customer matches on is finish, then diameter: someone with an
antique brass 28mm pole needs a finial in the same brass and rings in the same
28. So finish is the browse axis here, exactly as system is for rails, and
diameter is the filter within it.
"""

RANGES = [
    {
        "slug": "antique-brass",
        "prefixes": ["RD#AB_"],
        "name": "Antique brass",
        "shortName": "Brass",
        "swatch": "#B08D57",
        "blurb": "Warm aged brass, the widest rod range we stock, with finials from a plain "
                 "basket to a cut diamond.",
    },
    {
        "slug": "antique-copper",
        "prefixes": ["RD#AC_"],
        "name": "Antique copper",
        "shortName": "Copper",
        "swatch": "#B06B3A",
        "blurb": "A redder metal than the brass, for warm rooms and darker timber.",
    },
    {
        "slug": "antique-black",
        "prefixes": ["RD#BL_"],
        "name": "Antique black",
        "shortName": "Black",
        "swatch": "#2B2B2E",
        "blurb": "Matt black wrought iron, the quiet choice against a white wall.",
    },
    {
        "slug": "antique-silver",
        "prefixes": ["RD#MN_"],
        "name": "Antique silver",
        "shortName": "Silver",
        "swatch": "#B9BCC1",
        "blurb": "A cool brushed silver that sits with aluminium windows and chrome fittings.",
    },
]

ROD_PREFIX = "RD#"


def range_for_sku(sku):
    for entry in RANGES:
        if any(sku.startswith(prefix) for prefix in entry["prefixes"]):
            return entry["slug"]
    return None
