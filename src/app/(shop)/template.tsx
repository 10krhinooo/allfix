import { PageCurtain } from "@/components/PageCurtain"

/**
 * A template rather than anything in the layout, because that is the whole
 * mechanism: React remounts a template on every navigation and keeps a layout
 * alive across them. So the curtain mounting is the navigation happening, and
 * the header, the footer and their state survive underneath exactly as before.
 *
 * The console has no template of its own on purpose. Wiping the screen between
 * two rows of a worksheet is a flourish at the counter's expense.
 */
export default function ShopTemplate({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageCurtain />
      {children}
    </>
  )
}
