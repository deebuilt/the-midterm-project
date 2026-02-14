import { useState } from "react";

type Party = "R" | "D" | "I";

interface SeatInfo {
  abbr: string;
  name: string;
  senator: string;
  party: Party;
}

// Senate classes are permanently assigned and never change.
// Source: senate.gov/senators/Class_I.htm, Class_II.htm, Class_III.htm
// Senator names current as of 119th Congress (January 2025).

const CLASS_1_SEATS: SeatInfo[] = [
  { abbr: "AZ", name: "Arizona", senator: "Ruben Gallego", party: "D" },
  { abbr: "CA", name: "California", senator: "Adam Schiff", party: "D" },
  { abbr: "CT", name: "Connecticut", senator: "Chris Murphy", party: "D" },
  { abbr: "DE", name: "Delaware", senator: "Lisa Blunt Rochester", party: "D" },
  { abbr: "FL", name: "Florida", senator: "Rick Scott", party: "R" },
  { abbr: "HI", name: "Hawaii", senator: "Mazie Hirono", party: "D" },
  { abbr: "IN", name: "Indiana", senator: "Jim Banks", party: "R" },
  { abbr: "ME", name: "Maine", senator: "Angus King", party: "I" },
  { abbr: "MD", name: "Maryland", senator: "Angela Alsobrooks", party: "D" },
  { abbr: "MA", name: "Massachusetts", senator: "Elizabeth Warren", party: "D" },
  { abbr: "MI", name: "Michigan", senator: "Elissa Slotkin", party: "D" },
  { abbr: "MN", name: "Minnesota", senator: "Amy Klobuchar", party: "D" },
  { abbr: "MS", name: "Mississippi", senator: "Roger Wicker", party: "R" },
  { abbr: "MO", name: "Missouri", senator: "Josh Hawley", party: "R" },
  { abbr: "MT", name: "Montana", senator: "Tim Sheehy", party: "R" },
  { abbr: "NE", name: "Nebraska", senator: "Deb Fischer", party: "R" },
  { abbr: "NV", name: "Nevada", senator: "Jacky Rosen", party: "D" },
  { abbr: "NJ", name: "New Jersey", senator: "Andy Kim", party: "D" },
  { abbr: "NM", name: "New Mexico", senator: "Martin Heinrich", party: "D" },
  { abbr: "NY", name: "New York", senator: "Kirsten Gillibrand", party: "D" },
  { abbr: "ND", name: "North Dakota", senator: "Kevin Cramer", party: "R" },
  { abbr: "OH", name: "Ohio", senator: "Bernie Moreno", party: "R" },
  { abbr: "PA", name: "Pennsylvania", senator: "Dave McCormick", party: "R" },
  { abbr: "RI", name: "Rhode Island", senator: "Sheldon Whitehouse", party: "D" },
  { abbr: "TN", name: "Tennessee", senator: "Marsha Blackburn", party: "R" },
  { abbr: "TX", name: "Texas", senator: "Ted Cruz", party: "R" },
  { abbr: "UT", name: "Utah", senator: "John Curtis", party: "R" },
  { abbr: "VT", name: "Vermont", senator: "Bernie Sanders", party: "I" },
  { abbr: "VA", name: "Virginia", senator: "Tim Kaine", party: "D" },
  { abbr: "WA", name: "Washington", senator: "Maria Cantwell", party: "D" },
  { abbr: "WV", name: "West Virginia", senator: "Jim Justice", party: "R" },
  { abbr: "WI", name: "Wisconsin", senator: "Tammy Baldwin", party: "D" },
  { abbr: "WY", name: "Wyoming", senator: "John Barrasso", party: "R" },
];

