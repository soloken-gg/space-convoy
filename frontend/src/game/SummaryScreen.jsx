import React from "react";
import { motion } from "framer-motion";
import { Download, RotateCcw, Trophy, Target, Flame } from "lucide-react";

export default function SummaryScreen({ session, onPlayAgain, onExport }) {
  const { nickname, score, trials, maxStreak, correctTrials } = session;
  const totalHits = trials.reduce((s, t) => s + (t.hits?.length || 0), 0);
  const totalTargets = trials.reduce((s, t) => s + (t.targetIds?.length || 0), 0);
  const accuracy = totalTargets ? Math.round((totalHits / totalTargets) * 100) : 0;
  const maxLevel = trials.reduce((m, t) => Math.max(m, t.level || 1), 1);

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center px-6 py-10"
      data-testid="summary-screen"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-[#06D6A0]/15 border border-[#06D6A0]/40 flex items-center justify-center mb-4">
          <Trophy className="text-[#06D6A0]" size={28} strokeWidth={2.2} />
        </div>
        <span className="text-[10px] uppercase tracking-[0.35em] text-white/60 font-primary">
          Mission Complete
        </span>
        <h2
          className="font-primary font-bold text-white text-center mt-2"
          style={{ fontSize: "clamp(32px, 6vh, 48px)" }}
        >
          Well flown, {nickname}
        </h2>
      </motion.div>

      {/* Stats bento */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="grid grid-cols-2 gap-3 w-full max-w-xs mt-8"
      >
        <StatCard
          label="Final Score"
          value={score}
          color="#00B4D8"
          testId="stat-final-score"
          span={2}
        />
        <StatCard
          label="Trials"
          value={trials.length}
          testId="stat-trials"
        />
        <StatCard
          label="Perfect"
          value={correctTrials}
          testId="stat-perfect-trials"
        />
        <StatCard
          label="Accuracy"
          value={`${accuracy}%`}
          icon={<Target size={14} />}
          testId="stat-accuracy"
        />
        <StatCard
          label="Max Streak"
          value={maxStreak}
          icon={<Flame size={14} />}
          color="#F4A261"
          testId="stat-max-streak"
        />
        <StatCard
          label="Top Level"
          value={maxLevel}
          testId="stat-top-level"
          span={2}
        />
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="flex flex-col items-center gap-3 w-full max-w-xs mt-8"
      >
        <button
          type="button"
          onClick={onPlayAgain}
          className="w-full h-14 rounded-full bg-[#00B4D8] text-[#0A1628] font-primary font-bold text-base tracking-[0.25em] uppercase flex items-center justify-center gap-3 active:scale-[0.97] transition-transform"
          style={{ boxShadow: "0 0 32px rgba(0,180,216,0.35)" }}
          data-testid="play-again-button"
        >
          <RotateCcw size={18} strokeWidth={2.8} />
          Play Again
        </button>
        <button
          type="button"
          onClick={onExport}
          className="w-full h-12 rounded-full border border-white/20 bg-white/5 text-white/80 font-primary font-medium text-sm tracking-[0.25em] uppercase flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
          data-testid="export-log-button"
        >
          <Download size={14} strokeWidth={2.5} />
          Export Session Log
        </button>
      </motion.div>
    </div>
  );
}

function StatCard({ label, value, color = "#fff", icon, testId, span = 1 }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[#0A1628]/60 backdrop-blur-xl p-4 flex flex-col justify-between ${span === 2 ? "col-span-2" : ""}`}
      data-testid={testId}
    >
      <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.3em] text-white/50 font-primary">
        {icon}
        {label}
      </div>
      <div
        className="font-numeric font-bold leading-none mt-2"
        style={{ color, fontSize: "clamp(22px, 3.5vh, 32px)" }}
      >
        {value}
      </div>
    </div>
  );
}
