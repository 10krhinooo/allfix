"use client"

import { EnquiryForm } from "@/components/enquiry/EnquiryForm"
import type { Service } from "@/lib/services"

/**
 * Asking about a service, without leaving the page that describes it.
 *
 * The service pages used to offer WhatsApp and a phone number and nothing else,
 * which meant the highest value work the shop does, motorisation and full
 * curtain jobs, could only be enquired about in a way that leaves no record.
 * The counter could not pick up somebody else's chat, and nobody could say on
 * Friday what came in on Tuesday.
 *
 * The kind comes off the service rather than being fixed here, because it is
 * what decides who picks the enquiry up: a motorised job needs somebody to go
 * out with a tape measure before any number is real, and a fitting can be
 * quoted from what the customer already knows.
 */
export function ServiceEnquiry({ service }: { service: Service }) {
  const work = service.title.toLowerCase()
  const survey = service.enquiryKind === "survey"

  return (
    <EnquiryForm
      kind={service.enquiryKind ?? "quote"}
      summary={`Asking about ${work}.`}
      detail={`Sent from the ${work} page.`}
      areaLabel="Area or town"
      areaPlaceholder="Where the work is"
      copy={{
        badge: "Sent",
        sent: "We have your enquiry.",
        next: (phone) =>
          survey
            ? `Somebody from the shop will call ${phone} to arrange a look at the job, because this is not work anybody can price down a phone. Quote your reference and whoever picks up can find it.`
            : `Somebody from the shop will call ${phone} to talk it through and price it. Quote your reference and whoever picks up can find it.`,
        submit: "Send through the site",
        notes: `About the job`,
        notesPlaceholder: "The rooms, the windows, roughly how wide, and when you need it",
      }}
    />
  )
}
