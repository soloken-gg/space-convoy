import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";

export default function FeedbackBanner({ delta, streakMsg }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
      <AnimatePresence>
        {delta !== null && delta !== undefined && (
          <motion.div
            key={`delta-${delta}`}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6 }}
            className="absolute"
            style={{ top: "40%" }}
            data-testid="score-delta"
          >
            <span
              className={`font-numeric font-bold text-5xl tracking-wider ${
                delta >= 0 ? "text-[#06D6A0]" : "text-[#F4A261]"
              }`}
              style={{
                textShadow:
                  delta >= 0
                    ? "0 0 24px rgba(6,214,160,0.6)"
                    : "0 0 24px rgba(244,162,97,0.6)",
              }}
            >
              {delta >= 0 ? `+${delta}` : delta}
            </span>
          </motion.div>
        )}

        {streakMsg && (
          <motion.div
            key={`streak-${streakMsg}`}
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            className="absolute flex items-center gap-3 px-6 py-3 rounded-full bg-[#06D6A0]/10 border border-[#06D6A0]/50 backdrop-blur-xl"
            style={{ top: "28%" }}
            data-testid="streak-banner"
          >
            <Flame className="text-[#06D6A0]" size={22} />
            <span className="font-primary font-bold text-[#06D6A0] text-xl tracking-widest uppercase">
              {streakMsg}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
