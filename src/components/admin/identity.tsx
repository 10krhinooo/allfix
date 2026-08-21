"use client"

import { createContext, useContext } from "react"
import type { Desk } from "@/lib/admin/session"

/**
 * The verified identity, made available to the screens inside the shell.
 *
 * Context rather than props because `{children}` are the pages the layout
 * renders, not components the shell constructs, so there is nothing to drill
 * through. Only the plain fields cross the boundary: never the cookie, which is
 * HttpOnly precisely so it does not travel in a payload the browser can read.
 *
 * `useDesk` throws outside the provider rather than returning null, so a console
 * screen cannot quietly render an unattributed price change.
 */

const DeskContext = createContext<Desk | null>(null)

export function DeskProvider({ desk, children }: { desk: Desk; children: React.ReactNode }) {
  return <DeskContext.Provider value={desk}>{children}</DeskContext.Provider>
}

export function useDesk(): Desk {
  const desk = useContext(DeskContext)
  if (!desk) throw new Error("useDesk was called outside the console shell")
  return desk
}
