"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { save } from "@/app/admin/settings/actions"
import { SHOP } from "@/lib/format"
import {
  IDLE_MAX,
  IDLE_MIN,
  idleMinutes,
  NOTICES,
  SESSION_ENV,
  SOCIAL_ENV,
  SOCIAL_KINDS,
  SOCIAL_LABEL,
  socialLink,
  type EmailSettings,
  type ShopSettings,
  type SocialKind,
} from "@/lib/settings"
import { SocialRow } from "@/components/Social"
import { PageHead, Card, CardHeader, Note } from "@/components/admin/parts"

/**
 * The settings screen.
 *
 * It is a form and a mirror at the same time: what it shows is what the shop is
 * actually configured with right now, read through the seam, and the footer
 * preview beside the links is the real component rather than a drawing of it.
 * A screen that describes settings without showing their effect is how a link
 * ends up pointing at a page that closed two years ago.
 *
 * When there is no settings service, saving says so rather than showing a tick
 * and dropping the change, and it names the environment variables that set these
 * today. That is deliberate and it is the same answer registration gives: a
 * console that quietly loses work is worse than one that admits it cannot keep
 * it.
 */

const RULE =
  "mt-1.5 w-full border-0 border-b border-rule bg-transparent px-0 py-2 text-sm text-ink " +
  "outline-none transition-colors placeholder:text-mute focus:border-ink disabled:opacity-55"

