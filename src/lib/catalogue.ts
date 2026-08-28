/**
 * The catalogue data layer, and the seam the shop reads everything through.
 *
 * With `ALLFIX_API_URL` set this reads the shop's own service; without it, the
 * migrated JSON committed to this repository, exactly as it always did. That is
 * the same arrangement `settings-service.ts` and `registration.ts` are in, and
 * it is what lets a part created at the counter appear on the shop at all: the
 * catalogue used to be a file, so a part added through the console would have
 * been saved by the service and then not existed as far as any page was
 * concerned.
 *
 * **Cached, and expired the moment somebody saves.** The catalogue is on every
 * prerendered page, and a shop that asks the service on every request stops
 * being prerendered and goes down whenever the service does. So it is a tagged
 * fetch, and the console's own save calls `updateTag("catalogue")`, which is
 * what makes an edit visible immediately rather than on a timer. `updateTag`
 * rather than `revalidateTag` for the reason the settings screen already gives:
 * somebody who has just changed a part is about to go and look at it.
 *
 * Every accessor is async because a network read is. The functions that are
 * pure over a product they are handed, `imageFor` and `skusOf`, are not, and
 * stay callable from anywhere.
 */
import catalogue from "../../data/catalogue.json"

export interface Spec { label: string; value: string }

/**
 * What a price buys. The shop quotes track by the metre and tie backs by the
 * pair, so a bare figure would misprice both, and the rail configurator's bill
 * of materials depends on knowing which.
 */
export type PriceBasis = "each" | "metre" | "pair" | "box" | "roll" | "length"

/** Rails are browsed by system, rods by finish. The two do not interchange. */
export type Family = "rail" | "rod"

export interface Variant {
  sku: string
  label: string
  swatch: string
  priceKes: number | null
  priceBasis: PriceBasis
  tradePriceKes: number | null
  stock: number | null
  image: string | null
  legacyUrl: string | null
}

export interface Product {
  sku: string | null
  name: string
  slug: string
  family: Family
  system: string | null
  /** The rod finish, on rods only. Rails carry a `system` instead. */
  range: string | null
  /** Rod bore in millimetres, on the parts that have to match the pole. */
  diameter: number | null
  universal: boolean
  fitsSystems: string[]
  component: string
  componentLabel: string
  specs: Spec[]
  summary: string
  description: string
  priceKes: number | null
  priceBasis: PriceBasis
  /**
   * A price the sheet stated in words rather than figures, kept verbatim: the
   * roman blind fittings are included in the track's rate per metre, and the
   * double rail quotes a length price alongside its metre rate. Never guessed
   * into a number.
   */
  priceNote: string | null
  tradePriceKes: number | null
  stock: number | null
  image: string | null
  /** The shot this part is waiting for, on everything not yet photographed. */
  imageName: string | null
  legacyUrl: string | null
  variantAxis?: string
  variants?: Variant[]
}

export type SystemKind = "rail" | "blind"

export interface System {
  slug: string
  name: string
  shortName: string
  blurb: string
  /**
   * A track drawn on runners, or a blind raised on a cord.
   *
   * Both answer the same question, what the customer already has above the
   * window, which is why they share this table. Almost nothing else about them
   * is shared: a blind takes no runners, no stoppers and no tape, it is quoted
   * by the metre with its fittings included rather than sold as parts, and it
   * has no cross section to draw. Anywhere those differ, ask this rather than
   * naming a slug. The configurator named one and the other two walked straight
   * past it.
   */
  kind: SystemKind
  flagship?: boolean
  skuPrefixes: string[]
  partCount: number
  components: string[]
  /**
   * The length track is stocked in, in metres. A run longer than this needs a
   * joint, and the configurator counts joints against it. Unconfirmed with the
   * client: see the note in `tools/migrate/systems.py`.
   */
  stockLengthM: number
}

export interface Component {
  slug: string
  name: string
  purpose: string
  /**
   * How many of this part a metre of run takes, and the fewest any run takes.
   * The configurator counts with these, and `purpose` is written from them in
   * the migration, so the sentence a customer reads and the quantity they are
   * quoted can never drift apart.
   */
  perMetre: number | null
  minimum: number | null
}

/**
 * A curtain rod finish. Rods are the half of the shop the old site never had,
 * and they browse on their own axis: someone with an antique brass 28mm pole
 * needs a finial in the same brass and rings in the same 28, so finish leads
 * and diameter filters within it.
 */
export interface Range {
  slug: string
  name: string
  shortName: string
  blurb: string
  swatch: string
  skuPrefixes: string[]
  partCount: number
  components: string[]
  diameters: number[]
}

