/**
 * What the console is told about the back office link.
 *
 * The sibling of `settings-service.ts`, and the same seam: with `ALLFIX_API_URL`
 * set it reads the console API server to server, and without it it says plainly
 * that there is nothing to read rather than drawing a panel of zeros. A zero
 * next to "events waiting" and "no service reachable" are different facts, and
 * only the first one means the queue is empty.
 *
 * Server only, by what it touches. It reads `process.env` and carries the
 * service token, and neither has any business in a browser bundle.
 */

const API = process.env.ALLFIX_API_URL ?? ""

const SERVICE_TOKEN = process.env.ALLFIX_SERVICE_TOKEN ?? ""

const asService = (): Record<string, string> =>
  SERVICE_TOKEN ? { "X-Allfix-Service": SERVICE_TOKEN } : {}

export interface OhalaEvent {
  id: number
  event: string
  subject: string
  state: string
  attempts: number
  lastError: string | null
  nextAttemptAt: string | null
  sentAt: string | null
  createdAt: string
}

export interface OhalaState {
  /** What is actually in use, which is not always what was asked for. */
  gateway: string
  /** The configured value, verbatim. The difference is how a typo is found. */
  asked: string
  /** Whether it could send if asked. Selected and not configured is the case worth showing. */
  ready: boolean
  lastSent: string | null
  counts: Record<string, number>
  failed: OhalaEvent[]
}

/**
 * `null` means nobody could be asked, which is not the same as a link that is
 * configured and idle. Every panel in this console makes that distinction and
 * this one has more reason to than most: "nothing is stuck" is exactly what a
 * broken read looks like.
 */
export async function readOhala(): Promise<OhalaState | null> {
  if (!API) return null

  try {
    const response = await fetch(`${API}/api/admin/ohala`, {
      cache: "no-store",
      headers: asService(),
    })
    if (!response.ok) return null
    return (await response.json()) as OhalaState
  } catch {
    return null
  }
}

export type RetryResult = { ok: true } | { ok: false; message: string }

export async function retryOhalaEvent(id: number): Promise<RetryResult> {
  if (!API) {
    return {
      ok: false,
      message:
        "No console service is reachable, so there is nothing to put back in the queue.",
    }
  }

  try {
    const response = await fetch(`${API}/api/admin/ohala/events/${id}/retry`, {
      method: "POST",
      cache: "no-store",
      headers: asService(),
    })
    if (response.status === 404) {
      return { ok: false, message: "That event is no longer in the outbox." }
    }
    if (!response.ok) {
      return { ok: false, message: "That could not be put back in the queue." }
    }
    return { ok: true }
  } catch {
    return {
      ok: false,
      message: "Could not reach the shop's own service just then. Try again in a moment.",
    }
  }
}
