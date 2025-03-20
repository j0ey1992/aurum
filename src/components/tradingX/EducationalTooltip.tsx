"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, X } from "lucide-react";

interface EducationalTooltipProps {
  showTooltip: string | null;
  setShowTooltip: (tooltip: string | null) => void;
  tooltips: Record<string, string>;
}

export function EducationalTooltip({
  showTooltip,
  setShowTooltip,
  tooltips,
}: EducationalTooltipProps) {
  return (
    <AnimatePresence>
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#2a2a2a] p-3 rounded-lg shadow-lg border border-white/10 max-w-md z-50"
        >
          <div className="flex gap-2">
            <Info size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white text-sm">{tooltips[showTooltip as keyof typeof tooltips]}</p>
            </div>
          </div>
          <button
            onClick={() => setShowTooltip(null)}
            className="absolute top-2 right-2 text-white/50 hover:text-white"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default EducationalTooltip;
