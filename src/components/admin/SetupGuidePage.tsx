import { useState } from "react";
import { Typography, Tag } from "antd";
import {
  ArrowLeftOutlined,
  LinkOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  FlagOutlined,
  BankOutlined,
  SwapOutlined,
  ScheduleOutlined,
  FileSearchOutlined,
  TeamOutlined,
  FileTextOutlined,
  RightOutlined,
  DatabaseOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import type { AdminRoute } from "./AdminDashboard";
import { useIsMobile } from "./useIsMobile";

const { Title, Paragraph, Text } = Typography;

type GuidePage =
  | "landing"
  | "homepage"
  | "map"
  | "senate"
  | "house"
  | "explore"
  | "calendar"
  | "whos-running"
  | "volunteer"
  | "static";

interface Props {
  navigate: (route: AdminRoute) => void;
  isMobile?: boolean;
}

// -- Colors -------------------------------------------------------------------
const NAVY = "#1E293B";
const BLUE = "#2563EB";
const AMBER = "#F59E0B";
const GREEN = "#059669";
const RED = "#DC2626";
const PURPLE = "#7C3AED";
const SLATE = "#475569";

// -- Shared building blocks ---------------------------------------------------

function PageHeader({ icon, iconBg, iconColor, title, url }: { icon: React.ReactNode; iconBg: string; iconColor: string; title: string; url?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: iconColor }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: NAVY }}>{title}</div>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#EFF6FF", color: BLUE, padding: "4px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, textDecoration: "none", border: `1px solid ${BLUE}33` }}>
            <LinkOutlined /> View live page
          </a>
        )}
      </div>
    </div>
  );
}

function AdminTag({ route, label, navigate, color }: { route: AdminRoute; label: string; navigate: (r: AdminRoute) => void; color: string }) {
  return (
    <Tag color={color} onClick={() => navigate(route)} style={{ cursor: "pointer", fontSize: 13, padding: "3px 12px", fontWeight: 600, marginBottom: 4 }}>
      {label} <RightOutlined style={{ fontSize: 10, marginLeft: 4 }} />
    </Tag>
  );
}

function Callout({ color, bg, children }: { color: string; bg: string; children: React.ReactNode }) {
  return (
    <div style={{ background: bg, borderLeft: `4px solid ${color}`, padding: "12px 16px", borderRadius: "0 8px 8px 0", marginTop: 16, marginBottom: 16, fontSize: 14, lineHeight: 1.7 }}>
      {children}
    </div>
  );
}

function FlowArrow() {
  return <ArrowRightOutlined style={{ color: "#CBD5E1", fontSize: 14, margin: "0 4px" }} />;
}