const CLASS_2_SEATS: SeatInfo[] = [
  { abbr: "AL", name: "Alabama", senator: "Tommy Tuberville", party: "R" },
  { abbr: "AK", name: "Alaska", senator: "Dan Sullivan", party: "R" },
  { abbr: "AR", name: "Arkansas", senator: "Tom Cotton", party: "R" },
  { abbr: "CO", name: "Colorado", senator: "John Hickenlooper", party: "D" },
  { abbr: "DE", name: "Delaware", senator: "Chris Coons", party: "D" },
  { abbr: "GA", name: "Georgia", senator: "Jon Ossoff", party: "D" },
  { abbr: "ID", name: "Idaho", senator: "Jim Risch", party: "R" },
  { abbr: "IL", name: "Illinois", senator: "Dick Durbin", party: "D" },
  { abbr: "IA", name: "Iowa", senator: "Joni Ernst", party: "R" },
  { abbr: "KS", name: "Kansas", senator: "Roger Marshall", party: "R" },
  { abbr: "KY", name: "Kentucky", senator: "Mitch McConnell", party: "R" },
  { abbr: "LA", name: "Louisiana", senator: "Bill Cassidy", party: "R" },
  { abbr: "ME", name: "Maine", senator: "Susan Collins", party: "R" },
  { abbr: "MA", name: "Massachusetts", senator: "Ed Markey", party: "D" },
  { abbr: "MI", name: "Michigan", senator: "Gary Peters", party: "D" },
  { abbr: "MN", name: "Minnesota", senator: "Tina Smith", party: "D" },
  { abbr: "MS", name: "Mississippi", senator: "Cindy Hyde-Smith", party: "R" },
  { abbr: "MT", name: "Montana", senator: "Steve Daines", party: "R" },
  { abbr: "NE", name: "Nebraska", senator: "Pete Ricketts", party: "R" },
  { abbr: "NH", name: "New Hampshire", senator: "Jeanne Shaheen", party: "D" },
  { abbr: "NJ", name: "New Jersey", senator: "Cory Booker", party: "D" },
  { abbr: "NM", name: "New Mexico", senator: "Ben Ray Lujan", party: "D" },
  { abbr: "NC", name: "North Carolina", senator: "Thom Tillis", party: "R" },
  { abbr: "OK", name: "Oklahoma", senator: "Markwayne Mullin", party: "R" },
  { abbr: "OR", name: "Oregon", senator: "Jeff Merkley", party: "D" },
  { abbr: "RI", name: "Rhode Island", senator: "Jack Reed", party: "D" },
  { abbr: "SC", name: "South Carolina", senator: "Lindsey Graham", party: "R" },
  { abbr: "SD", name: "South Dakota", senator: "Mike Rounds", party: "R" },
  { abbr: "TN", name: "Tennessee", senator: "Bill Hagerty", party: "R" },
  { abbr: "TX", name: "Texas", senator: "John Cornyn", party: "R" },
  { abbr: "VA", name: "Virginia", senator: "Mark Warner", party: "D" },
  { abbr: "WV", name: "West Virginia", senator: "Shelley Moore Capito", party: "R" },
  { abbr: "WY", name: "Wyoming", senator: "Cynthia Lummis", party: "R" },
];

const CLASS_3_SEATS: SeatInfo[] = [
  { abbr: "AL", name: "Alabama", senator: "Katie Britt", party: "R" },
  { abbr: "AK", name: "Alaska", senator: "Lisa Murkowski", party: "R" },
  { abbr: "AZ", name: "Arizona", senator: "Mark Kelly", party: "D" },
  { abbr: "AR", name: "Arkansas", senator: "John Boozman", party: "R" },
  { abbr: "CA", name: "California", senator: "Alex Padilla", party: "D" },
  { abbr: "CO", name: "Colorado", senator: "Michael Bennet", party: "D" },
  { abbr: "CT", name: "Connecticut", senator: "Richard Blumenthal", party: "D" },
  { abbr: "FL", name: "Florida", senator: "Ashley Moody", party: "R" },
  { abbr: "GA", name: "Georgia", senator: "Raphael Warnock", party: "D" },
  { abbr: "HI", name: "Hawaii", senator: "Brian Schatz", party: "D" },
  { abbr: "ID", name: "Idaho", senator: "Mike Crapo", party: "R" },
  { abbr: "IL", name: "Illinois", senator: "Tammy Duckworth", party: "D" },
  { abbr: "IN", name: "Indiana", senator: "Todd Young", party: "R" },
  { abbr: "IA", name: "Iowa", senator: "Chuck Grassley", party: "R" },
  { abbr: "KS", name: "Kansas", senator: "Jerry Moran", party: "R" },
  { abbr: "KY", name: "Kentucky", senator: "Rand Paul", party: "R" },
  { abbr: "LA", name: "Louisiana", senator: "John Kennedy", party: "R" },
  { abbr: "MD", name: "Maryland", senator: "Chris Van Hollen", party: "D" },
  { abbr: "MO", name: "Missouri", senator: "Eric Schmitt", party: "R" },
  { abbr: "NV", name: "Nevada", senator: "Catherine Cortez Masto", party: "D" },
  { abbr: "NH", name: "New Hampshire", senator: "Maggie Hassan", party: "D" },
  { abbr: "NY", name: "New York", senator: "Chuck Schumer", party: "D" },
  { abbr: "NC", name: "North Carolina", senator: "Ted Budd", party: "R" },
  { abbr: "ND", name: "North Dakota", senator: "John Hoeven", party: "R" },
  { abbr: "OH", name: "Ohio", senator: "Jon Husted", party: "R" },
  { abbr: "OK", name: "Oklahoma", senator: "James Lankford", party: "R" },
  { abbr: "OR", name: "Oregon", senator: "Ron Wyden", party: "D" },
  { abbr: "PA", name: "Pennsylvania", senator: "John Fetterman", party: "D" },
  { abbr: "SC", name: "South Carolina", senator: "Tim Scott", party: "R" },
  { abbr: "SD", name: "South Dakota", senator: "John Thune", party: "R" },
  { abbr: "UT", name: "Utah", senator: "Mike Lee", party: "R" },
  { abbr: "VT", name: "Vermont", senator: "Peter Welch", party: "D" },
  { abbr: "WA", name: "Washington", senator: "Patty Murray", party: "D" },
  { abbr: "WI", name: "Wisconsin", senator: "Ron Johnson", party: "R" },
];

