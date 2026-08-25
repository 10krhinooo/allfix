import { pathToFileURL } from "node:url"
import { existsSync } from "node:fs"
import { dirname, resolve as join } from "node:path"
import { fileURLToPath } from "node:url"

/**
 * `@/` in Node, so a unit test can import the same modules a page does.
 *
 * The alias is a TypeScript path mapping, which the compiler understands and the
 * runtime does not. Next rewrites it when it builds; a plain `node --test` run
 * has to be told. Twenty lines here is the whole price of testing `src/lib`
 * without a bundler, a transform step or a dependency to keep current.
 */

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

interface Resolution {
  url: string
  format?: string | null
  importAttributes?: Record<string, string>
  shortCircuit?: boolean
}

/**
 * The catalogue is imported as `catalogue.json` with no attribute, because that
 * is what a bundler accepts and what every module in `src` is written for. Node
 * refuses a JSON import without `with { type: "json" }`, so the attribute is
 * added here rather than written into source that a bundler would then have to
 * be taught to ignore.
 */
async function withJsonAttribute(resolution: Resolution): Promise<Resolution> {
  if (!resolution.url.endsWith(".json")) return resolution
  return { ...resolution, importAttributes: { type: "json" } }
}

export async function resolve(
  specifier: string,
  context: { importAttributes?: Record<string, string> },
  next: (specifier: string, context: unknown) => Promise<Resolution>,
): Promise<Resolution> {
  if (!specifier.startsWith("@/")) {
    return withJsonAttribute(
      await next(specifier, { ...context, importAttributes: { type: "json" } }),
    )
  }

  const bare = join(root, "src", specifier.slice(2))
  // Written without an extension in the source, the same as every other import
  // in this codebase, so the extension is found here rather than typed there.
  for (const candidate of [bare, `${bare}.ts`, `${bare}.tsx`, join(bare, "index.ts")]) {
    if (existsSync(candidate)) {
      return next(pathToFileURL(candidate).href, context)
    }
  }
  return next(specifier, context)
}
