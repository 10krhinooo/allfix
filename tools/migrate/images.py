"""
Product photography: fetch, square up, and compress.

The source shots are inconsistent -- mixed aspect ratios and 70-120 KB
unoptimised JPEG -- so each one is scaled to a single 1200px WebP master and
padded out to a square. Next.js derives the responsive sizes from that master,
so there is one file per SKU to keep in order rather than three.

The photographs are shown as they were taken. An earlier version of this file
cut the ground out from under each part and framed it on transparency, which
made a tidier grid but is not what the shop wants: the background is part of
the picture, and nothing here crops it away or lifts it out. Squaring is done by
padding with the shot's own edge colour, so a part on a black field stays on a
black field and gains no visible bars.
"""

import hashlib
import urllib.request
from io import BytesIO
from pathlib import Path

from PIL import Image

MASTER = 1200
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


def ground(image):
    """
    The colour of the field, averaged right around the edge of the frame.

    Sampled from the border rather than the corners alone, because a shot with
    a vignette or a shadow along one side would otherwise pad out to a square
    with a bar that is visibly the wrong shade.
    """
    width, height = image.size
    step_x = max(1, width // 64)
    step_y = max(1, height // 64)
    edge = []
    for x in range(0, width, step_x):
        edge.append(image.getpixel((x, 0)))
        edge.append(image.getpixel((x, height - 1)))
    for y in range(0, height, step_y):
        edge.append(image.getpixel((0, y)))
        edge.append(image.getpixel((width - 1, y)))
    return tuple(sum(pixel[channel] for pixel in edge) // len(edge) for channel in range(3))


def square(image, name=""):
    """
    The shot as taken, scaled to the master size and padded out to a square.

    Nothing is cropped and nothing is lifted: the background is part of the
    photograph. Padding uses the shot's own edge colour, so a part photographed
    on black keeps a black frame and the pad is invisible rather than reading as
    two grey bars.
    """
    image = image.convert("RGB")
    image.thumbnail((MASTER, MASTER), Image.LANCZOS)
    if image.width == image.height:
        return image

    canvas = Image.new("RGB", (MASTER, MASTER), ground(image))
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
            square(fetch(url), name).save(destination, "WEBP", quality=QUALITY, method=6)
            done += 1
        except Exception as error:                       # noqa: BLE001
            failed += 1
            print(f"  ! {name}: {error}")

    total = sum(f.stat().st_size for f in out_dir.glob("*.webp"))
    print(f"images        {done} written, {failed} failed")
    print(f"image weight  {total / 1024:.0f} KB total, {total / max(done, 1) / 1024:.0f} KB average")
    return done, failed
