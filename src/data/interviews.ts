export interface InterviewMeta {
  /** URL slug — must match the .astro filename under src/pages/meet/ */
  slug: string;
  /** Set to true when the interview is ready to go live */
  published: boolean;
  name: string;
  party: "Democrat" | "Republican" | "Independent" | string;
  stateAbbr: string;
  state: string;
  body: "Senate" | "House" | "Governor";
  district: number | null;
  /** 1-2 sentence preview shown on the landing page card */
  teaser: string;
  /** Theme / content angle of the interview */
  angle: string;
  /** ISO date string (date only) */
  publishedDate: string;
  /** Path under public/, e.g. "/images/meet/robert-people.jpg" */
  photo: string | null;
  links: {
    website?: string;
    tiktok?: string;
    instagram?: string;
    twitter?: string;
    fec?: string;
    ballotpedia?: string;
  };
  fundraising?: {
    totalRaised: number;
    averageDonation?: number;
    numberOfDonors?: number;
    asOfDate: string;
  };
}

/** Newest first. Add new interviews to the top. */
export const interviews: InterviewMeta[] = [
  {
    slug: "robert-people",
    published: false, // flip to true when the interview is ready
    name: "Robert People",
    party: "Democrat",
    stateAbbr: "FL",
    state: "Florida",
    body: "House",
    district: null, // fill in when confirmed
    teaser:
      "A small-dollar candidate making the case that big money in politics isn't a sign of strength — it's a red flag. We sat down with Robert People to talk about what it really takes to run for Congress without corporate PACs.",
    angle: "Small-dollar fundraising vs. big-money candidates",
    publishedDate: "2026-03-01", // placeholder — update when published
    photo: null,
    links: {
      // fill in when available
    },
  },
];

export function partyColor(party: string): {
  badge: string;
  bg: string;
  text: string;
} {
  switch (party) {
    case "Democrat":
      return { badge: "bg-dem-light text-dem", bg: "bg-dem", text: "text-dem" };
    case "Republican":
      return { badge: "bg-gop-light text-gop", bg: "bg-gop", text: "text-gop" };
    case "Independent":
      return { badge: "bg-ind-light text-ind", bg: "bg-ind", text: "text-ind" };
    default:
      return {
        badge: "bg-slate-100 text-slate-600",
        bg: "bg-slate-400",
        text: "text-slate-600",
      };
  }
}

export function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}
