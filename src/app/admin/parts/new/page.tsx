import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PartForm } from "@/components/admin/PartForm"
import { readDesk } from "@/lib/admin/guard"
import { capabilities } from "@/lib/admin/roles"
import { skuPrefixes } from "@/lib/admin/rows"
import { add } from "@/app/admin/parts/actions"

export const metadata: Metadata = { title: "Add a part" }

export const dynamic = "force-dynamic"

export default async function NewPartPage() {
  const desk = await readDesk()
  if (!desk || !capabilities(desk.role).prices) notFound()

  // Read from the catalogue rather than listed here. The shop's own prefixes
  // are what the service matches a new code against, and a hand kept copy would
  // be a list telling somebody a code is fine that the service then refuses.
  return <PartForm prefixes={await skuPrefixes()} onSave={add} />
}
