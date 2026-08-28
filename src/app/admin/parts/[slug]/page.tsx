import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PartScreen } from "@/components/admin/PartScreen"
import { readDesk } from "@/lib/admin/guard"
import { capabilities } from "@/lib/admin/roles"
import { getProduct } from "@/lib/catalogue"
import { readPart } from "@/lib/admin/catalogue-api"
import { skuPrefixes } from "@/lib/admin/rows"
import { remove, restore, retire, save } from "@/app/admin/parts/actions"

export const metadata: Metadata = { title: "A part" }

/**
 * Dynamic, because this is where a part is corrected and the next thing
 * somebody does is look at what they corrected.
 */
export const dynamic = "force-dynamic"

export default async function PartPage({ params }: { params: Promise<{ slug: string }> }) {
  const desk = await readDesk()
  if (!desk || !capabilities(desk.role).prices) notFound()

  const { slug } = await params

  // The console's own read, not the shop's. The shop hides a retired part,
  // which is what retiring means, and this is the screen that can put one back.
  // Falls back to the catalogue where there is no service, so the screen still
  // shows the part it is about rather than a 404.
  const held = await readPart(slug)
  const product = held ?? (await getProduct(slug))
  if (!product) notFound()

  return (
    <PartScreen
      part={{
        slug: product.slug,
        sku: product.sku ?? undefined,
        name: product.name,
        summary: product.summary ?? undefined,
        description: product.description ?? undefined,
        imageName: product.imageName ?? undefined,
        retiredAt: held?.retiredAt ?? null,
      }}
      prefixes={await skuPrefixes()}
      owner={capabilities(desk.role).settings}
      onSave={save}
      onRetire={retire}
      onRestore={restore}
      onRemove={remove}
    />
  )
}
