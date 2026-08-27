"use server"

import { notFound } from "next/navigation"
import { revalidatePath } from "next/cache"
import { readDesk, readHeld } from "@/lib/admin/guard"
import { capabilities } from "@/lib/admin/roles"
import { moveOrder, takeOrder, type TakeOrder } from "@/lib/admin/orders-service"
import type { OrderStage } from "@/lib/orders"

/**
 * The two things this screen writes, and the guard they both start with.
 *
 * A Server Function is not a route in the proxy's matcher chain, so the proxy
 * never sees either of these. The check on the rail is for the rail and the
 * check in the page is for the page; this one is the one that matters, because
 * it is the only one between a request and a row.
 *
 * A refusal is returned rather than thrown. A stale tab held open through a role
 * change deserves a sentence, not a stack trace, and the person reading it is at
 * a counter with somebody waiting.
 */
async function allowed() {
  const desk = await readDesk()
  return Boolean(desk && capabilities(desk.role).orders)
}

export async function take(order: TakeOrder) {
  if (!(await allowed())) {
    return { ok: false as const, message: "That is a counter screen, and this account is not one." }
  }

  const answer = await takeOrder(order, (await readHeld())?.svc)
  // The list on screen is now a list short of one order, and the person who
  // just took it is about to look for it.
  if (answer.ok) revalidatePath("/admin/orders")
  return answer
}

export async function move(reference: string, stage: OrderStage) {
  if (!(await allowed())) {
    return { ok: false as const, message: "That is a counter screen, and this account is not one." }
  }

  const answer = await moveOrder(reference, stage, (await readHeld())?.svc)
  if (answer.ok) revalidatePath("/admin/orders")
  return answer
}

/** Kept so a guessed URL cannot learn the screen exists from an action either. */
export async function refuse() {
  notFound()
}
