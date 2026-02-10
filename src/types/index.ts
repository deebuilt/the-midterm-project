export interface Candidate {
  id: string;
  name: string;
  party: "Democrat" | "Republican" | "Independent";
  photo: string;
  isIncumbent: boolean;
  currentRole?: string;
  previousRoles?: string[];
  keyIssues: string[];
  positions?: string[];
  website?: string;
  twitter?: string;
}

export interface SenateRace {
  state: string;
  stateAbbr: string;
  class: 2 | 3;
  isSpecialElection: boolean;
  rating:
    | "Safe R"
    | "Likely R"
    | "Lean R"
    | "Toss-up"
    | "Lean D"
    | "Likely D"
    | "Safe D";
  incumbent?: Candidate;
  isOpenSeat: boolean;
  candidates: {
    democrat: Candidate[];
    republican: Candidate[];
    independent?: Candidate[];
  };
  primaryDate: string;
  generalElectionDate: string;
  whyCompetitive?: string;
}

export interface HouseRace {
  state: string;
  stateAbbr: string;
  district: number;
  rating:
    | "Safe R"
    | "Likely R"
    | "Lean R"
    | "Toss-up"
    | "Lean D"
    | "Likely D"
    | "Safe D";
  incumbent?: Candidate;
  isOpenSeat: boolean;
  candidates: {
    democrat: Candidate[];
    republican: Candidate[];
    independent?: Candidate[];
  };
  primaryDate: string;
  generalElectionDate: string;
  whyCompetitive?: string;
  trumpMargin2024?: number;
}

export interface SwipeCard {
  id: string;
  type: "candidate" | "race" | "fact";
  candidate?: Candidate;
  race?: SenateRace | HouseRace;
  fact?: {
    title: string;
    content: string;
  };
}

export type PartyColor = {
  Democrat: string;
  Republican: string;
  Independent: string;
};

export interface NewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: "ProPublica" | "PBS NewsHour" | "The Guardian";
  categories?: string[];
  author?: string;
}

export interface BallotMeasure {
  id: number;
  title: string;
  shortTitle: string | null;
  description: string;
  category: string;
  yesMeans: string | null;
  noMeans: string | null;
  status: string;
  stateAbbr: string;
  stateName: string;
  sourceUrl: string | null;
}

export interface CalendarEvent {
  id: number;
  eventType: string;
  eventDate: string;
  title: string;
  description: string | null;
  stateAbbr: string;
  stateName: string;
  sourceUrl: string | null;
}

export interface FecFiling {
  id: number;
  fecCandidateId: string;
  stateName: string;
  stateAbbr: string;
  firstName: string;
  lastName: string;
  party: "Democrat" | "Republican" | "Independent" | "Libertarian" | "Green" | "Other";
  office: "Senate" | "House";
  district: number | null;
  isIncumbent: boolean;
  incumbentChallenge: "I" | "C" | "O" | null;
  fundsRaised: number;
  fundsSpent: number;
  cashOnHand: number;
  primaryDate: string | null;
  isPromoted: boolean;
  isActive: boolean;
  lastSyncedAt: string;
  rating: "Safe D" | "Likely D" | "Lean D" | "Toss-up" | "Lean R" | "Likely R" | "Safe R" | null;
}

export interface FilingsByState {
  stateAbbr: string;
  stateName: string;
  primaryDate: string | null;
  daysUntilPrimary: number | null;
  filings: FecFiling[];
}

export interface CongressMember {
  bioguideId: string;
  name: string;
  firstName: string;
  lastName: string;
  party: "Democrat" | "Republican" | "Independent";
  state: string;
  chamber: "senate" | "house";
  district?: number;
  senateClass?: number;
  stateRank?: "senior" | "junior";
  phone?: string;
  address?: string;
  office?: string;
  website?: string;
  contactFormUrl?: string;
  photoUrl: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  fecIds?: string[];
}

export interface GovernorRace {
  state: string;
  stateAbbr: string;
  rating:
    | "Safe R"
    | "Likely R"
    | "Lean R"
    | "Toss-up"
    | "Lean D"
    | "Likely D"
    | "Safe D";
  incumbent?: Candidate;
  isOpenSeat: boolean;
  isTermLimited: boolean;
  candidates: {
    democrat: Candidate[];
    republican: Candidate[];
    independent?: Candidate[];
  };
  primaryDate: string;
  generalElectionDate: string;
  whyCompetitive?: string;
}

export interface StateInfo {
  name: string;
  abbr: string;
  fips: string;
  houseDistricts: number;
  senateClass2Senator?: string;
  senateClass2Party?: "Democrat" | "Republican" | "Independent";
  otherSenator?: string;
  otherSenatorParty?: "Democrat" | "Republican" | "Independent";
  hasCompetitiveRace: boolean;
  governorUpIn2026?: boolean;
  currentGovernor?: string;
  currentGovernorParty?: "Democrat" | "Republican" | "Independent";
}