/** Visual mapping row: "What you see → Where it comes from → How to change it" */
function MappingRow({ see, from, how, navigate, isMobile }: { see: React.ReactNode; from: React.ReactNode; how: React.ReactNode; navigate: (r: AdminRoute) => void; isMobile?: boolean }) {
  if (isMobile) {
    return (
      <div style={{ borderBottom: "1px solid #F1F5F9", padding: "14px 0" }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: BLUE, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>What you see</div>
          <div style={{ fontSize: 14, color: NAVY, lineHeight: 1.6 }}>{see}</div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Where it comes from</div>
          <div style={{ fontSize: 14, color: NAVY, lineHeight: 1.6 }}>{from}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: PURPLE, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>How to change it</div>
          <div style={{ fontSize: 14, color: NAVY, lineHeight: 1.6 }}>{how}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #F1F5F9", padding: "14px 0", alignItems: "flex-start" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: BLUE, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>What you see</div>
        <div style={{ fontSize: 14, color: NAVY, lineHeight: 1.6 }}>{see}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingLeft: 16, borderLeft: "1px solid #E2E8F0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: GREEN, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>Where it comes from</div>
        <div style={{ fontSize: 14, color: NAVY, lineHeight: 1.6 }}>{from}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingLeft: 16, borderLeft: "1px solid #E2E8F0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: PURPLE, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>How to change it</div>
        <div style={{ fontSize: 14, color: NAVY, lineHeight: 1.6 }}>{how}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HOMEPAGE GUIDE
// ---------------------------------------------------------------------------
function GuideHomepage({ navigate, isMobile }: Props) {
  return (
    <div>
      <PageHeader icon={<HomeOutlined />} iconBg="#DBEAFE" iconColor={BLUE} title="Homepage" url="/" />
      <Paragraph style={{ fontSize: 15, lineHeight: 1.8, color: SLATE }}>
        The first page visitors see. It's designed to orient them: how long until the election, where we are in the process, what's at stake, and what's in the news.
      </Paragraph>

      <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 12, marginTop: 28 }}>Page Sections (top to bottom)</div>

      <MappingRow navigate={navigate} isMobile={isMobile}
        see={<><strong>"Know your ballot. Own your vote."</strong><br />Hero section with countdown timer showing days until Nov 3, 2026</>}
        from={<>Countdown date is hardcoded in the component. No database.</>}
        how={<>Edit <code>src/components/ui/Countdown.tsx</code> to change the target date.</>}
      />
      <MappingRow navigate={navigate} isMobile={isMobile}
        see={<><strong>"WHERE WE ARE"</strong><br />Election Tracker — 5-phase stepper showing Filing → Primaries → Campaign → Election Day → Results</>}
        from={<>Current phase is detected automatically by today's date (client-side). No database.</>}
        how={<>Phase dates are defined inside <code>ElectionTracker.tsx</code>. The tracker updates itself.</>}
      />
      <MappingRow navigate={navigate} isMobile={isMobile}
        see={<><strong>"WHAT'S AT STAKE"</strong><br />Two side-by-side cards — "The Senate" and "The House" — showing current D/R split, seats up, and seats needed for majority</>}
        from={<><code>cycle_stats</code> table — one row for Senate, one for House, each with current split and extra data</>}
        how={<>Go to <AdminTag route="cycles" label="Election Cycles" navigate={navigate} color="blue" /> → click "Edit Stats" on the active cycle → update the numbers for Senate or House (current Dem/GOP count, seats up, retirements, battlegrounds)</>}
      />
      <MappingRow navigate={navigate} isMobile={isMobile}
        see={<><strong>"LATEST HEADLINES"</strong><br />3 news items from ProPublica, PBS NewsHour, The Guardian</>}
        from={<>External RSS feeds fetched at build time. No database.</>}
        how={<>Headlines refresh automatically on each Vercel deploy. No admin action needed.</>}
      />
      <MappingRow navigate={navigate} isMobile={isMobile}
        see={<><strong>"THE BASICS"</strong><br />4 cards linking to learn pages: How Congress Works, Senate 101, House 101, What Are Midterms?</>}
        from={<>Hardcoded links in the Astro template. No database.</>}
        how={<>Edit <code>src/pages/index.astro</code> to change the cards or links.</>}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAP GUIDE
// ---------------------------------------------------------------------------
function GuideMap({ navigate, isMobile }: Props) {
  return (
    <div>
      <PageHeader icon={<EnvironmentOutlined />} iconBg="#DCFCE7" iconColor={GREEN} title="Interactive Map" url="/map" />
      <Paragraph style={{ fontSize: 15, lineHeight: 1.8, color: SLATE }}>
        The most complex page on the site. It pulls data from <strong>4 different admin pages</strong>. The map colors come from race ratings, the ballot panel shows candidates and measures, and state info comes from the states table.
      </Paragraph>

      <Callout color={AMBER} bg="#FFFBEB">
        <strong>How the map colors work:</strong> Each state on the map is colored by its Senate race rating. "Safe R" = dark red, "Lean R" = light red, "Toss-up" = amber, "Lean D" = light blue, "Safe D" = dark blue. States with no Senate race this cycle are gray. Change the color by changing the rating in the Races admin page.
      </Callout>

      <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 12, marginTop: 28 }}>The Map Itself</div>
      <MappingRow navigate={navigate} isMobile={isMobile}
        see={<><strong>State colors</strong> on the map (red/blue/amber/gray)</>}
        from={<><code>races</code> table → <code>rating</code> field (e.g., "Lean R", "Toss-up", "Safe D")</>}
        how={<>Go to <AdminTag route="races" label="Races" navigate={navigate} color="red" /> → find the state's Senate race → change the <strong>rating</strong> dropdown</>}
      />

      <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 12, marginTop: 28 }}>The Ballot Panel (opens when you click a state)</div>
      <Paragraph style={{ fontSize: 14, color: SLATE }}>The ballot panel mimics a real ballot with black section headers. Here's each section:</Paragraph>

      <div style={{ background: NAVY, color: "white", padding: "8px 14px", borderRadius: "8px 8px 0 0", fontWeight: 700, fontSize: 13, letterSpacing: 0.5, marginTop: 16 }}>FEDERAL OFFICES</div>
      <div style={{ border: "1px solid #E2E8F0", borderTop: "none", padding: 16, borderRadius: "0 0 8px 8px", marginBottom: 16 }}>
        <MappingRow navigate={navigate} isMobile={isMobile}
          see={<><strong>"United States Senator"</strong><br />Candidate names with party bubbles (tappable). Rating badge. "VOTE FOR ONE" label.</>}
          from={<><code>races</code> table (the race entry for this state) + <code>candidates</code> table (linked via <code>race_candidates</code> join table)</>}
          how={<>
            <strong>To add/change candidates:</strong> Go to <AdminTag route="candidates" label="Candidates" navigate={navigate} color="purple" /> to create the candidate (name, party, photo), then go to <AdminTag route="races" label="Races" navigate={navigate} color="red" /> to assign them to the race.<br /><br />
            <strong>To change the rating badge:</strong> Go to <AdminTag route="races" label="Races" navigate={navigate} color="red" /> and change the rating dropdown.
          </>}
        />
        <MappingRow navigate={navigate} isMobile={isMobile}
          see={<><strong>"United States Representative"</strong><br />Shows explanatory text about districts. No candidates listed yet.</>}
          from={<>House races exist in the <code>races</code> + <code>districts</code> tables (body = us-house) but this section doesn't render individual candidates yet.</>}
          how={<>House candidate display is not yet built. The schema is ready — the public page needs a future update.</>}
        />
      </div>

      <div style={{ background: NAVY, color: "white", padding: "8px 14px", borderRadius: "8px 8px 0 0", fontWeight: 700, fontSize: 13, letterSpacing: 0.5 }}>STATE OFFICES</div>
      <div style={{ border: "1px solid #E2E8F0", borderTop: "none", padding: 16, borderRadius: "0 0 8px 8px", marginBottom: 16 }}>
        <MappingRow navigate={navigate} isMobile={isMobile}
          see={<><strong>"Governor"</strong><br />Shows current governor name. "VOTE FOR ONE" or "NOT THIS YEAR" depending on whether the seat is up in 2026.</>}
          from={<><code>states</code> table → <code>current_governor</code> column. Whether the seat is up comes from a hardcoded list in <code>queries.ts</code>.</>}
          how={<>Go to <AdminTag route="states" label="States" navigate={navigate} color="green" /> → edit the state → update the <strong>Governor</strong> field.</>}
        />
      </div>

      <div style={{ background: NAVY, color: "white", padding: "8px 14px", borderRadius: "8px 8px 0 0", fontWeight: 700, fontSize: 13, letterSpacing: 0.5 }}>BALLOT MEASURES</div>
      <div style={{ border: "1px solid #E2E8F0", borderTop: "none", padding: 16, borderRadius: "0 0 8px 8px", marginBottom: 16 }}>
        <MappingRow navigate={navigate} isMobile={isMobile}
          see={<><strong>Ballot measure rows</strong><br />Each measure has a title, description, status badge, and expandable Yes/No explanation with tappable bubbles.</>}
          from={<><code>ballot_measures</code> table — only measures with status <strong>"qualified"</strong> appear on the public ballot.</>}
          how={<>Go to <AdminTag route="ballot-measures" label="Ballot Measures" navigate={navigate} color="orange" /> → create a measure for the state → set status to <strong>"qualified"</strong>. Fill in the title, description, yes_means, and no_means fields.</>}
        />
      </div>

      <Callout color={NAVY} bg="#F1F5F9">
        <strong>Ballot selections:</strong> When visitors tap a candidate bubble, it fills solid with the party color and shows a "YOUR PICK" badge. These selections are saved in the visitor's browser (localStorage key: <code>tmp-ballot-selections</code>). There is no backend for this — it's purely client-side.
      </Callout>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SENATE GUIDE
// ---------------------------------------------------------------------------
function GuideSenate({ navigate, isMobile }: Props) {
  return (
    <div>
      <PageHeader icon={<FlagOutlined />} iconBg="#FEE2E2" iconColor={RED} title="Senate Races" url="/senate" />
      <Paragraph style={{ fontSize: 15, lineHeight: 1.8, color: SLATE }}>
        Shows all 33 Class II Senate seats plus 2 special elections (Ohio and Florida). Races are grouped into sections by their rating. The rating you set in the admin directly controls which section a race appears in.
      </Paragraph>

      <Callout color={RED} bg="#FEF2F2">
        <strong>Key concept:</strong> The <strong>rating</strong> you assign to a race in the Races admin page determines which section it shows up in on this page. Change the rating, and the race moves to a different section.
      </Callout>

      <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 12, marginTop: 28 }}>Page Sections (top to bottom)</div>

      <MappingRow navigate={navigate} isMobile={isMobile}
        see={<><strong>Senate Guide wizard</strong><br />"New to Senate elections? Take a 2-minute walkthrough..." — expandable 5-step tutorial covering The Big Picture, Regular vs Special, Current Score, Race Ratings, and Follow the Seats</>}
        from={<>Mostly hardcoded educational content inside <code>SenateGuide.tsx</code>. The "Current Score" step uses <code>cycle_stats</code> data (current D/R split).</>}
        how={<>The split numbers come from <AdminTag route="cycles" label="Election Cycles" navigate={navigate} color="blue" /> → edit the active cycle → Senate stats. The educational text is in the component code.</>}
      />
      <MappingRow navigate={navigate} isMobile={isMobile}
        see={<><strong>Path to Majority</strong><br />Visual bar showing current D/R split + cards saying "Dems need to flip X seats" / "GOP can lose X seats"</>}
        from={<><code>cycle_stats</code> table → Senate row → <code>current_dem</code>, <code>current_gop</code>, and <code>extra_data</code> JSON field</>}
        how={<>Go to <AdminTag route="cycles" label="Election Cycles" navigate={navigate} color="blue" /> → edit the active cycle → update the Senate current split and path-to-majority numbers</>}
      />
      <MappingRow navigate={navigate} isMobile={isMobile}
        see={<><strong>"Toss-up Races"</strong><br />Grid of race cards for races rated "Toss-up"</>}
        from={<><code>races</code> table where <code>rating = 'Toss-up'</code></>}
        how={<>A race appears here when you set its rating to "Toss-up" in <AdminTag route="races" label="Races" navigate={navigate} color="red" /></>}
      />
      <MappingRow navigate={navigate} isMobile={isMobile}
        see={<><strong>"Competitive Races"</strong><br />Grid of race cards for races rated "Lean R" or "Lean D"</>}
        from={<><code>races</code> table where rating is "Lean R" or "Lean D"</>}
        how={<>Set a race's rating to "Lean R" or "Lean D" in <AdminTag route="races" label="Races" navigate={navigate} color="red" /> to move it here</>}
      />
      <MappingRow navigate={navigate} isMobile={isMobile}
        see={<><strong>"Special Elections"</strong><br />Cards for Ohio and Florida (Class III seats with appointed senators)</>}
        from={<><code>races</code> table where <code>is_special_election = true</code></>}
        how={<>Toggle <code>is_special_election</code> on a race in <AdminTag route="races" label="Races" navigate={navigate} color="red" /></>}
      />
      <MappingRow navigate={navigate} isMobile={isMobile}
        see={<><strong>"Senate Retirements"</strong><br />Cards for senators not running again (Tuberville, Tillis, Peters, etc.)</>}
        from={<><code>races</code> table where <code>is_open_seat = true</code> + candidate data showing no incumbent running</>}
        how={<>Mark a race as <code>is_open_seat</code> in <AdminTag route="races" label="Races" navigate={navigate} color="red" /></>}
      />
      <MappingRow navigate={navigate} isMobile={isMobile}
        see={<><strong>"All 33 Senate Seats Up in 2026"</strong><br />Two grids: Republican-held seats and Democrat-held seats, showing every Class II race</>}
        from={<>All <code>races</code> with Senate districts (Class II), split by incumbent party</>}
        how={<>These are all the Senate races in the system. Each card shows the candidate name and "why competitive" text if set. Edit the race in <AdminTag route="races" label="Races" navigate={navigate} color="red" /> to add or update the <strong>why_competitive</strong> field.</>}
      />

      <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 12, marginTop: 28 }}>What Each Race Card Shows</div>
      <Paragraph style={{ fontSize: 14, color: SLATE, lineHeight: 1.8 }}>
        Each card on this page shows: state name, rating badge, incumbent name, challenger name (if assigned), and the "why competitive" text. All of this comes from:
      </Paragraph>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
        <AdminTag route="races" label="Races (rating, competitive text, open seat)" navigate={navigate} color="red" />
        <AdminTag route="candidates" label="Candidates (names, party, websites)" navigate={navigate} color="purple" />
        <AdminTag route="cycles" label="Cycles (overall split numbers)" navigate={navigate} color="blue" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HOUSE GUIDE
// ---------------------------------------------------------------------------
function GuideHouse({ navigate, isMobile }: Props) {
  return (
    <div>
      <PageHeader icon={<BankOutlined />} iconBg="#E0E7FF" iconColor="#4F46E5" title="House Overview" url="/house" />
      <Paragraph style={{ fontSize: 15, lineHeight: 1.8, color: SLATE }}>
        A simple overview page — it only shows aggregate numbers, not individual districts or candidates.
      </Paragraph>

      <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 12, marginTop: 28 }}>What's on This Page</div>

      <MappingRow navigate={navigate} isMobile={isMobile}
        see={<><strong>Current D/R split</strong>, number of retirements, number of battleground districts</>}
        from={<><code>cycle_stats</code> table → House row → <code>current_dem</code>, <code>current_gop</code>, and <code>extra_data</code> JSON (retirements, battlegrounds)</>}
        how={<>Go to <AdminTag route="cycles" label="Election Cycles" navigate={navigate} color="blue" /> → edit the active cycle → update House stats: current Dem/GOP count, retirements number, and battleground district count</>}
      />

      <Callout color={AMBER} bg="#FFFBEB">
        <strong>About individual House races:</strong> The database already supports them. The <code>races</code> table works with <code>districts</code> that have <code>body_id = us-house</code> and a <code>number</code> field for the district. You can create House races right now in the <AdminTag route="races" label="Races" navigate={navigate} color="red" /> admin page. They just don't have a public page to display them yet. <strong>No new database table is needed</strong> — the schema handles it.
      </Callout>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EXPLORE GUIDE
// ---------------------------------------------------------------------------
function GuideExplore({ navigate, isMobile }: Props) {
  return (
    <div>
      <PageHeader icon={<SwapOutlined />} iconBg="#FEF3C7" iconColor={AMBER} title="Explore (Swipe Cards)" url="/explore" />
      <Paragraph style={{ fontSize: 15, lineHeight: 1.8, color: SLATE }}>
        Tinder-style cards for competitive races. Swipe right/left to browse. Only competitive races appear here — the rating acts as the filter.
      </Paragraph>

      <Callout color={AMBER} bg="#FFFBEB">
        <strong>Which races become swipe cards?</strong> Only races with rating <strong>"Toss-up"</strong>, <strong>"Lean R"</strong>, or <strong>"Lean D"</strong>. Safe and Likely races are excluded. Plus 5 hardcoded educational fact cards (not in the database).
      </Callout>

      <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 12, marginTop: 28 }}>What Each Swipe Card Shows</div>

      <MappingRow navigate={navigate} isMobile={isMobile}
        see={<><strong>State name and race rating badge</strong></>}
        from={<><code>races</code> table → state name from joined <code>districts</code>/<code>states</code>, rating from the race</>}
        how={<>Change the rating in <AdminTag route="races" label="Races" navigate={navigate} color="red" /> — set to Toss-up, Lean R, or Lean D to include, anything else to exclude</>}
      />
      <MappingRow navigate={navigate} isMobile={isMobile}
        see={<><strong>Candidate photos, names, party labels, and key issue positions</strong></>}
        from={<><code>candidates</code> table (name, party, photo URL) + <code>candidate_positions</code> table (issue stances linked to <code>topics</code>)</>}
        how={<>Go to <AdminTag route="candidates" label="Candidates" navigate={navigate} color="purple" /> → add a photo URL, write a bio, and add issue positions in the Positions tab of the candidate drawer</>}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// CALENDAR GUIDE
// ---------------------------------------------------------------------------
function GuideCalendar({ navigate, isMobile }: Props) {
  return (
    <div>
      <PageHeader icon={<ScheduleOutlined />} iconBg="#D1FAE5" iconColor={GREEN} title="Election Calendar" url="/calendar" />
      <Paragraph style={{ fontSize: 15, lineHeight: 1.8, color: SLATE }}>
        Full calendar view with colored dots showing primary dates, filing deadlines, registration deadlines, early voting periods, and Election Day. Visitors can filter by state and click any date to see details.
      </Paragraph>

      <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 12, marginTop: 28 }}>How It Works</div>

      <MappingRow navigate={navigate} isMobile={isMobile}
        see={<><strong>Colored dots on calendar dates</strong><br />Each dot color = a different event type. Blue = primary, red = filing deadline, green = early voting, etc.</>}
        from={<><code>calendar_events</code> table. Each event has a <code>state_id</code>, <code>event_type</code> (primary, runoff, filing_deadline, registration_deadline, early_voting_start, early_voting_end, general, other), and <code>event_date</code>.</>}
        how={<>Go to <AdminTag route="calendar-events" label="Calendar Events" navigate={navigate} color="green" /> → add events by selecting the state, event type, and date. The color is determined by the event type automatically.</>}
      />
      <MappingRow navigate={navigate} isMobile={isMobile}
        see={<><strong>State filter dropdown</strong> + <strong>date detail panel</strong> (click a date to see events)</>}
        from={<>Same <code>calendar_events</code> table — the state filter narrows the query, the detail panel shows all events for the clicked date</>}
        how={<>Same admin page. Add more events to make dates richer.</>}
      />

      <Callout color={GREEN} bg="#ECFDF5">
        <strong>Already seeded:</strong> All 50 state primary dates from NCSL data + general election (Nov 3) for every state are already in the database. What you still need to add: filing deadlines, voter registration deadlines, and early voting start/end dates as states announce them.
      </Callout>
    </div>
  );
}

// ---------------------------------------------------------------------------
// WHO'S RUNNING GUIDE
// ---------------------------------------------------------------------------
function GuideWhosRunning({ navigate, isMobile }: Props) {
  return (
    <div>
      <PageHeader icon={<FileSearchOutlined />} iconBg="#EDE9FE" iconColor={PURPLE} title="Who's Running" url="/whos-running" />
      <Paragraph style={{ fontSize: 15, lineHeight: 1.8, color: SLATE }}>
        Shows everyone who has filed with the FEC and raised at least $5,000. This page is a <strong>staging area</strong> — the candidates listed here are raw FEC filings that haven't been promoted to the main candidates table yet.
      </Paragraph>

      <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 12, marginTop: 28 }}>What Visitors See</div>

      <MappingRow navigate={navigate} isMobile={isMobile}
        see={<><strong>Filter bar</strong><br />State dropdown, sort options (by primary date, state name, or most candidates), expand/collapse all</>}
        from={<>Client-side filtering over the <code>fec_filings</code> data. The state list and primary dates come from joined <code>states</code> + <code>calendar_events</code> tables.</>}
        how={<>State names come from <AdminTag route="states" label="States" navigate={navigate} color="green" /> and primary dates come from <AdminTag route="calendar-events" label="Calendar Events" navigate={navigate} color="green" /></>}
      />
      <MappingRow navigate={navigate} isMobile={isMobile}
        see={<><strong>Collapsible state cards</strong><br />Each card shows the state name, primary date, urgency badge ("14d away"), and candidate count. Expanded view shows each candidate with name, party, and fundraising bar graph (raised / spent / cash on hand).</>}
        from={<><code>fec_filings</code> staging table. Only filings where <code>promoted_to_candidate_id IS NULL</code> appear here (unpromoted ones).</>}
        how={<>Go to <AdminTag route="fec" label="FEC" navigate={navigate} color="purple" /> (described below)</>}
      />

      <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 12, marginTop: 28 }}>The FEC Data Flow</div>
      <Paragraph style={{ fontSize: 14, color: SLATE, marginBottom: 12 }}>This page has a specific pipeline. Here's how data moves through the system:</Paragraph>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: 16, background: "#F8FAFC", borderRadius: 10, border: "1px solid #E2E8F0", marginBottom: 16 }}>
        <Tag color="blue" style={{ fontSize: 13, padding: "4px 12px" }}>OpenFEC API</Tag>
        <FlowArrow />
        <Tag color="purple" style={{ fontSize: 13, padding: "4px 12px", fontFamily: "monospace" }}>fec_filings table</Tag>
        <span style={{ fontSize: 12, color: SLATE }}>(staging)</span>
        <FlowArrow />
        <span style={{ fontSize: 13, fontWeight: 600, color: AMBER }}>Admin promotes winners</span>
        <FlowArrow />
        <Tag color="red" style={{ fontSize: 13, padding: "4px 12px", fontFamily: "monospace" }}>candidates table</Tag>
        <span style={{ fontSize: 12, color: SLATE }}>(live)</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ background: "#F5F3FF", borderRadius: 8, padding: "12px 16px", border: "1px solid #E9E5FF" }}>
          <strong style={{ color: PURPLE }}>Who's Running page</strong> <span style={{ color: SLATE }}>shows the <code>fec_filings</code> staging table — raw filings that haven't been promoted yet</span>
        </div>
        <div style={{ background: "#FEF2F2", borderRadius: 8, padding: "12px 16px", border: "1px solid #FECACA" }}>
          <strong style={{ color: RED }}>Map + Senate pages</strong> <span style={{ color: SLATE }}>show the <code>candidates</code> table — only promoted candidates appear there</span>
        </div>
      </div>

      <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 12, marginTop: 28 }}>Step-by-Step: Importing FEC Data</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          <>Go to <AdminTag route="fec" label="FEC" navigate={navigate} color="purple" /> → <strong>FEC Import</strong> tab</>,
          <>Enter your FEC API key (it's saved in your browser's localStorage — not shared)</>,
          <>Select cycle <strong>2026</strong>, office <strong>Senate</strong>, and optionally filter to a specific state</>,
          <>Click <strong>Fetch</strong> → review the candidates list → click <strong>Import</strong> to save to the <code>fec_filings</code> staging table</>,
          <>The imported filings now appear on the public Who's Running page</>,
          <>After a state's primary election: switch to the <strong>Filings</strong> tab → find the primary winners → click <strong>Promote</strong> to move them to the real <code>candidates</code> table</>,
          <>Promoted candidates now appear on the <strong>Map ballot panel</strong> and <strong>Senate Races</strong> page</>,
        ].map((step, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: NAVY, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ fontSize: 14, lineHeight: 1.7, paddingTop: 3 }}>{step}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VOLUNTEER GUIDE
