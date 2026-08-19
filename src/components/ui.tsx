import Link from "next/link"

type Variant = "primary" | "secondary" | "ghost" | "whatsapp"

const STYLES: Record<Variant, string> = {
  primary: "bg-oxblood text-white hover:bg-oxblood-deep",
  secondary: "border border-ink text-ink hover:bg-ink hover:text-paper",
  ghost: "text-slate hover:text-ink underline-offset-4 hover:underline",
  whatsapp: "bg-[#1f8f4e] text-white hover:bg-[#187a41]",
}

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-sm text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55"

const SIZES = { sm: "px-4 py-2", md: "px-6 py-3" }

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: keyof typeof SIZES
  href?: string
}

export function Button({ variant = "primary", size = "md", href, className = "", ...rest }: Props) {
  const classes = `${BASE} ${SIZES[size]} ${STYLES[variant]} ${className}`
  const padding = variant === "ghost" ? "" : SIZES[size]

  if (href) {
    const external = href.startsWith("http") || href.startsWith("tel:")
    const content = { className: `${BASE} ${padding} ${STYLES[variant]} ${className}`, children: rest.children }
    return external ? (
      <a href={href} rel={href.startsWith("http") ? "noopener noreferrer" : undefined} {...content} />
    ) : (
      <Link href={href} {...content} />
    )
  }
  return <button className={classes} {...rest} />
}

export function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.25-8.23a8.2 8.2 0 0 1 8.24 8.24c0 4.54-3.7 8.21-8.24 8.21Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.28Z" />
    </svg>
  )
}

export function Breadcrumbs({ trail }: { trail: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5">
      {trail.map((step, index) => (
        <span key={step.label} className="flex items-center gap-1.5">
          {index > 0 && <span className="callout" aria-hidden="true">/</span>}
          {step.href ? (
            <Link href={step.href} className="callout hover:text-ink">{step.label}</Link>
          ) : (
            <span className="callout text-ink">{step.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="border border-dashed border-rule px-6 py-14 text-center">
      <p className="font-display text-lg font-semibold tracking-tight">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate">{children}</div>}
    </div>
  )
}
