"use server"

import { revalidatePath, updateTag } from "next/cache"
import { readDesk, readHeld } from "@/lib/admin/guard"
import { capabilities } from "@/lib/admin/roles"
import { countStock, setLowStockAt, type Counted } from "@/lib/admin/stock-service"
import { CATALOGUE_TAG } from "@/lib/catalogue"

/**
 * Counting a shelf, from the console.
 *
 * The guard is the first statement of both, and it is not belt and braces. A
 * Server Function is not a route in the proxy's matcher chain, so the proxy
 * never sees these calls at all: anything that can reach the deployment can
 * invoke one. The rail check is for the rail and the page check is for the page.
 * This is the only thing between a request and a row.
 *
 * Refusals are returned rather than thrown, because the likely reader is a stale
 * tab held open through a role change, at a counter, with somebody waiting.
 */

async function allowed() {
  const desk = await readDesk()
  return Boolean(desk && capabilities(desk.role).stock)
}

export async function count(
  slug: string,
  counted: number | null,
  note: string | null,
): Promise<Counted> {
  if (!(await allowed())) {
    return { ok: false, message: "That is a counter screen, and this account is not one." }
  }

  const answer = await countStock(slug, counted, note, (await readHeld())?.svc)
  if (answer.ok) {
    revalidatePath("/admin/stock")
    // The shop reads the catalogue through a tagged fetch, and a count is part
    // of it. updateTag rather than revalidateTag for the reason the settings
    // screen already gives: stale-while-revalidate would show the person who
    // just counted the shelf the figure they replaced.
    updateTag(CATALOGUE_TAG)
  }
  return answer
}

/**
 * What counts as low for one part.
 *
 * Admin only, and checked here as well as on the service. Counting a shelf is
 * counter work; deciding what the shop is warned about is the owner's, the same
 * call as who gets in and what the shop says about itself.
 */
export async function setThreshold(slug: string, lowStockAt: number | null): Promise<Counted> {
  const desk = await readDesk()
  if (!desk || !capabilities(desk.role).settings) {
    return { ok: false, message: "That is an owner's setting, and this account is not one." }
  }

  const answer = await setLowStockAt(slug, lowStockAt, (await readHeld())?.svc)
  if (answer.ok) {
    revalidatePath("/admin/stock")
    updateTag(CATALOGUE_TAG)
  }
  return answer
}
