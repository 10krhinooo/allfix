import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { inStock, priceLine, sellable, skuFor } from "@/lib/commerce"
import { price, priceOrAsk } from "@/lib/format"

/**
 * The rule the whole project exists because of.
 *
 * Every product on the store this replaces was priced 0, in the wrong currency,
 * which is why it could not take an order. So "a null price is not zero" is not
 * a style preference here, it is the requirement, and it is worth pinning down
 * at the level where a wrong answer is one character.
 */

const part = (over: Record<string, unknown> = {}) => ({
  slug: "20-runners",
  sku: "RL#20_004",
  name: "#20 Runners",
  priceKes: 10,
  priceBasis: "each",
  priceNote: null,
  ...over,
}) as never

describe("whether a part can be sold at all", () => {
  test("a real figure can", () => {
    assert.equal(sellable({ priceKes: 10 }), true)
  })

  test("an absent price cannot", () => {
    assert.equal(sellable({ priceKes: null }), false)
  })

  test("and neither can zero, which is what the old store had", () => {
    assert.equal(sellable({ priceKes: 0 }), false)
  })
})

describe("what goes where the price goes", () => {
  test("a figure, carrying what it buys", () => {
    const line = priceLine(part({ priceKes: 400, priceBasis: "metre" }))
    assert.equal(line.text, "KES 400 per metre")
    assert.equal(line.buyable, true)
  })

  test("the client's own words when they priced in prose", () => {
    // The roman blind fittings are "included in the cost of the track per mtr",
    // which is a real answer and a better one than silence.
    const line = priceLine(
      part({ priceKes: null, priceNote: "Included in the cost of the track per mtr" }),
    )
    assert.equal(line.text, "Included in the cost of the track per mtr")
    assert.equal(line.buyable, false)
  })

  test("and otherwise the honest fallback, never a zero", () => {
    const line = priceLine(part({ priceKes: null, priceNote: null }))
    assert.equal(line.text, "Price on request")
    assert.equal(line.buyable, false)

    const zero = priceLine(part({ priceKes: 0 }))
    assert.equal(zero.text, "Price on request")
    assert.equal(zero.buyable, false)
  })
})

describe("money, as a Nairobi shopper reads it", () => {
  test("grouped, in shillings", () => {
    assert.equal(price(184600), "KES 184,600")
  })

  test("a basis is spoken where it changes what you are buying", () => {
    // "KES 20 each" is how a counter quotes a runner and "KES 20" is how a
    // shopper reads it. A track at 400 must never look like a whole track.
    assert.equal(price(20, "each"), "KES 20")
    assert.equal(price(400, "metre"), "KES 400 per metre")
    assert.equal(price(96, "pair"), "KES 96 per pair")
  })

  test("nothing is not zero", () => {
    assert.equal(price(null), null)
    assert.equal(price(undefined), null)
    assert.equal(priceOrAsk(null), "Price on request")
  })
})

describe("the SKU a basket line refers to", () => {
  test("the variant's, once one is chosen", () => {
    assert.equal(skuFor(part(), { sku: "RL#20_004-W" } as never), "RL#20_004-W")
  })

  test("the product's otherwise, and the slug when there is no SKU at all", () => {
    assert.equal(skuFor(part()), "RL#20_004")
    assert.equal(skuFor(part({ sku: null })), "20-runners")
  })
})

describe("stock", () => {
  test("untracked is not the same as out of stock", () => {
    // The workbook's stock column is empty, so absent means unknown and the
    // counter's own answer stands.
    assert.equal(inStock({ stock: null }), true)
    assert.equal(inStock({ stock: 4 }), true)
    assert.equal(inStock({ stock: 0 }), false)
  })
})
