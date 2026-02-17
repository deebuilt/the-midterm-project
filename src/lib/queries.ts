/**
 * Supabase data-fetching layer.
 *
 * Queries the database and transforms rows into the same shapes
 * that the existing React components expect (StateInfo, SenateRace, etc.).
 * This way, components don't need to change — only the Astro pages
 * switch from importing hardcoded data to calling these functions.
 */

import { supabase } from "./supabase";
import type { StateInfo, SenateRace, HouseRace, GovernorRace, Candidate, SwipeCard, BallotMeasure, CalendarEvent, FecFiling, FilingsByState, IncumbentCard, VotingRecord } from "../types";

// ─── States ───

export async function fetchStates(): Promise<StateInfo[]> {
  // We still need the state-level senate/governor data that lives in the
  // old states.ts. For now we query states + join with races/candidates
  // to build the full StateInfo shape.

  const { data: states, error: statesErr } = await supabase
    .from("states")
    .select("*")
    .order("name");

  if (statesErr) throw new Error(`Failed to fetch states: ${statesErr.message}`);

  // Get the active cycle
  const { data: cycle } = await supabase
    .from("election_cycles")
    .select("id")
    .eq("is_active", true)
    .single();

  if (!cycle) throw new Error("No active election cycle found");

  // Get all races for the active cycle with their district + candidates
  const { data: races, error: racesErr } = await supabase
    .from("races")
    .select(`
      id,
      rating,
      is_special_election,
      is_open_seat,
      primary_date,
      general_date,
      why_competitive,
      district:districts!inner(
        id,
        state_id,
        senate_class,
        name,
        body:government_bodies!inner(slug)
      ),
      race_candidates(
        is_incumbent,
        candidate:candidates!inner(
          slug,
          first_name,
          last_name,
          party,
          photo_url,
          website,
          twitter,
          role_title,
          is_incumbent,
          bioguide_id
        )
      )
    `)
    .eq("cycle_id", cycle.id);

  if (racesErr) throw new Error(`Failed to fetch races: ${racesErr.message}`);

  // Build a lookup: state_id -> senate race info
  const senateRaceByStateId = new Map<number, {
    senator: string;
    party: string;
    hasCompetitive: boolean;
    class2: boolean;
  }>();

  // Also track which states have governor races up (we need this from old data
  // until we add governor races to the DB — for now, keep the static list)
  const governorStates2026 = new Set([
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "FL", "GA", "HI", "ID", "IL",
    "IA", "KS", "ME", "MD", "MA", "MI", "MN", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "VT",
    "VA", "WI",
  ]);

  // Build race lookup by state
  const racesByStateId = new Map<number, typeof races>();
  for (const race of races ?? []) {
    const dist = race.district as any;
    const stateId = dist.state_id as number;
    if (!racesByStateId.has(stateId)) racesByStateId.set(stateId, []);
    racesByStateId.get(stateId)!.push(race);
  }

  // Transform to StateInfo[]
  return (states ?? []).map((s) => {
    const stateRaces = racesByStateId.get(s.id) ?? [];
    const senateRace = stateRaces.find((r) => {
      const dist = r.district as any;
      return dist.body?.slug === "us-senate";
    });

    let senateClass2Senator: string | undefined;
    let senateClass2Party: "Democrat" | "Republican" | "Independent" | undefined;
    let hasCompetitiveRace = false;

    if (senateRace) {
      const dist = senateRace.district as any;
      const isClass2 = dist.senate_class === 2;
      const incumbent = (senateRace.race_candidates as any[])?.find(
        (rc: any) => rc.is_incumbent
      );

      if (isClass2 && incumbent) {
        const c = incumbent.candidate as any;
        senateClass2Senator = `${c.first_name} ${c.last_name}`;
        senateClass2Party = c.party;
      }

      // Check if this is a competitive race
      const rating = senateRace.rating as string;
      hasCompetitiveRace = [
        "Toss-up", "Lean R", "Lean D", "Likely R", "Likely D",
      ].includes(rating);
    }

    const info: StateInfo = {
      name: s.name,
      abbr: s.abbr,
      fips: s.fips,
      houseDistricts: s.house_districts,
      hasSenateRace: !!senateRace,
      senateClass2Senator,
      senateClass2Party,
      otherSenator: s.other_senator ?? undefined,
      otherSenatorParty: s.other_senator_party as StateInfo["otherSenatorParty"],
      hasCompetitiveRace,
      governorUpIn2026: governorStates2026.has(s.abbr),
      currentGovernor: s.current_governor ?? undefined,
      currentGovernorParty: s.current_governor_party as StateInfo["currentGovernorParty"],
    };

    return info;
  });
}

