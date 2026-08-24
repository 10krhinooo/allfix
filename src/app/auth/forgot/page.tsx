import type { Metadata } from "next"
import { Sheet } from "@/components/auth/Sheet"
import { ForgotForm } from "@/components/auth/ForgotForm"

export const metadata: Metadata = {
  title: "Forgotten password",
  robots: { index: false, follow: false },
}

export default function ForgotPage() {
  return (
    <Sheet
      label="Forgotten password"
      stageLine="Njugu Lane, and a counter with real people behind it."
      title="Let us send you a link."
      lead="Tell us the address on your account and we will email a link to set a new password."
    >
      <ForgotForm />
    </Sheet>
  )
}
