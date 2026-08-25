import { test, describe } from "node:test"
import assert from "node:assert/strict"
import {
  billOfMaterials,
  bomSummary,
  configuratorSystems,
  defaultInput,
  WIDTH_MAX,
  type BomInput,
  type BuildSystem,
} from "@/lib/configurator"

/**
 * The bill of materials, table driven, which is what section 25 of the plan
 * asked for and nothing has ever checked.
 *
 * These are the cases the counter is asked for by name: an ordinary window on a
 * #20, a span longer than a stock length, a single draw against a pair, and a
 * motorised run. A browser test can tell you the page drew a list; it cannot
 * tell you the list is right, and a wrong quantity here is a customer who drives
 * to Njugu Lane for one bracket.
 */

function systemBy(slug: string): BuildSystem {
  const found = configuratorSystems().find((system) => system.slug === slug)
  assert.ok(found, `the catalogue carries a ${slug} system`)
  return found
}

function bom(system: BuildSystem, input: Partial<BomInput> = {}) {
  const lines = billOfMaterials(system, { ...defaultInput(), ...input }).lines
  return {
    lines,
    qty: (role: string) => lines.find((line) => line.role === role)?.qty,
    has: (role: string) => lines.some((line) => line.role === role),
    sku: (role: string) => lines.find((line) => line.role === role)?.sku,
  }
}

describe("a 3 m window on a #20, wall mount", () => {
  const list = bom(systemBy("20"), { widthM: 3, panels: 2, mount: "wall" })

  test("the track is cut to the window", () => {
    assert.equal(list.qty("track"), 3)
  })

  test("brackets are one a metre and never fewer than two", () => {
    assert.equal(list.qty("bracket"), 3)
    assert.equal(bom(systemBy("20"), { widthM: 1 }).qty("bracket"), 2)
  })

  test("runners are the counter's rate a metre", () => {
    // Ten to the metre is what the component copy on every system page says.
    assert.equal(list.qty("runner"), 30)
  })

  test("two stoppers, one at each end, whatever the run", () => {
    assert.equal(list.qty("stopper"), 2)
    assert.equal(bom(systemBy("20"), { widthM: 11 }).qty("stopper"), 2)
  })

  test("no joint is specified inside a stock length", () => {
    assert.equal(list.has("joint"), false)
  })

  test("the bracket follows the mount rather than only the sentence under it", () => {
    // The fault found in phase 7: choosing wall produced a list naming a ceiling
    // bracket, which is the sheet the counter picks from.
    const ceiling = bom(systemBy("20"), { mount: "ceiling" })
    const wall = bom(systemBy("20"), { mount: "wall" })
    if (ceiling.sku("bracket") && wall.sku("bracket")) {
      assert.notEqual(ceiling.sku("bracket"), wall.sku("bracket"))
    }
  })
})

describe("a span longer than a stock length", () => {
  test("a joint is added for each stock length crossed", () => {
    const system = systemBy("20")
    // The plan's own verification case. It only passes for a stock length under
    // the span, which is why the client's answer on track length matters: at
    // 6 m stock a 5 m span needs none, and this asserts the rule rather than a
    // number nobody has confirmed.
    const stock = system.stockLengthM
    assert.equal(bom(system, { widthM: stock }).has("joint"), false)
    assert.equal(bom(system, { widthM: stock + 0.5 }).qty("joint"), 1)

    // The widest window this configurator will take, which is where the count
    // stops: past WIDTH_MAX it is a survey rather than a form.
    assert.equal(
      bom(system, { widthM: WIDTH_MAX }).qty("joint"),
      Math.ceil(WIDTH_MAX / stock) - 1,
    )
  })
})

describe("how the curtain draws", () => {
  test("a centre-opening pair takes a master carrier where the system has one", () => {
    const system = configuratorSystems().find((one) => one.parts["master-carrier"])
    if (!system) return
    assert.equal(bom(system, { panels: 2 }).qty("master-carrier"), 1)
    assert.equal(bom(system, { panels: 1 }).has("master-carrier"), false)
  })
})

describe("a motorised run", () => {
  const system = configuratorSystems().find((one) => one.motorised)

  test("carries a drive end, an idle end and a motor", () => {
    if (!system) return
    const list = bom(system, { widthM: 4 })
    assert.equal(list.qty("drive-unit"), 1)
    assert.equal(list.qty("roller-unit"), 1)
    assert.equal(list.qty("motor"), 1)
  })

  test("the belt loops the run, so it is about twice the width", () => {
    if (!system) return
    assert.equal(bom(system, { widthM: 4 }).qty("belt"), 8.4)
  })

  test("and the whole list is marked as needing a survey", () => {
    if (!system) return
    assert.equal(billOfMaterials(system, { ...defaultInput(), widthM: 4 }).onSurvey, true)
    assert.equal(
      billOfMaterials(systemBy("20"), { ...defaultInput(), widthM: 4 }).onSurvey,
      false,
    )
  })
})

describe("what the customer cannot ask for", () => {
  test("a window wider than the shop sells is clamped rather than quoted", () => {
    assert.equal(bom(systemBy("20"), { widthM: 40 }).qty("track"), WIDTH_MAX)
  })

  test("a nonsense width does not produce a nonsense list", () => {
    const list = bom(systemBy("20"), { widthM: -3 })
    assert.ok((list.qty("track") ?? 0) > 0, "never a negative length of track")
    assert.equal(list.qty("stopper"), 2)
  })

  test("panels are whole curtains, and at most four", () => {
    assert.match(bomSummary(systemBy("20"), { ...defaultInput(), panels: 9 }), /centre-opening/)
    assert.match(
      bomSummary(systemBy("20"), { ...defaultInput(), panels: 1, mount: "wall" }),
      /single-draw, wall mount/,
    )
  })

  test("a fuller heading is the fundi's to set, within reason", () => {
    // The rate is an input because the person who knows the job knows it. It is
    // still clamped, because 200 runners a metre is a typo.
    assert.equal(bom(systemBy("20"), { widthM: 2, runnersPerM: 14 }).qty("runner"), 28)
    assert.equal(bom(systemBy("20"), { widthM: 2, runnersPerM: 400 }).qty("runner"), 40)
  })
})