// ---------------------------------------------------------------------------
function GuideVolunteer({ navigate, isMobile }: Props) {
  return (
    <div>
      <PageHeader icon={<TeamOutlined />} iconBg="#FCE7F3" iconColor="#DB2777" title="Volunteer Form" />
      <Paragraph style={{ fontSize: 15, lineHeight: 1.8, color: SLATE }}>
        The volunteer signup form lives in the site footer — it appears on every public page. When someone submits the form, a row goes into the <code>volunteers</code> table with status "pending".
      </Paragraph>

      <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 12, marginTop: 28 }}>How It Works</div>

      <MappingRow navigate={navigate} isMobile={isMobile}
        see={<><strong>Footer signup form</strong><br />Fields: name, email, role interests (checkboxes), experience, availability</>}
        from={<>Submits directly to the <code>volunteers</code> table in Supabase. Status = "pending", no auth_id (anonymous submission).</>}
        how={<>The form itself is in <code>src/components/ui/VolunteerForm.tsx</code>. To change the form fields, edit that component.</>}
      />
      <MappingRow navigate={navigate} isMobile={isMobile}
        see={<><em>(Not visible to public)</em> — volunteer submissions waiting for review</>}
        from={<><code>volunteers</code> table with all submissions</>}
        how={<>Go to <AdminTag route="volunteers" label="Volunteers" navigate={navigate} color="cyan" /> → review pending applications → change status to <strong>"active"</strong> (approved) or <strong>"inactive"</strong> (declined). You can also add internal notes.</>}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// STATIC PAGES GUIDE
