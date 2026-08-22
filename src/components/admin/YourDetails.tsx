import { PEOPLE, ROLE_NOTE } from "@/lib/admin/desk"
import { capabilities } from "@/lib/admin/roles"
import type { Desk } from "@/lib/admin/session"
import { SHOP } from "@/lib/format"
import { PageHead, Card, CardHeader, Pill, Table, Td } from "@/components/admin/parts"
import { SignOutButton } from "@/components/admin/SignOutButton"

/**
 * Your details.
 *
 * One screen for both consoles, because the answer to "who am I signed in as
 * and what does that let me do" is the same question at the counter and at the
 * trade desk. Read only: a role is granted from account administration, where
 * the change is audited against whoever made it, and a screen that let somebody
 * edit their own would be the hole that makes the whole role model decorative.
 *
 * It says out loud what the session actually is. A cookie that cannot be
 * revoked is worth being honest about on the screen where somebody would look
 * for a "sign out everywhere" button and not find one.
 */
export function YourDetails({ desk }: { desk: Desk }) {
  const allowed = capabilities(desk.role)
  const person = PEOPLE.find((candidate) => candidate.email === desk.email)

  const may = [
    { label: "The counter console", granted: allowed.console },
    { label: "Setting prices", granted: allowed.prices },
    { label: "People, and who gets in", granted: allowed.people },
    { label: "Trade rates on every figure", granted: desk.role === "TRADE" },
  ]

  return (
    <>
      <PageHead
        title="Your details"
        lead="Who you are signed in as, and what that lets you do. Granted at the counter, never claimed here."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="The account" hint="As the shop has it." />
          <dl className="divide-y divide-rule">
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="callout">Name</dt>
              <dd className="text-sm font-medium text-ink">{desk.name}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="callout">Email</dt>
              <dd className="min-w-0 truncate font-mono text-xs text-slate">{desk.email}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 py-3">
              <dt className="callout">Role</dt>
              <dd>
                <Pill>{desk.role}</Pill>
              </dd>
            </div>
            {person && (
              <div className="flex items-baseline justify-between gap-4 py-3">
                <dt className="callout">Post</dt>
                <dd className="text-sm text-slate">{person.post}</dd>
              </div>
            )}
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-slate">{ROLE_NOTE[desk.role]}</p>
        </Card>

        <Card>
          <CardHeader title="What this role may do" hint="Decided in one place, for every screen." />
          <Table>
            <tbody>
              {may.map((row) => (
                <tr key={row.label}>
                  <Td className="text-sm text-ink">{row.label}</Td>
                  <Td align="right">
                    {row.granted ? <Pill tone="waiting">Granted</Pill> : <Pill>No</Pill>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="This session"
          hint="What it is, and what it is not."
          action={
            <SignOutButton className="shrink-0 rounded-sm border border-ink px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink hover:text-paper" />
          }
        />
        <ul className="max-w-2xl space-y-3 text-sm leading-relaxed text-slate">
          <li>
            You are signed in on this browser by a cookie no script can read, carrying a signed
            payload, so a role cannot be edited in devtools.
          </li>
          <li>
            It is not revocable. Signing out here clears this browser, and there is no way yet to
            end a session somewhere else, which needs the backend&apos;s token table.
          </li>
          <li>
            Your name and role are read fresh on every request rather than copied into the cookie,
            so suspending an account takes effect on its next request.
          </li>
          <li>
            To change any of this, or if you have lost a device you were signed in on, call the
            counter on{" "}
            <a href={`tel:${SHOP.phoneIntl}`} className="font-mono text-ink hover:underline">
              {SHOP.phone}
            </a>
            .
          </li>
        </ul>
      </Card>
    </>
  )
}
