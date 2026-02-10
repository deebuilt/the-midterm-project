/**
 * Congress Legislators data — fetched at build time (or on-demand in admin)
 * from the unitedstates/congress-legislators project (public domain, CC0).
 *
 * Source: https://github.com/unitedstates/congress-legislators
 * JSON:   https://unitedstates.github.io/congress-legislators/legislators-current.json
 * Social: https://unitedstates.github.io/congress-legislators/legislators-social-media.json
 * Photos: https://unitedstates.github.io/images/congress/450x550/{bioguide_id}.jpg
 *
 * Gotchas:
 * - The `terms` array is chronological — LAST element is the current term
 * - Social media `twitter` field is just the handle, not a URL
 * - Some legislators lack contact_form, phone, or office fields
 * - The `fec` field is an array (House + Senate campaigns get separate IDs)
 * - Party values are "Democrat" | "Republican" | "Independent" (already normalized)
 */

import type { CongressMember } from "../types";

// ─── Raw JSON shapes ───

interface RawTerm {
  type: "sen" | "rep";
  start: string;
  end: string;
  state: string;
  party: string;
  district?: number;
  class?: number;
  state_rank?: "senior" | "junior";
  url?: string;
  phone?: string;
  address?: string;
  office?: string;
  contact_form?: string;
  rss_url?: string;
  fax?: string;
  caucus?: string;
}

interface RawLegislator {
  id: {
    bioguide: string;
    thomas?: string;
    lis?: string;
    govtrack?: number;
    opensecrets?: string;
    votesmart?: number;
    fec?: string[];
    cspan?: number;
    wikipedia?: string;
    ballotpedia?: string;
    wikidata?: string;
    google_entity_id?: string;
    icpsr?: number;
  };
  name: {
    first: string;
    last: string;
    middle?: string;
    suffix?: string;
    nickname?: string;
    official_full?: string;
  };
  bio: {
    birthday: string;
    gender: string;
  };
  terms: RawTerm[];
  leadership_roles?: Array<{
    title: string;
    chamber: string;
    start: string;
    end?: string;
  }>;
}

interface RawSocialEntry {
  id: {
    bioguide: string;
    thomas?: string;
    govtrack?: number;
  };
  social: {
    twitter?: string;
    twitter_id?: string;
    facebook?: string;
    youtube?: string;
    youtube_id?: string;
    instagram?: string;
    instagram_id?: number;
    mastodon?: string;
  };
}

// ─── Constants ───

const LEGISLATORS_URL =
  "https://unitedstates.github.io/congress-legislators/legislators-current.json";
const SOCIAL_MEDIA_URL =
  "https://unitedstates.github.io/congress-legislators/legislators-social-media.json";
const PHOTO_BASE =
  "https://unitedstates.github.io/images/congress/450x550";

// ─── Module-level cache (one fetch per build/session) ───

let _members: CongressMember[] | null = null;
let _fetchPromise: Promise<CongressMember[]> | null = null;

// ─── Internal helpers ───

function normalizeParty(raw: string): CongressMember["party"] {
  if (raw === "Democrat") return "Democrat";
  if (raw === "Republican") return "Republican";
  return "Independent";
}

