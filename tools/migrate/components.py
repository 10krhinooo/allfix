"""
Component types, derived from the product name.

The WooCommerce categories cannot be trusted for this: `Tapes` is its own
parent, five products sit in `Uncategorized`, and several parts are filed under
the system rather than the part. The names, by contrast, are consistent and
descriptive, so they are the better signal. Order matters -- the first match
wins, so more specific phrases are listed before the words they contain.
"""

COMPONENT_TYPES = [
    ("master-carrier", "Master carriers", ["master carrier"]),
    ("drive-unit",     "Drive units",     ["drive unit", "idle unit", "tension pulley"]),
    ("motor",          "Motors",          ["motor "], ),
    ("belt",           "Belts",           ["belt"]),
    ("corner-joint",   "Corner joints",   ["corner joint"]),
    ("joint",          "Joints",          ["joint"]),
    ("bracket",        "Brackets",        ["bracket"]),
    ("holder",         "Holders",         ["holder"]),
    ("stopper",        "Stoppers",        ["stopper"]),
    ("runner",         "Runners",         ["runner", "glider"]),
    ("track",          "Tracks",          ["track", "rail"]),
    # "Plastic Curtain Tape Hooks" is a hook and "Buckle Tape" is a tape, so
    # hooks are matched before tapes, and tapes before buckles.
    ("hook",           "Curtain hooks",   ["hook"]),
    ("tape",           "Curtain tapes",   ["tape"]),
    ("buckle",         "Curtain buckles", ["buckle"]),
]

# What each component type is for, shown on the component filter and on the
# system page so a first-time buyer can tell a runner from a carrier.
PURPOSE = {
    "track":          "The rail itself, cut to your window width.",
    "runner":         "The gliders the curtain hooks onto. Roughly 10 per metre of track.",
    "bracket":        "Fixes the track to the wall or ceiling. One per metre, never fewer than two.",
    "stopper":        "Caps each end so the runners cannot slide off. Two per track.",
    "joint":          "Joins two lengths of track for a span longer than one stock length.",
    "corner-joint":   "Turns the track around a corner or a bay.",
    "holder":         "Supports the track along its run.",
    "motor":          "Drives a motorised track. Sized to the length and weight of the run.",
    "drive-unit":     "The powered and idle ends of a motorised belt system.",
    "master-carrier": "The lead runner the motor pulls, carrying the leading edge of the curtain.",
    "belt":           "The loop that transmits drive along a motorised track.",
    "tape":           "Sewn to the curtain header to form the pleat.",
    "hook":           "Joins the curtain tape to the runners.",
    "buckle":         "Holds the curtain back when it is open.",
}

def component_for_name(name: str):
    lowered = f" {name.lower()} "
    for entry in COMPONENT_TYPES:
        slug, label, keywords = entry[0], entry[1], entry[2]
        for keyword in keywords:
            if keyword in lowered:
                return slug, label
    return "other", "Other parts"
