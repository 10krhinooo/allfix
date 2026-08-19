import Link from "next/link"
import Image from "next/image"
import { priceOrAsk } from "@/lib/format"
import type { ShopItem } from "@/lib/shop"

/**
 * A richer product card than the plain grid tile: a taller image, a badge for
 * the part's state, colour swatches where a part has finishes, and a price row
 * that carries an action. The structure follows the sister site's card, drawn
 * in AllFix's flat drafting palette rather than its soft rounded one, so the
 * grid gains the same density without the shop looking like a different brand.
 */
export function ShopCard({ item }: { item: ShopItem }) {
  const money = item.buyable ? priceOrAsk(item.priceKes, item.priceBasis) : null

  return (
    <article className="group relative flex flex-col overflow-hidden border border-rule bg-paper transition-shadow duration-300 hover:shadow-[0_16px_36px_-24px_rgba(22,21,26,0.5)]">
      <Link
        href={`/product/${item.slug}`}
        aria-label={item.name}
        className="relative block aspect-square overflow-hidden bg-black"
      >
        {item.image ? (
          // The square master fills the square tile exactly, so a black-field
          // shot becomes a black tile and a warmed white-field one a soft tile,
          // with no card colour showing through and nothing letterboxed.
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="drafting flex h-full items-center justify-center bg-panel">
            <span className="callout px-3 text-center">Photograph to come</span>
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {/* No "in stock" badge: stock is not tracked yet, so it would be a
              claim the shop cannot stand behind. The unpriced state is the one
              worth flagging, since the card's action changes because of it. */}
          {!item.buyable && <Badge tone="ask">Ask for a price</Badge>}
          {item.family === "rod" && item.diameter ? (
            <Badge tone="mute">{item.diameter}mm</Badge>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="callout">{item.componentLabel}</p>
        <h3 className="mt-1.5 font-display text-[15px] leading-snug font-semibold tracking-tight text-ink">
          {/* The heading link stretches an overlay across the whole card, so the
              image link above and this one act as one target. */}
          <Link href={`/product/${item.slug}`} className="after:absolute after:inset-0 after:content-['']">
            {item.name}
          </Link>
        </h3>

        {item.swatches.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5">
            {item.swatches.slice(0, 6).map((s) => (
              <span
                key={s.label}
                title={s.label}
                className="h-4 w-4 rounded-full border border-black/15"
                style={{ background: s.swatch }}
              />
            ))}
            {item.swatches.length > 6 && (
              <span className="text-[11px] text-mute">+{item.swatches.length - 6}</span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            {money ? (
              <span className="font-mono text-base font-medium text-ink">{money}</span>
            ) : (
              <span className="text-sm text-slate">{item.priceNote ?? "Price on request"}</span>
            )}
            {item.variantCount > 1 && (
              <span className="mt-1 block text-[11px] text-mute">
                {item.variantCount} {item.variantAxis?.toLowerCase() ?? "option"} choices
              </span>
            )}
          </div>

          {/* Sits above the card overlay so it reads as its own affordance, even
              though the whole card is the link. */}
          <span
            className={`relative z-10 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors ${
              item.buyable
                ? "bg-oxblood text-white group-hover:bg-oxblood-deep"
                : "border border-rule text-slate group-hover:border-ink group-hover:text-ink"
            }`}
          >
            {item.buyable ? "View" : "Enquire"}
          </span>
        </div>
      </div>
    </article>
  )
}

type Tone = "ask" | "mute"

function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const tones: Record<Tone, string> = {
    ask: "bg-ink/85 text-paper",
    mute: "bg-paper/85 text-ink border border-rule",
  }
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] backdrop-blur ${tones[tone]}`}
    >
      {children}
    </span>
  )
}
