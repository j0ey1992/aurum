"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Position } from "./types";

interface PositionManagerModalProps {
  showPositionManager: boolean;
  setShowPositionManager: (show: boolean) => void;
  selectedPosition: Position | null;
}

export function PositionManagerModal({
  showPositionManager,
  setShowPositionManager,
  selectedPosition,
}: PositionManagerModalProps) {
  if (!selectedPosition) return null;

  return (
    <AnimatePresence>
      {showPositionManager && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto"
          onClick={() => setShowPositionManager(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-5 max-w-md w-full mx-auto my-4 sm:my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Manage Position</h3>
              <button
                onClick={() => setShowPositionManager(false)}
                className="p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Position details */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-white/50">Direction</p>
                  <p className={`text-sm font-medium ${
                    selectedPosition.direction === "long" ? "text-green-400" : "text-red-400"
                  }`}>
                    {selectedPosition.direction === "long" ? "Long" : "Short"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Leverage</p>
                  <p className="text-sm font-medium text-white">{selectedPosition.leverage}x</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Entry Price</p>
                  <p className="text-sm font-medium text-white">${selectedPosition.entryPrice.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Size</p>
                  <p className="text-sm font-medium text-white">${selectedPosition.size.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Margin</p>
                  <p className="text-sm font-medium text-white">{selectedPosition.margin.toFixed(2)} AUT</p>
                </div>
                <div>
                  <p className="text-xs text-white/50">Liquidation Price</p>
                  <p className="text-sm font-medium text-red-400">${selectedPosition.liquidationPrice.toFixed(4)}</p>
                </div>
                {selectedPosition.stopLoss && (
                  <div>
                    <p className="text-xs text-white/50">Stop Loss</p>
                    <p className="text-sm font-medium text-red-400">${selectedPosition.stopLoss.toFixed(4)}</p>
                  </div>
                )}
                {selectedPosition.takeProfit && (
                  <div>
                    <p className="text-xs text-white/50">Take Profit</p>
                    <p className="text-sm font-medium text-green-400">${selectedPosition.takeProfit.toFixed(4)}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Position management options */}
            <div className="space-y-3">
              <button
                className="w-full py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium"
              >
                Close Position
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium"
                >
                  Add Stop Loss
                </button>
                <button
                  className="py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium"
                >
                  Add Take Profit
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PositionManagerModal;