// ---------------------------------------------------------------------------
function GuideStatic({ isMobile }: { isMobile?: boolean }) {
  return (
    <div>
      <PageHeader icon={<FileTextOutlined />} iconBg="#F1F5F9" iconColor={SLATE} title="Static Pages" />
      <Paragraph style={{ fontSize: 15, lineHeight: 1.8, color: SLATE }}>
        These pages have no database connection. They're educational content that doesn't change with election cycles. To update any of them, you edit the source file directly.
      </Paragraph>

      <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 16, marginTop: 28 }}>Pages</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {[
          { url: "/glossary", name: "Glossary", desc: "Election terms defined", file: "src/data/glossary.ts (data) + src/pages/glossary.astro (page)" },
          { url: "/resources", name: "Resources", desc: "Links to Congress.gov, GovTrack, Vote411, Ballotpedia, 270toWin", file: "src/pages/resources.astro" },
          { url: "/news", name: "News", desc: "RSS feeds from ProPublica, PBS, The Guardian — refreshes on each build", file: "src/pages/news.astro" },
          { url: "/about", name: "About", desc: "Project description and mission", file: "src/pages/about.astro" },
          { url: "/learn/how-congress-works", name: "How Congress Works", desc: "Bicameral system explainer", file: "src/pages/learn/how-congress-works.astro" },
          { url: "/senate#101", name: "Senate 101", desc: "Senate basics (merged into Senate page)", file: "src/pages/senate/index.astro" },
          { url: "/house#101", name: "House 101", desc: "House basics (merged into House page)", file: "src/pages/house/index.astro" },
          { url: "/learn/what-are-midterms", name: "What Are Midterms?", desc: "Midterm elections explained", file: "src/pages/learn/what-are-midterms.astro" },
          { url: "/learn/how-to-run", name: "How to Run", desc: "Guide to running for office", file: "src/pages/learn/how-to-run.astro" },
        ].map((p) => (
          <div key={p.url} style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "baseline", gap: isMobile ? 4 : 12, padding: "10px 0", borderBottom: "1px solid #F1F5F9" }}>
            <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, fontSize: 14, color: BLUE, minWidth: isMobile ? undefined : 180, textDecoration: "none" }}>{p.name}</a>
            <span style={{ fontSize: 14, color: NAVY, flex: isMobile ? undefined : 1 }}>{p.desc}</span>
            <code style={{ fontSize: 11, color: SLATE, whiteSpace: isMobile ? "normal" : "nowrap", wordBreak: isMobile ? "break-all" : undefined }}>{p.file}</code>
          </div>
        ))}
      </div>

      <Callout color={SLATE} bg="#F8FAFC">
        <strong>Why no admin control?</strong> These are educational reference pages. Their content doesn't change based on the election cycle. Keeping them as static files means less database complexity and faster page loads.
      </Callout>
    </div>
  );
}

