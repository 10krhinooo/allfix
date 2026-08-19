"""
Product photography: fetch, lift the field, square up, and compress.

The source shots are inconsistent -- mixed aspect ratios, uneven margins, and
70-120 KB unoptimised JPEG -- which is why the old grid looks unsettled. Worse,
they were not all shot on the same ground: 56 of the 62 are light hardware on a
black field and the rest are on white, so a grid of them reads as a set of
photographs rather than as a catalogue.

Rather than wait for a reshoot, each shot has its field lifted: the ground is
whatever is connected to the border of the frame, so it comes away while a dark
part *inside* the product, an end cap or a screw head, stays. What is left is
the part on transparency, trimmed to itself and centred on a square canvas with
a constant margin, written as one 1200px WebP master carrying its alpha. Next.js
derives the responsive sizes from that master, so there is one file per SKU to
keep in order rather than three.
"""

import hashlib
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

MASTER = 1200
MARGIN = 0.06        # share of the canvas left empty on the tightest side
NEAR_WHITE = 247     # a pixel at or above this on all channels counts as background
QUALITY = 82

# How far a pixel may drift from the corner it is flooded from and still count
# as the field. The black grounds are close to pure, so they need very little
# room; the white ones carry a linen texture and a shadow, so they need more.
FIELD_TOLERANCE = {"dark": 48, "light": 110}
FIELD_MARK = (255, 0, 255)

# A lift that takes almost nothing, or takes the subject with it, has misread
# the shot. Either way the original is left alone and the SKU is named for a
# human. The upper bound is generous because a run of hooks on a wide black
# field genuinely is 97% background.
FIELD_MIN = 0.02
FIELD_MAX = 0.985

# Dust and compression noise on the field survive the flood, because a speck
# that never touches the border is not connected to it. Anything under this
# share of the frame that is also this dark is grit rather than a part: the
# parts themselves are white or brass, and the smallest of them, a screw, is an
# order of magnitude larger than a speck.
SPECK_AREA = 0.0004
SPECK_LUMA = 90

CACHE = Path(__file__).parent / "raw" / "images"


def fetch(url):
    CACHE.mkdir(parents=True, exist_ok=True)
    cached = CACHE / (hashlib.sha1(url.encode()).hexdigest() + Path(url).suffix)
    if not cached.exists():
        request = urllib.request.Request(url, headers={"User-Agent": "allfix-migrate"})
        with urllib.request.urlopen(request, timeout=30) as response:
            cached.write_bytes(response.read())
    return Image.open(BytesIO(cached.read_bytes()))


def trim(image):
    """Crop away a uniform near-white border, if there is one."""
    grey = image.convert("L").point(lambda v: 0 if v >= NEAR_WHITE else 255)
    box = grey.getbbox()
    # A bbox covering the whole frame means the shot is not on white; leave it be.
    return image.crop(box) if box and box != (0, 0, *image.size) else image


def ground(image):
    """Which field the shot was taken on, read from its four corners."""
    pixels = image.load()
    width, height = image.size
    corners = [pixels[2, 2], pixels[width - 3, 2], pixels[2, height - 3], pixels[width - 3, height - 3]]
    average = sum(0.299 * r + 0.587 * g + 0.114 * b for r, g, b in corners) / 4
    return "dark" if average < 60 else "light"


