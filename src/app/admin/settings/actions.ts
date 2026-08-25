"use server"

import { updateTag } from "next/cache"
import { readDesk } from "@/lib/admin/guard"
import { capabilities } from "@/lib/admin/roles"
import { SOCIAL_KINDS, type EmailSettings, type SocialKind } from "@/lib/settings"
import { saveSettings, type SaveResult } from "@/lib/settings-service"

/**
 * Saving the shop's own settings.
 *
 * The check is here rather than only in the proxy, and this is the case the
 * Next documentation is explicit about: a Server Function is not a route in the
 * matcher chain, so the proxy never sees this call. Anything that can reach the
 * deployment can invoke it, which means the capability has to be read from the
 * cookie at the top of the function itself.
 *
 * A refusal is returned rather than thrown. Somebody signed in as staff who
 * reaches this has almost certainly kept a tab open through a role change, and
 * a sentence saying so is more use than a stack trace.
 */
export async function save(next: {
  social: Partial<Record<SocialKind, string>>
  email: EmailSettings
}): Promise<SaveResult> {
  const desk = await readDesk()
  if (!desk || !capabilities(desk.role).settings) {
    return { ok: false, message: "That is an owner's screen, and this account is not one." }
  }

  // Only the keys this shop knows about, and no more. The form is the only
  // caller today, and it will not be the only caller for ever.
  const social: Partial<Record<SocialKind, string>> = {}
  for (const kind of SOCIAL_KINDS) {
    const value = next.social[kind]?.trim()
    if (value) social[kind] = value
  }

  const result = await saveSettings({ social, email: next.email })
  /*
   * `updateTag` rather than `revalidateTag`, which in Next 16 serves the stale
   * copy while the fresh one is fetched. That is the right behaviour for a
   * catalogue and the wrong one for the person who has just changed a link and
   * gone to the shop to look at it: they would see the old footer and change it
   * again. This expires it at once, which is what read your own writes means.
   */
  if (result.ok) updateTag("settings")
  return result
}
