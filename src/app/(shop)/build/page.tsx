import type { Metadata } from "next"
import Link from "next/link"
import { Configurator } from "@/components/build/Configurator"
import { Breadcrumbs } from "@/components/ui"
import { configuratorSystems } from "@/lib/configurator"
import { whatsapp } from "@/lib/format"

export const metadata: Metadata = {
  title: "Build a rail",
  description:
    "Tell us your window and get the exact parts a curtain rail takes: track, brackets, runners, " +
    "stoppers and joints, in the right quantities and guaranteed to fit. Send the list to AllFix " +
    "for a quote.",
}

const HELP = whatsapp(
  "Hello AllFix, I am not sure which rail I need. Here is my window and what I have:",
)

/**
 * The configurator route.
 *
 * The catalogue read happens here on the server, projected small by
 * `configuratorSystems()` so the browser gets the systems and their part names
 * but not the whole catalogue. Everything interactive is in the client
 * component below it.
 */
export default async function Build({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const systems = configuratorSystems()

  // Every system page links here as `/build?system=<slug>`. That parameter used
  // to go nowhere: the configurator always opened on the first system in the
  // list, so a customer who pressed "Build a complete #28 rail" silently got a
  // motorised one. Resolving it here rather than in the client means the right
  // rail is selected in the first render, with no flash and no JavaScript
  // needed to read the URL. An unknown slug falls back rather than erroring.
  const wanted = searchParams ? (await searchParams).system : undefined
  const asked = Array.isArray(wanted) ? wanted[0] : wanted
  const initialSlug = systems.find((system) => system.slug === asked)?.slug ?? systems[0]?.slug ?? ""

  return (
    <div className="shell py-12">
      <Breadcrumbs trail={[{ href: "/", label: "Home" }, { label: "Build a rail" }]} />

      <h1 className="display-lg mt-5 max-w-[20ch] font-display font-bold tracking-tight">
        Build a rail to your window
      </h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-slate">
        Pick your system, set the width, and the configurator works out every part the rail takes,
        in the right quantities and all guaranteed to fit. Send the list over and we confirm the
        price and pull it at the counter.
      </p>

      <div className="mt-10">
        <Configurator systems={systems} initialSlug={initialSlug} />
      </div>

      <p className="mt-8 text-sm text-slate">
        Not sure which rail you have?{" "}
        <Link href="/systems" className="text-oxblood underline-offset-4 hover:underline">
          Match it by its section
        </Link>{" "}
        or{" "}
        <a href={HELP} className="text-oxblood underline-offset-4 hover:underline">
          send us the window
        </a>
        .
      </p>
    </div>
  )
}
