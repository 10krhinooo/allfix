import { NextResponse } from "next/server"
import { resetPassword } from "@/lib/admin/registration"

/** `POST /api/auth/reset`: the token from the emailed link, and the new password. */
export async function POST(request: Request) {
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
