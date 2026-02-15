import { useState, useMemo, useEffect } from "react";
import { Calendar, ConfigProvider, Select, Drawer } from "antd";
import dayjs from "dayjs";
import type { CalendarEvent } from "../../types";

const EVENT_COLORS: Record<string, string> = {
  primary: "#3B82F6",
  runoff: "#F59E0B",
  general: "#EF4444",
  filing_deadline: "#8B5CF6",
  registration_deadline: "#10B981",
  early_voting_start: "#06B6D4",
  early_voting_end: "#06B6D4",
  other: "#64748B",
};

const EVENT_LABELS: Record<string, string> = {
  primary: "Primary",
  runoff: "Runoff",
  general: "General",
  filing_deadline: "Filing Deadline",
  registration_deadline: "Registration",
  early_voting_start: "Early Voting Start",
  early_voting_end: "Early Voting End",
  other: "Other",
};

interface CalendarViewProps {
  events: CalendarEvent[];
}

export default function CalendarView({ events }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filterState, setFilterState] = useState<string>("all");
  const [isMobile, setIsMobile] = useState(false);
  const [calendarValue, setCalendarValue] = useState<dayjs.Dayjs>(dayjs());

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const filteredEvents = useMemo(() => {
    if (filterState === "all") return events;
    return events.filter((e) => e.stateAbbr === filterState);
  }, [events, filterState]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of filteredEvents) {
      const key = ev.eventDate;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    }
    return map;
  }, [filteredEvents]);

  const stateOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const ev of events) {
      if (!seen.has(ev.stateAbbr)) seen.set(ev.stateAbbr, ev.stateName);
    }
    return [
      { value: "all", label: "All States" },
      ...Array.from(seen.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([abbr, name]) => ({ value: abbr, label: `${name} (${abbr})` })),
    ];
  }, [events]);

  const selectedEvents = selectedDate ? eventsByDate.get(selectedDate) ?? [] : [];

  // When state filter changes, jump the calendar to that state's next event
  useEffect(() => {
    const now = dayjs();
    for (const ev of filteredEvents) {
      const evDate = dayjs(ev.eventDate);
      if (evDate.isAfter(now) || evDate.isSame(now, "day")) {
        setCalendarValue(evDate);
        return;
      }
    }
    // If all events are past, jump to the last one
    if (filteredEvents.length > 0) {
      setCalendarValue(dayjs(filteredEvents[filteredEvents.length - 1].eventDate));
    }
  }, [filteredEvents]);

  function handleDateSelect(date: dayjs.Dayjs) {
    const key = date.format("YYYY-MM-DD");
    const dayEvents = eventsByDate.get(key);
    setSelectedDate(key);
    setCalendarValue(date);
    if (dayEvents && dayEvents.length > 0) {
      setDrawerOpen(true);
    }
  }

  // Desktop cell render: show state abbreviation text previews
  const desktopCellRender = (date: dayjs.Dayjs) => {
    const key = date.format("YYYY-MM-DD");
    const dayEvents = eventsByDate.get(key);
    if (!dayEvents || dayEvents.length === 0) return null;

    // Show up to 3 state abbreviations with colored left border
    const shown = dayEvents.slice(0, 3);
    const remaining = dayEvents.length - shown.length;

    return (
      <div style={{ paddingTop: 2 }}>
        {shown.map((ev) => {
          const color = EVENT_COLORS[ev.eventType] || EVENT_COLORS.other;
          return (
            <div
              key={ev.id}
              style={{
                fontSize: 11,
                lineHeight: "16px",
                padding: "0 4px",
                marginBottom: 1,
                borderLeft: `3px solid ${color}`,
                color: "#334155",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {ev.stateAbbr}
            </div>
          );
        })}
        {remaining > 0 && (
          <div style={{ fontSize: 10, color: "#94A3B8", paddingLeft: 7 }}>
            +{remaining} more
          </div>
        )}
      </div>
    );
  };

  // Group events by month for the mobile list view
  const eventsByMonth = useMemo(() => {
    const groups = new Map<string, CalendarEvent[]>();
    for (const ev of filteredEvents) {
      const month = dayjs(ev.eventDate).format("MMMM YYYY");
      if (!groups.has(month)) groups.set(month, []);
      groups.get(month)!.push(ev);
    }
    return groups;
  }, [filteredEvents]);

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 8,
          fontFamily: "inherit",
        },
      }}
    >
      <div>
        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
          <Select
            value={filterState}
            onChange={setFilterState}
            options={stateOptions}
            style={{ width: 220 }}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            placeholder="Filter by state"
          />
          <span style={{ fontSize: 13, color: "#94A3B8" }}>
            {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
          {Object.entries(EVENT_LABELS)
            .filter(([type]) => filteredEvents.some((e) => e.eventType === type))
            .map(([type, label]) => (
              <div key={type} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: EVENT_COLORS[type],
                  }}
                />
                <span style={{ fontSize: 12, color: "#64748B" }}>{label}</span>
              </div>
            ))}
        </div>

        {/* Desktop Calendar */}
        {!isMobile && (
          <div style={{ border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden" }}>
            <Calendar
              value={calendarValue}
              cellRender={(date, info) => {
                if (info.type !== "date") return info.originNode;
                return desktopCellRender(date);
              }}
              onSelect={handleDateSelect}
              fullscreen={true}
              headerRender={({ value, onChange }) => {
                const monthOptions = Array.from({ length: 12 }, (_, i) => ({
                  value: i,
                  label: dayjs().month(i).format("MMMM"),
                }));
                const yearOptions = Array.from({ length: 5 }, (_, i) => {
                  const y = 2025 + i;
                  return { value: y, label: String(y) };
                });
                return (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                    }}
                  >
                    <button
                      onClick={() => { const next = value.subtract(1, "month"); onChange(next); setCalendarValue(next); }}
                      style={{
                        background: "none",
                        border: "1px solid #E2E8F0",
                        borderRadius: 6,
                        padding: "6px 12px",
                        cursor: "pointer",
                        fontSize: 14,
                        color: "#334155",
                      }}
                    >
                      &larr; Prev
                    </button>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Select
                        value={value.month()}
                        onChange={(m) => { const next = value.month(m); onChange(next); setCalendarValue(next); }}
                        options={monthOptions}
                        style={{ width: 130 }}
                        variant="borderless"
                        popupMatchSelectWidth={false}
                      />
                      <Select
                        value={value.year()}
                        onChange={(y) => { const next = value.year(y); onChange(next); setCalendarValue(next); }}
                        options={yearOptions}
                        style={{ width: 80 }}
                        variant="borderless"
                        popupMatchSelectWidth={false}
                      />
                    </div>
                    <button
                      onClick={() => { const next = value.add(1, "month"); onChange(next); setCalendarValue(next); }}
                      style={{
                        background: "none",
                        border: "1px solid #E2E8F0",
                        borderRadius: 6,
                        padding: "6px 12px",
                        cursor: "pointer",
                        fontSize: 14,
                        color: "#334155",
                      }}
                    >
                      Next &rarr;
                    </button>
                  </div>
                );
              }}
            />
          </div>
        )}

        {/* Mobile: Compact calendar + list */}
        {isMobile && (
          <div>
            <div
              style={{
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                overflow: "hidden",
                marginBottom: 20,
              }}
            >
              <Calendar
                value={calendarValue}
                fullscreen={false}
                cellRender={(date, info) => {
                  if (info.type !== "date") return info.originNode;
                  const key = date.format("YYYY-MM-DD");
                  const dayEvents = eventsByDate.get(key);
                  if (!dayEvents) return null;
                  return (
                    <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)" }}>
                      <div
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          backgroundColor: EVENT_COLORS[dayEvents[0].eventType] || "#64748B",
                        }}
                      />
                    </div>
                  );
                }}
                onSelect={handleDateSelect}
                headerRender={({ value, onChange }) => {
                  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
                    value: i,
                    label: dayjs().month(i).format("MMM"),
                  }));
                  const yearOptions = Array.from({ length: 5 }, (_, i) => {
                    const y = 2025 + i;
                    return { value: y, label: String(y) };
                  });
                  return (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                      }}
                    >
                      <button
                        onClick={() => { const next = value.subtract(1, "month"); onChange(next); setCalendarValue(next); }}
                        style={{
                          background: "none",
                          border: "1px solid #E2E8F0",
                          borderRadius: 6,
                          padding: "4px 10px",
                          cursor: "pointer",
                          fontSize: 13,
                          color: "#334155",
                        }}
                      >
                        &larr;
                      </button>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Select
                          value={value.month()}
                          onChange={(m) => { const next = value.month(m); onChange(next); setCalendarValue(next); }}
                          options={monthOptions}
                          style={{ width: 80 }}
                          variant="borderless"
                          popupMatchSelectWidth={false}
                        />
                        <Select
                          value={value.year()}
                          onChange={(y) => { const next = value.year(y); onChange(next); setCalendarValue(next); }}
                          options={yearOptions}
                          style={{ width: 70 }}
                          variant="borderless"
                          popupMatchSelectWidth={false}
                        />
                      </div>
                      <button
                        onClick={() => { const next = value.add(1, "month"); onChange(next); setCalendarValue(next); }}
                        style={{
                          background: "none",
                          border: "1px solid #E2E8F0",
                          borderRadius: 6,
                          padding: "4px 10px",
                          cursor: "pointer",
                          fontSize: 13,
                          color: "#334155",
                        }}
                      >
                        &rarr;
                      </button>
                    </div>
                  );
                }}
              />
            </div>

            {/* Month-by-month event list */}
            <div>
              {Array.from(eventsByMonth.entries()).map(([month, monthEvents]) => (
                <div key={month} style={{ marginBottom: 24 }}>
                  <h3
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#1E293B",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 8,
                      borderBottom: "1px solid #E2E8F0",
                      paddingBottom: 6,
                    }}
                  >
                    {month}
                  </h3>
                  {monthEvents.map((ev) => (
                    <EventRow key={ev.id} event={ev} showDate />
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Drawer for selected date events */}
        <Drawer
          title={selectedDate ? dayjs(selectedDate).format("MMMM D, YYYY") : ""}
          placement="bottom"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          height="auto"
          styles={{
            body: { padding: "12px 16px", maxHeight: "50vh", overflowY: "auto" },
            header: { padding: "12px 16px" },
          }}
          extra={
            <span style={{ fontSize: 12, color: "#94A3B8" }}>
              {selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""}
            </span>
          }
        >
          {selectedEvents.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {selectedEvents.map((ev) => (
                <EventRow key={ev.id} event={ev} showDate={false} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "#94A3B8", fontSize: 14, padding: 20 }}>
              No events on this date
            </div>
          )}
        </Drawer>
      </div>
    </ConfigProvider>
  );
}

function EventRow({ event, showDate }: { event: CalendarEvent; showDate: boolean }) {
  const color = EVENT_COLORS[event.eventType] || EVENT_COLORS.other;
  const label = EVENT_LABELS[event.eventType] || event.eventType;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 12px",
        backgroundColor: "#FFFFFF",
        borderRadius: 6,
        border: "1px solid #F1F5F9",
      }}
    >
      <div
        style={{
          width: 4,
          height: 32,
          borderRadius: 2,
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1E293B" }}>
            {event.stateName}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: color,
              backgroundColor: `${color}15`,
              padding: "1px 6px",
              borderRadius: 4,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            {label}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#64748B" }}>
          {event.title}
          {event.description && <> &mdash; {event.description}</>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {showDate && (
          <span style={{ fontSize: 11, color: "#94A3B8" }}>
            {dayjs(event.eventDate).format("MMM D")}
          </span>
        )}
        <a
          href={`/map?state=${event.stateAbbr}`}
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#1E293B",
            textDecoration: "none",
            padding: "3px 8px",
            borderRadius: 4,
            border: "1px solid #E2E8F0",
          }}
          title={`View ${event.stateAbbr} on map`}
        >
          Map &rarr;
        </a>
      </div>
    </div>
  );
}