export interface Catalogue {
  systems: System[]
  ranges: Range[]
  components: Component[]
  products: Product[]
  skuCount: number
}

/** The committed migration, which is what the shop reads with no service wired. */
const FILE = catalogue as unknown as Catalogue

const API = process.env.ALLFIX_API_URL ?? ""

/** The tag the console expires when somebody saves a part. */
export const CATALOGUE_TAG = "catalogue"

/**
 * How long a page may keep a catalogue nobody has changed.
 *
 * Long, because a save expires the tag outright and this is only the backstop
 * for a change that reached the database by some other route: a migration, an
 * import run against the service directly, somebody at a psql prompt.
 */
const REVALIDATE = 3600

/**
 * The catalogue, from the service where there is one and from the file where
 * there is not.
 *
 * A service that is down must not take the shop down with it, so a failed read
 * falls back to the committed file rather than throwing. That is a real
 * decision and not only caution: the file is a real catalogue, a few edits
 * behind at worst, and a shop showing slightly stale parts is worth more than a
 * shop showing an error. It is the same answer `readSettings` gives.
 */
export async function catalogueData(): Promise<Catalogue> {
  if (!API) return FILE

  try {
    const [reference, parts] = await Promise.all([
      fetch(`${API}/api/catalogue`, {
        next: { revalidate: REVALIDATE, tags: [CATALOGUE_TAG] },
      }),
      fetch(`${API}/api/products`, {
        next: { revalidate: REVALIDATE, tags: [CATALOGUE_TAG] },
      }),
    ])
    if (!reference.ok || !parts.ok) {
      warn(`the service answered ${reference.status} and ${parts.status}`)
      return FILE
    }

    const bundle = await reference.json()
    const list = await parts.json()
    if (!Array.isArray(list) || !Array.isArray(bundle?.systems)) {
      warn("the service answered in a shape this does not recognise")
      return FILE
    }

    return fromService(bundle, list)
  } catch (failure) {
    warn(String(failure))
    return FILE
  }
}

/**
 * Says out loud that the shop is running on the committed file.
 *
 * The only fallback in this codebase a person cannot see. An unreachable
 * settings service leaves the footer bare and an unreachable order service
 * draws an empty state, but a catalogue read that quietly falls back looks
 * exactly like one that worked: the shop is up, the parts are there, and they
 * are simply however old the last deploy was. Somebody has to be able to find
 * that out, and this line is the only way they will.
 */
function warn(why: string) {
  console.warn(`[catalogue] reading the committed file instead of the service: ${why}`)
}

/**
 * The service's answer, in the shop's own vocabulary.
 *
 * Pure and exported so it can be tested without a service, because this is the
 * exact shape of fault that stopped every enquiry reaching the shop: one side
 * said `survey` and the other said `SURVEY`, both were right on their own, and
 * nothing found it until the two were run together.
 */
export function fromService(bundle: Record<string, unknown>, list: unknown[]): Catalogue {
  return {
    systems: ((bundle.systems as Record<string, unknown>[]) ?? []).map(fromServiceSystem),
    ranges: (bundle.ranges as Range[]) ?? [],
    components: (bundle.components as Component[]) ?? [],
    products: (list as Record<string, unknown>[]).map(fromServiceProduct),
    skuCount: Number(bundle.skuCount ?? 0),
  }
}

/**
 * The service spells its enums the way Java does and this shop spells them the
 * way it reads them.
 *
 * Written out rather than lowercased blindly, because this is the exact shape of
 * fault that stopped every enquiry reaching the shop: one side said `survey` and
 * the other `SURVEY`, and nothing noticed until the two were run together.
 */
function down<T extends string>(value: unknown, fallback: T): T {
  return typeof value === "string" ? (value.toLowerCase() as T) : fallback
}

function fromServiceSystem(system: Record<string, unknown>): System {
  return { ...system, kind: down<SystemKind>(system.kind, "rail") } as System
}

function fromServiceProduct(product: Record<string, unknown>): Product {
  return {
    ...product,
    family: down<Family>(product.family, "rail"),
    priceBasis: down<PriceBasis>(product.priceBasis, "each"),
    // A Set on the wire arrives as an array, and a null as nothing at all.
    fitsSystems: Array.isArray(product.fitsSystems) ? product.fitsSystems : [],
    variants: Array.isArray(product.variants)
      ? product.variants.map((variant: Record<string, unknown>) => ({
          ...variant,
          priceBasis: down<PriceBasis>(variant.priceBasis, "each"),
        }))
      : undefined,
  } as Product
}

export async function systems() {
  return (await catalogueData()).systems
}