// ─── Senate Races ───

export async function fetchSenateRaces(): Promise<SenateRace[]> {
  const { data: cycle } = await supabase
    .from("election_cycles")
    .select("id")
    .eq("is_active", true)
    .single();

  if (!cycle) throw new Error("No active election cycle found");

  const { data: races, error } = await supabase
    .from("races")
    .select(`
      id,
      rating,
      is_special_election,
      is_open_seat,
      primary_date,
      general_date,
      why_competitive,
      district:districts!inner(
        state_id,
        senate_class,
        name,
        state:states!inner(name, abbr),
        body:government_bodies!inner(slug)
      ),
      race_candidates(
        is_incumbent,
        candidate:candidates!inner(
          slug,
          first_name,
          last_name,
          party,
          photo_url,
          website,
          twitter,
          role_title,
          is_incumbent,
          bioguide_id,
          fec_candidate_id,
          candidate_positions(
            summary,
            stance,
            topic:topics!inner(name, slug)
          )
        )
      )
    `)
    .eq("cycle_id", cycle.id)
    .not("rating", "is", null);

  if (error) throw new Error(`Failed to fetch senate races: ${error.message}`);

  // Filter to senate races only
  const senateRaces = (races ?? []).filter((r) => {
    const dist = r.district as any;
    return dist.body?.slug === "us-senate";
  });

  return senateRaces.map((race) => {
    const dist = race.district as any;
    const state = dist.state as any;
    const rcs = (race.race_candidates ?? []) as any[];

    // Find the incumbent candidate
    const incumbentRc = rcs.find((rc) => rc.is_incumbent);
    const incumbentCandidate = incumbentRc
      ? dbCandidateToCandidate(incumbentRc.candidate)
      : undefined;

    // Group candidates by party
    // Only show incumbents or candidates promoted from FEC filings (post-primary)
    const democrats: Candidate[] = [];
    const republicans: Candidate[] = [];
    const independents: Candidate[] = [];

    for (const rc of rcs) {
      const cand = rc.candidate as any;
      const isIncumbent = rc.is_incumbent || cand.is_incumbent;
      if (!isIncumbent && !cand.fec_candidate_id) continue;
      const c = dbCandidateToCandidate(cand);
      if (c.party === "Democrat") democrats.push(c);
      else if (c.party === "Republican") republicans.push(c);
      else independents.push(c);
    }

    const result: SenateRace = {
      state: state.name,
      stateAbbr: state.abbr,
      class: (dist.senate_class ?? 2) as 2 | 3,
      isSpecialElection: race.is_special_election,
      rating: race.rating as SenateRace["rating"],
      isOpenSeat: race.is_open_seat,
      incumbent: incumbentCandidate,
      candidates: {
        democrat: democrats,
        republican: republicans,
        ...(independents.length > 0 ? { independent: independents } : {}),
      },
      primaryDate: race.primary_date ?? "",
      generalElectionDate: race.general_date ?? "2026-11-03",
      whyCompetitive: race.why_competitive ?? undefined,
    };

    return result;
  });
}

// ─── Senate Overview Stats ───

