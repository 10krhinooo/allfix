import { test, describe } from "node:test"
import assert from "node:assert/strict"
import {
  BASES,
  currentPrice,
  isSellable,
  priceProblem,
  samePrice,
  toPrice,
  type PriceEdit,
} from "@/lib/admin/pricing"

/**
 * What the console will accept as a price, and whether it is worth writing.
 *
 * `samePrice` decides whether a save happens at all, so a field missing from it
 * is a field that silently cannot be edited: the form reports success, the
 * service is never called, and the figure on the shop is the old one. That is
 * the same class of failure as a null price rendering "KES 0", which is why
 * this file exists rather than leaving it to a browser test.
 */

const BASE: PriceEdit = {
  priceKes: 400,
  priceBasis: "metre",
  priceNote: null,
  tradePriceKes: null,
}

describe("whether an edit is worth writing", () => {
  test("an edit that changes nothing writes nothing", () => {
    assert.equal(samePrice(BASE, { ...BASE }), true)
  })

  test("every field in the block is compared", () => {
    // Each of these on its own has to count as a change. A field left out here
    // cannot be edited at all: the caller reads "nothing changed" and returns
    // before it ever reaches the service.
    assert.equal(samePrice(BASE, { ...BASE, priceKes: 450 }), false)
    assert.equal(samePrice(BASE, { ...BASE, priceBasis: "each" }), false)
    assert.equal(samePrice(BASE, { ...BASE, priceNote: "by arrangement" }), false)
    assert.equal(samePrice(BASE, { ...BASE, tradePriceKes: 320 }), false)
  })

  test("clearing a price is a change, not an absence of one", () => {
    // "Price on request" is a decision somebody made, and it has to survive
    // being saved. Treating null as "nothing to do" would make it unreachable.
    assert.equal(samePrice(BASE, { ...BASE, priceKes: null }), false)
    assert.equal(samePrice({ ...BASE, tradePriceKes: 320 }, BASE), false)
  })
})

describe("what the console refuses to send", () => {
  test("a zero is refused, and says what to do instead", () => {
    // Every product on the site this replaces was priced 0, which is precisely
    // why it could not take an order.
    const problem = priceProblem("0")
    assert.ok(problem)
    assert.match(problem, /Leave it blank/)
  })

  test("blank is not a problem, because unpriced is a real state", () => {
    assert.equal(priceProblem(""), null)
    assert.equal(priceProblem("   "), null)
    assert.equal(toPrice(""), null)
  })

  test("a negative, a word and an extra digit are all caught", () => {
    assert.ok(priceProblem("-5"))
    assert.ok(priceProblem("four hundred"))
    assert.ok(priceProblem("4000000"))
  })

  test("a figure that cannot be parsed never becomes a number", () => {
    // Anything priceProblem rejects has to come back null rather than NaN,
    // which would reach the service as a price.
    assert.equal(toPrice("0"), null)
    assert.equal(toPrice("-5"), null)
    assert.equal(toPrice("four hundred"), null)
  })

  test("shillings and cents survive the round trip", () => {
    assert.equal(toPrice("400"), 400)
    assert.equal(toPrice(" 1200.50 "), 1200.5)
    assert.equal(toPrice("99.999"), 100)
  })
})

describe("reading a price off a part", () => {
  test("a row with no trade price reads as off list, not as zero", () => {
    // Zero would be a trade account buying for nothing. Absent means the rate
    // in tiers.ts applies instead.
    assert.deepEqual(currentPrice({ priceKes: 400, priceBasis: "metre", priceNote: null }), {
      priceKes: 400,
      priceBasis: "metre",
      priceNote: null,
      tradePriceKes: null,
    })
  })

  test("a part is sellable only on a real figure", () => {
    assert.equal(isSellable(BASE), true)
    assert.equal(isSellable({ ...BASE, priceKes: null }), false)
    assert.equal(isSellable({ ...BASE, priceKes: 0 }), false)
  })
})

describe("what a price buys", () => {
  test("every basis the catalogue uses can be chosen at the counter", () => {
    // A track at 400 is 400 per metre. A basis the form cannot offer is a part
    // the counter cannot price correctly.
    const offered = BASES.map((basis) => basis.value)
    assert.deepEqual(offered, ["each", "metre", "pair", "box", "roll", "length"])
  })
})
