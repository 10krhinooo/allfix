import { test, describe } from "node:test"
import assert from "node:assert/strict"
import vm from "node:vm"
import { heroGateScript, heroReveals, reducedMotion, SEEN } from "@/lib/motion"

/**
 * The one rule in this repository that is written twice.
 *
 * `Curtain` is server rendered closed, so the decision not to open it has to be
 * taken in the document head, before the first paint. That means the rule
 * exists as a string for the head and as a function for React, and the comment
 * on `heroGateScript` asks whoever edits one to edit the other.
 *
 * A comment is not a control. The two can drift and the only symptom is a full
 * screen of red on a page that was supposed to be still, or a hero that never
 * opens, and neither shows up in a browser test because the browser only ever
 * runs one of the two paths at a time.
 *
 * So the string is executed here against the same inputs the function reads,
 * and the pair is asserted to agree on every combination of them. Sixteen
 * cases, which is all of them.
 */

/**
 * `NODE_ENV`, which both halves read and which Next types as read only.
 *
 * Read only is right for source: nothing in the app should be reassigning it.
 * This is the one place that has to, because the rule under test branches on it
 * and the branch is half of what can drift.
 */
function asEnvironment(value: string | undefined): void {
  const environment = process.env as Record<string, string | undefined>
  if (value === undefined) delete environment.NODE_ENV
  else environment.NODE_ENV = value
}

/** The inputs both halves read, and nothing else. */
interface World {
  production: boolean
  reloaded: boolean
  seen: boolean
  reduced: boolean
}

/**
 * Runs the head script in a sandbox holding just enough browser.
 *
 * `dataset.hero` is what the script writes and what `globals.css` reads, so the
 * sandbox's answer is whether the attribute came out set, not what the script
 * returned. It returns nothing.
 */
function scriptOpensTheHero(world: World): boolean {
  const dataset: Record<string, string> = {}
  const sandbox = {
    document: { documentElement: { dataset } },
    performance: {
      getEntriesByType: (kind: string) =>
        kind === "navigation" ? [{ type: world.reloaded ? "reload" : "navigate" }] : [],
    },
    sessionStorage: {
      getItem: (key: string) => (key === SEEN && world.seen ? "1" : null),
    },
    matchMedia: (query: string) => ({
      matches: query.includes("prefers-reduced-motion") && world.reduced,
    }),
  }

  const previous = process.env.NODE_ENV
  // Read when the string is built rather than when it runs, so it is set for
  // the call and not for the evaluation.
  asEnvironment(world.production ? "production" : "development")
  const source = heroGateScript()
  asEnvironment(previous)

  vm.runInNewContext(source, sandbox)
  return dataset.hero === "1"
}

/**
 * The same question asked of the React half.
 *
 * `Curtain` refuses on `reducedMotion() || !heroReveals()`, so the condition
 * the head script has to match is both of them together, not `heroReveals`
 * alone. That asymmetry is the drift most likely to go unnoticed, because each
 * function reads correctly on its own.
 */
function reactOpensTheHero(world: World): boolean {
  const previousEnv = process.env.NODE_ENV
  const previousPerformance = globalThis.performance
  const globals = globalThis as Record<string, unknown>
  const hadSession = "sessionStorage" in globals
  const hadWindow = "window" in globals

  asEnvironment(world.production ? "production" : "development")
  Object.defineProperty(globalThis, "performance", {
    value: {
      getEntriesByType: (kind: string) =>
        kind === "navigation" ? [{ type: world.reloaded ? "reload" : "navigate" }] : [],
    },
    configurable: true,
    writable: true,
  })
  globals.sessionStorage = {
    getItem: (key: string) => (key === SEEN && world.seen ? "1" : null),
  }
  globals.window = {
    matchMedia: (query: string) => ({
      matches: query.includes("prefers-reduced-motion") && world.reduced,
    }),
  }

  try {
    return !reducedMotion() && heroReveals()
  } finally {
    asEnvironment(previousEnv)
    Object.defineProperty(globalThis, "performance", {
      value: previousPerformance,
      configurable: true,
      writable: true,
    })
    if (!hadSession) delete globals.sessionStorage
    if (!hadWindow) delete globals.window
  }
}

/** Every combination of the four inputs, named so a failure reads as a sentence. */
const WORLDS: World[] = [false, true].flatMap((production) =>
  [false, true].flatMap((reloaded) =>
    [false, true].flatMap((seen) =>
      [false, true].map((reduced) => ({ production, reloaded, seen, reduced })),
    ),
  ),
)

function describeWorld(world: World): string {
  return [
    world.production ? "in production" : "in development",
    world.reloaded ? "on a reload" : "on a fresh navigation",
    world.seen ? "having seen the hero" : "not having seen the hero",
    world.reduced ? "asking for reduced motion" : "not asking for reduced motion",
  ].join(", ")
}

describe("the head script and the component agree", () => {
  for (const world of WORLDS) {
    test(describeWorld(world), () => {
      assert.equal(
        scriptOpensTheHero(world),
        reactOpensTheHero(world),
        "the rule in the head and the rule in React have drifted",
      )
    })
  }
})

describe("the rule itself, so a drift is not merely mutual", () => {
  // The pair above proves the two halves match. These prove they match on the
  // right answer, so changing both in the same wrong direction still fails.

  test("reduced motion closes it whatever else is true", () => {
    for (const world of WORLDS.filter((each) => each.reduced)) {
      assert.equal(scriptOpensTheHero(world), false, describeWorld(world))
    }
  })

  test("a first visit opens it", () => {
    assert.equal(
      scriptOpensTheHero({ production: true, reloaded: false, seen: false, reduced: false }),
      true,
    )
  })

  test("a second visit in the same tab does not", () => {
    assert.equal(
      scriptOpensTheHero({ production: true, reloaded: false, seen: true, reduced: false }),
      false,
    )
  })

  test("a reload asks to see it again", () => {
    assert.equal(
      scriptOpensTheHero({ production: true, reloaded: true, seen: true, reduced: false }),
      true,
    )
  })

  test("development always opens it, so it can be worked on", () => {
    assert.equal(
      scriptOpensTheHero({ production: false, reloaded: false, seen: true, reduced: false }),
      true,
    )
  })
})
