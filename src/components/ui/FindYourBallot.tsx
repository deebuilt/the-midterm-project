import { useState } from "react";
import type { StateInfo } from "../../types";

interface FindYourBallotProps {
  states: StateInfo[];
  primaryDates: Record<string, string>;
}

const SOS_URLS: Record<string, string> = {
  AL: "https://www.sos.alabama.gov/alabama-votes",
  AK: "https://www.elections.alaska.gov/",
  AZ: "https://azsos.gov/elections",
  AR: "https://www.sos.arkansas.gov/elections",
  CA: "https://www.sos.ca.gov/elections",
  CO: "https://www.sos.state.co.us/pubs/elections/",
  CT: "https://portal.ct.gov/sots/election-services",
  DE: "https://elections.delaware.gov/",
  FL: "https://dos.fl.gov/elections/",
  GA: "https://sos.ga.gov/elections-division",
  HI: "https://elections.hawaii.gov/",
  ID: "https://sos.idaho.gov/elect/",
  IL: "https://www.elections.il.gov/",
  IN: "https://www.in.gov/sos/elections/",
  IA: "https://sos.iowa.gov/elections/",
  KS: "https://sos.ks.gov/elections/",
  KY: "https://elect.ky.gov/",
  LA: "https://www.sos.la.gov/ElectionsAndVoting/",
  ME: "https://www.maine.gov/sos/cec/elec/",
  MD: "https://elections.maryland.gov/",
  MA: "https://www.sec.state.ma.us/divisions/elections/",
  MI: "https://mvic.sos.state.mi.us/",
  MN: "https://www.sos.mn.gov/elections-voting/",
  MS: "https://www.sos.ms.gov/elections-voting",
  MO: "https://www.sos.mo.gov/elections",
  MT: "https://sosmt.gov/elections/",
  NE: "https://sos.nebraska.gov/elections",
  NV: "https://www.nvsos.gov/sos/elections",
  NH: "https://www.sos.nh.gov/elections",
  NJ: "https://nj.gov/state/elections/",
  NM: "https://www.sos.nm.gov/voting-and-elections/",
  NY: "https://www.elections.ny.gov/",
  NC: "https://www.ncsbe.gov/",
  ND: "https://vip.sos.nd.gov/",
  OH: "https://www.ohiosos.gov/elections/",
  OK: "https://oklahoma.gov/elections.html",
  OR: "https://sos.oregon.gov/voting/Pages/default.aspx",
  PA: "https://www.vote.pa.gov/",
  RI: "https://vote.ri.gov/",
  SC: "https://www.scvotes.gov/",
  SD: "https://sdsos.gov/elections-voting/",
  TN: "https://sos.tn.gov/elections",
  TX: "https://www.sos.texas.gov/elections/",
  UT: "https://voteinfo.utah.gov/",
  VT: "https://sos.vermont.gov/elections/",
  VA: "https://www.elections.virginia.gov/",
  WA: "https://www.sos.wa.gov/elections/",
  WV: "https://sos.wv.gov/elections/",
  WI: "https://elections.wi.gov/",
  WY: "https://sos.wyo.gov/Elections/",
  DC: "https://www.dcboe.org/",
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function FindYourBallot({ states, primaryDates }: FindYourBallotProps) {
  const [selectedAbbr, setSelectedAbbr] = useState<string>("");

  const sortedStates = [...states].sort((a, b) => a.name.localeCompare(b.name));
  const state = sortedStates.find((s) => s.abbr === selectedAbbr);
  const primaryDate = selectedAbbr ? primaryDates[selectedAbbr] : undefined;
  const sosUrl = selectedAbbr ? SOS_URLS[selectedAbbr] : undefined;

  return (
    <div>
      {/* State selector */}
      <div className="max-w-md">
        <label htmlFor="state-select" className="block text-sm font-semibold text-slate-700 mb-2">
          Select your state
        </label>
        <select
          id="state-select"
          value={selectedAbbr}
          onChange={(e) => setSelectedAbbr(e.target.value)}
          className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-base focus:border-navy focus:outline-none bg-white"
        >
          <option value="">Choose a state...</option>
          {sortedStates.map((s) => (
            <option key={s.abbr} value={s.abbr}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Results */}
      {state && (
        <div className="mt-8 space-y-6">
          {/* Primary date callout */}
          {primaryDate && (
            <div className="bg-tossup/10 border border-tossup/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="font-bold text-slate-800">
                    {state.name} Primary: {formatDate(primaryDate)}
                  </p>
                  {daysUntil(primaryDate) > 0 ? (
                    <p className="text-sm text-slate-600 mt-0.5">
                      That's <span className="font-semibold">{daysUntil(primaryDate)} days away</span>.
                      Primary elections determine which candidates appear on the general election ballot in November.
                    </p>
                  ) : (
                    <p className="text-sm text-slate-600 mt-0.5">
                      This primary has already passed. The general election is November 3, 2026.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* What's on your ballot */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-navy text-white px-5 py-3">
              <h2 className="text-lg font-bold">What's on your ballot in {state.name}</h2>
            </div>

            <div className="divide-y divide-slate-200">
              {/* Senate */}
              <BallotItem
                office="U.S. Senate"
                active={!!state.senateClass2Senator || state.hasCompetitiveRace}
                description={
                  state.senateClass2Senator
                    ? `${state.senateClass2Senator} (${state.senateClass2Party === "Democrat" ? "D" : state.senateClass2Party === "Republican" ? "R" : "I"}) holds this seat. Senators serve 6-year terms.`
                    : state.hasCompetitiveRace
                      ? "This seat is up for election. Senators serve 6-year terms."
                      : "No Senate seat up in your state this year. Senate terms are 6 years, so not every state votes for Senator every election."
                }
                links={
                  (state.senateClass2Senator || state.hasCompetitiveRace)
                    ? [{
                      label: "Research Senate candidates",
                      url: `https://ballotpedia.org/United_States_Senate_election_in_${state.name.replace(/ /g, "_")},_2026`,
                    }]
                    : []
                }
              />

              {/* House */}
              <BallotItem
                office="U.S. House of Representatives"
                active
                description={
                  state.houseDistricts === 1
                    ? `${state.name} has 1 at-large seat — one representative for the whole state. Representatives serve 2-year terms, so this is always on your ballot.`
                    : `${state.name} has ${state.houseDistricts} congressional districts. You vote only in your district. Representatives serve 2-year terms.`
                }
                links={[
                  ...(state.houseDistricts > 1
                    ? [{ label: "Find your district", url: "https://www.house.gov/representatives/find-your-representative" }]
                    : []
                  ),
                  {
                    label: "Research House candidates",
                    url: `https://ballotpedia.org/United_States_House_of_Representatives_elections_in_${state.name.replace(/ /g, "_")},_2026`,
                  },
                ]}
              />

              {/* Governor */}
              <BallotItem
                office="Governor"
                active={!!state.governorUpIn2026}
                description={
                  state.governorUpIn2026
                    ? state.currentGovernor
                      ? `Gov. ${state.currentGovernor} (${state.currentGovernorParty === "Democrat" ? "D" : state.currentGovernorParty === "Republican" ? "R" : "I"}) currently holds this office. Governors serve 4-year terms.`
                      : "This governor's seat is up for election. Governors serve 4-year terms."
                    : "Not up for election in 2026. Governors serve 4-year terms."
                }
                links={
                  state.governorUpIn2026
                    ? [{
                      label: "Research governor candidates",
                      url: `https://ballotpedia.org/${state.name.replace(/ /g, "_")}_gubernatorial_election,_2026`,
                    }]
                    : []
                }
              />

              {/* Ballot measures */}
              <BallotItem
                office="Ballot Measures"
                active
                status="varies"
                description="Ballot measures are yes-or-no votes on new laws, constitutional amendments, or policy changes. These vary by state and are finalized closer to the election. Check your state's official ballot for what's on yours."
                links={[{
                  label: `See ${state.name} ballot measures`,
                  url: `https://ballotpedia.org/${state.name.replace(/ /g, "_")}_2026_ballot_measures`,
                }]}
              />
            </div>
          </div>

          {/* Research your candidates */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
            <h3 className="text-base font-bold text-slate-800 mb-3">Research Your Candidates</h3>
            <p className="text-sm text-slate-600 mb-4">
              Use these trusted, nonpartisan resources to learn about the candidates on your ballot:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <ResourceLink
                name="Vote411"
                org="League of Women Voters"
                description="Personalized ballot lookup by address"
                url="https://www.vote411.org/ballot"
              />
              {sosUrl && (
                <ResourceLink
                  name={`${state.name} Elections`}
                  org="Secretary of State"
                  description="Official state election information"
                  url={sosUrl}
                />
              )}
              <ResourceLink
                name="Ballotpedia"
                org="Nonpartisan encyclopedia"
                description="Sample ballot lookup and candidate info"
                url="https://ballotpedia.org/Sample_Ballot_Lookup"
              />
              <ResourceLink
                name="Preview Your Ballot"
                org="The Midterm Project"
                description="Interactive ballot map — plan your vote"
                url={`/map?state=${state.abbr}`}
                internal
              />
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!selectedAbbr && (
        <div className="mt-12 text-center text-slate-400">
          <p className="text-5xl mb-3">🗳️</p>
          <p className="text-lg font-medium">Choose a state above to get started</p>
          <p className="text-sm mt-1">
            Or go straight to the{" "}
            <a href="/map" className="text-navy underline underline-offset-2 hover:decoration-2">
              interactive ballot map
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

// --- Ballot item row ---

function BallotItem({
  office,
  active,
  status,
  description,
  links,
}: {
  office: string;
  active: boolean;
  status?: "varies";
  description: string;
  links: { label: string; url: string }[];
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-slate-800">{office}</h3>
            {status === "varies" ? (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-tossup/20 text-tossup px-1.5 py-0.5 rounded">
                Varies by state
              </span>
            ) : active ? (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-navy text-white px-1.5 py-0.5 rounded">
                On your ballot
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Not this year
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
          {links.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-navy font-medium underline underline-offset-2 hover:decoration-2"
                >
                  {link.label} →
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Resource link card ---

function ResourceLink({
  name,
  org,
  description,
  url,
  internal,
}: {
  name: string;
  org: string;
  description: string;
  url: string;
  internal?: boolean;
}) {
  return (
    <a
      href={url}
      target={internal ? undefined : "_blank"}
      rel={internal ? undefined : "noopener noreferrer"}
      className="block p-3 bg-white border border-slate-200 rounded-lg hover:border-navy/40 hover:shadow-sm transition-all"
    >
      <p className="text-sm font-semibold text-slate-800">{name}</p>
      <p className="text-[11px] text-slate-400 font-medium">{org}</p>
      <p className="text-xs text-slate-500 mt-1">{description}</p>
    </a>
  );
}
