/**
 * The one bit of session state the storefront chrome is allowed to see.
 *
 * The session cookie is HttpOnly and unreadable on purpose, and working the
 * header's state out from it on the server would mean reading the session in a
 * component that renders on every page, which turns the whole shop dynamic and
 * gives up the static rendering the catalogue depends on. So a second cookie
 * carries a single boolean: somebody is signed in. It holds no address, no name
 * and no role, and forging it only changes which label a visitor is shown.
 *
 * Client safe by design: no `PEOPLE`, no crypto, nothing that must not ship to
 * the browser. `src/lib/admin/session.ts` re-exports the name for the server.
 */
export const HINT = "allfix_desk"

/**
 * Mirror the cookie onto the document, so the chrome follows a sign in that
 * happened without a page load.
 *
 * The inline script in `src/app/layout.tsx` covers a fresh document, which is
 * the case that must not flash. It cannot cover the other one: signing in and
 * signing out are client side navigations, the document is never re-parsed, and
 * without this the header would keep offering the door to somebody who has just
 * walked through it.
 */
export function markDesk(signedIn: boolean) {
  if (signedIn) document.documentElement.dataset.desk = "1"
  else delete document.documentElement.dataset.desk
}
