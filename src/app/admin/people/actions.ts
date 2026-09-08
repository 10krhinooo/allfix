"use server"

import { revalidatePath } from "next/cache"
import { readDesk } from "@/lib/admin/guard"
import { capabilities } from "@/lib/admin/roles"
import {
  GRANTABLE,
  setRole,
  setSuspended,
  setTier,
  type Changed,
  type Grantable,
} from "@/lib/admin/people-service"

/**
 * Granting a role, a tier, or an account back.
 *
 * The capability is read from the cookie at the top of each function, and this
 * is the case the Next documentation is explicit about: a Server Function is not
 * a route in the matcher chain, so the proxy never sees these calls. Anything
 * that can reach the deployment can invoke them.
 *
 * A refusal is returned rather than thrown. Two people can be looking at this
 * screen, and the second one to press a button meets a rule the first one has
 * just changed; a sentence is more use to them than a stack trace. The wording
 * comes from the service, because the rules are the service's.
 */

const REFUSED = "Only an owner may change who gets in, and as what."

async function allowed(): Promise<boolean> {
  const desk = await readDesk()
  return Boolean(desk && capabilities(desk.role).people)
}

/** The screen redraws from the service, so a change one person makes is seen. */
function redraw(): void {
  revalidatePath("/admin/people")
}

export async function grant(id: string, role: string, granted: boolean): Promise<Changed> {
  if (!(await allowed())) return { ok: false, message: REFUSED }

  // Checked here as well as in the service. The service is the control and this
  // is the one that keeps a bad request from ever being made, which is also how
  // the screen learns it asked for something impossible.
  if (!GRANTABLE.includes(role as Grantable)) {
    return { ok: false, message: `${role} is not a role this screen may grant.` }
  }

  const answer = await setRole(id, role as Grantable, granted)
  if (answer.ok) redraw()
  return answer
}

export async function tier(id: string, code: string | null): Promise<Changed> {
  if (!(await allowed())) return { ok: false, message: REFUSED }

  const answer = await setTier(id, code)
  if (answer.ok) redraw()
  return answer
}

export async function suspend(id: string, suspended: boolean): Promise<Changed> {
  if (!(await allowed())) return { ok: false, message: REFUSED }

  const answer = await setSuspended(id, suspended)
  if (answer.ok) redraw()
  return answer
}
