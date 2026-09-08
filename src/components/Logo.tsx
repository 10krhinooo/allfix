import Image from "next/image"
import light from "../../public/brand/allfix-logo.png"
import dark from "../../public/brand/allfix-logo-dark.png"

/**
 * The official logo.
 *
 * The wordmark is oxblood, which reads on the plaster ground and all but
 * disappears on a deep one, so a variant with the red lifted ships alongside it
 * and `on="deep"` asks for it. The brass is untouched in both.
 *
 * There used to be a third case, a pair of images swapped in CSS by the theme,
 * because the ground could change under the same logo. There is one ground now,
 * so the caller knows which of the two it wants and says so, and nothing has to
 * be drawn twice and hidden once.
 *
 * Pass an empty alt when the logo sits inside an already labelled link, so the
 * name is not read out twice.
 *
 * Still a 240 by 98 raster. It is the only artwork the shop has, and it is too
 * small to trace into vector without inventing detail it does not contain, so
 * the vector logo stays what `PROJECT_PLAN.md` already calls it: something to
 * ask the client for, not something to draw here.
 */
export function Logo({
  height = 34,
  priority = false,
  alt = "AllFix By Kipekee",
  on = "paper",
}: {
  height?: number
  priority?: boolean
  alt?: string
  /** Which ground it is being drawn on. */
  on?: "paper" | "deep"
}) {
  const source = on === "deep" ? dark : light
  const width = Math.round((light.width / light.height) * height)

  return <Image src={source} alt={alt} width={width} height={height} priority={priority} />
}
