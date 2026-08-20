import { deskRows } from "@/lib/admin/rows"
import { Counter } from "@/components/admin/Counter"

/**
 * The catalogue is read on the server and handed down as a compact projection,
 * the same arrangement `/shop` uses: the 200 KB of specs and copy has no
 * business in a console bundle, and the counter only ever asks four things of a
 * part, what it is, what it costs, what it fits and whether it has been
 * photographed.
 */
export default function CounterPage() {
  return <Counter rows={deskRows()} />
}
