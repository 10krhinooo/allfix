"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Note } from "@/components/admin/parts"

/**
 * The photograph of a part, taken or replaced from the counter.
 *
 * Two pictures can be on screen and they mean different things. What is stored
 * is what the shop is showing customers now; what was just chosen is a local
 * preview of a file that has not been uploaded yet and may still be refused for
 * its type or its size. Showing one control that silently becomes the other
 * would make a failed upload look like a saved photograph, so the preview is
 * labelled as pending until the address comes back.
 *
 * The preview is an object URL, which the CSP already allows through `blob:` in
 * `img-src` because that is what next/image's own optimiser output uses. So a
 * part can be looked at before it is uploaded without widening anything, and
 * the stored picture renders through next/image, whose output is same origin.
 *
 * Nothing here is saved on its own. The upload answers with a URL, the URL goes
 * into the form, and the form saves it with the rest of the part: a photograph
 * that uploaded and then failed to save would otherwise sit in the blob store
 * attached to nothing.
 */
export function PartPhoto({
  sku,
  photoUrl,
  onChange,
  disabled,
}: {
  /** What the picture is filed under. Absent while the code is still being typed. */
  sku: string
  /** The address already stored against this part, or empty for none. */
  photoUrl: string
  onChange: (url: string) => void
  disabled?: boolean
}) {
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const input = useRef<HTMLInputElement>(null)

  // An object URL is a document-lifetime handle on the file. Left unrevoked it
  // keeps the whole image in memory for as long as the tab is open, and this
  // screen is one somebody works through forty parts on.
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  async function upload(file: File) {
    setProblem(null)
    if (!sku.trim()) {
      setProblem("Give the part its code first. A picture has to belong to something.")
      return
    }

    const local = URL.createObjectURL(file)
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old)
      return local
    })

    setBusy(true)
    try {
      const body = new FormData()
      body.set("file", file)
      body.set("sku", sku.trim())
      const response = await fetch("/api/admin/photo", { method: "POST", body })
      const answer = await response.json().catch(() => null)

      if (!response.ok) {
        setProblem(answer?.message ?? "That picture could not be stored.")
        setPreview((old) => {
          if (old) URL.revokeObjectURL(old)
          return null
        })
        return
      }

      onChange(answer.url)
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old)
        return null
      })
    } catch {
      setProblem("Could not reach the shop's own server, so the picture was not stored.")
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old)
        return null
      })
    } finally {
      setBusy(false)
      // So choosing the same file twice in a row still fires a change.
      if (input.current) input.current.value = ""
    }
  }

  const showing = preview ?? (photoUrl || null)

  return (
    <div>
      <label htmlFor="part-photo" className="callout">
        Photograph
      </label>

      <div className="mt-1.5 flex flex-wrap items-start gap-4">
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-sm border border-rule bg-shot">
          {showing ? (
            // Unoptimised for the local preview only: a blob: URL has nothing
            // for the optimiser to fetch on the server.
            <Image
              src={showing}
              alt={photoUrl && !preview ? "The photograph on file for this part" : "The picture just chosen"}
              fill
              sizes="112px"
              unoptimized={Boolean(preview)}
              className="object-contain"
            />
          ) : (
            <span className="flex h-full items-center justify-center px-2 text-center text-[10px] leading-tight text-deep-mute">
              No photograph
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <input
            id="part-photo"
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={disabled || busy}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void upload(file)
            }}
            className="block w-full text-xs text-slate file:mr-3 file:rounded-sm file:border file:border-rule file:bg-panel file:px-3 file:py-1.5 file:text-xs file:text-ink hover:file:border-ink disabled:opacity-55"
          />

          <p aria-live="polite" className="text-xs text-slate">
            {busy
              ? "Storing the picture..."
              : preview
                ? "Not stored yet."
                : photoUrl
                  ? "On file. Choosing another replaces it when you save."
                  : "A JPEG, PNG, WebP or AVIF, up to 8 MB."}
          </p>

          {photoUrl && !preview && !busy && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange("")}
              className="text-xs text-oxblood underline underline-offset-2 hover:no-underline disabled:opacity-55"
            >
              Take this photograph down
            </button>
          )}
        </div>
      </div>

      {problem && (
        <div className="mt-2">
          <Note tone="warn">{problem}</Note>
        </div>
      )}
    </div>
  )
}
