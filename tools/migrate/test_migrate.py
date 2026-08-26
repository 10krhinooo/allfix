"""
Verification for the catalogue migration.

    python3 -m unittest discover -s tools/migrate -v

These are the assertions the plan commits to: every SKU from either source
survives, no junk row makes it through, every part resolves the axis it is
browsed on, and no price is ever invented. They run against the generated
catalogue, so a regression in the migration fails here rather than in
production.
"""

import json
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).parent
REPO = HERE.parent.parent
sys.path.insert(0, str(HERE))

from systems import curtain_side_systems
from ranges import RANGES, ROD_PREFIX
from sheet import load_sheet

CATALOGUE = json.loads((REPO / "data" / "catalogue.json").read_text())
PRODUCTS = CATALOGUE["products"]
SYSTEM_SLUGS = {s["slug"] for s in CATALOGUE["systems"]}
RANGE_SLUGS = {r["slug"] for r in CATALOGUE["ranges"]}

RAILS = [p for p in PRODUCTS if p["family"] == "rail"]
RODS = [p for p in PRODUCTS if p["family"] == "rod"]

# What a price can be quoted in. A bare figure would misprice a track sold by
# the metre and a tie back sold by the pair.
BASES = {"each", "metre", "pair", "box", "roll", "length"}


def every_sku():
    for product in PRODUCTS:
        for entry in product.get("variants") or [product]:
            yield product, entry


