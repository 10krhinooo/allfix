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
    # A roman blind is a different mechanism from a curtain track: it is raised
    # by cords running through rings sewn to the back, over fibre rods that
    # form each fold, with a weight bar in the hem. None of those parts has an
    # equivalent on a curtain rail, so they get their own types rather than
    # being forced into the nearest track part.
    ("roller-unit",    "Roller units",    ["roller unit"]),
    ("thread",         "Threads",         ["thread"]),
    ("blind-ring",     "Blind rings",     ["blind plastic ring", "blind ring"]),
    ("fibre",          "Fibre rods",      ["fiber", "fibre"]),
    ("weight",         "Weights",         ["weight"]),
    # A zebra or a roller blind is a tube with a mechanism in one end of it, and
    # the fabric is a part in its own right rather than something sewn up
    # elsewhere and hung. None of that has a match on a curtain track either, so
    # it follows the roman blind above and gets its own types. Listed before the
    # track rule because a head rail cover is the one part of a blind that is
    # genuinely a rail.
    ("tube",           "Tubes",           ["tube"]),
    ("mechanism",      "Mechanisms",      ["mechanism"]),
    ("base-bar",       "Base bars",       ["base bar"]),
    ("pin-end",        "Pin ends",        ["pin end"]),
    ("end-seal",       "End seals",       ["end seal"]),
    ("fabric",         "Blind fabric",    ["blind material"]),
    ("track",          "Tracks",          ["track", "rail"]),
    # "Plastic Curtain Tape Hooks" is a hook and "Buckle Tape" is a tape, so
    # hooks are matched before tapes, and tapes before buckles.
    ("hook",           "Curtain hooks",   ["hook"]),
    ("tape",           "Curtain tapes",   ["tape"]),
    ("buckle",         "Curtain buckles", ["buckle"]),
]

# Rods are filed by the category column of the client sheet rather than by name.
# On the rod line the categories are clean, and the names are not: a "Basket
# Finial" and a "Trophy Finial" share no word with each other, and "End Cup"
# appears in the name of a part that is filed as a bracket.
ROD_COMPONENTS = {
    "rods":          ("rod", "Curtain rods"),
    "brackets":      ("bracket", "Brackets"),
    "finials":       ("finial", "Finials"),
    "end cups":      ("end-cup", "End cups"),
    "rings":         ("ring", "Rings"),
    "tie backs":     ("tie-back", "Tie backs"),
    "corner joints": ("corner-joint", "Corner joints"),
}


def component_for_category(categories: str):
    """
    Read the part type out of `Curtain Rods > Finials, Curtain Rods`.

    The sheet is hand written, so the separator, the spacing and the trailing
    comma all vary. Only the segment between the chevron and the comma is
    meaningful, and it is matched loosely.
    """
    if ">" not in (categories or ""):
        return None
    leaf = categories.split(">", 1)[1].split(",")[0].strip().lower()
    return ROD_COMPONENTS.get(leaf)

# How many of a part a metre of run takes.
#
# These are the counter's rules of thumb, and they are the same numbers the rail
# configurator counts with. They live here as figures rather than as words
# inside the sentences below, because the configurator was quoting eight runners
# to the metre while the catalogue copy beside it said ten. A rate stated twice
# gets to disagree with itself; stated once it cannot.
PER_METRE = {
    "runner": 10,
    "bracket": 1,
    "ring": 7,
}

# The fewest a run takes whatever its width. A two metre track still needs a
# bracket at each end.
MINIMUM = {
    "bracket": 2,
    "stopper": 2,
}

# What each component type is for, shown on the component filter and on the
# system page so a first-time buyer can tell a runner from a carrier.
PURPOSE = {
    "track":          "The rail itself, cut to your window width.",
    "runner":         f"The gliders the curtain hooks onto. Roughly {PER_METRE['runner']} per metre of track.",
    "bracket":        f"Fixes the track to the wall or ceiling. One per metre, never fewer than {MINIMUM['bracket']}.",
    "stopper":        f"Caps each end so the runners cannot slide off. {MINIMUM['stopper']} per track.",
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
    "roller-unit":    "Winds the cord that raises a roman blind.",
    "thread":         "The cord that runs through the rings to raise the blind.",
    "blind-ring":     "Sewn to the back of the blind for the cord to run through.",
    "fibre":          "Slots into the back of the blind to form each fold.",
    "weight":         "Sits in the hem so the blind hangs straight.",
    "tube":           "The barrel the blind rolls onto, cut to your window width.",
    "mechanism":      "The chain driven end that raises and lowers the blind.",
    "base-bar":       "Weights the bottom of a roller blind so it hangs true.",
    "pin-end":        "The idle end the tube turns on, opposite the mechanism.",
    "end-seal":       "Caps the tube and keeps the fabric square on it.",
    "fabric":         "The blind itself, cut to the window.",
    "rod":            "The pole itself, cut to your window width.",
    "finial":         "The turned end that finishes the rod and keeps the rings on it.",
    "end-cup":        "Seats the end of the rod against the wall where a bracket would show.",
    "ring":           f"Carries the curtain along the rod. Roughly {PER_METRE['ring']} per metre.",
    "tie-back":       "Fixed to the wall beside the window, to hold the curtain open.",
}

def component_for_name(name: str):
    lowered = f" {name.lower()} "
    for entry in COMPONENT_TYPES:
        slug, label, keywords = entry[0], entry[1], entry[2]
        for keyword in keywords:
            if keyword in lowered:
                return slug, label
    return "other", "Other parts"
