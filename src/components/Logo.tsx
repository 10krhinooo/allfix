import Image from "next/image"
import light from "../../public/brand/allfix-logo.png"
import dark from "../../public/brand/allfix-logo-dark.png"

/**
 * The official logo, in both themes.
 *
 * The wordmark is oxblood, which all but disappears on the dark ground, so a
 * variant with the red lifted ships alongside it. The brass is untouched in
 * both. Swapping is done in CSS rather than in React so the correct one is
 * right on the very first paint.
 *
 * Both variants carry the same alt, because only one is ever displayed and a
 * `display: none` image is not announced. Pass an empty alt when the logo sits
 * inside an already labelled link, so the name is not read out twice.
 *
 * `on="dark"` pins it to the lifted variant for ground that is dark whatever the
 * theme says. The auth stage is the case: it is the shop's black house and stays
 * black in light mode, so the theme-driven swap would put the oxblood wordmark
 * on black and lose it.
 */
export function Logo({
  height = 34,
  priority = false,
  alt = "AllFix By Kipekee",
  on = "theme",
}: {
  height?: number
  priority?: boolean
  alt?: string
  /** "theme" swaps with `data-theme`; "dark" is for permanently dark ground. */
  on?: "theme" | "dark"
}) {
  const width = Math.round((light.width / light.height) * height)

  if (on === "dark") {
    return (
      <Image src={dark} alt={alt} width={width} height={height} priority={priority} />
    )
  }

  return (
    <>
      <Image
        src={light}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className="logo-light"
      />
      <Image
        src={dark}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        className="logo-dark"
      />
    </>
  )
}
