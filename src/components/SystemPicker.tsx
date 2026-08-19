import Link from "next/link"
import { Profile } from "@/components/Profile"
import type { System } from "@/lib/catalogue"
import { SHOP, whatsapp } from "@/lib/format"

/**
 * The profile picker.
 *
 * This is the site's front door, and it is the fix for the old site's central
 * failure. The old shop browsed by part type, Brackets and Stoppers and Runners,
 * which asks every customer to work out compatibility for themselves, and is why
 * people buy a track and go home without the stoppers.
 *
 * Here you identify your rail the way the trade does, by its section, and every
 * part behind it is guaranteed to fit.
 */
export function SystemPicker({ list }: { list: System[] }) {
  return (
    <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-sm bg-rule sm:grid-cols-3 lg:grid-cols-5">
      {list.map((system, index) => (
          <li key={system.slug}>
            <Link
              href={`/systems/${system.slug}`}
              className="group flex h-full flex-col items-center gap-2 bg-paper px-3 py-6 transition-colors hover:bg-brass-soft"
            >
              <span
                className="text-brass transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <Profile system={system.slug} size={92} animate dimensioned />
              </span>

              <span className="font-display text-base font-semibold tracking-tight">
                {system.name}
              </span>
            </Link>
          </li>
      ))}

      {/*
        The picker asks a question some customers cannot answer: plenty of people
        own a rail without knowing its number. Leaving that as a dead end would
        push them straight back to the phone, so the last cell is the way out.
      */}
      <li>
        <div className="flex h-full flex-col items-center justify-center gap-2 bg-panel px-4 py-6 text-center">
          <p className="font-display text-base font-semibold tracking-tight">Not sure which?</p>
          <p className="text-sm leading-relaxed text-slate">
            Send us a photo of the cut end and we will name it.
          </p>
          <a
            href={whatsapp("Hello AllFix, can you tell me which rail system this is? I will send a photo of the end of my track.")}
            className="mt-1 text-sm font-medium text-oxblood underline-offset-4 hover:underline"
          >
            Ask on WhatsApp
          </a>
          <p className="callout">or call {SHOP.phone}</p>
        </div>
      </li>
    </ul>
  )
}
