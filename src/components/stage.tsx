import Image from "next/image"

/**
 * The showroom after dark, and the two seams that join it to the workshop.
 *
 * A stage is wherever the shop shows a part off rather than describes one: the
 * hero, the motorised band, every photograph. The rest of the site is the wall.
 * `seam` says which curtain the page passes through on the way in and out, so a
 * page changes room at a rail or a hem rather than at a hard colour cut.
 */
export function Stage({
  as: Tag = "section",
  seam = "none",
  className = "",
  children,
  ...rest
}: {
  as?: "section" | "div" | "aside"
  seam?: "none" | "rail" | "hem" | "both"
  className?: string
  children: React.ReactNode
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <>
      {(seam === "rail" || seam === "both") && <RailSeam />}
      <Tag className={`stage ${className}`} {...rest}>
        {children}
      </Tag>
      {(seam === "hem" || seam === "both") && <Hem />}
    </>
  )
}

export function RailSeam() {
  return <div className="rail-seam" aria-hidden="true" />
}

export function Hem() {
  return <div className="hem" aria-hidden="true" />
}

/**
 * Where a photograph sits, and the one place the catalogue decides how.
 *
 * Every photograph used to bring its own well: `bg-shot` on the card, on the
 * shop tile, on the product page, each with its own idea of contain or cover.
 * On a stage the well is the room itself and the photograph is blended into it
 * (see `.frame` in globals.css), so the decision lives here once.
 *
 * `src` is null for a part nobody has photographed yet, and that draws the
 * drafting tile rather than a broken image: the part is real, the shot is not
 * taken, and the paper says so. `children` are laid over the frame, for the
 * badges a card pins to a corner.
 */
export function PhotoFrame({
  src,
  alt,
  sizes,
  fit = "contain",
  priority = false,
  className = "",
  imageClassName = "",
  children,
}: {
  src: string | null
  alt: string
  sizes: string
  fit?: "contain" | "cover"
  priority?: boolean
  className?: string
  imageClassName?: string
  children?: React.ReactNode
}) {
  if (!src) {
    return (
      <div className={`relative drafting flex items-center justify-center bg-panel ${className}`}>
        <span className="callout px-3 text-center">Photograph to come</span>
        {children}
      </div>
    )
  }

  return (
    <div className={`frame ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`${fit === "cover" ? "object-cover" : "object-contain"} ${imageClassName}`}
      />
      {children}
    </div>
  )
}
