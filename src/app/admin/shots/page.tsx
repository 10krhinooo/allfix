import { deskRows } from "@/lib/admin/rows"
import { Shots } from "@/components/admin/Shots"

export default function ShotsPage() {
  return <Shots rows={deskRows()} />
}
