"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Clock, Award, AlertTriangle, X, ExternalLink } from "lucide-react";
import { Position } from "./types";

interface PositionCardProps {
  position: Position;
  currentPrice: number;
  onClose?: () => void;
  onManage?: () => void;
  className?: string;
}

export function PositionCard({
  position,
  currentPrice,
  onClose,
  onManage,
  className = "",
}: PositionCardProps) {
  const {
    id,
    timestamp,
    direction,
    status,
    leverage,
    entryPrice,
    liquidationPrice,
    size,
    margin,
    pnl,
    exitPrice,
    stopLoss,
    takeProfit,
  } = position;
  
  // Calculate current PnL if position is open
  const calculateCurrentPnl = () => {
    if (status !== "open") return pnl || 0;
    
    if (direction === "long") {
      return ((currentPrice - entryPrice) / entryPrice) * size;
    } else {
      return ((entryPrice - currentPrice) / entryPrice) * size;
    }
  };
  
  const currentPnl = calculateCurrentPnl();
  const pnlPercentage = (currentPnl / margin) * 100;
  
  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Calculate liquidation distance
  const calculateLiquidationDistance = () => {
    if (status !== "open") return 0;
    
    if (direction === "long") {
      return ((entryPrice - liquidationPrice) / entryPrice) * 100;
    } else {
      return ((liquidationPrice - entryPrice) / entryPrice) * 100;
    }
  };
  
  const liquidationDistance = calculateLiquidationDistance();
  
  // Determine if position is at risk of liquidation (within 20% of liquidation price)
  const isAtRisk = status === "open" && (
    (direction === "long" && currentPrice < entryPrice * (1 - (liquidationDistance * 0.8 / 100))) ||
    (direction === "short" && currentPrice > entryPrice * (1 + (liquidationDistance * 0.8 / 100)))
  );
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`bg-[#1a1a1a]/80 backdrop-blur-sm border ${
        status === "open"
          ? isAtRisk
            ? "border-red-400/30"
            : direction === "long"
              ? "border-green-400/30"
              : "border-red-400/30"
          : status === "liquidated"
            ? "border-red-400/30"
            : "border-white/10"
      } rounded-xl p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-full ${
            direction === "long"
              ? "bg-green-400/20"
              : "bg-red-400/20"
          }`}>
            {direction === "long" ? (
              <TrendingUp size={16} className="text-green-400" />
            ) : (
              <TrendingDown size={16} className="text-red-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <p className="text-sm font-medium text-white">
                {direction === "long" ? "Long" : "Short"} Gold
              </p>
              <span className="text-xs text-white/50">#{id.slice(-4)}</span>
            </div>
            <p className="text-xs text-white/50 flex items-center">
              <Clock size={10} className="inline mr-1" />
              {formatDate(timestamp)}
            </p>
          </div>
        </div>
        
        {status === "open" && onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white"
          >
            <X size={14} />
          </button>
        )}
        
        {status === "liquidated" && (
          <div className="px-2 py-1 rounded-full bg-red-400/20 text-red-400 text-xs font-medium">
            Liquidated
          </div>
        )}
        
        {status === "closed" && pnl && pnl > 0 && (
          <div className="px-2 py-1 rounded-full bg-green-400/20 text-green-400 text-xs font-medium flex items-center">
            <Award size={12} className="mr-1" />
            Profit
          </div>
        )}
        
        {status === "closed" && pnl && pnl <= 0 && (
          <div className="px-2 py-1 rounded-full bg-red-400/20 text-red-400 text-xs font-medium">
            Loss
          </div>
        )}
      </div>
      
      {/* Position details */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <p className="text-xs text-white/50">Size</p>
          <p className="text-sm font-medium text-white">${size.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-white/50">Margin</p>
          <p className="text-sm font-medium text-white">{margin.toFixed(2)} AUT</p>
        </div>
        <div>
          <p className="text-xs text-white/50">Leverage</p>
          <p className="text-sm font-medium text-white">{leverage}x</p>
        </div>
        <div>
          <p className="text-xs text-white/50">Entry Price</p>
          <p className="text-sm font-medium text-white">${entryPrice.toFixed(2)}</p>
        </div>
        
        {status === "open" && (
          <>
            <div>
              <p className="text-xs text-white/50">Liquidation Price</p>
              <p className="text-sm font-medium text-red-400">${liquidationPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-white/50">Current Price</p>
              <p className="text-sm font-medium text-white">${currentPrice.toFixed(2)}</p>
            </div>
          </>
        )}
        
        {status !== "open" && exitPrice && (
          <div className="col-span-2">
            <p className="text-xs text-white/50">Exit Price</p>
            <p className="text-sm font-medium text-white">${exitPrice.toFixed(2)}</p>
          </div>
        )}
        
        {stopLoss && (
          <div>
            <p className="text-xs text-white/50">Stop Loss</p>
            <p className="text-sm font-medium text-red-400">${stopLoss.toFixed(2)}</p>
          </div>
        )}
        
        {takeProfit && (
          <div>
            <p className="text-xs text-white/50">Take Profit</p>
            <p className="text-sm font-medium text-green-400">${takeProfit.toFixed(2)}</p>
          </div>
        )}
      </div>
      
      {/* PnL */}
      <div className={`p-3 rounded-lg ${
        currentPnl > 0
          ? "bg-green-400/10"
          : "bg-red-400/10"
      }`}>
        <div className="flex justify-between items-center">
          <p className="text-xs text-white/70">Unrealized PnL</p>
          <p className={`text-sm font-bold ${
            currentPnl > 0
              ? "text-green-400"
              : "text-red-400"
          }`}>
            {currentPnl > 0 ? "+" : ""}{currentPnl.toFixed(2)} AUT
            <span className="text-xs ml-1">
              ({currentPnl > 0 ? "+" : ""}{pnlPercentage.toFixed(2)}%)
            </span>
          </p>
        </div>
      </div>
      
      {/* Risk warning */}
      {status === "open" && isAtRisk && (
        <div className="mt-3 p-2 rounded-lg bg-red-400/10 border border-red-400/30 flex items-center gap-2">
          <AlertTriangle size={14} className="text-red-400" />
          <p className="text-xs text-red-400">
            Position at risk of liquidation
          </p>
        </div>
      )}
      
      {/* Action buttons */}
      {status === "open" && onManage && (
        <button
          onClick={onManage}
          className="mt-3 w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium"
        >
          Manage Position
        </button>
      )}
      
      {/* View on explorer link */}
      <div className="mt-3 text-center">
        <a
          href="#"
          className="text-xs text-white/50 hover:text-white/70 flex items-center justify-center gap-1"
        >
          <ExternalLink size={10} />
          View on Explorer
        </a>
      </div>
    </motion.div>
  );
}

export default PositionCard;
