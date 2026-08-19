"""
Declared variant groups.

The WooCommerce catalogue has no attributes and no variations at all: the six
buckle colours are six separate products. Collapsing them gives one product with
a colour swatch, which is both the better shopping experience and the honest
data model.

These groups are declared by SKU rather than inferred from names on purpose.
Fuzzy name matching would merge parts that are genuinely different -- a
"#15 Bendable Runner" and a "#15 Bendable Runner with Metal" are not the same
part -- and a wrong merge silently loses a SKU. Every variant keeps its own SKU,
stock and image, so nothing is lost by collapsing.
"""

VARIANT_GROUPS = [
    {
        "slug": "curtain-buckles",
        "name": "Curtain Buckles",
        "axis": "Finish",
        "members": {
            "RL#ACC_010": {"label": "Marble brown", "swatch": "#6B4A32"},
            "RL#ACC_009": {"label": "Marble black", "swatch": "#2B2B2E"},
            "RL#ACC_008": {"label": "Black",        "swatch": "#141416"},
            "RL#ACC_006": {"label": "Copper",       "swatch": "#B06B3A"},
            "RL#ACC_005": {"label": "Silver",       "swatch": "#B9BCC1"},
            "RL#ACC_004": {"label": "White",        "swatch": "#F2F2F0"},
        },
    },
    {
        "slug": "curtain-tape-hooks",
        "name": "Curtain Tape Hooks",
        "axis": "Material",
        "members": {
            "RL#ACC_003": {"label": "Plastic", "swatch": "#E8E8E6"},
            "RL#ACC_002": {"label": "Metal",   "swatch": "#9AA0A6"},
        },
    },
]

def group_for_sku(sku: str):
    for group in VARIANT_GROUPS:
        if sku in group["members"]:
            return group
    return None
