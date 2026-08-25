import { test, describe } from "node:test"
import assert from "node:assert/strict"
import { assess, MIN_LENGTH } from "@/lib/password"

/**
 * The meter, which mirrors `PasswordPolicy` on the server.
 *
 * The two are written twice on purpose: this one is a courtesy shown as somebody
 * types and the server is the control. That only works while they agree, and
 * this is where a drift shows up before a customer meets it as "the meter said
 * strong and the shop said no".
 */

describe("what it refuses", () => {
  test("something too short, saying how short", () => {
    const verdict = assess("Rafiki-9")
    assert.equal(verdict.acceptable, false)
    assert.ok(
      verdict.problems.some((problem) => problem.includes(String(MIN_LENGTH))),
      "the message names the length rather than saying it is invalid",
    )
  })

  test("a password made of the person's own name", () => {
    // Widened during the account book work: the whole-local-part test let
    // "ochieng-rails-99" past for p.ochieng@gmail.com.
    const verdict = assess("ochieng-rails-99", "p.ochieng@gmail.com", "Peter Ochieng")
    assert.equal(verdict.acceptable, false)
  })

  test("their email address, whole", () => {
    assert.equal(assess("grace@example.com", "grace@example.com", "Grace").acceptable, false)
  })

  test("a straight run off the keyboard", () => {
    assert.equal(assess("abcdefghijkl").acceptable, false)
    assert.equal(assess("123456789012").acceptable, false)
  })
})

describe("what it accepts", () => {
  test("length carrying the weight, rather than a bolted-on symbol", () => {
    const verdict = assess("kikapu rafiki tembo")
    assert.equal(verdict.acceptable, true)
    assert.equal(verdict.problems.length, 0)
  })

  test("and it rates rather than only permits", () => {
    assert.equal(assess("").strength, "empty")
    assert.ok(["weak", "fair", "strong"].includes(assess("Rafiki-88-Tumbili").strength))
  })
})

describe("what it says while somebody is still typing", () => {
  test("an empty field is not a failure, it is an empty field", () => {
    const verdict = assess("")
    assert.equal(verdict.strength, "empty")
    assert.equal(verdict.acceptable, false)
  })
})
