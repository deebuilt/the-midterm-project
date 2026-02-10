import { useState, useRef, useEffect } from "react";

const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ReadAloud({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const audio = new Audio(src);
    audio.preload = "metadata";
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
    });
    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime);
    });
    audio.addEventListener("ended", () => {
      setPlaying(false);
      setCurrentTime(0);
    });
    audio.addEventListener("waiting", () => setLoading(true));
    audio.addEventListener("canplay", () => setLoading(false));
    audio.addEventListener("error", () => {
      setError(true);
      setPlaying(false);
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
  };

  const cycleSpeed = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const currentIndex = SPEEDS.indexOf(speed);
    const nextIndex = (currentIndex + 1) % SPEEDS.length;
    const nextSpeed = SPEEDS[nextIndex];
    audio.playbackRate = nextSpeed;
    setSpeed(nextSpeed);
  };

  if (error) return null;

  return (
    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-lg bg-slate-100 max-w-lg">
      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        className="flex-shrink-0 w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center hover:bg-slate-700 transition-colors"
        aria-label={playing ? "Pause" : "Listen to this page"}
      >
        {loading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : playing ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Skip back */}
      <button
        onClick={() => skip(-15)}
        className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="Skip back 15 seconds"
        title="-15s"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
        </svg>
      </button>

      {/* Progress */}
      <div className="flex-1 min-w-0">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={seek}
          className="w-full h-1 bg-slate-300 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-navy"
          aria-label="Seek"
        />
        <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{duration > 0 ? formatTime(duration) : "--:--"}</span>
        </div>
      </div>

      {/* Skip forward */}
      <button
        onClick={() => skip(15)}
        className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="Skip forward 15 seconds"
        title="+15s"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
        </svg>
      </button>

      {/* Speed */}
      <button
        onClick={cycleSpeed}
        className="flex-shrink-0 min-w-[3rem] px-1.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-600 text-xs font-semibold tabular-nums transition-colors"
        aria-label={`Playback speed ${speed}x. Click to change.`}
        title="Change speed"
      >
        {speed}x
      </button>
    </div>
  );
}
