import { useState, useEffect } from "react";

const ELECTION_DATE = new Date("2026-11-03T00:00:00");

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex gap-4 justify-center md:justify-start">
      <Unit value={timeLeft.days} label="days" />
      <Unit value={timeLeft.hours} label="hrs" />
      <Unit value={timeLeft.minutes} label="min" />
      <Unit value={timeLeft.seconds} label="sec" />
    </div>
  );
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl md:text-3xl font-black tabular-nums text-white">
        {String(value).padStart(2, "0")}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-white/40">
        {label}
      </div>
    </div>
  );
}

function getTimeLeft() {
  const now = new Date();
  const diff = Math.max(0, ELECTION_DATE.getTime() - now.getTime());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}
