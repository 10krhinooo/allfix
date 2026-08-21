import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PEOPLE, ROLE_NOTE } from "@/lib/admin/desk"
import { readDesk } from "@/lib/admin/guard"
import { capabilities } from "@/lib/admin/roles"
import { PageHead, Figures, Note, Section } from "@/components/admin/parts"

export const metadata: Metadata = { title: "People" }

/**
 * Who gets in, and as what.
 *
 * A server component, because none of it is editable yet and pretending
 * otherwise would be worse than leaving it read only: granting a role is the
 * one action on this screen that must never be a prototype. The backend already
 * enforces that registration cannot set a role, that trade, staff and admin are
 * granted rather than claimed, and that suspending an account ends its sessions
 * at once. None of that can be demonstrated from a browser holding its own
 * state, so this screen shows the model and says plainly that it is reading.
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
        <Note>
          Read only. Granting a role is the one thing on this console that will not be
          prototyped: it waits for the real backend.
        </Note>
      </PageHead>

      <Figures>
        {roles.map((role) => (
          <div key={role} className="px-5 py-5 sm:px-6">
            <span className="callout">{role}</span>
            <p className="mt-2 text-sm leading-relaxed text-slate">{ROLE_NOTE[role]}</p>
            <p className="mt-2 font-mono text-xs text-mute">
              {PEOPLE.filter((person) => person.role === role && person.active).length} active
            </p>
          </div>
        ))}
      </Figures>

      <ul className="bg-paper">
        {PEOPLE.map((person) => (
          <li
            key={person.email}
            className={`flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-rule px-5 py-3.5 sm:px-8 ${
              person.active ? "" : "opacity-55"
            }`}
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium text-ink">{person.name}</span>
              <span className="mt-0.5 flex flex-wrap items-baseline gap-x-3">
                <span className="font-mono text-[11px] text-mute">{person.email}</span>
                <span className="text-xs text-slate">{person.post}</span>
              </span>
            </span>
            <span className="flex items-baseline gap-4">
              {!person.active && <span className="text-xs text-oxblood">suspended</span>}
              <span className="callout">{person.role}</span>
            </span>
          </li>
        ))}
      </ul>

      <Section title="What the backend already enforces">
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
