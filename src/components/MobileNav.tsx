"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { SHOP } from "@/lib/format"

/**
 * The navigation, on a phone.
 *
 * Most of this shop's traffic is mobile, so the menu is not a lesser version of
 * the desktop one: every destination in the header is here. It closes when a
 * link is followed and on Escape, which returns focus to the button it came
 * from.
 */
export function MobileNav({ items }: { items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <div className="md:hidden">
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close the menu" : "Open the menu"}
        className="rounded-sm p-2 text-slate transition-colors hover:bg-panel hover:text-ink"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3.5 7h17M3.5 12h17M3.5 17h17" />}
        </svg>
      </button>

      {open && (
        <div
          id="mobile-nav"
          className="absolute inset-x-0 top-full border-b border-rule bg-paper shadow-lg"
        >
          <nav className="shell flex flex-col py-2">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-rule py-3.5 text-base text-ink last:border-0"
              >
                {item.label}
              </Link>
            ))}
            {/* Every destination in the header is here, the door included. */}
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className="when-signed-out border-b border-rule py-3.5 text-base text-ink"
            >
              Sign in
            </Link>
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="when-signed-in border-b border-rule py-3.5 text-base text-ink"
            >
              Your account
            </Link>
            <a href={`tel:${SHOP.phoneIntl}`} className="py-3.5 font-mono text-base text-oxblood">
              {SHOP.phone}
            </a>
          </nav>
        </div>
      )}
    </div>
  )
}
