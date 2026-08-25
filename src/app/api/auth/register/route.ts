import { NextResponse } from "next/server"
import { check, tooMany } from "@/lib/rate-limit"
import { register } from "@/lib/admin/registration"

/**
 * `POST /api/auth/register`, the same body the backend takes.
 *
 * A handler of its own rather than the browser calling Quarkus directly: the
 * session cookie is SameSite=Lax on the backend's origin, so the call is made
 * server to server and the first party cookie is issued from here.
 */
export async function POST(request: Request) {
  // Before anything else, including reading the body: a flood is cheapest to
  // refuse before it costs anything.
  const knock = check(request, "register")
  if (!knock.ok) return tooMany(knock.retryAfter)

  let body: { email?: unknown; password?: unknown; displayName?: unknown; phone?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "That request was not readable." }, { status: 400 })
  }

  const email = typeof body.email === "string" ? body.email.trim() : ""
  const password = typeof body.password === "string" ? body.password : ""
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : ""
  const phone = typeof body.phone === "string" ? body.phone.trim() : undefined

  if (!email || !password || !displayName) {
    return NextResponse.json({ message: "Fill in your name, email and password." }, { status: 400 })
  }

  const outcome = await register({ email, password, displayName, phone })
  return NextResponse.json({ message: outcome.message }, { status: outcome.ok ? 201 : outcome.status })
}
