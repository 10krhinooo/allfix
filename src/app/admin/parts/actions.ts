"use server"

import { revalidatePath, updateTag } from "next/cache"
import { readDesk, readHeld } from "@/lib/admin/guard"
import { capabilities } from "@/lib/admin/roles"
import { CATALOGUE_TAG } from "@/lib/catalogue"
import {
  createPart,
  deletePart,
  pricePart,
  restorePart,
  retirePart,
  savePart,
  type PartEdit,
  type PriceEditWire,
  type Saved,
} from "@/lib/admin/catalogue-api"

/**
 * Changing the catalogue, from the console.
 *
 * The guard is the first statement of each, and it is the only thing between a
 * request and a row: a Server Function is not a route in the proxy's matcher
 * chain, so anything that can reach the deployment can invoke one. Refusals are
 * returned rather than thrown, because the likely reader is somebody at a
 * counter with a customer waiting.
 *
 * Every success expires the catalogue tag. The shop reads its parts through a
 * tagged fetch, so without this a part added here would be correct in the
 * records and absent from the shop until the timer ran out, which is the same
 * as not having saved it.
 */

async function priced() {
  const desk = await readDesk()
  return Boolean(desk && capabilities(desk.role).prices)
}

async function owner() {
  const desk = await readDesk()
  return Boolean(desk && capabilities(desk.role).settings)
}

const NOT_YOURS = { ok: false as const, message: "That is a counter screen, and this account is not one." }
const NOT_OWNERS = { ok: false as const, message: "That one is the owner's, and this account is not." }

function landed(answer: Saved, path?: string): Saved {
  if (answer.ok) {
    updateTag(CATALOGUE_TAG)
    revalidatePath("/admin/parts")
    if (path) revalidatePath(path)
  }
  return answer
}

export async function add(part: PartEdit): Promise<Saved> {
  if (!(await priced())) return NOT_YOURS
  return landed(await createPart(part, (await readHeld())?.svc))
}

export async function save(slug: string, part: PartEdit): Promise<Saved> {
  if (!(await priced())) return NOT_YOURS
  return landed(await savePart(slug, part, (await readHeld())?.svc), `/admin/parts/${slug}`)
}

export async function price(slug: string, block: PriceEditWire): Promise<Saved> {
  if (!(await priced())) return NOT_YOURS
  return landed(await pricePart(slug, block, (await readHeld())?.svc), `/admin/parts/${slug}`)
}

export async function retire(slug: string): Promise<Saved> {
  if (!(await priced())) return NOT_YOURS
  return landed(await retirePart(slug, (await readHeld())?.svc), `/admin/parts/${slug}`)
}

export async function restore(slug: string): Promise<Saved> {
  if (!(await priced())) return NOT_YOURS
  return landed(await restorePart(slug, (await readHeld())?.svc), `/admin/parts/${slug}`)
}

/**
 * The owner's, and checked here as well as on the service.
 *
 * Retiring is the reversible thing a member of staff should reach for. This one
 * cannot be undone and the service refuses it for anything ever sold, so the
 * only parts it can remove are ones with no history at all.
 */
export async function remove(slug: string): Promise<Saved> {
  if (!(await owner())) return NOT_OWNERS
  return landed(await deletePart(slug, (await readHeld())?.svc))
}
