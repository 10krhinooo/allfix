import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PartScreen } from "@/components/admin/PartScreen"
import { readDesk, readHeld } from "@/lib/admin/guard"
import { capabilities } from "@/lib/admin/roles"
import { getProduct } from "@/lib/catalogue"
import { readPart, readPriceHistory, readStockHistory } from "@/lib/admin/catalogue-api"
import { PriceHistory, StockHistory } from "@/components/admin/PartHistory"
import { skuPrefixes } from "@/lib/admin/rows"
import { currentPrice } from "@/lib/admin/pricing"
import { price, remove, restore, retire, save } from "@/app/admin/parts/actions"

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

  /*
   * Both histories, read as the person looking at them.
   *
   * Fetched together rather than one after the other: neither depends on the
   * other and this screen is opened to answer a question, so the round trips go
   * side by side. Both come back null where nobody could be asked, which the
   * panels say rather than drawing an empty table.
   */
  const session = (await readHeld())?.svc
  const [prices, movements] = await Promise.all([
    readPriceHistory(slug, session),
    readStockHistory(slug, session),
  ])

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
      price={currentPrice(product)}
      prefixes={await skuPrefixes()}
      owner={capabilities(desk.role).settings}
      onSave={save}
      onPrice={price}
      onRetire={retire}
      onRestore={restore}
      onRemove={remove}
    >
      {/* Below the form, because they are the evidence for what it just did.
          Passed as children so the screen keeps deciding its own layout and this
          page keeps deciding what to read. */}
      <div className="mt-10 space-y-6">
        <PriceHistory moments={prices} />
        <StockHistory moments={movements} />
      </div>
    </PartScreen>
  )
}
