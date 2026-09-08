import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { readDesk } from "@/lib/admin/guard"
import { capabilities } from "@/lib/admin/roles"
import { readPlatform } from "@/lib/admin/reports-service"
import { Platform } from "@/components/admin/Platform"

export const metadata: Metadata = { title: "The platform" }

/**
 * Whether the shop is working, as opposed to how it is doing.
 *
 * Admin only, checked here as well as in the proxy, the same as Settings and
 * People and for a sharper version of the same reason: this screen names which
 * configuration values a deployment is missing. `notFound` rather than a
 * redirect, so somebody guessing the URL does not learn the screen exists.
 *
 * Never cached. Every other console screen can afford to be a moment stale; the
 * one that answers "is anything working right now" cannot.
 */
export const dynamic = "force-dynamic"

export default async function PlatformPage() {
  const desk = await readDesk()
  if (!desk || !capabilities(desk.role).platform) notFound()

  return <Platform state={await readPlatform()} />
}
