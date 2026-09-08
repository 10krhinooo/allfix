import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PEOPLE, ROLE_NOTE } from "@/lib/admin/desk"
import { fromSeeded, readAccounts, readTiers } from "@/lib/admin/people-service"
import { grant, suspend, tier } from "@/app/admin/people/actions"
import { People } from "@/components/admin/People"
import { readDesk } from "@/lib/admin/guard"
import { capabilities } from "@/lib/admin/roles"
import { PageHead, Stats, Card, Note } from "@/components/admin/parts"

export const metadata: Metadata = { title: "People" }

/**
 * Who gets in, and as what.
 *
 * This was a poster, and it said so: it listed the roster and explained that
 * granting a role happened somewhere else. Somewhere else did not exist. No
 * endpoint set a role or a tier, so the only way to make somebody a trade
 * customer was a SQL update against production, while the strip above every
 * page advertised a trade account and the application handed off to WhatsApp.
 *
 * It grants now. Every rule stays the service's, including the ones that stop
 * somebody locking the shop out of its own back office, and every refusal is
 * shown in the service's own words rather than reworded here.
 */
export const dynamic = "force-dynamic"

export default async function PeoplePage() {
  // Admin only, checked here as well as in the proxy and again at the top of
  // each action. `notFound` rather than a redirect: somebody who guesses the
  // URL should not learn the screen exists.
  const desk = await readDesk()
  if (!desk || !capabilities(desk.role).people) notFound()

  const [accounts, tiers] = await Promise.all([readAccounts(), readTiers()])
  const live = accounts !== null
  const roster = accounts ?? fromSeeded(PEOPLE)
  const roles = ["ADMIN", "STAFF", "TRADE", "CUSTOMER"] as const

  return (
    <>
      <PageHead
        title="People"
        lead="Roles are granted, never claimed. Every account starts as a customer, and staff, trade and admin are given by somebody who already has them."
      >
        {!live && (
          // The distinction that matters on this screen: a roster nobody could
          // ask for is not a roster of nobody, and every control on it would be
          // a button that silently does nothing.
          <Note tone="warn">
            No account service is reachable, so this is the seeded roster and nothing on it can
            be changed.
          </Note>
        )}
      </PageHead>

      <Stats>
        {roles.map((role) => (
          <Card key={role}>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-mute">{role}</p>
            <p className="mt-2 font-mono text-2xl leading-none text-ink">
              {roster.filter((one) => one.roles.includes(role) && one.status !== "SUSPENDED").length}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate">{ROLE_NOTE[role]}</p>
          </Card>
        ))}
      </Stats>

      <div className="mt-6">
        <People
          accounts={roster}
          tiers={tiers ?? []}
          live={live}
          onGrant={grant}
          onTier={tier}
          onSuspend={suspend}
        />
      </div>
    </>
  )
}
