import React, { useState } from "react";
import { motion } from "framer-motion";
import { Rocket, Sparkles } from "lucide-react";

export default function WelcomeScreen({ onStart, reducedMotion, onToggleReducedMotion }) {
  const [nickname, setNickname] = useState("");

  const handleStart = () => {
    const name = nickname.trim() || "Pilot";
    onStart(name);
  };

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center px-8"
      data-testid="welcome-screen"
    >
      {/* Floating sparkle ornament */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-2 mb-4 px-3 py-1 rounded-full border border-white/10 backdrop-blur-xl bg-[#0A1628]/50"
      >
        <Sparkles size={14} className="text-[#00B4D8]" />
        <span className="text-[10px] uppercase tracking-[0.35em] text-white/70 font-primary">
          Omma AI · Attention Training
        </span>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="font-primary font-bold text-white text-center leading-[0.95] tracking-tight"
        style={{ fontSize: "clamp(42px, 9vh, 84px)" }}
      >
        Space
        <br />
        <span className="text-[#00B4D8]" style={{ textShadow: "0 0 30px rgba(0,180,216,0.5)" }}>
          Convoy
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="mt-6 text-center text-white/70 font-primary max-w-xs leading-relaxed"
        style={{ fontSize: "clamp(15px, 2vh, 18px)" }}
      >
        Lock onto your convoy. Watch them weave through the asteroid field.
        Tap the right ships when the stars freeze.
      </motion.p>

      {/* Nickname input */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
        className="mt-10 w-full max-w-xs"
      >
        <label
          className="text-[10px] uppercase tracking-[0.3em] text-white/50 font-primary block mb-2 text-center"
          htmlFor="nickname-input"
        >
          Call Sign
        </label>
        <input
          id="nickname-input"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value.slice(0, 16))}
          placeholder="Pilot"
          className="w-full h-14 rounded-2xl bg-[#0A1628]/60 border-2 border-[#00B4D8]/40 text-white text-xl text-center font-primary tracking-widest placeholder:text-white/25 focus:outline-none focus:border-[#00B4D8] transition-colors backdrop-blur-xl"
          data-testid="nickname-input"
        />
      </motion.div>

      {/* Start button */}
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        onClick={handleStart}
        className="mt-6 h-16 px-10 rounded-full bg-[#00B4D8] text-[#0A1628] font-primary font-bold text-lg tracking-[0.3em] uppercase flex items-center gap-3 active:scale-[0.97] transition-transform"
        style={{
          boxShadow: "0 0 40px rgba(0,180,216,0.4), 0 8px 32px rgba(0,180,216,0.25)",
        }}
        data-testid="start-mission-button"
      >
        <Rocket size={20} strokeWidth={2.8} />
        Start Mission
      </motion.button>

      {/* Reduced-motion toggle */}
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        onClick={onToggleReducedMotion}
        className="mt-8 text-[11px] uppercase tracking-[0.25em] text-white/50 hover:text-white/80 transition-colors font-primary underline-offset-4"
        data-testid="reduced-motion-toggle"
      >
        Reduced motion: {reducedMotion ? "ON" : "OFF"}
      </motion.button>
    </div>
  );
}
