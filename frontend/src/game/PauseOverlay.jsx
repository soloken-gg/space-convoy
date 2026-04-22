import React from "react";
import { motion } from "framer-motion";
import { Play, LogOut } from "lucide-react";

export default function PauseOverlay({ onResume, onEnd }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex flex-col items-center justify-center backdrop-blur-xl bg-[#0A1628]/80"
      data-testid="pause-overlay"
    >
      <span className="text-[10px] uppercase tracking-[0.35em] text-white/60 font-primary">
        Systems Paused
      </span>
      <h2
        className="font-primary font-bold text-white text-center mt-2"
        style={{ fontSize: "clamp(32px, 6vh, 48px)" }}
      >
        Catch your breath.
      </h2>

      <div className="flex flex-col gap-3 w-full max-w-xs mt-10">
        <button
          type="button"
          onClick={onResume}
          className="w-full h-14 rounded-full bg-[#00B4D8] text-[#0A1628] font-primary font-bold text-base tracking-[0.25em] uppercase flex items-center justify-center gap-3 active:scale-[0.97] transition-transform"
          style={{ boxShadow: "0 0 32px rgba(0,180,216,0.3)" }}
          data-testid="resume-button"
        >
          <Play size={16} strokeWidth={2.8} />
          Resume
        </button>
        <button
          type="button"
          onClick={onEnd}
          className="w-full h-12 rounded-full border border-white/20 bg-white/5 text-white/80 font-primary font-medium text-sm tracking-[0.25em] uppercase flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
          data-testid="end-session-button"
        >
          <LogOut size={14} strokeWidth={2.5} />
          End Session
        </button>
      </div>
    </motion.div>
  );
}