const CLASSES = [
  {
    id: 1,
    label: "Class I",
    seats: CLASS_1_SEATS,
    count: 33,
    schedule: "Last elected 2024. Next up in 2030.",
    active: false,
  },
  {
    id: 2,
    label: "Class II",
    seats: CLASS_2_SEATS,
    count: 33,
    schedule: "Up for election in 2026!",
    active: true,
  },
  {
    id: 3,
    label: "Class III",
    seats: CLASS_3_SEATS,
    count: 34,
    schedule: "Last elected 2022. Next up in 2028.",
    active: false,
  },
];

const PARTY_COLORS: Record<Party, { bg: string; text: string; dot: string; label: string }> = {
  R: { bg: "bg-gop-light", text: "text-gop-dark", dot: "bg-gop", label: "Republican" },
  D: { bg: "bg-dem-light", text: "text-dem-dark", dot: "bg-dem", label: "Democrat" },
  I: { bg: "bg-ind-light", text: "text-ind-dark", dot: "bg-ind", label: "Independent" },
};

export default function SenateClassExplorer() {
  const [selectedClass, setSelectedClass] = useState(2);

  const activeClass = CLASSES.find((c) => c.id === selectedClass)!;
  const seats = activeClass.seats;

  // Count by party
  const partyCounts = seats.reduce(
    (acc, s) => {
      acc[s.party] = (acc[s.party] || 0) + 1;
      return acc;
    },
    {} as Record<Party, number>
  );

  // Sort seats alphabetically by state abbreviation
  const sortedSeats = [...seats].sort((a, b) => a.abbr.localeCompare(b.abbr));

  return (
    <div className="space-y-4">
      {/* Class tabs */}
      <div className="grid grid-cols-3 gap-2">
        {CLASSES.map((cls) => {
          const isSelected = cls.id === selectedClass;
          return (
            <button
              key={cls.id}
              onClick={() => setSelectedClass(cls.id)}
              className={`
                rounded-lg p-3 text-left transition-all cursor-pointer
                ${isSelected
                  ? cls.active
                    ? "border-2 border-tossup bg-tossup/5 shadow-sm"
                    : "border-2 border-navy bg-navy/5 shadow-sm"
                  : "border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }
              `}
              aria-pressed={isSelected}
            >
              <div className={`font-bold text-sm ${
                isSelected
                  ? cls.active ? "text-tossup" : "text-navy"
                  : "text-slate-400"
              }`}>
                {cls.label}
              </div>
              <div className="text-lg font-semibold">{cls.count} seats</div>
              <div className={`text-xs ${
                isSelected && cls.active ? "text-slate-700 font-medium" : "text-slate-500"
              }`}>
                {cls.schedule}
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded detail panel */}
      <div className={`rounded-lg p-4 ${
        activeClass.active
          ? "bg-tossup/5 border border-tossup/20"
          : "bg-slate-50 border border-slate-200"
      }`}>
        {/* Context note */}
        {selectedClass === 2 && (
          <p className="text-sm text-tossup font-medium mb-3">
            These 33 seats are up for election in November 2026. Current split: {partyCounts.R || 0}R &ndash; {partyCounts.D || 0}D.
          </p>
        )}
        {selectedClass === 3 && (
          <p className="text-sm text-slate-600 mb-3">
            Class III was last elected in 2022 and won't be up again until 2028 &mdash; but 2 Class III seats (Ohio and Florida) appear on the 2026 ballot as special elections.
          </p>
        )}
        {selectedClass === 1 && (
          <p className="text-sm text-slate-600 mb-3">
            Class I was just elected in 2024. These senators won't face voters again until 2030.
          </p>
        )}

        {/* State circles */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {sortedSeats.map((seat) => {
            const colors = PARTY_COLORS[seat.party];
            return (
              <span
                key={`${seat.abbr}-c${selectedClass}`}
                title={`${seat.name} — ${seat.senator} (${seat.party})`}
                className={`
                  inline-flex items-center justify-center
                  px-2 py-0.5 rounded-full text-xs font-bold
                  ${colors.bg} ${colors.text}
                  transition-all duration-300
                `}
              >
                {seat.abbr}
              </span>
            );
          })}
        </div>

        {/* Party legend */}
        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
          {(["R", "D", "I"] as Party[]).map((p) => {
            const count = partyCounts[p];
            if (!count) return null;
            const colors = PARTY_COLORS[p];
            return (
              <span key={p} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                {count} {colors.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
