/**
 * Database types — mirrors the Supabase schema.
 * These are the shapes you get back from supabase queries.
 *
 * Note: You can auto-generate these with `npx supabase gen types typescript`
 * once you have the Supabase CLI set up. For now, these are hand-written
 * to match our migration.
 */

export type Party = "Democrat" | "Republican" | "Independent" | "Libertarian" | "Green" | "Other";
export type RaceRating = "Safe D" | "Likely D" | "Lean D" | "Toss-up" | "Lean R" | "Likely R" | "Safe R";
export type CandidateStatus = "announced" | "primary_winner" | "withdrawn" | "won" | "lost" | "runoff";
export type GovtLevel = "federal" | "state" | "local";
export type Chamber = "upper" | "lower" | "executive";
export type CycleType = "midterm" | "presidential" | "special" | "primary" | "runoff";
export type Stance = "supports" | "opposes" | "mixed" | "unknown";
export type VolunteerStatus = "active" | "inactive" | "pending";
export type VolunteerRole =
  | "data_research"
  | "local_elections"
  | "ballot_measures"
  | "content_writing"
  | "social_media"
  | "community_outreach"
  | "translation";

export const VOLUNTEER_ROLE_LABELS: Record<VolunteerRole, string> = {
  data_research: "Data Research",
  local_elections: "Local Elections",
  ballot_measures: "Ballot Measures",
  content_writing: "Content Writing",
  social_media: "Social Media",
  community_outreach: "Community Outreach",
  translation: "Translation",
};

export type ContactSubject = "feedback" | "suggestion" | "candidate_inquiry" | "other";

export const CONTACT_SUBJECT_LABELS: Record<ContactSubject, string> = {
  feedback: "Feedback",
  suggestion: "Suggestion or Idea",
  candidate_inquiry: "Candidate Inquiry",
  other: "Other",
};

