import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { readDesk } from "@/lib/admin/guard"
import { capabilities } from "@/lib/admin/roles"
import { readSettings } from "@/lib/settings-service"
import { Settings } from "@/components/admin/Settings"

export const metadata: Metadata = { title: "Settings" }

/**
 * What the shop says about itself.
 *
 * Two things live here, and they are the two that are true of the whole shop
 * rather than of one part: the accounts it links to, and the messages it sends.
 * A price is counter work and staff change one. These change what every customer
 * sees or receives, so they are the owner's.
 *
 * Admin only, checked here as well as in the proxy and again inside the action
 * that saves, because a Server Function is not a route and the proxy never sees
 * one. `notFound` rather than a redirect, the same as People: somebody who
 * guesses the URL should not learn the screen exists.
 */
export default async function SettingsPage() {
  const desk = await readDesk()
  if (!desk || !capabilities(desk.role).settings) notFound()

  return <Settings settings={await readSettings()} />
}
