import { test, describe } from "node:test"
import assert from "node:assert/strict"
import {
  activeCount,
  CATEGORIES,
  EMPTY_QUERY,
  facetsFor,
  filterItems,
  parseQuery,
  shopData,
  toParams,
  type ShopItem,
} from "@/lib/shop"

/**
 * The faceted browser's own logic, away from the browser.
 *
 * `/shop` filters in memory and mirrors its state into the URL, so a shared link
 * has to reopen on the same view and a made up one has to open on something
 * rather than on an empty grid. Both are pure functions and neither is worth an
 * end to end test.
 */

const data = shopData()

const query = (search: string) => parseQuery(new URLSearchParams(search), data)

describe("reading a link somebody shared", () => {
  test("a real facet is honoured", () => {
    const real = data.systems[0]!.slug
    assert.deepEqual(query(`system=${real}`).systems, [real])
  })

  test("several are a comma list, because a filter is a multi select", () => {
    const [first, second] = data.systems.map((facet) => facet.slug)
    assert.deepEqual(query(`system=${first},${second}`).systems, [first, second])
  })

  test("a value that names nothing is dropped rather than filtering to nothing", () => {
    // An empty grid is what a customer reads as "you have none of these", and a
    // typo in a shared link should not be able to say that.
    assert.deepEqual(query("system=not-a-system").systems, [])
    assert.equal(query("category=biscuits").category, null)
    assert.equal(query("price=free").price, null)
    assert.equal(query("sort=cheapest").sort, "featured")
  })

  test("the search box takes anything, trimmed", () => {
    assert.equal(query("q=%20%2020%20").q, "20")
  })
})

describe("writing the link back", () => {
  test("a default is not written at all, so the tidy case has a clean URL", () => {
    assert.equal(toParams(EMPTY_QUERY).toString(), "")
  })

  test("and what is set survives the round trip", () => {
    const system = data.systems[0]!.slug
    const original = { ...EMPTY_QUERY, systems: [system], buyable: true, q: "bracket", sort: "price-asc" as const }
    assert.deepEqual(query(toParams(original).toString()), original)
  })

  test("the count is what the clear-all button offers to undo", () => {
    assert.equal(activeCount(EMPTY_QUERY), 0)
    assert.equal(activeCount({ ...EMPTY_QUERY, systems: ["20", "28"], q: "rail" }), 3)
  })
})

describe("filtering", () => {
  test("nothing set keeps the whole catalogue", () => {
    assert.equal(filterItems(data.items, EMPTY_QUERY).length, data.items.length)
  })

  test("buyable keeps only what has a real price", () => {
    const kept = filterItems(data.items, { ...EMPTY_QUERY, buyable: true })
    assert.ok(kept.length > 0, "the shop can sell something")
    assert.ok(kept.length < data.items.length, "and not everything is priced yet")
    assert.ok(kept.every((item: ShopItem) => item.buyable))
  })

  test("a system keeps only what fits it", () => {
    const system = data.systems[0]!.slug
    const kept = filterItems(data.items, { ...EMPTY_QUERY, systems: [system] })
    assert.ok(kept.every((item: ShopItem) => item.fitsSystems.includes(system)))
  })

  test("search reads a SKU as readily as a name", () => {
    // Somebody with the old part in their hand types what is printed on it.
    const one = data.items.find((item: ShopItem) => item.sku)!
    const bySku = filterItems(data.items, { ...EMPTY_QUERY, q: one.sku! })
    assert.ok(bySku.some((item: ShopItem) => item.sku === one.sku))

    const byName = filterItems(data.items, { ...EMPTY_QUERY, q: one.name })
    assert.ok(byName.some((item: ShopItem) => item.sku === one.sku))
  })
})

describe("sorting, which filtering does on the way out", () => {
  test("by price, cheapest first", () => {
    const sorted = filterItems(data.items, {
      ...EMPTY_QUERY,
      buyable: true,
      sort: "price-asc",
    })
    for (let at = 1; at < sorted.length; at++) {
      assert.ok((sorted[at]!.priceKes ?? 0) >= (sorted[at - 1]!.priceKes ?? 0))
    }
  })

  test("by name, in the order a person reads a list", () => {
    const sorted = filterItems(data.items, { ...EMPTY_QUERY, sort: "name" })
    const names = sorted.map((item: ShopItem) => item.name)
    assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b)))
  })

  test("and an unpriced part never sorts as though it were free", () => {
    // Sorting cheapest first with nulls read as zero would put every part the
    // shop cannot sell at the top of the page it sells from.
    const sorted = filterItems(data.items, { ...EMPTY_QUERY, sort: "price-asc" })
    const firstPriced = sorted.findIndex((item: ShopItem) => (item.priceKes ?? 0) > 0)
    const firstUnpriced = sorted.findIndex((item: ShopItem) => !item.priceKes)
    assert.ok(firstPriced < firstUnpriced || firstUnpriced === -1)
  })
})

