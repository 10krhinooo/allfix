import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PEOPLE, ROLE_NOTE } from "@/lib/admin/desk"
import { readDesk } from "@/lib/admin/guard"
import { capabilities } from "@/lib/admin/roles"
import { PageHead, Stats, Card, CardHeader, Pill, Note, Section, Table, Th, Td } from "@/components/admin/parts"

export const metadata: Metadata = { title: "People" }

/**
 * Who gets in, and as what.
 *
 * A server component, and read only. Granting a role is an audited write against
 * an account, so it belongs in account administration rather than on a screen
 * whose job is to answer "who has access, and as what". Registration cannot set
 * a role, trade, staff and admin are granted rather than claimed, and suspending
 * an account ends its sessions at once; this screen shows the result of all
 * three.
 */
export default async function PeoplePage() {
  // Admin only, checked here as well as in the proxy. `notFound` rather than a
  // redirect: somebody who guesses the URL should not learn the screen exists.
  const desk = await readDesk()
  if (!desk || !capabilities(desk.role).people) notFound()

  const roles = ["ADMIN", "STAFF", "TRADE", "CUSTOMER"] as const

  return (
    <>
      <PageHead
        title="People"
        lead="Roles are granted, never claimed. Every account starts as a customer, and staff, trade and admin are given by somebody who already has them."
      >
        {/* This used to name "account administration", which is not a screen
            that exists and is not linked from anywhere. Naming a place nobody
            can go is worse than saying plainly that the door is elsewhere. */}
        <Note>
          Read only here. Granting or withdrawing a role is done on the service rather than on
          this screen, so the change is audited against whoever made it.
        </Note>
      </PageHead>

      <Stats>
        {roles.map((role) => (
          <Card key={role}>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-mute">{role}</p>
            <p className="mt-2 font-mono text-2xl leading-none text-ink">
              {PEOPLE.filter((person) => person.role === role && person.active).length}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate">{ROLE_NOTE[role]}</p>
          </Card>
        ))}
      </Stats>

      <Card className="mb-4">
        <CardHeader title="Everybody with an account" hint="Suspended accounts stay listed." />
        <Table>
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Post</Th>
              <Th align="right">Role</Th>
            </tr>
          </thead>
          <tbody>
            {PEOPLE.map((person) => (
              <tr key={person.email} className={person.active ? "" : "opacity-55"}>
                <Td>
                  <span className="block text-sm font-medium text-ink">{person.name}</span>
                  <span className="mt-0.5 block font-mono text-[11px] text-mute">
                    {person.email}
                  </span>
                </Td>
                <Td className="text-xs text-slate">{person.post}</Td>
                <Td align="right">
                  <span className="inline-flex items-center gap-2">
                    {!person.active && <Pill tone="todo">Suspended</Pill>}
                    <Pill>{person.role}</Pill>
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Section title="What the shop enforces">
        <ul className="max-w-2xl space-y-3 text-sm leading-relaxed text-slate">
          <li>
            A wrong password and an address nobody has registered give the same answer, byte for
            byte, so this list cannot be read a name at a time by guessing.
          </li>
          <li>
            Sessions are revocable rows rather than self-contained tokens, so suspending somebody
            takes effect on their next request, not whenever a token happens to expire.
          </li>
          <li>
            A password reset ends every other session that account holds, because a reset is what
            somebody does when they think they have been compromised.
          </li>
          <li>Passwords are stored only as a BCrypt hash, and session tokens only as a SHA-256.</li>
        </ul>
      </Section>
    </>
  )
}