def despeckle(image, alpha):
    """
    Clear the grit the flood cannot reach.

    A speck of dust or a knot of compression noise sitting on the field is not
    connected to the border, so it survives as an island of opacity and reads as
    dirt once the image is on paper. Each island is measured: the small dark
    ones go, and anything bright or of any size stays, because the smallest real
    part in the catalogue is a screw and a screw is neither.
    """
    width, height = alpha.size
    coverage = bytearray(alpha.tobytes())
    luma = image.convert("L").tobytes()
    seen = bytearray(len(coverage))
    limit = int(width * height * SPECK_AREA)
    cleared = 0

    for start in range(len(coverage)):
        if seen[start] or coverage[start] < 128:
            continue
        island, stack, brightness = [], [start], 0
        seen[start] = 1
        while stack:
            here = stack.pop()
            island.append(here)
            brightness += luma[here]
            x, y = here % width, here // width
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < width and 0 <= ny < height:
                    there = ny * width + nx
                    if not seen[there] and coverage[there] >= 128:
                        seen[there] = 1
                        stack.append(there)

        if len(island) <= limit and brightness / len(island) < SPECK_LUMA:
            for pixel in island:
                coverage[pixel] = 0
            cleared += len(island)

    if cleared:
        alpha.putdata(coverage)
    return cleared


def lift_field(image):
    """
    Take the ground out from under the subject.

    Flooding inward from the border rather than thresholding on brightness is
    what keeps a black bracket on a black field: the bracket is not connected to
    the edge of the frame, so the flood never reaches it. Returns the image on
    transparency, or None if the result is not believable.
    """
    flooded = image.copy()
    width, height = flooded.size
    tolerance = FIELD_TOLERANCE[ground(image)]
    seeds = [(0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1),
             (width // 2, 0), (width // 2, height - 1), (0, height // 2), (width - 1, height // 2)]
    for seed in seeds:
        ImageDraw.floodfill(flooded, seed, FIELD_MARK, thresh=tolerance)

    marked = flooded.load()
    alpha = Image.new("L", (width, height), 255)
    opacity = alpha.load()
    lifted = 0
    for y in range(height):
        for x in range(width):
            if marked[x, y] == FIELD_MARK:
                opacity[x, y] = 0
                lifted += 1

    share = lifted / (width * height)
    if not FIELD_MIN <= share <= FIELD_MAX:
        return None

    lifted += despeckle(image, alpha)

    # A whisker of feather, so the cut edge does not alias against the page.
    alpha = alpha.filter(ImageFilter.GaussianBlur(max(1.0, min(width, height) / 700)))
    out = image.copy()
    out.putalpha(alpha)
    return out


def square(image, name=""):
    image = trim(image.convert("RGB"))
    lifted = lift_field(image)
    if lifted is None:
        print(f"  ~ {name}: field not lifted, left as shot")
        lifted = image.convert("RGBA")
    else:
        # Now that the ground is gone, the subject can be framed against itself
        # rather than against whatever margin the photographer left.
        box = lifted.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
        if box:
            lifted = lifted.crop(box)

    inner = int(MASTER * (1 - 2 * MARGIN))
    lifted.thumbnail((inner, inner), Image.LANCZOS)
    canvas = Image.new("RGBA", (MASTER, MASTER), (255, 255, 255, 0))
    canvas.paste(lifted, ((MASTER - lifted.width) // 2, (MASTER - lifted.height) // 2))
    return canvas


def key_for(sku, slug):
    """A stable filename. SKUs carry `#`, which has no business in a URL."""
    return (sku or slug).replace("#", "").replace("/", "-").lower()


def process_all(catalogue, out_dir):
    out_dir.mkdir(parents=True, exist_ok=True)
    targets, seen = [], set()
    for product in catalogue["products"]:
        for entry in product.get("variants") or [product]:
            url = entry.get("image")
            name = key_for(entry.get("sku"), product["slug"])
            if url and name not in seen:
                seen.add(name)
                targets.append((name, url))

    done = failed = 0
    for name, url in targets:
        destination = out_dir / f"{name}.webp"
        try:
            square(fetch(url), name).save(destination, "WEBP", quality=QUALITY, method=6)
            done += 1
        except Exception as error:                       # noqa: BLE001
            failed += 1
            print(f"  ! {name}: {error}")

    total = sum(f.stat().st_size for f in out_dir.glob("*.webp"))
    print(f"images        {done} written, {failed} failed")
    print(f"image weight  {total / 1024:.0f} KB total, {total / max(done, 1) / 1024:.0f} KB average")
    return done, failed
