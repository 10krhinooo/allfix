import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { TRADE_RATE, rateFor, ratePhrase, savingOn, tierFor, unitFor } from "@/lib/tiers"

/**
 * What an account pays, checked where a wrong answer is one character.
 *
 * A browser test can tell you the page said KES 80. It cannot economically tell
 * you what happens to a null price, a zero, a part the counter has priced for
 * trade, or a figure with cents in it, and those are the four places money goes
 * wrong quietly. This file is also the mirror of the backend's `unitPriceFor`,
 * so it is where a drift between the two shows up.
 */

describe("which tier an account buys at", () => {
  test("only a trade account is trade", () => {
    assert.equal(tierFor("TRADE"), "trade")
    assert.equal(tierFor("CUSTOMER"), "retail")
    assert.equal(tierFor("STAFF"), "retail")
    assert.equal(tierFor("ADMIN"), "retail")
  })

  test("a visitor with no account at all is retail", () => {
    // There is no account to look a tier up on, which is the same answer the
    // service gives a guest order.
    assert.equal(tierFor(null), "retail")
    assert.equal(tierFor(undefined), "retail")
    assert.equal(rateFor("retail"), 0)
  })

  test("the rate is the one the shop advertises", () => {
    assert.equal(rateFor("trade"), TRADE_RATE)
    assert.equal(ratePhrase("trade"), "20% off list")
  })
})

describe("what one of a part costs", () => {
  test("retail pays list, trade comes off it", () => {
    assert.equal(unitFor({ priceKes: 400 }, "retail"), 400)
    assert.equal(unitFor({ priceKes: 400 }, "trade"), 320)
  })

  test("a price set against the part beats the rate, either way", () => {
    // A rate is a default. A figure somebody typed is a decision, and it holds
    // even when it is dearer than the rate would have been.
    assert.equal(unitFor({ priceKes: 400, tradeKes: 300 }, "trade"), 300)
    assert.equal(unitFor({ priceKes: 400, tradeKes: 380 }, "trade"), 380)
  })

  test("a part priced on request stays priced on request", () => {
    // A null price is "ask us", not zero, and no rate can turn it into a number.
    assert.equal(unitFor({ priceKes: null }, "trade"), null)
    assert.equal(unitFor({ priceKes: null }, "retail"), null)
    assert.equal(unitFor({ priceKes: null, tradeKes: 300 }, "trade"), null)
  })

  test("a zero is not a price, and neither is a trade price of zero", () => {
    assert.equal(unitFor({ priceKes: 0 }, "retail"), null)
    assert.equal(unitFor({ priceKes: 400, tradeKes: 0 }, "trade"), 320)
  })

  test("the figure is whole shillings, because a counter cannot take cents", () => {
    assert.equal(unitFor({ priceKes: 999 }, "trade"), 799)
    assert.equal(unitFor({ priceKes: 12.5 }, "retail"), 13)
  })
})

describe("what the tier takes off", () => {
  test("nothing at retail, the difference at trade, nothing on an absent price", () => {
    assert.equal(savingOn({ priceKes: 400 }, "retail"), 0)
    assert.equal(savingOn({ priceKes: 400 }, "trade"), 80)
    assert.equal(savingOn({ priceKes: null }, "trade"), 0)
  })
})