class TestCatalogue(unittest.TestCase):

    def test_every_source_sku_survives(self):
        """
        Both sources are complete in the catalogue.

        The export holds the photography and the sheet holds the money, but the
        sheet also carries stock the old site never listed: the rod line, most
        of the roman blind system, and a seventh buckle colour. A SKU that is
        sold and not listed is the empty-shelf bug the project exists to fix.
        """
        listed = {entry["sku"] for _, entry in every_sku()}
        exported = {
            (p.get("sku") or "").strip()
            for p in json.loads((HERE / "raw" / "wc-products.json").read_text())
            if (p.get("sku") or "").strip()
        }
        quoted = set(load_sheet())

        # An export SKU may be absent, but only by being withdrawn on purpose:
        # the sheet is the list of what the shop sells and the export is a
        # record of what it sold, so a part the sheet has dropped leaves with
        # it rather than lingering at no price. Anything else missing is a bug.
        self.assertEqual(exported - listed, set(CATALOGUE["retired"]),
                         "export SKUs missing from the catalogue for no stated reason")
        self.assertEqual(set(CATALOGUE["retired"]) & quoted, set(),
                         "a retired SKU is one the sheet no longer carries")
        self.assertEqual(quoted - listed, set(), "sheet SKUs missing from the catalogue")
        self.assertEqual(len(listed), CATALOGUE["skuCount"])
        self.assertEqual(len(listed), len((exported | quoted) - set(CATALOGUE["retired"])),
                         "SKUs must be unique")

    def test_no_junk_rows(self):
        names = [p["name"] for p in PRODUCTS]
        self.assertNotIn("Product", names)
        self.assertEqual(len(CATALOGUE["dropped"]), 5)

    def test_every_entry_has_a_sku_and_a_photograph_or_says_it_has_none(self):
        """
        A SKU that came from the old site keeps its photograph.

        Everything the sheet added has never been shot. Most name the picture
        they are waiting for and the card draws a placeholder until the file
        arrives, but the August sheet leaves the Images column blank for the
        blind lines and the ripple runners, so those name nothing at all. That
        is a gap in the client's data rather than in this migration, it is the
        same kind of gap as a missing price, and it surfaces in the same place:
        the migration counts it and /admin/parts is filtered by what is
        missing. What must never happen is a card pointing at a file that would
        404, so the rule here is that a part without a photograph says so.
        """
        for product, entry in every_sku():
            self.assertTrue(entry["sku"], product["name"])
            if entry.get("legacyUrl"):
                self.assertTrue(entry["image"], f"{product['name']} has no image")
            else:
                self.assertIsNone(entry["image"],
                                  f"{product['name']} points at a photograph it never had")

    def test_rails_resolve_a_system(self):
        for product in RAILS:
            self.assertTrue(product["fitsSystems"], f"{product['name']} fits no system")
            for slug in product["fitsSystems"]:
                self.assertIn(slug, SYSTEM_SLUGS, product["name"])

    def test_rods_resolve_a_range_and_never_a_system(self):
        """A rod is not a track: nothing that fits a #20 fits a 28mm pole."""
        for product in RODS:
            self.assertIn(product["range"], RANGE_SLUGS, product["name"])
            self.assertEqual(product["fitsSystems"], [], product["name"])
            self.assertTrue(product["sku"].startswith(ROD_PREFIX), product["sku"])

    def test_universal_parts_fit_every_system_that_carries_a_curtain(self):
        """
        Universal used to mean every system, which was true while every system
        was a track. Zebra and roller blinds take no tape, no hooks and no
        runners, so a part listed as fitting one would be the shop saying a part
        will work when it will not.
        """
        expected = set(curtain_side_systems())
        self.assertTrue(expected < SYSTEM_SLUGS, "the blinds should be outside this set")
        for product in PRODUCTS:
            if product["universal"]:
                self.assertEqual(set(product["fitsSystems"]), expected, product["name"])

    def test_every_system_has_parts(self):
        """A system with no parts behind it is the empty-shelf bug from the old site."""
        for system in CATALOGUE["systems"]:
            self.assertGreater(system["partCount"], 0, system["slug"])

    def test_every_range_has_parts_and_a_rod_to_hang(self):
        self.assertEqual(len(CATALOGUE["ranges"]), len(RANGES))
        for entry in CATALOGUE["ranges"]:
            self.assertGreater(entry["partCount"], 0, entry["slug"])
            self.assertIn("rod", entry["components"], entry["slug"])

    def test_rod_diameters_are_stocked_sizes(self):
        for product in RODS:
            if product["diameter"] is not None:
                self.assertIn(product["diameter"], (19, 25, 28), product["name"])

    def test_every_product_has_a_component_type(self):
        for product in PRODUCTS:
            self.assertNotEqual(product["component"], "other", product["name"])

    def test_specs_were_recovered(self):
        """The spec table is parsed out of the old description HTML and the sheet."""
        with_specs = [p for p in PRODUCTS if p["specs"]]
        self.assertGreater(len(with_specs), len(PRODUCTS) * 0.8)

    def test_prices_are_never_zero(self):
        """
        The old store priced everything at 0, which is why it could not sell.
        A price is either absent, shown as "price on request", or positive.
        Zero must never survive the migration.
        """
        for product, entry in every_sku():
            for field in ("priceKes", "tradePriceKes"):
                value = entry.get(field) if field in entry else product.get(field)
                if value is not None:
                    self.assertGreater(value, 0, f"{product['name']} {field}")

    def test_every_price_says_what_it_buys(self):
        """A track at 400 is 400 per metre, so a figure without a basis misprices it."""
        for product in PRODUCTS:
            self.assertIn(product["priceBasis"], BASES, product["name"])

    def test_prose_prices_are_carried_as_notes_not_guessed_at(self):
        """
        Some rows price in words: the roman blind fittings are included in the
        track's rate per metre. That is a pricing rule, not a number, so the
        part stays unpriced and keeps the rule where a shopper can read it.
        """
        noted = [p for p in PRODUCTS if p["priceNote"]]
        self.assertTrue(noted, "the sheet's prose prices were dropped")
        for product in noted:
            self.assertNotIn("KES 0", str(product["priceKes"]), product["name"])

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

    def test_every_photographed_sku_has_an_optimised_image(self):
        from images import key_for
        for product, entry in every_sku():
            if not entry.get("image"):
                continue
            name = key_for(entry["sku"], product["slug"])
            self.assertTrue((self.dir / f"{name}.webp").exists(), name)

    def test_the_image_a_card_asks_for_exists(self):
        """
        A card renders the product, not the variant, and a variant group has no
        SKU of its own. It must still resolve to a file that was written: the
        group slug never is one, which is how the buckles and the tape hooks
        came to show a broken image on every grid they appeared in.
        """
        from images import key_for
        for product in PRODUCTS:
            if not product["image"]:
                continue
            lead = (product.get("variants") or [{}])[0].get("sku")
            name = key_for(product["sku"] or lead, product["slug"])
            self.assertTrue(
                (self.dir / f"{name}.webp").exists(),
                f"{product['name']} asks for {name}.webp, which was never written",
            )

    def test_images_are_square_and_light(self):
        from PIL import Image
        for path in self.dir.glob("*.webp"):
            with Image.open(path) as image:
                self.assertEqual(image.width, image.height, path.name)
            self.assertLess(path.stat().st_size, 120_000, f"{path.name} is heavier than the source")


if __name__ == "__main__":
    unittest.main()
