import { redirect } from "next/navigation"
import { readDesk } from "@/lib/admin/guard"
import { landing } from "@/lib/admin/roles"
import { ordersFor, railsFor, isOpen } from "@/lib/account"
import { AccountShell } from "@/components/account/AccountShell"

/**
 * The shopper's chrome, outside `(shop)` for the same reason the trade desk is.
 *
 * A desk under a shopfront header is two navigations stacked and neither of
 * them is in charge. The way back to the catalogue is at the foot of the rail,
 * where the trade desk already puts it.
 *
 * Read here as well as in the proxy, per the rule in CLAUDE.md: the proxy is
 * for the redirect and the server check is the authoritative one. Reading the
 * cookie also makes this subtree dynamic, which a per visitor desk should be.
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const desk = await readDesk()
  if (!desk) redirect("/sign-in?next=%2Faccount")

  // Staff and trade each have a desk of their own. Landing them on this one
  // would be a third place to keep in step with the other two.
  if (desk.role !== "CUSTOMER") redirect(landing(desk.role))

  const orders = ordersFor(desk.email)

  return (
    <AccountShell
      name={desk.name}
      role={desk.role}
      open={orders.filter(isOpen).length}
      saved={railsFor(desk.email).length}
    >
      {children}
    </AccountShell>
  )
}
