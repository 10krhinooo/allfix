"""
The rail systems AllFix stocks, and the SKU prefix that identifies each one.

This table is the heart of the migration. The WooCommerce catalogue organises
parts by component type (Brackets, Stoppers, Runners), which is the wrong axis:
nobody shops for "a stopper", they own a #20 rail and need parts that fit it.
The SKU prefix already encodes the system, so it is the reliable signal.
"""

# Order matters: RL#20R_ must be tested before RL#20_, which is a prefix of it.
SYSTEMS = [
    {
        "slug": "motorised",
        "prefixes": ["RL#MOTOR_"],
        "name": "Motorised",
        "shortName": "Motorised",
        "blurb": "Curtains that open at the touch of a button or on a schedule. "
                 "A driven track with a motor sized to the run, for homes, offices and hotels.",
        "flagship": True,
    },
    {
        "slug": "20-rubber",
        "prefixes": ["RL#20R_"],
        "name": "#20 with rubber",
        "shortName": "#20R",
        "blurb": "The #20 profile with a rubber insert, for quieter gliding on a heavier curtain.",
    },
    {
        "slug": "20",
        "prefixes": ["RL#20_"],
        "name": "#20",
        "shortName": "#20",
        "blurb": "The workhorse aluminium track. The widest parts range we stock, "
                 "in single and double, wall and ceiling.",
    },
    {
        "slug": "28",
        "prefixes": ["RL#28_"],
        "name": "#28",
        "shortName": "#28",
        "blurb": "A heavier profile for wide spans and heavy lined curtains, with a ripple option.",
    },
    {
        "slug": "15-bendable",
        "prefixes": ["RL#15_"],
        "name": "#15 bendable",
        "shortName": "#15",
        "blurb": "A bendable track that follows a bay window or a curved wall.",
    },
    {
        "slug": "17-rubber",
        "prefixes": ["RL#17_"],
        "name": "#17 groove rubber",
        "shortName": "#17",
        "blurb": "A bendable rubber groove track, for curves that need a quiet, soft glide.",
    },
    {
        "slug": "ks",
        "prefixes": ["RL#KS_"],
        "name": "KS",
        "shortName": "KS",
        "blurb": "A compact ceiling-fixed system for a discreet, recessed look.",
    },
    {
        "slug": "double-rail",
        "prefixes": ["RL#DR_"],
        "name": "Double rail",
        "shortName": "Double",
        "blurb": "One track carrying both a sheer and a main curtain.",
    },
    {
        "slug": "roman-blind",
        "prefixes": ["RL#ROMAN_"],
        "name": "Roman blind",
        "shortName": "Roman",
        "blurb": "The corded track a roman blind is built on.",
    },
]

# RL#ACC_ parts are curtain-side, not track-side: tapes, hooks and buckles work
# with any system, so they are marked universal rather than given a system.
UNIVERSAL_PREFIX = "RL#ACC_"

def system_for_sku(sku: str):
    """Return the system slug for a SKU, or None if the part is universal."""
    if not sku:
        return None
    if sku.startswith(UNIVERSAL_PREFIX):
        return None
    for system in SYSTEMS:
        for prefix in system["prefixes"]:
            if sku.startswith(prefix):
                return system["slug"]
    return None
