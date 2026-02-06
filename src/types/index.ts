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
  };
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
