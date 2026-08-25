import { NextResponse } from "next/server"
import { check, tooMany } from "@/lib/rate-limit"
import { resetPassword } from "@/lib/admin/registration"

/** `POST /api/auth/reset`: the token from the emailed link, and the new password. */
export async function POST(request: Request) {
  // Before anything else, including reading the body: a flood is cheapest to
  // refuse before it costs anything.
  const knock = check(request, "reset")
  if (!knock.ok) return tooMany(knock.retryAfter)

  let body: { token?: unknown; password?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "That request was not readable." }, { status: 400 })
  }

  const token = typeof body.token === "string" ? body.token : ""
  const password = typeof body.password === "string" ? body.password : ""
  if (!token || !password) {
    return NextResponse.json({ message: "That reset link is incomplete." }, { status: 400 })
  }

  const outcome = await resetPassword(token, password)
  return NextResponse.json({ message: outcome.message }, { status: outcome.ok ? 200 : outcome.status })
}