export async function fetchSenateOverview() {
  const { data: cycle } = await supabase
    .from("election_cycles")
    .select("id")
    .eq("is_active", true)
    .single();

  if (!cycle) throw new Error("No active election cycle found");

  const { data: stats, error } = await supabase
    .from("cycle_stats")
    .select("*, body:government_bodies!inner(slug)")
    .eq("cycle_id", cycle.id);

  if (error) throw new Error(`Failed to fetch cycle stats: ${error.message}`);

  const senateStats = (stats ?? []).find(
    (s) => (s.body as any)?.slug === "us-senate"
  );
  const houseStats = (stats ?? []).find(
    (s) => (s.body as any)?.slug === "us-house"
  );

  const extraData = (senateStats?.extra_data as any) ?? {};

  const senateOverview = {
    totalSeats: senateStats?.total_seats ?? 100,
    seatsUpForElection: senateStats?.seats_up ?? 33,
    specialElections: senateStats?.special_elections ?? 2,
    currentSplit: {
      republican: senateStats?.current_split_r ?? 53,
      democrat: senateStats?.current_split_d ?? 47,
    },
    majorityNeeded: senateStats?.majority_needed ?? 51,
    demsNeedToFlip: senateStats?.dems_need_flip ?? 4,
    gopsCanLose: senateStats?.gops_can_lose ?? 2,
    classUp: 2 as const,
    classBreakdown: extraData.class_breakdown ?? { republican: 20, democrat: 13 },
    retirements: [] as { name: string; party: "Republican" | "Democrat"; state: string }[],
  };

  // Fetch retirements from candidates who are incumbents in open-seat races
  const { data: retirementRaces } = await supabase
    .from("races")
    .select(`
      is_open_seat,
      district:districts!inner(
        state:states!inner(name),
        body:government_bodies!inner(slug)
      ),
      race_candidates(
        is_incumbent,
        candidate:candidates!inner(first_name, last_name, party)
      )
    `)
    .eq("cycle_id", cycle.id)
    .eq("is_open_seat", true);

  for (const race of retirementRaces ?? []) {
    const dist = race.district as any;
    if (dist.body?.slug !== "us-senate") continue;
    const incumbentRc = (race.race_candidates as any[])?.find(
      (rc: any) => rc.is_incumbent
    );
    if (incumbentRc) {
      const c = incumbentRc.candidate as any;
      senateOverview.retirements.push({
        name: `${c.first_name} ${c.last_name}`,
        party: c.party as "Republican" | "Democrat",
        state: dist.state.name,
      });
    }
  }

  return { senateOverview, houseOverview: houseStats };
}

// ─── House Overview ───

export async function fetchHouseOverview() {
  const { data: cycle } = await supabase
    .from("election_cycles")
    .select("id")
    .eq("is_active", true)
    .single();

  if (!cycle) throw new Error("No active election cycle found");

  const { data: stats, error } = await supabase
    .from("cycle_stats")
    .select("*, body:government_bodies!inner(slug)")
    .eq("cycle_id", cycle.id);

  if (error) throw new Error(`Failed to fetch house stats: ${error.message}`);

  const houseStats = (stats ?? []).find(
    (s) => (s.body as any)?.slug === "us-house"
  );

  if (!houseStats) throw new Error("No house stats found for active cycle");

  const extraData = (houseStats.extra_data as any) ?? {};

  return {
    totalSeats: houseStats.total_seats ?? 435,
    allSeatsContested: true,
    currentSplit: {
      republican: houseStats.current_split_r ?? 218,
      democrat: houseStats.current_split_d ?? 214,
    },
    vacancies: extraData.vacancies ?? 3,
    majorityNeeded: houseStats.majority_needed ?? 218,
    demsNeedToFlip: houseStats.dems_need_flip ?? 3,
    gopsCanLose: houseStats.gops_can_lose ?? 2,
    battlegroundDistricts: houseStats.battleground_count ?? 42,
    battlegroundBreakdown: extraData.battleground_breakdown ?? {
      democratHeld: 22,
      republicanHeld: 20,
    },
    retirements: {
      democrat: houseStats.retirements_d ?? 22,
      republican: houseStats.retirements_r ?? 30,
      total: (houseStats.retirements_d ?? 22) + (houseStats.retirements_r ?? 30),
    },
    termLength: 2,
  };
}

// ─── All Class II Seats ───

