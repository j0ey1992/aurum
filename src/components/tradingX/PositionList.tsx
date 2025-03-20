"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Position } from "./types";
import { PositionCard } from "./PositionCard";

interface PositionListProps {
  positions: Position[];
  currentPrice: number;
  onClosePosition: (positionId: string) => void;
  onManagePosition: (positionId: string) => void;
  className?: string;
}

export function PositionList({
  positions,
  currentPrice,
  onClosePosition,
  onManagePosition,
  className = "",
}: PositionListProps) {
  // Separate positions by status
  const openPositions = positions.filter(pos => pos.status === "open");
  const closedPositions = positions.filter(pos => pos.status === "closed" || pos.status === "liquidated");
  
  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* Open positions */}
      <div>
        <h3 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3">Open Positions</h3>
        
        {openPositions.length === 0 ? (
          <div className="bg-[#1a1a1a]/50 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-6 text-center">
            <p className="text-white/50">No open positions</p>
            <p className="text-xs sm:text-sm text-white/30 mt-1">
              Open a position to start trading
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <AnimatePresence>
              {openPositions.map(position => (
                <PositionCard
                  key={position.id}
                  position={position}
                  currentPrice={currentPrice}
                  onClose={() => onClosePosition(position.id)}
                  onManage={() => onManagePosition(position.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* Closed positions */}
      {closedPositions.length > 0 && (
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3">Position History</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <AnimatePresence>
              {closedPositions.slice(0, 4).map(position => (
                <PositionCard
                  key={position.id}
                  position={position}
                  currentPrice={currentPrice}
                />
              ))}
            </AnimatePresence>
          </div>
          
          {closedPositions.length > 4 && (
            <div className="mt-3 text-center">
              <button className="text-xs sm:text-sm text-white/50 hover:text-white underline">
                View all position history
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PositionList;