// ---------------------------------------------------------------------------
// LANDING PAGE
// ---------------------------------------------------------------------------

const GUIDE_LINKS: { key: GuidePage; icon: React.ReactNode; title: string; url: string; desc: string; bg: string; iconColor: string }[] = [
  { key: "homepage", icon: <HomeOutlined />, title: "Homepage", url: "/", desc: "Countdown, election tracker, Senate/House numbers, news", bg: "#DBEAFE", iconColor: BLUE },
  { key: "map", icon: <EnvironmentOutlined />, title: "Interactive Map", url: "/map", desc: "Color-coded US map + state ballot panels (4 admin pages)", bg: "#DCFCE7", iconColor: GREEN },
  { key: "senate", icon: <FlagOutlined />, title: "Senate Races", url: "/senate", desc: "All 33 Class II seats + 2 special elections, grouped by rating", bg: "#FEE2E2", iconColor: RED },
  { key: "house", icon: <BankOutlined />, title: "House Overview", url: "/house", desc: "Aggregate stats only — no individual races yet", bg: "#E0E7FF", iconColor: "#4F46E5" },
  { key: "explore", icon: <SwapOutlined />, title: "Explore (Swipe Cards)", url: "/explore", desc: "Toss-up and lean races as swipeable cards", bg: "#FEF3C7", iconColor: AMBER },
  { key: "calendar", icon: <ScheduleOutlined />, title: "Election Calendar", url: "/calendar", desc: "Primary dates, deadlines, early voting for all 50 states", bg: "#D1FAE5", iconColor: GREEN },
  { key: "whos-running", icon: <FileSearchOutlined />, title: "Who's Running", url: "/whos-running", desc: "FEC filings staging area — everyone who filed and raised $5K+", bg: "#EDE9FE", iconColor: PURPLE },
  { key: "volunteer", icon: <TeamOutlined />, title: "Volunteer Form", url: "footer", desc: "Footer signup form → volunteers table", bg: "#FCE7F3", iconColor: "#DB2777" },
  { key: "static", icon: <FileTextOutlined />, title: "Static Pages", url: "—", desc: "Glossary, resources, news, about, learn pages (no admin control)", bg: "#F1F5F9", iconColor: SLATE },
];

