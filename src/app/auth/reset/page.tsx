import type { Metadata } from "next"
import { Sheet } from "@/components/auth/Sheet"
import { ResetForm } from "@/components/auth/ResetForm"

export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
}

/**
 * The token arrives on the query string because that is where an emailed link
 * can put it. It is read on the server and handed down as a prop rather than
 * being pulled out of `location` in the browser, so it is never logged by
 * anything watching client navigation.
 */
export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>
}) {
  const { token } = await searchParams
  const one = Array.isArray(token) ? token[0] : token

  return (
    <Sheet
      label="New password"
      stageLine="Every rail system we stock, and the fittings that match them."
      title="Set a new password."
      lead="Pick something you will remember. Length beats punctuation."
    >
      <ResetForm token={one ?? ""} />
    </Sheet>
  )
}
