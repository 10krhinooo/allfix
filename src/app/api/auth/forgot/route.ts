import { NextResponse } from "next/server"
import { check, tooMany } from "@/lib/rate-limit"
import { requestReset } from "@/lib/admin/registration"

/**
 * `POST /api/auth/forgot`.
 *
 * The answer is identical whether or not the address is registered, and it is
 * identical whether or not there is a backend behind this. Both matter: the
 * first stops the form being used to ask who shops here, and the second stops
 * a demo build leaking that it is a demo build by answering differently.
 */
export async function POST(request: Request) {
  // Before anything else, including reading the body: a flood is cheapest to
  // refuse before it costs anything.
  const knock = check(request, "forgot")
  if (!knock.ok) return tooMany(knock.retryAfter)

  let body: { email?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "That request was not readable." }, { status: 400 })
  }

  const email = typeof body.email === "string" ? body.email.trim() : ""
  if (!email) {
    return NextResponse.json({ message: "Enter your email address." }, { status: 400 })
  }

  const outcome = await requestReset(email)
  return NextResponse.json({ message: outcome.message }, { status: outcome.ok ? 202 : outcome.status })
}
