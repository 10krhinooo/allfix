import { Card, CardHeader, EmptyState, Figure, Figures, PageHead, Pill } from "@/components/admin/parts"
import type { Integration, Job, Platform as PlatformState, Severity, SystemErrorEntry } from "@/lib/admin/reports-service"

/**
 * Whether the shop is working, as opposed to how it is doing.
 *
 * Every fault on this screen is one that is otherwise silent, which is the
 * whole reason it exists. An unconfigured M-Pesa refuses a payment politely and
 * looks like a customer changing their mind. An unset service token leaves the
 * storefront quietly serving a catalogue from a committed file, which looks
 * exactly like a catalogue that loaded. A scheduled job that has failed every
 * morning for a week says nothing at all, because the only place it ever said
 * anything was a container log nobody at a counter can read.
 *
 * Admin only. It names which configuration values a deployment is missing,
 * which is not something whoever is covering the counter on a Saturday should
 * be reading off a screen.
 */

const SEVERITY_ORDER: Severity[] = ["CRITICAL", "ERROR", "WARNING"]

const SEVERITY_TONE: Record<Severity, "todo" | "waiting"> = {
  CRITICAL: "todo",
  ERROR: "todo",
  WARNING: "waiting",
}

/** Days, hours, minutes. A number that keeps resetting means something is restarting it. */
function since(seconds: number): string {
  const days = Math.floor(seconds / 86_400)
  const hours = Math.floor((seconds % 86_400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function when(at: string | null): string {
  if (!at) return "Never"
  return new Date(at).toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * The alert this console did not have.
 *
 * `Note` is `max-w-xs` at eleven pixels, which is right for an aside beside a
 * field and wrong for the two sentences on this screen that matter most. These
 * are read across the whole width, carry `role="alert"` so a screen reader
 * announces them on arrival, and say what is happening rather than that
 * something went wrong.
 */
function Alarm({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="border-l-2 border-oxblood bg-oxblood/5 px-4 py-3.5 text-sm leading-relaxed text-ink"
    >
      {children}
    </div>
  )
}

export function Platform({ state }: { state: PlatformState | null }) {
  if (state === null) {
    return (
      <>
        <PageHead title="The platform" lead="Whether the shop is working, and what has failed." />
        {/*
          The one empty state on this console that answers its own question. A
          platform screen that cannot reach the service has, in failing, told
          you the most important thing it could have told you.
        */}
        <Alarm>
          This screen could not reach the service, which is itself the answer: nothing on the shop
          is being recorded right now. Orders are priced in the browser and lost, registrations
          are discarded, and the catalogue is being served from the file that shipped with the
          last deploy. Set <span className="font-mono">ALLFIX_API_URL</span> and{" "}
          <span className="font-mono">ALLFIX_SERVICE_TOKEN</span>.
        </Alarm>
      </>
    )
  }

  const { runtime, errors } = state
  const unconfigured = state.integrations.filter((each) => !each.configured).length
  const failing = state.jobs.filter((job) => job.state === "Failing").length

  return (
    <>
      <PageHead
        title="The platform"
        lead="Whether the shop is working, and what has failed. None of this is visible anywhere else."
      />

      <div className="space-y-6">
        <Figures>
          <Figure
            label="Running for"
            value={since(runtime.uptimeSeconds)}
            note={`since ${when(runtime.startedAt)}`}
          />
          <Figure
            label="Open failures"
            value={String(errors.openCount)}
            note={`${errors.last24h.CRITICAL} critical · ${errors.last24h.ERROR} error · ${errors.last24h.WARNING} warning, last day`}
            tone={errors.openCount > 0 ? "warn" : "ink"}
          />
          <Figure
            label="Not configured"
            value={String(unconfigured)}
            note={unconfigured === 0 ? "everything the shop needs is set" : "the shop is missing something"}
            tone={unconfigured > 0 ? "warn" : "ink"}
          />
          <Figure
            label="Memory"
            value={runtime.heapPercent === null ? "Unbounded" : `${runtime.heapPercent}%`}
            note={`${runtime.heapUsedMb} MB used${runtime.heapMaxMb > 0 ? ` of ${runtime.heapMaxMb}` : ""}`}
            tone={runtime.heapPercent !== null && runtime.heapPercent > 85 ? "warn" : "ink"}
          />
        </Figures>

        <Card>
          <CardHeader
            title="What the shop depends on"
            hint="Whether the deployment was given it, not whether it answered just now. What actually goes wrong is a value set in one environment and not another."
          />
          <ul className="mt-4 divide-y divide-rule">
            {state.integrations.map((each) => (
              <Depends key={each.name} on={each} />
            ))}
          </ul>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Scheduled work"
              hint="A job does not say it is well. It says when it breaks."
            />
            <ul className="mt-4 divide-y divide-rule">
              {state.jobs.map((job) => (
                <Scheduled key={job.name} job={job} />
              ))}
            </ul>
            {failing > 0 && (
              <p className="mt-4 text-sm text-oxblood" role="alert">
                {failing === 1 ? "A job is failing" : `${failing} jobs are failing`} and nothing else
                would have told you.
              </p>
            )}
          </Card>

          <Card>
            <CardHeader
              title="The database"
              hint="A pending migration on a running deployment means the code and the schema disagree."
            />
            <dl className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <dt className="callout">Schema</dt>
                <dd className="mt-1 font-mono text-lg text-ink">
                  {state.migrations.currentVersion ?? "None"}
                </dd>
              </div>
              <div>
                <dt className="callout">Pending</dt>
                <dd
                  className={`mt-1 font-mono text-lg ${
                    state.migrations.pendingCount > 0 ? "text-oxblood" : "text-ink"
                  }`}
                >
                  {state.migrations.pendingCount}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-slate">
              {state.migrations.appliedCount} migrations applied. Running in{" "}
              <span className="font-mono">{runtime.profile}</span>.
            </p>
          </Card>
        </div>

        <Card>
          <CardHeader
            title="What has failed"
            hint="Marking one resolved records that somebody looked at it. It does not retry anything and does not fix anything."
          />
          {errors.open.length === 0 ? (
            <EmptyState
              title="Nothing outstanding"
              body="Failures the service records show up here. An empty list means none since the last one was cleared, not that none are being recorded."
            />
          ) : (
            <ul className="mt-4 divide-y divide-rule">
              {errors.open.map((entry) => (
                <Failure key={entry.id} entry={entry} />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}

function Depends({ on }: { on: Integration }) {
  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{on.name}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-slate">{on.note}</p>
        {on.missing.length > 0 && (
          // Named, so the fix does not need somebody to read the source. This
          // is the difference between a screen that reports a problem and one
          // that reports a problem somebody can act on.
          <p className="mt-1 font-mono text-[11px] text-mute">missing: {on.missing.join(", ")}</p>
        )}
      </div>
      <span className="shrink-0">
        <Pill tone={on.configured ? "quiet" : "todo"}>{on.configured ? "Set" : "Not set"}</Pill>
      </span>
    </li>
  )
}

function Scheduled({ job }: { job: Job }) {
  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{job.name}</p>
        <p className="mt-0.5 text-sm text-slate">
          {job.state === "Off"
            ? "Not scheduled in this environment."
            : job.lastErrorAt
              ? `Last failed ${when(job.lastErrorAt)}`
              : "No failures recorded."}
        </p>
        {job.lastErrorMessage && (
          <p className="mt-1 font-mono text-[11px] leading-relaxed text-mute">
            {job.lastErrorMessage}
          </p>
        )}
      </div>
      <span className="shrink-0">
        <Pill tone={job.state === "Failing" ? "todo" : job.state === "Off" ? "quiet" : "waiting"}>
          {job.state}
        </Pill>
      </span>
    </li>
  )
}

function Failure({ entry }: { entry: SystemErrorEntry }) {
  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-mono text-[11px] text-mute">{entry.source}</span>
          <span className="font-mono text-[11px] text-mute">{when(entry.at)}</span>
        </p>
        <p className="mt-1 text-sm leading-relaxed text-ink">{entry.message}</p>
      </div>
      <span className="shrink-0">
        <Pill tone={SEVERITY_TONE[entry.severity]}>{entry.severity.toLowerCase()}</Pill>
      </span>
    </li>
  )
}

export { SEVERITY_ORDER }
