/**
 * The services the shop sells, as data.
 *
 * Kept here rather than inline in the page so the index and the per-service
 * detail route read from one list, and so the order is the order the shop
 * actually walks a customer through: talk first, measure, build, fit.
 */
import { whatsapp } from "@/lib/format"
import type { EnquiryKind } from "@/lib/enquiry"

export interface Service {
  slug: string
  title: string
  /** The one-line promise, shown under the title. */
  lead: string
  /** The card and index summary. */
  body: string
  /** Headline points, shown as a short list on the card. */
  points: string[]
  /** The longer opening on the detail page. */
  intro: string
  /** What the job actually includes, on the detail page. */
  includes: string[]
  /** The WhatsApp deep-link enquiry, pre-filled for this service. */
  message: string
  /**
   * Which queue an enquiry about this lands in.
   *
   * Not decoration: the kind is what decides who picks it up. Motorisation and
   * a consultation both need somebody to go out and look before anybody can
   * say a number, so they are surveys. Fitting and curtaining can be quoted
   * from what the customer tells us, so they are quotes. Absent means quote,
   * which is the ordinary case.
   */
  enquiryKind?: EnquiryKind
  /**
   * Where the primary action goes when it is not WhatsApp: assembly sends a
   * customer to the configurator, motorisation to the flagship range. Absent
   * means the WhatsApp enquiry is the primary action.
   */
  action?: { href: string; label: string }
}

export const services: Service[] = [
  {
    slug: "installation",
    title: "Installation",
    lead: "We fit what we sell.",
    body:
      "Our own fitters measure, drill and hang, on concrete, timber or a plasterboard ceiling. " +
      "The rail comes off our shelf, so the brackets, runners and stoppers are guaranteed to " +
      "match, and nothing is left for a second trip to town.",
    points: ["Ceiling or wall mount", "Levelled and packed off true", "Rails, rods and blinds"],
    intro:
      "The fitting is where a curtain job is won or lost. A rail hung a few millimetres off level " +
      "shows the moment the curtains are drawn, and a bracket into plasterboard with no fixing " +
      "behind it pulls out the first time the fabric catches. We hang what we sell, so the parts " +
      "are matched before anyone is on a ladder in your house.",
    includes: [
      "Measure and mark to the finished line, not the glass",
      "Fixings for the wall you actually have, concrete, timber or plasterboard",
      "Rail levelled, runners threaded and stoppers set",
      "Curtains hung, dressed and left drawing cleanly",
      "Offcuts and dust cleared before we leave",
    ],
    message:
      "Hello AllFix, I would like my curtains fitted. Here is the window and where I am:",
  },
  {
    slug: "assembling",
    title: "Rail assembly",
    lead: "Cut, counted and ready to mount.",
    body:
      "Bringing your own fitter, or fitting it yourself? We cut the track to your length, add the " +
      "brackets at one per metre, thread the runners and cap both ends, so the kit arrives assembled " +
      "rather than as a bag of parts. Tell us the run with the configurator and we build to it.",
    points: ["Track cut to length", "Runners threaded and counted", "Joints made for long spans"],
    intro:
      "A curtain rail is not hard to fit, but it is easy to buy wrong: too few runners for a full " +
      "pleat, a track a hand short of the window, no joint for a run past the stock length. Spec it " +
      "on the configurator and we cut, count and assemble the kit to that measurement, so what you " +
      "carry home goes straight onto the wall.",
    includes: [
      "Track cut to your run and joined where it needs it",
      "Brackets counted at one per metre, at least two",
      "Runners threaded and the ends capped with stoppers",
      "Everything from one system, so the fit is guaranteed",
      "A parts list you can check against the box",
    ],
    message:
      "Hello AllFix, I would like a rail assembled to my measurements. Here is the run:",
    action: { href: "/build", label: "Spec a rail" },
  },
  {
    slug: "curtaining",
    title: "Made-to-measure curtaining",
    lead: "Sewn to your window in our workshop.",
    body:
      "Choose the fabric and we cut, hem, pleat and finish it to the drop you actually have, not to " +
      "a standard size. Pinch, pencil or wave heading, lined or sheer, weighted to hang clean. The " +
      "curtains and the track that carries them come from the same counter.",
    points: ["Pinch, pencil or wave", "Lined, blackout or sheer", "Hemmed and weighted"],
    intro:
      "Ready-made curtains are cut to a shop's sizes, not your window, and it shows in a hem that " +
      "puddles or floats. We make to the measurement: the right width for the fullness you want, the " +
      "right drop for the floor you have, and a heading that suits the rail carrying it.",
    includes: [
      "Fabric measured and cut to your window",
      "Pinch, pencil or wave heading",
      "Lined, blackout or left sheer",
      "Hemmed to the floor and weighted to hang clean",
      "Matched to the rail or rod from the same counter",
    ],
    message:
      "Hello AllFix, I would like a quote for curtains. Here is my window and what I have in mind:",
  },
  {
    slug: "motorisation",
    enquiryKind: "survey",
    title: "Motorisation",
    lead: "Curtains that open on their own.",
    body:
      "A driven track with the motor sized to the length and weight of the run, wired in and set up " +
      "to a remote, a wall switch, an app or a schedule, and tied into a smart home. Fitted to a new " +
      "track or retrofitted to the one you already have. The span is sized on a survey.",
    points: ["Remote, switch, app or schedule", "New or existing track", "From KES 15,000, fitted"],
    intro:
      "The highest-margin line, and the one that needs the most care to get right. A motor has to be " +
      "sized to how long and how heavy the run is, the track has to take the drive, and the power has " +
      "to reach it. That is why motorisation starts with a survey rather than a checkout: we look at " +
      "the window and the wiring before we quote.",
    includes: [
      "Site survey to size the motor to the run",
      "Driven track, new or retrofitted to your existing one",
      "Wired in and set to remote, wall switch, app or schedule",
      "Tied into a smart home where you want it",
      "Tested drawing end to end before we leave",
    ],
    message:
      "Hello AllFix, I am interested in motorised curtains and would like a site survey.",
    action: { href: "/systems/motorised", label: "See the motorised range" },
  },
  {
    slug: "consultation",
    enquiryKind: "survey",
    title: "Consultation",
    lead: "Fabric, colour and hardware, worked out with you.",
    body:
      "Not sure where to start? We talk through fabric, colour, heading and the right rail for the " +
      "window and the wall, in your home or over a call. It is the first step on the bigger jobs and " +
      "it is what stops a wrong order before it is cut.",
    points: ["In your home or on a call", "Fabric and colour matching", "The right rail for the wall"],
    intro:
      "Most wrong orders start with a decision made too fast: a fabric that fights the room, a heading " +
      "the rail cannot carry, a colour that looked right on a phone screen. A consultation is the cheap " +
      "step that prevents the expensive one. We talk it through, in your home or on a call, before a " +
      "metre is cut.",
    includes: [
      "Fabric, colour and heading talked through",
      "The right rail for the window and the wall",
      "In your home or over a call, whichever suits",
      "A clear plan and a quote to work from",
      "No pressure to order on the spot",
    ],
    message:
      "Hello AllFix, I would like a consultation about curtains for my home. Here is what I am after:",
  },
]

export function getService(slug: string) {
  return services.find((service) => service.slug === slug)
}

/** The pre-filled WhatsApp link for a service enquiry. */
export function serviceEnquiry(service: Service) {
  return whatsapp(service.message)
}