describe("what is above the window", () => {
  const all = data.items

  test("a blind is its own category and not filed under rails", () => {
    const blinds = all.filter((i) => i.category === "blind")
    const rails = all.filter((i) => i.category === "rail")

    assert.ok(blinds.length > 30, "the August sheet added three blind systems")
    assert.equal(
      blinds.some((i) => rails.includes(i)),
      false,
      "nothing is both a rail part and a blind part",
    )
  })

  test("every part lands in exactly one category, so the three add up", () => {
    const total = CATEGORIES.reduce(
      (sum, c) => sum + all.filter((i) => i.category === c.id).length,
      0,
    )
    assert.equal(total, all.length)
  })

  test("curtain tapes and hooks stay with rails, because that is what they dress", () => {
    // They are bought to hang a curtain on a track, and a system filter is
    // expected to keep showing them: that is the promise `fitsSystems` makes
    // everywhere else in the shop.
    for (const item of all.filter((i) => i.universal)) {
      assert.equal(item.category, "rail", item.name)
    }
  })

  test("a link that named a family before there were categories still works", () => {
    // `?family=rail` and `?family=rod` are on the home page, on every product
    // page and in the WooCommerce redirect table.
    assert.equal(query("family=rod").category, "rod")
    assert.equal(query("family=rail").category, "rail")
    assert.equal(query("category=blind").category, "blind")
  })
})

describe("the counts beside the boxes", () => {
  test("a part type with nothing behind it is dropped rather than offered as zero", () => {
    // Twenty four of the thirty component types are rail only and six are rod
    // only, so more than half the list was always dead whichever way somebody
    // had come in. "Rods" and "Tracks 11" sat side by side and the second
    // returned nothing.
    const rods = facetsFor(data.items, data, { ...EMPTY_QUERY, category: "rod" })

    assert.ok(rods.parts.length > 0)
    for (const part of rods.parts) {
      assert.ok(part.count > 0, `${part.label} is offered against no rods`)
    }
    assert.equal(
      rods.parts.some((f) => f.slug === "track"),
      false,
      "a track is not a rod part",
    )
  })

  test("ticking one system does not report every other one as zero", () => {
    // A facet is counted with its own dimension cleared, so the number answers
    // "and how many if I also tick this" rather than "how many are left".
    const one = data.systems[0]!.slug
    const counted = facetsFor(data.items, data, { ...EMPTY_QUERY, systems: [one] })

    assert.ok(counted.systems.filter((f) => f.count > 0).length > 1)
  })

  test("a count answers the panel as it stands, not the whole catalogue", () => {
    const everything = facetsFor(data.items, data, EMPTY_QUERY)
    const rodsOnly = facetsFor(data.items, data, { ...EMPTY_QUERY, category: "rod" })

    const finials = (f: typeof everything) => f.parts.find((p) => p.slug === "finial")?.count ?? 0
    assert.equal(finials(everything), finials(rodsOnly), "every finial is a rod part")

    const brackets = (f: typeof everything) => f.parts.find((p) => p.slug === "bracket")?.count ?? 0
    assert.ok(brackets(rodsOnly) < brackets(everything), "only some brackets are for rods")
  })
})

describe("the bore of a rod", () => {
  test("a size filter keeps the parts made for that pole", () => {
    const bore = data.diameters[0]!
    const kept = filterItems(data.items, { ...EMPTY_QUERY, category: "rod", diameters: [bore] })

    assert.ok(kept.length > 0)
    for (const item of kept) {
      assert.ok(item.diameter === null || item.diameter === bore, item.name)
    }
  })

  test("a part with no bore of its own is never filtered out by size", () => {
    // A bracket goes on any pole. Dropping it would tell somebody the shop has
    // nothing to hang their rod on.
    const bore = data.diameters[0]!
    const kept = filterItems(data.items, { ...EMPTY_QUERY, category: "rod", diameters: [bore] })

    assert.ok(kept.some((i) => i.diameter === null), "boreless rod parts survive")
  })

  test("a size survives the round trip through a shared link", () => {
    const original = { ...EMPTY_QUERY, category: "rod" as const, diameters: [data.diameters[0]!] }
    assert.deepEqual(query(toParams(original).toString()), original)
  })
})