export interface DbContactMessage {
  id: number;
  name: string;
  email: string;
  subject: ContactSubject;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface DbState {
  id: number;
  name: string;
  abbr: string;
  fips: string;
  house_districts: number;
  current_governor: string | null;
  current_governor_party: Party | null;
  other_senator: string | null;
  other_senator_party: Party | null;
  created_at: string;
}

export interface DbGovernmentBody {
  id: number;
  name: string;
  slug: string;
  level: GovtLevel;
  chamber: Chamber | null;
  total_seats: number | null;
  majority_needed: number | null;
  term_years: number;
  member_title: string | null;
  created_at: string;
}

export interface DbElectionCycle {
  id: number;
  name: string;
  year: number;
  election_date: string;
  type: CycleType;
  is_active: boolean;
  description: string | null;
  created_at: string;
}

export interface DbDistrict {
  id: number;
  state_id: number;
  body_id: number;
  number: number | null;
  senate_class: number | null;
  name: string;
  created_at: string;
}

export interface DbCandidate {
  id: number;
  slug: string;
  first_name: string;
  last_name: string;
  party: Party;
  state_id: number | null;
  photo_url: string | null;
  website: string | null;
  twitter: string | null;
  bio: string | null;
  body_id: number | null;
  is_incumbent: boolean;
  is_retiring: boolean;
  term_start_year: number | null;
  bioguide_id: string | null;
  fec_candidate_id: string | null;
  govtrack_url: string | null;
  funds_raised: number | null;
  funds_spent: number | null;
  cash_on_hand: number | null;
  fec_financials_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbRace {
  id: number;
  cycle_id: number;
  district_id: number;
  rating: RaceRating | null;
  is_special_election: boolean;
  is_open_seat: boolean;
  primary_date: string | null;
  general_date: string | null;
  why_competitive: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbRaceCandidate {
  id: number;
  race_id: number;
  candidate_id: number;
  status: CandidateStatus;
  is_incumbent: boolean;
  created_at: string;
}

export interface DbTopic {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  created_at: string;
}

export interface DbCandidatePosition {
  id: number;
  candidate_id: number;
  topic_id: number;
  stance: Stance;
  summary: string;
  source_url: string | null;
  created_at: string;
}

export type VoteEnum = "yea" | "nay" | "abstain" | "not_voting";
export type BillChamber = "senate" | "house" | "both";

export interface DbVote {
  id: number;
  bill_name: string;
  bill_number: string | null;
  vote_date: string | null;
  topic_id: number | null;
  summary: string | null;
  source_url: string | null;
  result: string | null;
  chamber: BillChamber | null;
  created_at: string;
  updated_at: string;
}

export interface DbCandidateVote {
  id: number;
  candidate_id: number;
  vote_id: number;
  vote: VoteEnum;
  created_at: string;
}

export interface DbCycleStats {
  id: number;
  cycle_id: number;
  body_id: number;
  total_seats: number | null;
  seats_up: number | null;
  special_elections: number | null;
  current_split_r: number | null;
  current_split_d: number | null;
  majority_needed: number | null;
  dems_need_flip: number | null;
  gops_can_lose: number | null;
  battleground_count: number | null;
  retirements_r: number | null;
  retirements_d: number | null;
  extra_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type BallotMeasureStatus = "proposed" | "qualified" | "passed" | "failed" | "withdrawn";
export type BallotMeasureCategory =
  | "constitutional_amendment"
  | "statute"
  | "bond"
  | "veto_referendum"
  | "initiative"
  | "legislative_referral"
  | "other";

export const BALLOT_MEASURE_STATUS_LABELS: Record<BallotMeasureStatus, string> = {
  proposed: "Proposed",
  qualified: "Qualified",
  passed: "Passed",
  failed: "Failed",
  withdrawn: "Withdrawn",
};

export const BALLOT_MEASURE_CATEGORY_LABELS: Record<BallotMeasureCategory, string> = {
  constitutional_amendment: "Constitutional Amendment",
  statute: "Statute",
  bond: "Bond Measure",
  veto_referendum: "Veto Referendum",
  initiative: "Citizen Initiative",
  legislative_referral: "Legislative Referral",
  other: "Other",
};

export interface DbBallotMeasure {
  id: number;
  cycle_id: number;
  state_id: number;
  title: string;
  slug: string;
  short_title: string | null;
  description: string;
  category: BallotMeasureCategory;
  yes_means: string | null;
  no_means: string | null;
  status: BallotMeasureStatus;
  election_date: string | null;
  source_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type CalendarEventType =
  | "primary"
  | "runoff"
  | "general"
  | "filing_deadline"
  | "registration_deadline"
  | "early_voting_start"
  | "early_voting_end"
  | "other";

export const CALENDAR_EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  primary: "Primary Election",
  runoff: "Runoff Election",
  general: "General Election",
  filing_deadline: "Filing Deadline",
  registration_deadline: "Registration Deadline",
  early_voting_start: "Early Voting Starts",
  early_voting_end: "Early Voting Ends",
  other: "Other",
};

export interface DbCalendarEvent {
  id: number;
  cycle_id: number;
  state_id: number;
  event_type: CalendarEventType;
  event_date: string;
  title: string;
  description: string | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbFecFiling {
  id: number;
  fec_candidate_id: string;
  cycle_id: number;
  state_id: number;
  name: string;
  first_name: string;
  last_name: string;
  party: string;
  office: "S" | "H";
  district_number: number | null;
  is_incumbent: boolean;
  funds_raised: number;
  funds_spent: number;
  cash_on_hand: number;
  promoted_to_candidate_id: number | null;
  is_active: boolean;
  incumbent_challenge: string | null;
  deactivated_at: string | null;
  fec_candidate_status: string | null;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface DbSyncLog {
  id: number;
  sync_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  states_synced: string[] | null;
  filings_created: number;
  filings_updated: number;
  filings_deactivated: number;
  api_requests: number;
  error_message: string | null;
  details: Record<string, unknown> | null;
  triggered_rebuild: boolean;
}

export interface DbAutomationConfig {
  id: number;
  fec_sync_enabled: boolean;
  lookahead_days: number;
  lookback_days: number;
  min_funds_raised: number;
  major_parties_only: boolean;
  active_only: boolean;
  vercel_deploy_hook: string | null;
  webhook_secret: string | null;
  last_sync_at: string | null;
  updated_at: string;
}

export interface DbVolunteer {
  id: number;
  email: string;
  name: string;
  auth_id: string | null;
  state_id: number | null;
  interests: string[] | null;
  roles: string[] | null;
  experience: string | null;
  availability: string | null;
  status: VolunteerStatus;
  notes: string | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
}

