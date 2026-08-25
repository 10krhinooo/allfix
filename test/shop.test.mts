import { test, describe } from "node:test"
import assert from "node:assert/strict"
import {
  activeCount,
  EMPTY_QUERY,
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
    const real = data.systemFacets[0]!.slug
    assert.deepEqual(query(`system=${real}`).systems, [real])
  })

  test("several are a comma list, because a filter is a multi select", () => {
    const [first, second] = data.systemFacets.map((facet) => facet.slug)
    assert.deepEqual(query(`system=${first},${second}`).systems, [first, second])
  })

  test("a value that names nothing is dropped rather than filtering to nothing", () => {
    // An empty grid is what a customer reads as "you have none of these", and a
    // typo in a shared link should not be able to say that.
    assert.deepEqual(query("system=not-a-system").systems, [])
    assert.equal(query("family=biscuits").family, null)
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
    const system = data.systemFacets[0]!.slug
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
    const system = data.systemFacets[0]!.slug
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