export async function fetchAllClass2Seats() {
  const { data: cycle } = await supabase
    .from("election_cycles")
    .select("id")
    .eq("is_active", true)
    .single();

  if (!cycle) throw new Error("No active election cycle found");

  const { data: races, error } = await supabase
    .from("races")
    .select(`
      rating,
      district:districts!inner(
        senate_class,
        state:states!inner(name, abbr),
        body:government_bodies!inner(slug)
      ),
      race_candidates(
        is_incumbent,
        candidate:candidates!inner(first_name, last_name, party)
      )
    `)
    .eq("cycle_id", cycle.id);

  if (error) throw new Error(`Failed to fetch class 2 seats: ${error.message}`);

  // Filter to Class II senate seats only
  const class2 = (races ?? []).filter((r) => {
    const dist = r.district as any;
    return dist.body?.slug === "us-senate" && dist.senate_class === 2;
  });

  return class2.map((race) => {
    const dist = race.district as any;
    const state = dist.state as any;
    const incumbentRc = (race.race_candidates as any[])?.find(
      (rc: any) => rc.is_incumbent
    );
    const c = incumbentRc?.candidate as any;

    const rating = race.rating as string;
    const isCompetitive = [
      "Toss-up", "Lean R", "Lean D", "Likely R", "Likely D",
    ].includes(rating);

    // Derive party: incumbent candidate first, then rating suffix
    let party: "Democrat" | "Republican" | "Independent" = "Republican";
    if (c?.party) {
      party = c.party as typeof party;
    } else if (rating?.endsWith("D")) {
      party = "Democrat";
    }
    // Ratings ending in "R" or "Toss-up" without incumbent default to Republican

    return {
      state: state.name,
      stateAbbr: state.abbr,
      senator: c ? `${c.first_name} ${c.last_name}` : "TBD",
      party,
      rating,
      isCompetitive,
    };
  });
}

// ─── Swipe Cards ───

export async function fetchSwipeCards(): Promise<SwipeCard[]> {
  const senateRaces = await fetchSenateRaces();

  const competitiveRatings = ["Toss-up", "Lean R", "Lean D"];

  const candidateCards: SwipeCard[] = senateRaces
    .filter((race) => competitiveRatings.includes(race.rating))
    .flatMap((race) => {
      const allCandidates = [
        ...race.candidates.democrat,
        ...race.candidates.republican,
        ...(race.candidates.independent ?? []),
      ];
      const raceInfo: SwipeCard["race"] = {
        state: race.state,
        stateAbbr: race.stateAbbr,
        class: race.class,
        isSpecialElection: race.isSpecialElection,
        rating: race.rating,
        isOpenSeat: race.isOpenSeat,
        candidates: { democrat: [], republican: [] },
        primaryDate: race.primaryDate,
        generalElectionDate: race.generalElectionDate,
      };
      return allCandidates.map((candidate) => ({
        id: `card-${candidate.id}`,
        type: "candidate" as const,
        candidate,
        race: raceInfo,
      }));
    });

  const factCards: SwipeCard[] = [
    {
      id: "fact-senate-classes",
      type: "fact",
      fact: {
        title: "Why Only 33 Seats?",
        content:
          "The Senate is divided into 3 classes. Each class is up for election every 6 years, so roughly one-third of the Senate is elected every 2 years.",
      },
    },
    {
      id: "fact-house-all",
      type: "fact",
      fact: {
        title: "All 435 House Seats",
        content:
          "Unlike the Senate, every single House seat is up for election every 2 years. That's 435 races happening on November 3, 2026.",
      },
    },
    {
      id: "fact-path-majority",
      type: "fact",
      fact: {
        title: "Path to Majority",
        content:
          "Democrats need to flip 4 Senate seats to win the majority. Republicans can only afford to lose 2. In the House, Democrats need just 3 more seats.",
      },
    },
    {
      id: "fact-special-elections",
      type: "fact",
      fact: {
        title: "Special Elections",
        content:
          "Two extra Senate seats are up due to resignations: Ohio (JD Vance became VP) and Florida (Marco Rubio became Secretary of State).",
      },
    },
    {
      id: "fact-midterm-pattern",
      type: "fact",
      fact: {
        title: "The Midterm Pattern",
        content:
          "Historically, the president's party almost always loses seats in midterm elections. Since 1934, the president's party has lost House seats in all but three midterms.",
      },
    },
  ];

  // Interleave facts among candidate cards
  const swipeCards: SwipeCard[] = [];
  let factIndex = 0;
  candidateCards.forEach((card, i) => {
    swipeCards.push(card);
    if ((i + 1) % 3 === 0 && factIndex < factCards.length) {
      swipeCards.push(factCards[factIndex]!);
      factIndex++;
    }
  });
  while (factIndex < factCards.length) {
    swipeCards.push(factCards[factIndex]!);
    factIndex++;
  }

  return swipeCards;
}

// ─── Re-elect or Reject ───

