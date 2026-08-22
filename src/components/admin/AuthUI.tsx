"use client"

import Link from "next/link"
import { useId, useState, type InputHTMLAttributes } from "react"
import { Logo } from "@/components/Logo"

/**
 * The door's own small vocabulary.
 *
 * Separate from both the storefront's primitives and the console's, because a
 * door is neither: it is not selling anything and it is not a worksheet. It is
 * one card on a dark stage, and everything in it is sized to be read at arm's
 * length by somebody who is already slightly annoyed at being asked to sign in.
 */

export function AuthCard({
  title,
  intro,
  children,
}: {
  title: string
  intro: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      data-field
      className="rounded-2xl bg-paper p-7 shadow-[0_40px_90px_-25px_rgb(0_0_0/0.7)] sm:p-9"
    >
      {/* The mark is the way out. Somebody who landed here on an old bookmark
          wants the shop rather than a login, and the logo is the control they
          will try first anyway. */}
      <Link
        href="/"
        title="Back to the shop"
        className="inline-block rounded-sm transition-opacity hover:opacity-70"
      >
        <Logo height={40} alt="AllFix By Kipekee, back to the shop" />
      </Link>

      <div className="mt-7">
        <h1 className="font-display text-xl font-bold tracking-tight text-ink">{title}</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate">{intro}</p>
      </div>

      {children}
    </div>
  )
}

const field = (error?: boolean) =>
  `w-full rounded-xl border bg-panel px-4 py-3 text-sm text-ink outline-none transition-colors ` +
  `placeholder:text-mute focus:bg-paper disabled:opacity-60 ` +
  (error ? "border-oxblood" : "border-rule focus:border-ink")

export function AuthField({
  label,
  hint,
  error,
  ...input
}: {
  label: string
  hint?: React.ReactNode
  error?: string
} & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  return (
    <label htmlFor={id} data-field className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-ink">{label}</span>
        {hint && <span className="text-[11px] text-mute">{hint}</span>}
      </span>
      <input
        {...input}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={field(Boolean(error))}
      />
      {error && (
        <span id={`${id}-error`} role="alert" className="text-xs text-oxblood">
          {error}
        </span>
      )}
    </label>
  )
}

/**
 * A password field that can be read back.
 *
 * Typing a long password blind on a phone keyboard is how people end up
 * choosing short ones, so the toggle is worth more to real password strength
 * than any rule about punctuation. It reads as hidden whenever the field is
 * disabled, so a form left mid submit does not sit there with a password on
 * screen.
 */
export function PasswordField({
  label,
  hint,
  error,
  ...input
}: {
  label: string
  hint?: React.ReactNode
  error?: string
} & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId()
  const [visible, setVisible] = useState(false)

  // Derived rather than reset by an effect, so a form left mid submit cannot
  // sit there with a password on screen even for the render it would take an
  // effect to notice.
  const showing = visible && !input.disabled

  return (
    <div data-field className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium text-ink">{label}</span>
        {hint && <span className="text-[11px] text-mute">{hint}</span>}
      </label>

      <div className="relative">
        <input
          {...input}
          id={id}
          type={showing ? "text" : "password"}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${field(Boolean(error))} pr-16`}
        />
        <button
          type="button"
          onClick={() => setVisible((was) => !was)}
          disabled={input.disabled}
          className="absolute inset-y-0 right-0 px-4 text-[11px] font-medium uppercase tracking-[0.14em] text-mute transition-colors hover:text-ink disabled:opacity-0"
        >
          {showing ? "Hide" : "Show"}
        </button>
      </div>

      {error && (
        <span id={`${id}-error`} role="alert" className="text-xs text-oxblood">
          {error}
        </span>
      )}
    </div>
  )
}

export function AuthSubmit({
  busy,
  busyLabel,
  children,
}: {
  busy: boolean
  busyLabel: string
  children: React.ReactNode
}) {
  return (
    <button
      type="submit"
      disabled={busy}
      data-field
      className="mt-2 w-full rounded-xl bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep disabled:cursor-not-allowed disabled:opacity-55"
    >
      {busy ? busyLabel : children}
    </button>
  )
}

/**
 * What went wrong, said once.
 *
 * `role="alert"` rather than a paragraph, because the failure that matters here
 * arrives without the page moving: somebody who cannot see the form needs to be
 * told the door refused them, not left waiting on a button that came back.
 */
export function Notice({
  tone = "bad",
  children,
}: {
  tone?: "bad" | "quiet"
  children: React.ReactNode
}) {
  const skin =
    tone === "bad"
      ? "border-oxblood bg-oxblood/5 text-ink"
      : "border-brass bg-brass-soft text-ink"

  return (
    <p role="alert" className={`rounded-lg border-l-2 px-3 py-2 text-sm leading-relaxed ${skin}`}>
      {children}
    </p>
  )
}

export function AuthFooter({ children }: { children: React.ReactNode }) {
  return (
    <p data-field className="mt-6 border-t border-rule pt-5 text-xs leading-relaxed text-slate">
      {children}
    </p>
  )
}
