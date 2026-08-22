/**
 * The rail's icons.
 *
 * Drawn as the shop's own things rather than as generic console furniture: a
 * rail with its runners, a bracket in section, a docket, a person, a carton, a
 * quotation. They are stroke only and inherit `currentColor`, so the rail's
 * active and resting states need no second copy of each one.
 */
export const ICONS = {
  today: (
    <>
      <path d="M3 7h18" />
      <path d="M6 7v3M12 7v3M18 7v3" />
      <path d="M4 14h16v6H4z" />
    </>
  ),
  parts: (
    <>
      <path d="M4 4v10a3 3 0 003 3h5" />
      <path d="M4 4h5" />
      <path d="M12 14l4 3-4 3z" />
      <path d="M18 6h3v4h-3z" />
    </>
  ),
  enquiries: (
    <>
      <path d="M4 5h16v11H9l-5 4z" />
      <path d="M8 9h8M8 12h5" />
    </>
  ),
  people: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    </>
  ),
  orders: (
    <>
      <path d="M4 8l8-4 8 4v8l-8 4-8-4z" />
      <path d="M4 8l8 4 8-4M12 12v8" />
    </>
  ),
  quotes: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
      <path d="M9 12h6M9 16h4" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
      <path d="M18 4l.9 1.8 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2L15 6.1l2-.3z" />
    </>
  ),
}
