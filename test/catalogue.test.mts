import { test, describe } from "node:test"
import assert from "node:assert/strict"
import {
  catalogueData,
  counted,
  fromService,
  partsForRange,
  partsForSystem,
  products,
  ranges,
  skuCount,
  skusOf,
  systems,
} from "@/lib/catalogue"

/**
 * The shop's vocabulary against the service's.
 *
 * Java spells an enum `RAIL` and this shop reads `rail`. Both are right on their
 * own, which is exactly why this is worth a test: the same disagreement in the
 * enquiry seam meant every booking, survey request and trade quote was refused
 * by the shop's own service, and nothing found it until the two halves were run
 * together for the first time.
 */

const SYSTEM = {
  slug: "roller-blind",
  name: "Roller blind",
  shortName: "Roller",
  kind: "BLIND",
}

const PRODUCT = {
  sku: "RL#20_004",
  name: "#20 Runners",
  slug: "20-runners",
  family: "RAIL",
  priceBasis: "EACH",
  fitsSystems: ["20"],
  variants: [{ sku: "RL#ACC_002", label: "Metal", priceBasis: "BOX" }],
}

describe("reading the service's catalogue", () => {
  const read = fromService({ systems: [SYSTEM], skuCount: 195 }, [PRODUCT])

  test("a family comes back in the words the shop reads", () => {
    assert.equal(read.products[0]!.family, "rail")
  })

  test("so does a price basis, on the part and on its finishes", () => {
    assert.equal(read.products[0]!.priceBasis, "each")
    assert.equal(read.products[0]!.variants![0]!.priceBasis, "box")
  })

  test("and a system kind, which is what keeps a blind out of the configurator", () => {
    // The one with teeth. `railSystems()` filters on kind === "rail", so an
    // uppercase BLIND would read as neither and every blind would be offered a
    // bill of materials counting runners it does not stock.
    assert.equal(read.systems[0]!.kind, "blind")
  })

  test("a missing kind is a rail, because that is what a system was before blinds", () => {
    const older = fromService({ systems: [{ slug: "20", name: "#20" }] }, [])
    assert.equal(older.systems[0]!.kind, "rail")
  })

  test("fitsSystems survives the wire, where it is a Set on the other side", () => {
    assert.deepEqual(read.products[0]!.fitsSystems, ["20"])
  })

  test("a part with no fitment is an empty list rather than undefined", () => {
    // Every caller does `fitsSystems.includes(...)`, so a null here is a crash
    // on whichever page happens to show that part first.
    const bare = fromService({ systems: [] }, [{ sku: "X", family: "RAIL" }])
    assert.deepEqual(bare.products[0]!.fitsSystems, [])
  })

  test("the sku count is a number, whatever the wire made of it", () => {
    assert.equal(read.skuCount, 195)
  })
})

describe("the counts a page prints", () => {
  /**
   * `skuCount` and `partCount` arrive as stored numbers: the migration writes
   * them once and the service returns what it was told. That was fine while the
   * catalogue only ever changed by a migration. The console can add, retire and
   * remove a part now, so a stored figure is a figure about a catalogue that no
   * longer exists, and a system page would go on saying "24 parts" over a list
   * of twenty five with nothing to correct it.
   *
   * These assert the figure against the list it labels, which is the only
   * property that matters: the two are drawn on the same screen, and a reader
   * can see them disagree.
   */
  test("a system's figure is the length of its own part list", async () => {
    for (const system of await systems()) {
      const parts = await partsForSystem(system.slug)
      assert.equal(
        system.partCount,
        parts.length,
        `${system.slug} says ${system.partCount} and lists ${parts.length}`,
      )
    }
  })

  test("a range's figure is the length of its own part list", async () => {
    for (const range of await ranges()) {
      const parts = await partsForRange(range.slug)
      assert.equal(
        range.partCount,
        parts.length,
        `${range.slug} says ${range.partCount} and lists ${parts.length}`,
      )
    }
  })

  test("the shop's SKU count is the SKUs it actually has", async () => {
    const parts = await products()
    const counted = parts.reduce((total, product) => total + skusOf(product), 0)
    assert.equal(await skuCount(), counted)
  })

  test("a part added after the migration moves the figures", async () => {
    // The whole point. `counted` runs over whatever the seam hands back, so a
    // catalogue with one more part in it reports one more part, without anyone
    // remembering to update a stored number.
    const before = await systems()
    const target = before.find((system) => system.partCount > 0)!
    const grown = counted({
      ...(await catalogueData()),
      products: [
        ...(await products()),
        {
          ...(await partsForSystem(target.slug))[0]!,
          sku: "RL#TEST_999",
          slug: "a-part-that-did-not-exist",
        },
      ],
    })

    const after = grown.systems.find((system) => system.slug === target.slug)!
    assert.equal(after.partCount, target.partCount + 1)
  })
})