export function Settings({ settings }: { settings: ShopSettings }) {
  const [social, setSocial] = useState<Partial<Record<SocialKind, string>>>(settings.social)
  const [email, setEmail] = useState<EmailSettings>(settings.email)
  /*
   * Held as typed rather than as a number. A number input that coerces while
   * somebody is still typing turns a half entered "45" into 4 and then into
   * something they did not mean, and an empty field has to be expressible for
   * as long as it takes to type the next digit.
   */
  const [idle, setIdle] = useState(String(settings.session.idleMinutes))
  const [answer, setAnswer] = useState<{ ok: boolean; message: string } | null>(null)
  const [saving, startSaving] = useTransition()

  // Only what parses as a link is previewed, so a half typed address does not
  // put a dead icon in the preview and read as if it were live.
  const live: Partial<Record<SocialKind, string>> = {}
  for (const kind of SOCIAL_KINDS) {
    const found = socialLink(social[kind])
    if (found) live[kind] = found
  }
  const bad = SOCIAL_KINDS.filter((kind) => (social[kind] ?? "").trim() && !live[kind])

  const window = idleMinutes(idle)
  const badWindow = window === undefined

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setAnswer(null)
    startSaving(async () => {
      const result = await save({
        social,
        email,
        session: { idleMinutes: idle },
      })
      setAnswer(
        result.ok
          ? { ok: true, message: "Saved. The shop is showing these now." }
          : { ok: false, message: result.message },
      )
    })
  }

  return (
    <form onSubmit={submit}>
      <PageHead
        title="Settings"
        lead="The accounts the shop links to, and the messages it sends. Both are true of the whole shop rather than of one part, which is why they are here and not on the counter's screens."
      >
        <Note tone={settings.source === "service" ? "brass" : "warn"}>
          {settings.source === "service"
            ? "Read from the settings service. Saving here changes what the shop shows."
            : "Read from the environment, because no settings service is configured. This screen will show what is set and cannot yet keep a change."}
        </Note>
      </PageHead>

      {/* ------------------------------------------------------------ social */}
      <Card className="mb-4">
        <CardHeader
          title="Social accounts"
          hint="Left blank, nothing is shown. An icon pointing nowhere is worse than no icon."
        />

        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {SOCIAL_KINDS.map((kind) => (
            <label key={kind} className="block">
              <span className="callout">{SOCIAL_LABEL[kind]}</span>
              <input
                type="url"
                inputMode="url"
                value={social[kind] ?? ""}
                onChange={(event) =>
                  setSocial((previous) => ({ ...previous, [kind]: event.target.value }))
                }
                placeholder={`https://${kind === "x" ? "x.com" : `${kind}.com`}/allfix`}
                className={RULE}
                disabled={saving}
              />
              <span className="mt-1 block font-mono text-[11px] text-mute">
                {SOCIAL_ENV[kind]}
              </span>
            </label>
          ))}
        </div>

        {bad.length > 0 && (
          <p role="alert" className="mt-5 border-l-2 border-oxblood bg-oxblood/5 px-3 py-2 text-sm leading-relaxed text-ink">
            {bad.map((kind) => SOCIAL_LABEL[kind]).join(", ")}{" "}
            {bad.length === 1 ? "is not a full web address" : "are not full web addresses"}. Paste
            the whole thing, starting https://, or leave it blank.
          </p>
        )}

        <div className="mt-7 border-t border-rule pt-5">
          <CardHeader title="In the footer" hint="The real row, as the shop would draw it." />
          {Object.keys(live).length === 0 ? (
            <p className="text-sm leading-relaxed text-slate">
              Nothing yet, so the footer shows no social row at all.
            </p>
          ) : (
            <SocialRow links={live} />
          )}
        </div>
      </Card>

      {/* ------------------------------------------------------------- email */}
      <Card className="mb-4">
        <CardHeader
          title="What the shop sends, and from where"
          hint="The sender the customer sees, and the address a reply reaches."
        />

        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <label className="block">
            <span className="callout">Appears from</span>
            <input
              value={email.fromName}
              onChange={(event) => setEmail({ ...email, fromName: event.target.value })}
              className={RULE}
              disabled={saving}
            />
          </label>
          <label className="block">
            <span className="callout">Sent as</span>
            <input
              type="email"
              value={email.fromAddress}
              onChange={(event) => setEmail({ ...email, fromAddress: event.target.value })}
              className={RULE}
              disabled={saving}
            />
            <span className="mt-1 block text-[11px] leading-relaxed text-mute">
              Gmail rewrites this to the mailbox that authenticated unless it is a verified
              alias, so the domain has to be set up before it appears as the sender.
            </span>
          </label>
          <label className="block">
            <span className="callout">Replies go to</span>
            <input
              type="email"
              value={email.replyTo}
              onChange={(event) => setEmail({ ...email, replyTo: event.target.value })}
              placeholder={SHOP.email}
              className={RULE}
              disabled={saving}
            />
          </label>
          <label className="block">
            <span className="callout">Copy the counter on</span>
            <input
              type="email"
              value={email.copyTo ?? ""}
              onChange={(event) =>
                setEmail({ ...email, copyTo: event.target.value.trim() || null })
              }
              placeholder="Optional"
              className={RULE}
              disabled={saving}
            />
            <span className="mt-1 block text-[11px] leading-relaxed text-mute">
              So a booking is not only in one customer&apos;s inbox.
            </span>
          </label>
        </div>

        <div className="mt-7 border-t border-rule pt-5">
          <CardHeader
            title="Which messages go out"
            hint="Turned off, the record is still kept. Only the message stops."
          />
          <ul className="space-y-3">
            {NOTICES.map(([key, label, hint]) => (
              <li key={key}>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={email.sends[key]}
                    onChange={(event) =>
                      setEmail({
                        ...email,
                        sends: { ...email.sends, [key]: event.target.checked },
                      })
                    }
                    disabled={saving}
                    className="mt-1 h-4 w-4 accent-oxblood"
                  />
                  <span>
                    <span className="block text-sm font-medium text-ink">{label}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate">{hint}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card className="mb-4">
        <CardHeader
          title="Signing out"
          hint="How long an account may sit idle before the shop signs it out."
        />
        <label className="block max-w-xs">
          <span className="callout">Minutes of inactivity</span>
          <input
            inputMode="numeric"
            value={idle}
            onChange={(event) => setIdle(event.target.value)}
            aria-invalid={badWindow ? true : undefined}
            className={`${RULE} ${badWindow ? "border-oxblood" : ""}`}
            disabled={saving}
          />
          <span className="mt-1 block text-[11px] leading-relaxed text-mute">
            Counted from the last thing somebody did, not from when they signed in. A
            minute before the end they are warned and can stay. This applies to everyone
            with an account, the counter and customers alike.
          </span>
          <span className="mt-1 block font-mono text-[11px] text-mute">
            {SESSION_ENV.idleMinutes}
          </span>
        </label>

        {badWindow && (
          <p
            role="alert"
            className="mt-5 border-l-2 border-oxblood bg-oxblood/5 px-3 py-2 text-sm leading-relaxed text-ink"
          >
            That is not a window we can set. Give a whole number of minutes between{" "}
            {IDLE_MIN} and {IDLE_MAX}.
          </p>
        )}
      </Card>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="rounded-sm bg-oxblood px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep disabled:cursor-not-allowed disabled:opacity-55"
        >
          {saving ? "Saving" : "Save these settings"}
        </button>
        <Link href="/" className="callout hover:text-ink">
          See the shop
        </Link>
      </div>

      {answer && (
        <p
          role="status"
          className={`mt-5 max-w-2xl border-l-2 px-4 py-3 text-sm leading-relaxed text-ink ${
            answer.ok ? "border-brass bg-brass-soft" : "border-oxblood bg-oxblood/5"
          }`}
        >
          {answer.message}
        </p>
      )}
    </form>
  )
}
