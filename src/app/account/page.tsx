import { redirect } from "next/navigation"
import { readDesk } from "@/lib/admin/guard"
import { landing } from "@/lib/admin/roles"

/**
 * "Your account", wherever that turns out to be.
 *
 * The storefront chrome cannot know whether a signed in visitor belongs at the
 * counter console or the trade desk: it only knows that somebody is signed in,
 * because working out which would mean reading the session on every page. So the
 * header points here and the server answers, which is also the right answer for
 * a stale hint cookie: somebody who is not signed in at all lands on the door.
 */
export default async function AccountPage() {
  const desk = await readDesk()
  redirect(desk ? landing(desk.role) : "/sign-in")
}
