import React from "react";
import { motion } from "framer-motion";
import { Pause, Rocket } from "lucide-react";

/**
 * HUD (portrait 9:16):
 *  - Top 8%: Score (left), Level pill (center), Target icons + Pause (right)
 *  - Pause is top-right corner, 60x60
 */
export default function HUD({
  score,
  level,
  levelLabel,
  targetCount,
  streak,
  onPause,
  phase,
}) {
  return (
    <div
      className="hud-shell"
      aria-label="game-hud"
      data-testid="game-hud"
    >
      {/* Top HUD bar */}
      <div
        className="absolute left-0 right-0 top-0 flex items-center justify-between px-5 pt-4"
        style={{ height: "8%" }}
      >
        {/* Score — left */}
        <div
          className="flex flex-col items-start"
          data-testid="score-display"
        >
          <span
            className="text-[10px] uppercase tracking-[0.25em] text-white/60 font-primary"
          >
            Score
          </span>
          <span
            className="font-numeric font-bold text-[#00B4D8] text-3xl leading-none"
            style={{ textShadow: "0 0 18px rgba(0,180,216,0.4)" }}
            data-testid="score-value"
          >
            {String(score).padStart(4, "0")}
          </span>
        </div>

        {/* Level pill — center */}
        <motion.div
          key={level}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/15 backdrop-blur-xl bg-[#0A1628]/70"
          style={{
            boxShadow: "0 0 24px rgba(0,180,216,0.12)",
          }}
          data-testid="level-pill"
        >
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/60 font-primary">
            Level
          </span>
          <span
            className="font-numeric font-bold text-lg text-white leading-none"
            data-testid="level-number"
          >
            {level}
          </span>
          <span className="text-[9px] tracking-widest text-[#00B4D8] font-primary uppercase">
            {levelLabel}
          </span>
        </motion.div>

        {/* Target icons + pause — right */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/10"
            data-testid="target-count-display"
          >
            {Array.from({ length: targetCount }).map((_, i) => (
              <Rocket
                key={i}
                size={14}
                className="text-[#00B4D8]"
                strokeWidth={2.5}
                aria-hidden="true"
              />
            ))}
          </div>
          <button
            type="button"
            onClick={onPause}
            className="w-[44px] h-[44px] flex items-center justify-center rounded-full bg-white/5 border border-white/10 backdrop-blur-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors active:scale-95"
            aria-label="Pause game"
            data-testid="pause-button"
          >
            <Pause size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Phase label — just below HUD */}
      <div
        className="absolute left-0 right-0 flex justify-center pointer-events-none"
        style={{ top: "9%" }}
      >
        <PhaseBadge phase={phase} />
      </div>

      {/* Streak corner indicator */}
      {streak >= 2 && (
        <div
          className="absolute right-5 flex items-center gap-1 px-3 py-1 rounded-full bg-[#06D6A0]/15 border border-[#06D6A0]/40"
          style={{ top: "14%" }}
          data-testid="streak-indicator"
        >
          <span className="font-numeric text-xs text-[#06D6A0] font-bold tracking-wider">
            {streak}× STREAK
          </span>
        </div>
      )}

      {/* Response-phase border flash */}
      {phase === "response" && (
        <div
          className="absolute inset-0 pointer-events-none response-flash"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function PhaseBadge({ phase }) {
  const map = {
    cue: { text: "LOCK ON TARGETS", color: "#00B4D8" },
    isi: { text: "", color: "#00B4D8" },
    motion: { text: "TRACK THEM", color: "#F4A261" },
    response: { text: "TAP THE CONVOY", color: "#06D6A0" },
    feedback: { text: "", color: "#fff" },
    gap: { text: "", color: "#fff" },
  };
  const v = map[phase];
  if (!v || !v.text) return null;
  return (
    <motion.div
      key={phase + v.text}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 py-1 rounded-full border backdrop-blur-lg bg-[#0A1628]/60"
      style={{
        borderColor: v.color + "55",
      }}
      data-testid="phase-badge"
    >
      <span
        className="font-primary text-xs uppercase tracking-[0.3em]"
        style={{ color: v.color }}
      >
        {v.text}
      </span>
    </motion.div>
  );
}
