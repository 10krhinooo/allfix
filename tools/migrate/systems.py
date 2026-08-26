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
        "slug": "10-bendable",
        "prefixes": ["RL#10_"],
        "name": "#10 bendable",
        "shortName": "#10",
        "blurb": "A bendable track that follows a bay window or a curved wall, "
                 "plain or with a rubber insert for a quieter glide.",
    },
    {
        "slug": "17-rubber",
        # The groove runner arrived under a prefix of its own and fits this
        # track, which is the only groove system in the range.
        "prefixes": ["RL#17_", "RL#GROOVE_"],
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
    # Zebra and roller blinds are a tube and a mechanism rather than a track,
    # and they sit here for the reason the roman blind already does: the
    # question this axis asks is what the customer already has above the
    # window, and "a zebra blind" is an answer to it. Nearly every part of both
    # is unpriced in the sheet, so most of each system is price on request
    # until the counter quotes them.
    {
        "slug": "zebra-blind",
        "curtainParts": False,
        "prefixes": ["RL#ZEBRA_"],
        "name": "Zebra blind",
        "shortName": "Zebra",
        "blurb": "The double layer blind that tunes light by sliding one band of "
                 "fabric over another. Tube, mechanism, brackets and the fabric itself.",
    },
    {
        "slug": "roller-blind",
        "curtainParts": False,
        "prefixes": ["RL#ROLLER_"],
        "name": "Roller blind",
        "shortName": "Roller",
        "blurb": "A single sheet on a chain driven tube, the plainest blind we fit. "
                 "Every part of one, down to the base bar and the end seals.",
    },
]

# RL#ACC_ parts are curtain-side, not track-side: tapes, hooks and buckles work
# with any system, so they are marked universal rather than given a system.
#
# RL#RIPPLE_ joins them because that is where the client already had it. The
# five ripple runners arrived as one accessory, "Ripple runners" under
# RL#ACC_015, and were broken out into a prefix of their own without any of
# them being tied to a system. Two name one in passing (a #10 and a KS), the
# other three name none, and which tracks the generic ones fit is a question
# for the counter rather than something to infer from a product name. Universal
# keeps the client's own answer until they give a better one.
UNIVERSAL_PREFIXES = ("RL#ACC_", "RL#RIPPLE_")


def curtain_side_systems():
    """
    The systems a universal part actually fits.

    Universal used to mean every system in the table, which was true while every
    system was a track. It stopped being true the moment blinds joined it: a
    roller blind takes no curtain tape, no hooks and no runners, and a ripple
    runner listed as fitting one is the shop telling somebody a part will work
    when it will not. Systems that carry no curtain say so with `curtainParts`,
    and the default is the truth for everything else.
    """
    return [system["slug"] for system in SYSTEMS if system.get("curtainParts", True)]

# The length a track is stocked in, in metres. A run longer than this needs a
# joint, so this figure is what the configurator counts joints against.
#
# UNCONFIRMED. Six metres is the common aluminium stock length and it is what
# the configurator has always assumed, but nothing in the client's sheet or the
# old site states it, and it may well differ per system. It sits here, beside
# the systems, so the client's answer lands in one place rather than being
# hunted for in the configurator. Worth noting that the plan's own verification
# case, "a 5 m span needing a joint", cannot pass at 6 m.
STOCK_LENGTH_M = 6


def stock_length_for(slug: str) -> int:
    return STOCK_LENGTH_M

def system_for_sku(sku: str):
    """Return the system slug for a SKU, or None if the part is universal."""
    if not sku:
        return None
    if sku.startswith(UNIVERSAL_PREFIXES):
        return None
    for system in SYSTEMS:
        for prefix in system["prefixes"]:
            if sku.startswith(prefix):
                return system["slug"]
    return None
