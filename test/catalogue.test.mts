import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { fromService } from "@/lib/catalogue"

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
