import { register } from "node:module"

/**
 * Turns on the `@/` resolver for the run.
 *
 * A hooks module has to be registered rather than merely imported: it runs on
 * its own thread so it can answer resolution requests before the main thread
 * needs them. `--import ./test/register.mts` is the whole wiring.
 */
register("./alias.mts", import.meta.url)
