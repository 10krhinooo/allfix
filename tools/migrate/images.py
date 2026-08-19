"""
Product photography: fetch, trim, square up, and compress.

The source shots are inconsistent -- mixed aspect ratios, uneven margins, and
70-120 KB unoptimised JPEG -- which is why the old grid looks unsettled. Each
image is trimmed to its subject, centred on a square white field with a constant
margin, and written as one 1200px WebP master. Next.js derives the responsive
sizes from that master, so there is one file per SKU to keep in order rather
than three.
"""

import hashlib
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageChops

MASTER = 1200
MARGIN = 0.06        # share of the canvas left as white on the tightest side
NEAR_WHITE = 247     # a pixel at or above this on all channels counts as background
QUALITY = 82

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


def square(image):
    image = image.convert("RGB")
    image = trim(image)
    inner = int(MASTER * (1 - 2 * MARGIN))
    image.thumbnail((inner, inner), Image.LANCZOS)
    canvas = Image.new("RGB", (MASTER, MASTER), (255, 255, 255))
    canvas.paste(image, ((MASTER - image.width) // 2, (MASTER - image.height) // 2))
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
            square(fetch(url)).save(destination, "WEBP", quality=QUALITY, method=6)
            done += 1
        except Exception as error:                       # noqa: BLE001
            failed += 1
            print(f"  ! {name}: {error}")

    total = sum(f.stat().st_size for f in out_dir.glob("*.webp"))
    print(f"images        {done} written, {failed} failed")
    print(f"image weight  {total / 1024:.0f} KB total, {total / max(done, 1) / 1024:.0f} KB average")
    return done, failed
