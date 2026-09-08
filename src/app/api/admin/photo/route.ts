import { put } from "@vercel/blob"
import { requireConsole } from "@/lib/admin/guard"
import { capabilities } from "@/lib/admin/roles"
import { check, tooMany } from "@/lib/rate-limit"

/**
 * Where a photograph of a part goes.
 *
 * The picture is uploaded here, to this server, and forwarded to blob storage
 * from the server side. The alternative, handing the browser a token and letting
 * it upload straight to the store, is one fewer hop and wrong for this console
 * twice over. It would put a write credential in a page that a member of staff
 * leaves open on a counter all day, and it would need the blob host added to
 * `connect-src`, widening a policy that currently names one origin.
 *
 * Nothing here is stored by this service either. The answer is a URL, and the
 * URL is what the console then saves against the part, so the picture belongs to
 * the blob store and the address belongs to the catalogue.
 *
 * Gated three times over, like every other write in the console: the proxy turns
 * a signed out request away, `requireConsole` checks again here because a route
 * handler is not a page and the proxy's matcher is not the control, and the
 * capability check answers the narrower question of whether this particular desk
 * prices parts. Whoever keeps the service running holds the console and has no
 * business changing what a bracket looks like.
 */

/** What a camera or a phone produces, and nothing that executes. */
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"]

/**
 * Eight megabytes, which is a phone photograph with room to spare.
 *
 * Checked against the declared size before reading the body, and again against
 * what actually arrived, because the first is a claim made by the caller.
 */
const MAX_BYTES = 8 * 1024 * 1024

export async function POST(request: Request) {
  const verdict = check(request, "photo")
  if (!verdict.ok) return tooMany(verdict.retryAfter)

  const desk = await requireConsole()
  if (!capabilities(desk.role).prices) {
    return Response.json({ message: "That is not yours to change." }, { status: 403 })
  }

  const form = await request.formData().catch(() => null)
  const file = form?.get("file")
  if (!(file instanceof File)) {
    return Response.json({ message: "No picture was sent." }, { status: 400 })
  }

  if (!ALLOWED.includes(file.type)) {
    return Response.json(
      { message: "That is not a picture. Send a JPEG, a PNG, a WebP or an AVIF." },
      { status: 415 },
    )
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { message: "That picture is over 8 MB. Most phones can be asked for a smaller one." },
      { status: 413 },
    )
  }

  const sku = String(form?.get("sku") ?? "").trim()
  if (!sku) {
    return Response.json({ message: "A picture has to belong to a part." }, { status: 400 })
  }

  try {
    const blob = await put(`parts/${key(sku)}${extension(file.type)}`, file, {
      access: "public",
      // A part can be reshot, and the second shot must not land on the first's
      // address: a cached URL would keep serving the picture somebody replaced.
      addRandomSuffix: true,
      contentType: file.type,
    })
    return Response.json({ url: blob.url })
  } catch {
    // The store is somebody else's service and this is a counter. Saying so
    // beats a stack trace, and the part is unchanged either way.
    return Response.json(
      { message: "The picture could not be stored, so nothing was changed. Try again." },
      { status: 502 },
    )
  }
}

/** The same shape `imageFor()` builds, so a stored photo reads like a shot one. */
function key(sku: string): string {
  return sku.replace(/#/g, "").replace(/\//g, "-").toLowerCase()
}

function extension(type: string): string {
  return type === "image/jpeg" ? ".jpg" : `.${type.slice("image/".length)}`
}