export async function fetchIncumbentsWithVotes(): Promise<IncumbentCard[]> {
  // Query incumbent candidates directly via state_id (migration 016)
  // Do NOT use race_candidates — that table is empty
  const { data: candidates, error: candErr } = await supabase
    .from("candidates")
    .select(`
      id,
      slug,
      first_name,
      last_name,
      party,
      photo_url,
      website,
      twitter,
      bio,
      role_title,
      is_incumbent,
      state:states!inner(id, name, abbr)
    `)
    .eq("is_incumbent", true)
    .not("state_id", "is", null);

  if (candErr) throw new Error(`Failed to fetch incumbents: ${candErr.message}`);

  // Filter to only senators (role_title contains "Senator")
  const senators = (candidates ?? []).filter((c: any) => {
    const role = (c.role_title ?? "") as string;
    return role.toLowerCase().includes("senator");
  });

  // Get race ratings for these states (senate races only)
  const { data: cycle } = await supabase
    .from("election_cycles")
    .select("id")
    .eq("is_active", true)
    .single();

  const ratingByStateId = new Map<number, { rating: string; isSpecial: boolean; isOpenSeat: boolean }>();
  if (cycle) {
    const { data: races } = await supabase
      .from("races")
      .select(`
        rating,
        is_special_election,
        is_open_seat,
        district:districts!inner(
          state_id,
          body:government_bodies!inner(slug)
        )
      `)
      .eq("cycle_id", cycle.id);

    for (const race of races ?? []) {
      const dist = race.district as any;
      if (dist.body?.slug === "us-senate") {
        ratingByStateId.set(dist.state_id, {
          rating: race.rating,
          isSpecial: race.is_special_election,
          isOpenSeat: race.is_open_seat,
        });
      }
    }
  }

  // Get votes for all incumbent senators via candidate_votes join table (may be empty)
  const candidateIds = senators.map((c: any) => c.id);
  let votesByCandidate = new Map<number, VotingRecord[]>();

  if (candidateIds.length > 0) {
    const { data: candidateVotes } = await supabase
      .from("candidate_votes")
      .select(`
        id,
        candidate_id,
        vote,
        bill:votes!inner(
          id,
          bill_name,
          bill_number,
          vote_date,
          summary,
          source_url,
          result,
          topic:topics(name)
        )
      `)
      .in("candidate_id", candidateIds);

    for (const cv of candidateVotes ?? []) {
      const bill = cv.bill as any;
      const record: VotingRecord = {
        id: bill.id,
        billName: bill.bill_name,
        billNumber: bill.bill_number,
        vote: cv.vote as VotingRecord["vote"],
        voteDate: bill.vote_date,
        topic: bill.topic?.name ?? null,
        summary: bill.summary,
        sourceUrl: bill.source_url,
        result: bill.result ?? null,
      };
      if (!votesByCandidate.has(cv.candidate_id)) {
        votesByCandidate.set(cv.candidate_id, []);
      }
      votesByCandidate.get(cv.candidate_id)!.push(record);
    }

    // Sort each candidate's votes by date descending
    for (const records of votesByCandidate.values()) {
      records.sort((a, b) => (b.voteDate ?? "").localeCompare(a.voteDate ?? ""));
    }
  }

  // Transform to IncumbentCard[] sorted by state name
  const cards: IncumbentCard[] = senators
    .map((c: any) => {
      const state = c.state as any;
      const raceInfo = ratingByStateId.get(state.id);
      const roleTitle = (c.role_title ?? "") as string;
      const isRetiring = roleTitle.toLowerCase().includes("retiring");

      return {
        id: c.slug,
        candidateId: c.id,
        name: `${c.first_name} ${c.last_name}`,
        party: c.party as IncumbentCard["party"],
        photo: c.photo_url ?? "",
        state: state.name,
        stateAbbr: state.abbr,
        currentRole: roleTitle,
        isSpecialElection: raceInfo?.isSpecial ?? false,
        isRetiring,
        rating: raceInfo?.rating ?? null,
        website: c.website ?? undefined,
        twitter: c.twitter ?? undefined,
        bio: c.bio ?? undefined,
        votes: votesByCandidate.get(c.id) ?? [],
      };
    })
    .sort((a, b) => a.state.localeCompare(b.state));

  return cards;
}

// ─── Ballot Measures ───