async function fetchAndParse(): Promise<CongressMember[]> {
  try {
    const [legResponse, socialResponse] = await Promise.all([
      fetch(LEGISLATORS_URL),
      fetch(SOCIAL_MEDIA_URL),
    ]);

    if (!legResponse.ok) {
      console.error(`Failed to fetch legislators: ${legResponse.status}`);
      return [];
    }

    const rawLegislators: RawLegislator[] = await legResponse.json();

    // Social media is optional — if it fails, continue without it
    const socialMap = new Map<string, RawSocialEntry["social"]>();
    if (socialResponse.ok) {
      const rawSocial: RawSocialEntry[] = await socialResponse.json();
      for (const entry of rawSocial) {
        socialMap.set(entry.id.bioguide, entry.social);
      }
    }

    const members: CongressMember[] = [];

    for (const leg of rawLegislators) {
      const currentTerm = leg.terms[leg.terms.length - 1];
      if (!currentTerm) continue;

      const bioguideId = leg.id.bioguide;
      const social = socialMap.get(bioguideId);

      members.push({
        bioguideId,
        name:
          leg.name.official_full ??
          `${leg.name.first} ${leg.name.last}`,
        firstName: leg.name.first,
        lastName: leg.name.last,
        party: normalizeParty(currentTerm.party),
        state: currentTerm.state,
        chamber: currentTerm.type === "sen" ? "senate" : "house",
        district:
          currentTerm.type === "rep" ? currentTerm.district : undefined,
        senateClass:
          currentTerm.type === "sen" ? currentTerm.class : undefined,
        stateRank:
          currentTerm.type === "sen"
            ? (currentTerm.state_rank as CongressMember["stateRank"])
            : undefined,
        phone: currentTerm.phone ?? undefined,
        address: currentTerm.address ?? undefined,
        office: currentTerm.office ?? undefined,
        website: currentTerm.url ?? undefined,
        contactFormUrl: currentTerm.contact_form ?? undefined,
        photoUrl: `${PHOTO_BASE}/${bioguideId}.jpg`,
        twitter: social?.twitter ?? undefined,
        facebook: social?.facebook ?? undefined,
        instagram: social?.instagram ?? undefined,
        youtube: social?.youtube ?? social?.youtube_id ?? undefined,
        fecIds: leg.id.fec ?? undefined,
      });
    }

    return members;
  } catch (error) {
    console.error("Failed to fetch congress-legislators data:", error);
    return [];
  }
}

async function getAllMembers(): Promise<CongressMember[]> {
  if (_members) return _members;
  if (!_fetchPromise) _fetchPromise = fetchAndParse();
  _members = await _fetchPromise;
  return _members;
}

// ─── Public API ───

/** Fetch all current members of Congress (senators + representatives). */
export async function fetchAllCongressMembers(): Promise<CongressMember[]> {
  return getAllMembers();
}

/** Fetch all current US senators. */
export async function fetchCurrentSenators(): Promise<CongressMember[]> {
  const all = await getAllMembers();
  return all.filter((m) => m.chamber === "senate");
}

/** Fetch all current US representatives. */
export async function fetchCurrentRepresentatives(): Promise<CongressMember[]> {
  const all = await getAllMembers();
  return all.filter((m) => m.chamber === "house");
}

/**
 * Find a Congress member by FEC candidate ID.
 * The congress-legislators dataset stores an array of FEC IDs per member
 * (House and Senate campaigns get separate IDs).
 */
export async function findMemberByFecId(
  fecId: string
): Promise<CongressMember | undefined> {
  const all = await getAllMembers();
  return all.find((m) => m.fecIds?.includes(fecId));
}

/**
 * Find a Congress member by name and state.
 * Useful as a fallback when FEC ID matching fails.
 * Matches case-insensitively on last name + state, then checks first name.
 */
export async function findMemberByName(
  firstName: string,
  lastName: string,
  state: string
): Promise<CongressMember | undefined> {
  const all = await getAllMembers();
  const lastLower = lastName.toLowerCase();
  const firstLower = firstName.toLowerCase();
  const stateUpper = state.toUpperCase();

  return all.find(
    (m) =>
      m.state === stateUpper &&
      m.lastName.toLowerCase() === lastLower &&
      m.firstName.toLowerCase() === firstLower
  );
}

/**
 * Get enrichment data for a candidate being promoted from FEC filings.
 * Tries FEC ID match first, then falls back to name+state match.
 * Returns only the fields useful for enriching a candidates table row.
 */
export async function getEnrichmentData(
  fecCandidateId: string,
  firstName: string,
  lastName: string,
  state: string
): Promise<{
  bioguideId: string;
  photoUrl: string;
  website?: string;
  twitter?: string;
  phone?: string;
  office?: string;
  contactFormUrl?: string;
} | null> {
  // Try FEC ID match first (most reliable)
  let member = await findMemberByFecId(fecCandidateId);

  // Fall back to name+state match
  if (!member) {
    member = await findMemberByName(firstName, lastName, state);
  }

  if (!member) return null;

  return {
    bioguideId: member.bioguideId,
    photoUrl: member.photoUrl,
    website: member.website,
    twitter: member.twitter,
    phone: member.phone,
    office: member.office,
    contactFormUrl: member.contactFormUrl,
  };
}