const SCHEMA_TABLES = [
  { table: "states", desc: "50 states + DC, governor info, FIPS codes for map matching", color: "green" },
  { table: "election_cycles", desc: "Cycle years (2026), is_active flag", color: "blue" },
  { table: "cycle_stats", desc: "Senate/House aggregate numbers per cycle (current split, retirements, battlegrounds)", color: "blue" },
  { table: "races", desc: "All races — Senate + House. Rating, special election flag, open seat, why competitive", color: "red" },
  { table: "districts", desc: "State + body (us-senate / us-house) + senate class or district number", color: "red" },
  { table: "race_candidates", desc: "Join table linking races to candidates", color: "orange" },
  { table: "candidates", desc: "Names, party, photos, bios, FEC IDs, financials", color: "purple" },
  { table: "candidate_positions", desc: "Issue positions per candidate, linked to topics", color: "purple" },
  { table: "topics", desc: "Issue topics: healthcare, climate, immigration, etc.", color: "default" },
  { table: "ballot_measures", desc: "State ballot measures with status (qualified/proposed/withdrawn) and category", color: "orange" },
  { table: "calendar_events", desc: "Primary dates, filing deadlines, registration deadlines, early voting", color: "green" },
  { table: "fec_filings", desc: "Staging table — raw FEC data before promotion to candidates", color: "geekblue" },
  { table: "volunteers", desc: "Volunteer signups from footer form (name, email, roles, status)", color: "cyan" },
];