export async function fetchBallotMeasures(): Promise<BallotMeasure[]> {
  const { data: cycle } = await supabase
    .from("election_cycles")
    .select("id")
    .eq("is_active", true)
    .single();

  if (!cycle) return [];

  const { data, error } = await supabase
    .from("ballot_measures")
    .select("*, state:states!inner(name, abbr)")
    .eq("cycle_id", cycle.id)
    .neq("status", "withdrawn")
    .order("state_id")
    .order("sort_order");

  // Table may not exist yet if migration hasn't been run
  if (error) {
    console.warn(`Ballot measures unavailable: ${error.message}`);
    return [];
  }

  return (data ?? []).map((bm: any) => ({
    id: bm.id,
    title: bm.title,
    shortTitle: bm.short_title,
    description: bm.description,
    category: bm.category,
    yesMeans: bm.yes_means,
    noMeans: bm.no_means,
    status: bm.status,
    stateAbbr: bm.state.abbr,
    stateName: bm.state.name,
    sourceUrl: bm.source_url,
  }));
}

// ─── Calendar Events ───

export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  const { data: cycle } = await supabase
    .from("election_cycles")
    .select("id")
    .eq("is_active", true)
    .single();

  if (!cycle) return [];

  const { data, error } = await supabase
    .from("calendar_events")
    .select("*, state:states!inner(name, abbr)")
    .eq("cycle_id", cycle.id)
    .order("event_date")
    .order("state_id");

  if (error) {
    console.warn(`Calendar events unavailable: ${error.message}`);
    return [];
  }

  return (data ?? []).map((ev: any) => ({
    id: ev.id,
    eventType: ev.event_type,
    eventDate: ev.event_date,
    title: ev.title,
    description: ev.description,
    stateAbbr: ev.state.abbr,
    stateName: ev.state.name,
    sourceUrl: ev.source_url,
  }));
}

// ─── Helpers ───

function dbCandidateToCandidate(dbCandidate: any): Candidate {
  const positions = (dbCandidate.candidate_positions ?? []).map(
    (p: any) => p.summary
  );
  const keyIssues = [
    ...new Set(
      (dbCandidate.candidate_positions ?? []).map(
        (p: any) => p.topic?.name
      ).filter(Boolean)
    ),
  ] as string[];

  return {
    id: dbCandidate.slug,
    name: `${dbCandidate.first_name} ${dbCandidate.last_name}`,
    party: dbCandidate.party as Candidate["party"],
    photo: dbCandidate.photo_url ?? "",
    isIncumbent: dbCandidate.is_incumbent,
    currentRole: dbCandidate.role_title ?? undefined,
    keyIssues: keyIssues.length > 0 ? keyIssues : [],
    positions: positions.length > 0 ? positions : undefined,
    website: dbCandidate.website ?? undefined,
    twitter: dbCandidate.twitter ?? undefined,
  };
}

// ─── FEC Filings ───

/**
 * Fetch FEC filings for the active cycle, grouped by state with primary dates.
 * Returns filings with funds_raised >= $5,000 for the specified office(s).
 * Sorted by primary date ascending (earliest primaries first).
 */
