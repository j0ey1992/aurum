"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { TradingForm } from "./TradingForm";
import { OrderParams } from "./types";

interface TradingFormModalProps {
  showTradingForm: boolean;
  setShowTradingForm: (show: boolean) => void;
  currentPrice: number;
  maxMargin: number;
  onSubmit: (params: OrderParams) => Promise<void>;
}

export function TradingFormModal({
  showTradingForm,
  setShowTradingForm,
  currentPrice,
  maxMargin,
  onSubmit,
}: TradingFormModalProps) {
  return (
    <AnimatePresence>
      {showTradingForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-3 sm:p-4 overflow-y-auto"
          onClick={() => setShowTradingForm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="max-w-md w-full mx-auto my-12 sm:my-16 overflow-visible"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setShowTradingForm(false)}
                className="p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            
            <TradingForm
              currentPrice={currentPrice}
              maxMargin={maxMargin}
              onSubmit={onSubmit}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default TradingFormModal;
