import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { readDesk } from "@/lib/admin/guard"
import { landing } from "@/lib/admin/roles"
import { Sheet } from "@/components/auth/Sheet"
import { RegisterForm } from "@/components/auth/RegisterForm"

export const metadata: Metadata = {
  title: "Open an account",
  description:
    "Open an AllFix account to keep your delivery addresses, the windows you have measured and everything you have bought.",
}

export default async function RegisterPage() {
  // Already signed in. Offering the form would be a way of quietly losing the
  // session somebody is holding.
  const desk = await readDesk()
  if (desk) redirect(landing(desk.role))

  return (
    <Sheet
      label="Open an account"
      stageLine="Measured, sewn, and hung by the people who sold it to you."
      title="An account with the shop."
      lead="Keep your delivery addresses, the windows you have measured, and everything you have bought, in one place."
    >
      <RegisterForm />
    </Sheet>
  )
}