export async function fetchFecFilings(office: "S" | "H" | "both" = "S"): Promise<FilingsByState[]> {
  try {
    const { data: cycle } = await supabase
      .from("election_cycles")
      .select("id")
      .eq("is_active", true)
      .single();

    if (!cycle) return [];

    let query = supabase
      .from("fec_filings")
      .select(`*, state:states!inner(name, abbr)`)
      .eq("cycle_id", cycle.id)
      .gte("funds_raised", 5000)
      .is("promoted_to_candidate_id", null)
      .eq("is_active", true);

    if (office !== "both") {
      query = query.eq("office", office);
    }

    const { data: filings, error } = await query.order("funds_raised", { ascending: false });

    if (error || !filings) {
      console.warn(`FEC filings unavailable: ${error?.message}`);
      return [];
    }

    // Get primary dates for all states in this cycle
    const { data: primaryEvents } = await supabase
      .from("calendar_events")
      .select("state_id, event_date")
      .eq("cycle_id", cycle.id)
      .eq("event_type", "primary");

    const primaryDateByStateId = new Map<number, string>();
    for (const ev of primaryEvents ?? []) {
      primaryDateByStateId.set(ev.state_id, ev.event_date);
    }

    // Get race ratings for House districts (for battleground badges)
    const { data: races } = await supabase
      .from("races")
      .select(`
        rating,
        district:districts!inner(
          state:states!inner(abbr),
          number
        )
      `)
      .eq("cycle_id", cycle.id);

    const ratingByDistrictKey = new Map<string, string>();
    for (const race of races ?? []) {
      const dist = race.district as any;
      const stateAbbr = dist.state?.abbr;
      const districtNum = dist.number;
      if (stateAbbr && districtNum) {
        const key = `${stateAbbr}-${districtNum}`;
        ratingByDistrictKey.set(key, race.rating);
      }
    }

    // Group filings by state
    const grouped = new Map<
      string,
      {
        stateAbbr: string;
        stateName: string;
        primaryDate: string | null;
        stateId: number;
        filings: FecFiling[];
      }
    >();

    for (const row of filings) {
      const state = row.state as unknown as { name: string; abbr: string };
      const abbr = state.abbr;

      if (!grouped.has(abbr)) {
        grouped.set(abbr, {
          stateAbbr: abbr,
          stateName: state.name,
          primaryDate: primaryDateByStateId.get(row.state_id) ?? null,
          stateId: row.state_id,
          filings: [],
        });
      }

      const districtKey = row.office === "H" && row.district_number
        ? `${abbr}-${row.district_number}`
        : null;
      const rating = districtKey
        ? (ratingByDistrictKey.get(districtKey) as FecFiling["rating"]) ?? null
        : null;

      grouped.get(abbr)!.filings.push({
        id: row.id,
        fecCandidateId: row.fec_candidate_id,
        stateName: state.name,
        stateAbbr: abbr,
        firstName: row.first_name,
        lastName: row.last_name,
        party: row.party as FecFiling["party"],
        office: row.office === "H" ? "House" : "Senate",
        district: row.district_number,
        isIncumbent: row.is_incumbent,
        incumbentChallenge: (row.incumbent_challenge as "I" | "C" | "O") ?? null,
        fundsRaised: Number(row.funds_raised),
        fundsSpent: Number(row.funds_spent),
        cashOnHand: Number(row.cash_on_hand),
        primaryDate: primaryDateByStateId.get(row.state_id) ?? null,
        isPromoted: false,
        isActive: row.is_active ?? true,
        lastSyncedAt: row.last_synced_at,
        rating,
      });
    }

    // Sort by primary date ascending
    const now = new Date();
    return Array.from(grouped.values())
      .map((g) => ({
        stateAbbr: g.stateAbbr,
        stateName: g.stateName,
        primaryDate: g.primaryDate,
        daysUntilPrimary: g.primaryDate
          ? Math.ceil((new Date(g.primaryDate).getTime() - now.getTime()) / 86_400_000)
          : null,
        filings: g.filings,
      }))
      .sort((a, b) => {
        if (a.primaryDate && b.primaryDate) {
          const dateCompare = a.primaryDate.localeCompare(b.primaryDate);
          if (dateCompare !== 0) return dateCompare;
          return a.stateName.localeCompare(b.stateName);
        }
        if (a.primaryDate) return -1;
        if (b.primaryDate) return 1;
        return a.stateName.localeCompare(b.stateName);
      });
  } catch {
    console.warn("FEC filings table may not exist yet");
    return [];
  }
}

// ─── House Races ───

/**
 * Fetch competitive House races for the active cycle.
 * Mirrors fetchSenateRaces() but filters to us-house body.
 */