export async function ranges() {
  return (await catalogueData()).ranges
}

export async function components() {
  return (await catalogueData()).components
}

export async function products() {
  return (await catalogueData()).products
}

export async function skuCount() {
  return (await catalogueData()).skuCount
}

export async function rails() {
  return (await products()).filter((p) => p.family === "rail")
}

export async function rods() {
  return (await products()).filter((p) => p.family === "rod")
}

export async function getSystem(slug: string) {
  return (await systems()).find((s) => s.slug === slug)
}

/** The tracks. What the configurator, and the rail browse axis, mean by a system. */
export async function railSystems() {
  return (await systems()).filter((s) => s.kind === "rail")
}

/** The blinds, which browse and sell differently enough to be asked for on their own. */
export async function blindSystems() {
  return (await systems()).filter((s) => s.kind === "blind")
}

export async function getRange(slug: string) {
  return (await ranges()).find((r) => r.slug === slug)
}

/** Every part in a rod finish, in assembly order, optionally for one bore only. */
export async function partsForRange(slug: string, diameter?: number) {
  return (await rods())
    .filter((p) => p.range === slug)
    .filter((p) => !diameter || p.diameter === null || p.diameter === diameter)
    .sort((a, b) => order(a.component) - order(b.component) || a.name.localeCompare(b.name))
}

/** Tapes, hooks and buckles, which attach to the curtain rather than the track. */
export async function universalParts() {
  return (await products()).filter((p) => p.universal)
}

export async function getProduct(slug: string) {
  return (await products()).find((p) => p.slug === slug)
}

export async function getComponent(slug: string) {
  return (await components()).find((c) => c.slug === slug)
}

/** Every part that fits a given rail, ordered so the track comes before its fittings. */
export async function partsForSystem(slug: string) {
  return (await products())
    .filter((p) => p.fitsSystems.includes(slug))
    .sort((a, b) => order(a.component) - order(b.component) || a.name.localeCompare(b.name))
}

/**
 * The order a rail is actually assembled in: the track first, then what carries
 * it, then what runs in it, then what finishes it. A part list sorted this way
 * reads as instructions rather than as inventory.
 */
const ASSEMBLY = [
  "track", "rod", "bracket", "holder", "joint", "corner-joint",
  "runner", "master-carrier", "stopper",
  "motor", "drive-unit", "roller-unit", "belt",
  "finial", "end-cup", "ring", "tie-back",
  "thread", "blind-ring", "fibre", "weight",
  "tape", "hook", "buckle",
]

function order(component: string) {
  const index = ASSEMBLY.indexOf(component)
  return index === -1 ? ASSEMBLY.length : index
}

export async function componentsInOrder() {
  return [...(await components())].sort((a, b) => order(a.slug) - order(b.slug))
}

/**
 * The optimised image the migration wrote for a SKU, or null when there isn't
 * one. Only the parts that came off the old site have been photographed: the
 * rod line and everything the client's sheet added are waiting on a shoot, and
 * they say so with `imageName` rather than pointing at a file that would 404.
 */
export function imageFor(product: Product, variant?: Variant) {
  const entry = variant ?? product
  if (!entry.image) return null
  // A variant group has no SKU of its own, and the migration writes one file
  // per variant keyed by that variant's SKU. The group shows its lead, so the
  // lead's SKU is the file to ask for. Falling back to the group slug asks for
  // a file that was never written.
  const key = (variant?.sku ?? product.sku ?? product.variants?.[0]?.sku ?? product.slug)
    .replace(/#/g, "")
    .replace(/\//g, "-")
    .toLowerCase()
  return `/products/${key}.webp`
}

export function skusOf(product: Product) {
  return product.variants?.length ?? 1
}

/**
 * The parts for a system, bucketed by component type and still in assembly
 * order. A system page reads as a build sheet rather than a wall of cards, and
 * the buckets double as its jump links.
 */
export async function partsForSystemByComponent(slug: string) {
  const grouped = new Map<string, Product[]>()
  for (const product of await partsForSystem(slug)) {
    const bucket = grouped.get(product.component)
    if (bucket) bucket.push(product)
    else grouped.set(product.component, [product])
  }

  const known = await components()
  return [...grouped].map(([component, parts]) => ({
    component: known.find((c) => c.slug === component)
      ?? { slug: component, name: parts[0].componentLabel, purpose: "" },
    parts,
  }))
}

/** How many orderable SKUs sit behind a system, counting variants separately. */
export async function skuCountForSystem(slug: string) {
  return (await partsForSystem(slug)).reduce((total, product) => total + skusOf(product), 0)
}
