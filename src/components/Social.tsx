import type { SocialKind } from "@/lib/settings"
import { SOCIAL_LABEL } from "@/lib/settings"

/**
 * The shop's social accounts, where it has any.
 *
 * Drawn as marks in the same stroke weight as the rest of the site's drawings
 * rather than pasted in as brand assets, so the row reads as part of the footer
 * and not as six logos somebody dropped on it.
 *
 * Nothing is hardcoded. The links come from the settings seam, which is the
 * console's to change, and where there are none this renders nothing at all: a
 * row of icons pointing at accounts that do not exist is worse than no row.
 */

const MARKS: Record<SocialKind, React.ReactNode> = {
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  facebook: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M15 8h-1.5A2 2 0 0011.5 10v10M9.5 13h5" />
    </>
  ),
  tiktok: (
    <>
      <path d="M14 4v10.5a3.5 3.5 0 11-3.5-3.5" />
      <path d="M14 4c.4 2.3 2 3.8 4.5 4" />
    </>
  ),
  x: (
    <>
      <path d="M4.5 4.5l15 15M19.5 4.5l-15 15" />
    </>
  ),
  linkedin: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M8 10.5V16M8 7.6v.1M12 16v-3.2a1.8 1.8 0 013.6 0V16" />
    </>
  ),
  youtube: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="3.5" />
      <path d="M10.5 9.5l4.5 2.5-4.5 2.5z" />
    </>
  ),
}

export function SocialMark({ kind }: { kind: SocialKind }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {MARKS[kind]}
    </svg>
  )
}

export function SocialRow({
  links,
  className = "",
}: {
  links: Partial<Record<SocialKind, string>>
  className?: string
}) {
  const found = (Object.keys(MARKS) as SocialKind[]).filter((kind) => links[kind])
  if (found.length === 0) return null

  return (
    <ul className={`flex flex-wrap items-center gap-4 ${className}`}>
      {found.map((kind) => (
        <li key={kind}>
          <a
            href={links[kind]}
            target="_blank"
            rel="noopener noreferrer me"
            className="block text-slate transition-colors hover:text-ink"
          >
            <SocialMark kind={kind} />
            <span className="sr-only">{SOCIAL_LABEL[kind]}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}
