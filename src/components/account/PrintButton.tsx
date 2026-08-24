"use client"

/**
 * Saving the document.
 *
 * `window.print()` rather than a generated file. The browser is already a
 * typesetter with a PDF writer in it, so this produces a real PDF the customer
 * named and filed themselves, on every platform, with no dependency and nothing
 * to download and trust. The print stylesheet is what makes it a document
 * rather than a screenshot of one.
 */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="bg-oxblood px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-oxblood-deep"
    >
      Download or print
    </button>
  )
}
