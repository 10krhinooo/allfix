"use client"

import { useSyncExternalStore } from "react"

type Theme = "light" | "dark"

const STORAGE_KEY = "allfix-theme"

/**
 * The document element is the single source of truth for the theme: an inline
 * script sets it before the first paint, and this control reads it rather than
 * keeping a second copy in React state. Subscribing to the attribute keeps the
 * icon correct even if something else changes the theme.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributeFilter: ["data-theme"] })
  return () => observer.disconnect()
}

function read(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light"
}

/** Light on the server, matching the default the stylesheet ships with. */
function readOnServer(): Theme {
  return "light"
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, read, readOnServer)
  const next: Theme = theme === "dark" ? "light" : "dark"

  function choose() {
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Private browsing can refuse storage. The choice still holds for this visit.
    }
  }

  return (
    <button
      type="button"
      onClick={choose}
      className="rounded-sm p-2 text-slate transition-colors hover:bg-panel hover:text-ink"
      aria-label={`Switch to the ${next} theme`}
      title={`Switch to the ${next} theme`}
    >
      {theme === "dark" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.6M12 18.9v2.6M4.2 4.2l1.9 1.9M17.9 17.9l1.9 1.9M2.5 12h2.6M18.9 12h2.6M4.2 19.8l1.9-1.9M17.9 6.1l1.9-1.9" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M20.5 14.4A8.6 8.6 0 1 1 9.6 3.5a7 7 0 0 0 10.9 10.9Z" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}