export async function fetchHouseRaces(): Promise<HouseRace[]> {
  try {
    const { data: cycle } = await supabase
      .from("election_cycles")
      .select("id")
      .eq("is_active", true)
      .single();

    if (!cycle) return [];

    const { data: races, error } = await supabase
      .from("races")
      .select(`
        id,
        rating,
        is_special_election,
        is_open_seat,
        primary_date,
        general_date,
        why_competitive,
        district:districts!inner(
          state_id,
          number,
          name,
          state:states!inner(name, abbr),
          body:government_bodies!inner(slug)
        ),
        race_candidates(
          is_incumbent,
          candidate:candidates!inner(
            slug,
            first_name,
            last_name,
            party,
            photo_url,
            website,
            twitter,
            role_title,
            is_incumbent,
            bioguide_id,
            fec_candidate_id,
            candidate_positions(
              summary,
              stance,
              topic:topics!inner(name, slug)
            )
          )
        )
      `)
      .eq("cycle_id", cycle.id)
      .not("rating", "is", null);

    if (error) {
      console.warn(`House races unavailable: ${error.message}`);
      return [];
    }

    // Filter to house races only
    const houseRaces = (races ?? []).filter((r) => {
      const dist = r.district as any;
      return dist.body?.slug === "us-house";
    });

    return houseRaces.map((race) => {
      const dist = race.district as any;
      const state = dist.state as any;
      const rcs = (race.race_candidates ?? []) as any[];

      const incumbentRc = rcs.find((rc) => rc.is_incumbent);
      const incumbentCandidate = incumbentRc
        ? dbCandidateToCandidate(incumbentRc.candidate)
        : undefined;

      const democrats: Candidate[] = [];
      const republicans: Candidate[] = [];
      const independents: Candidate[] = [];

      for (const rc of rcs) {
        const c = dbCandidateToCandidate(rc.candidate);
        if (c.party === "Democrat") democrats.push(c);
        else if (c.party === "Republican") republicans.push(c);
        else independents.push(c);
      }

      return {
        state: state.name,
        stateAbbr: state.abbr,
        district: dist.number ?? 0,
        rating: race.rating as HouseRace["rating"],
        isOpenSeat: race.is_open_seat,
        incumbent: incumbentCandidate,
        candidates: {
          democrat: democrats,
          republican: republicans,
          ...(independents.length > 0 ? { independent: independents } : {}),
        },
        primaryDate: race.primary_date ?? "",
        generalElectionDate: race.general_date ?? "2026-11-03",
        whyCompetitive: race.why_competitive ?? undefined,
      } satisfies HouseRace;
    });
  } catch {
    console.warn("House races table may not be ready yet");
    return [];
  }
}

// ─── Governor Races ───

/**
 * Fetch governor races for the active cycle.
 * Mirrors fetchSenateRaces() but filters to governor body.
 */
export async function fetchGovernorRaces(): Promise<GovernorRace[]> {
  try {
    const { data: cycle } = await supabase
      .from("election_cycles")
      .select("id")
      .eq("is_active", true)
      .single();

    if (!cycle) return [];

    const { data: races, error } = await supabase
      .from("races")
      .select(`
        id,
        rating,
        is_special_election,
        is_open_seat,
        primary_date,
        general_date,
        why_competitive,
        district:districts!inner(
          state_id,
          name,
          state:states!inner(name, abbr),
          body:government_bodies!inner(slug)
        ),
        race_candidates(
          is_incumbent,
          candidate:candidates!inner(
            slug,
            first_name,
            last_name,
            party,
            photo_url,
            website,
            twitter,
            role_title,
            is_incumbent,
            bioguide_id,
            fec_candidate_id,
            candidate_positions(
              summary,
              stance,
              topic:topics!inner(name, slug)
            )
          )
        )
      `)
      .eq("cycle_id", cycle.id)
      .not("rating", "is", null);

    if (error) {
      console.warn(`Governor races unavailable: ${error.message}`);
      return [];
    }

    // Filter to governor races only
    const govRaces = (races ?? []).filter((r) => {
      const dist = r.district as any;
      return dist.body?.slug === "governor";
    });

    return govRaces.map((race) => {
      const dist = race.district as any;
      const state = dist.state as any;
      const rcs = (race.race_candidates ?? []) as any[];

      const incumbentRc = rcs.find((rc) => rc.is_incumbent);
      const incumbentCandidate = incumbentRc
        ? dbCandidateToCandidate(incumbentRc.candidate)
        : undefined;

      const democrats: Candidate[] = [];
      const republicans: Candidate[] = [];
      const independents: Candidate[] = [];

      for (const rc of rcs) {
        const c = dbCandidateToCandidate(rc.candidate);
        if (c.party === "Democrat") democrats.push(c);
        else if (c.party === "Republican") republicans.push(c);
        else independents.push(c);
      }

      return {
        state: state.name,
        stateAbbr: state.abbr,
        rating: race.rating as GovernorRace["rating"],
        isOpenSeat: race.is_open_seat,
        isTermLimited: race.is_open_seat, // open seats are typically due to term limits
        incumbent: incumbentCandidate,
        candidates: {
          democrat: democrats,
          republican: republicans,
          ...(independents.length > 0 ? { independent: independents } : {}),
        },
        primaryDate: race.primary_date ?? "",
        generalElectionDate: race.general_date ?? "2026-11-03",
        whyCompetitive: race.why_competitive ?? undefined,
      } satisfies GovernorRace;
    });
  } catch {
    console.warn("Governor races table may not be ready yet");
    return [];
  }
}
