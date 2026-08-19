"""
Verification for the catalogue migration.

    python3 -m unittest discover -s tools/migrate -v

These are the assertions the plan commits to: every SKU survives with an image
and a system, no junk row makes it through, and every part resolves a
compatibility list. They run against the generated catalogue, so a regression in
the migration fails here rather than in production.
"""

import json
import unittest
from pathlib import Path

REPO = Path(__file__).parent.parent.parent
CATALOGUE = json.loads((REPO / "data" / "catalogue.json").read_text())
PRODUCTS = CATALOGUE["products"]
SYSTEM_SLUGS = {s["slug"] for s in CATALOGUE["systems"]}


def every_sku():
    for product in PRODUCTS:
        for entry in product.get("variants") or [product]:
            yield product, entry


class TestCatalogue(unittest.TestCase):

    def test_all_62_skus_survive(self):
        skus = [entry["sku"] for _, entry in every_sku()]
        self.assertEqual(len(skus), 62)
        self.assertEqual(len(set(skus)), 62, "SKUs must be unique")

    def test_no_junk_rows(self):
        names = [p["name"] for p in PRODUCTS]
        self.assertNotIn("Product", names)
        self.assertEqual(len(CATALOGUE["dropped"]), 5)

    def test_every_sku_has_a_sku_and_an_image(self):
        for product, entry in every_sku():
            self.assertTrue(entry["sku"], product["name"])
            self.assertTrue(entry["image"], f"{product['name']} has no image")

    def test_every_product_resolves_at_least_one_system(self):
        for product in PRODUCTS:
            self.assertTrue(
                product["fitsSystems"],
                f"{product['name']} fits no system",
            )
            for slug in product["fitsSystems"]:
                self.assertIn(slug, SYSTEM_SLUGS, product["name"])

    def test_universal_parts_fit_every_system(self):
        for product in PRODUCTS:
            if product["universal"]:
                self.assertEqual(set(product["fitsSystems"]), SYSTEM_SLUGS, product["name"])

    def test_every_system_has_parts(self):
        """A system with no parts behind it is the empty-shelf bug from the old site."""
        for system in CATALOGUE["systems"]:
            self.assertGreater(system["partCount"], 0, system["slug"])

    def test_every_product_has_a_component_type(self):
        for product in PRODUCTS:
            self.assertNotEqual(product["component"], "other", product["name"])

    def test_specs_were_recovered(self):
        """The spec table is parsed out of the old description HTML."""
        with_specs = [p for p in PRODUCTS if p["specs"]]
        self.assertGreater(len(with_specs), len(PRODUCTS) * 0.8)

    def test_prices_are_never_zero(self):
        """
        The old store priced everything at 0, which is why it could not sell.
        A price is either absent -- shown as "price on request" -- or positive.
        Zero must never survive the migration.
        """
        for product, entry in every_sku():
            for field in ("priceKes", "tradePriceKes"):
                value = entry.get(field) if field in entry else product.get(field)
                if value is not None:
                    self.assertGreater(value, 0, f"{product['name']} {field}")

    def test_slugs_are_unique_and_url_safe(self):
        slugs = [p["slug"] for p in PRODUCTS]
        self.assertEqual(len(slugs), len(set(slugs)), "product slugs must be unique")
        for slug in slugs:
            self.assertRegex(slug, r"^[a-z0-9-]+$")


class TestImages(unittest.TestCase):

    def setUp(self):
        self.dir = REPO / "public" / "products"
        if not self.dir.exists():
            self.skipTest("images not generated; run migrate.py --images")

    def test_every_sku_has_an_optimised_image(self):
        from images import key_for
        for product, entry in every_sku():
            name = key_for(entry["sku"], product["slug"])
            self.assertTrue((self.dir / f"{name}.webp").exists(), name)

    def test_images_are_square_and_light(self):
        from PIL import Image
        for path in self.dir.glob("*.webp"):
            with Image.open(path) as image:
                self.assertEqual(image.width, image.height, path.name)
            self.assertLess(path.stat().st_size, 120_000, f"{path.name} is heavier than the source")


if __name__ == "__main__":
    unittest.main()
