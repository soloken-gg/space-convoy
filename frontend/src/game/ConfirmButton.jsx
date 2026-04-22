import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

export default function ConfirmButton({
  visible,
  enabled,
  selectedCount,
  requiredCount,
  onClick,
}) {
  return (
    <div
      className="absolute left-0 right-0 bottom-0 flex flex-col items-center justify-end pb-6 px-6 pointer-events-none"
      style={{ height: "14%" }}
    >
      <div className="text-[10px] uppercase tracking-[0.3em] text-white/60 font-primary mb-2">
        {selectedCount} of {requiredCount} locked
      </div>
      <AnimatePresence>
        {visible && (
          <motion.button
            type="button"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={enabled ? onClick : undefined}
            disabled={!enabled}
            className={`w-full max-w-sm h-[72px] rounded-full font-primary font-bold text-xl tracking-[0.3em] uppercase flex items-center justify-center gap-3 pointer-events-auto transition-all duration-200 ${
              enabled
                ? "bg-[#00B4D8] text-[#0A1628] active:scale-[0.98]"
                : "bg-white/5 text-white/40 border border-white/10"
            }`}
            style={
              enabled
                ? {
                    boxShadow:
                      "0 0 40px rgba(0,180,216,0.5), 0 8px 32px rgba(0,180,216,0.25)",
                  }
                : {}
            }
            data-testid="confirm-button"
          >
            <Check size={22} strokeWidth={3} />
            Confirm
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