function GuideLanding({ onNavigate, isMobile }: { onNavigate: (page: GuidePage) => void; isMobile?: boolean }) {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <Title level={2} style={{ color: NAVY, marginBottom: 8 }}>Admin Setup Guide</Title>
        <Paragraph style={{ fontSize: 16, lineHeight: 1.8, color: SLATE, maxWidth: 600 }}>
          This guide maps every public page to the admin controls that power it. Click a page below to see exactly what data it uses, which admin pages control it, and how to update it.
        </Paragraph>
      </div>

      <div style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Page Guides</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {GUIDE_LINKS.map((g) => (
          <a
            key={g.key}
            onClick={(e) => { e.preventDefault(); onNavigate(g.key); }}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 10, textDecoration: "none", transition: "background 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: g.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: g.iconColor, flexShrink: 0 }}>
              {g.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: NAVY }}>{g.title}</div>
              <div style={{ fontSize: 13, color: SLATE, lineHeight: 1.4 }}>{g.desc}</div>
            </div>
            <div style={{ color: "#CBD5E1", fontSize: 12, flexShrink: 0 }}><RightOutlined /></div>
          </a>
        ))}
      </div>

      <div style={{ marginTop: 40, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <DatabaseOutlined style={{ fontSize: 18, color: NAVY }} />
        <span style={{ fontSize: 16, fontWeight: 700, color: NAVY }}>Database Schema Overview</span>
      </div>
      <Paragraph style={{ fontSize: 14, color: SLATE, marginBottom: 16 }}>All tables in our Supabase database:</Paragraph>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {SCHEMA_TABLES.map((s) => (
          <div key={s.table} style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "baseline", gap: isMobile ? 4 : 12, padding: "8px 0", borderBottom: "1px solid #F8FAFC" }}>
            <Tag color={s.color} style={{ fontFamily: "monospace", fontSize: 13, minWidth: isMobile ? undefined : 160 }}>{s.table}</Tag>
            <span style={{ fontSize: 14, color: NAVY }}>{s.desc}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 40, fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Key Concepts</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Callout color={RED} bg="#FEF2F2">
          <strong>Races + Districts:</strong> A single <code>races</code> table handles both Senate and House. The <code>districts</code> table differentiates them via <code>body_id</code> (us-senate vs us-house). No separate tables needed.
        </Callout>
        <Callout color={PURPLE} bg="#F5F3FF">
          <strong>FEC Pipeline:</strong> OpenFEC API → <code>fec_filings</code> staging table → admin promotes primary winners → <code>candidates</code> table (appears on Map + Senate pages).
        </Callout>
        <Callout color={BLUE} bg="#EFF6FF">
          <strong>Build-time data:</strong> All public pages fetch from Supabase at build time (static site). Changes appear after the next Vercel deploy, not instantly.
        </Callout>
        <Callout color={SLATE} bg="#F8FAFC">
          <strong>Static content:</strong> Glossary, learn pages, and resources are hardcoded in the codebase. No database dependency — edit the files directly.
        </Callout>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

export default function SetupGuidePage({ navigate }: Props) {
  const [guidePage, setGuidePage] = useState<GuidePage>("landing");
  const isMobile = useIsMobile();

  return (
    <div style={{ maxWidth: 820 }}>
      {guidePage !== "landing" && (
        <a
          onClick={(e) => { e.preventDefault(); setGuidePage("landing"); }}
          style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20, fontSize: 14, fontWeight: 600, color: BLUE, padding: "6px 14px", background: "#EFF6FF", borderRadius: 8, textDecoration: "none" }}
        >
          <ArrowLeftOutlined /> Back to Setup Guide
        </a>
      )}

      {guidePage === "landing" && <GuideLanding onNavigate={setGuidePage} isMobile={isMobile} />}
      {guidePage === "homepage" && <GuideHomepage navigate={navigate} isMobile={isMobile} />}
      {guidePage === "map" && <GuideMap navigate={navigate} isMobile={isMobile} />}
      {guidePage === "senate" && <GuideSenate navigate={navigate} isMobile={isMobile} />}
      {guidePage === "house" && <GuideHouse navigate={navigate} isMobile={isMobile} />}
      {guidePage === "explore" && <GuideExplore navigate={navigate} isMobile={isMobile} />}
      {guidePage === "calendar" && <GuideCalendar navigate={navigate} isMobile={isMobile} />}
      {guidePage === "whos-running" && <GuideWhosRunning navigate={navigate} isMobile={isMobile} />}
      {guidePage === "volunteer" && <GuideVolunteer navigate={navigate} isMobile={isMobile} />}
      {guidePage === "static" && <GuideStatic isMobile={isMobile} />}
    </div>
  );
}
