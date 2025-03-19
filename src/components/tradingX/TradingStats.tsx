"use client";

import React from "react";
import { motion } from "framer-motion";
import { BarChart2, TrendingUp, Award, AlertTriangle, DollarSign } from "lucide-react";
import { TradingStats as TradingStatsType } from "./types";

interface TradingStatsProps {
  stats: TradingStatsType;
  autBalance: string;
  fundingRate: number;
  nextFundingTime: Date;
  className?: string;
}

export function TradingStats({
  stats,
  autBalance,
  fundingRate,
  nextFundingTime,
  className = "",
}: TradingStatsProps) {
  const {
    profit,
    loss,
    totalProfit,
    totalLoss,
    averageLeverage,
    winRate,
  } = stats;
  
  // Format funding rate
  const formatFundingRate = () => {
    const sign = fundingRate >= 0 ? "+" : "-";
    return `${sign}${Math.abs(fundingRate).toFixed(4)}%`;
  };
  
  // Format next funding time
  const formatNextFundingTime = () => {
    const now = new Date();
    const diffMs = nextFundingTime.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m`;
  };
  
  // Calculate net PnL
  const netPnL = totalProfit - totalLoss;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#1a1a1a]/80 backdrop-blur-sm border border-white/10 rounded-xl p-5 ${className}`}
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 size={18} className="text-amber-400" />
        <h3 className="text-lg font-bold text-white">Trading Statistics</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Balance */}
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-xs text-white/70 mb-1">Balance</p>
          <p className="text-xl font-bold text-white flex items-center">
            <DollarSign size={16} className="text-amber-400 mr-1" />
            {parseFloat(autBalance).toFixed(2)} AUT
          </p>
        </div>
        
        {/* Net PnL */}
        <div className={`rounded-lg p-3 ${
          netPnL >= 0 ? "bg-green-400/10" : "bg-red-400/10"
        }`}>
          <p className="text-xs text-white/70 mb-1">Net P&L</p>
          <p className={`text-xl font-bold ${
            netPnL >= 0 ? "text-green-400" : "text-red-400"
          } flex items-center`}>
            {netPnL >= 0 ? (
              <TrendingUp size={16} className="mr-1" />
            ) : (
              <AlertTriangle size={16} className="mr-1" />
            )}
            {netPnL >= 0 ? "+" : ""}{netPnL.toFixed(2)} AUT
          </p>
        </div>
      </div>
      
      {/* Trading metrics */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-6">
        <div>
          <p className="text-xs text-white/50">Win Rate</p>
          <p className="text-sm font-medium text-white">
            {winRate.toFixed(1)}%
          </p>
        </div>
        
        <div>
          <p className="text-xs text-white/50">Avg. Leverage</p>
          <p className="text-sm font-medium text-white">
            {averageLeverage.toFixed(1)}x
          </p>
        </div>
        
        <div>
          <p className="text-xs text-white/50">Winning Trades</p>
          <p className="text-sm font-medium text-green-400">
            {profit}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-white/50">Losing Trades</p>
          <p className="text-sm font-medium text-red-400">
            {loss}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-white/50">Total Profit</p>
          <p className="text-sm font-medium text-green-400">
            +{totalProfit.toFixed(2)} AUT
          </p>
        </div>
        
        <div>
          <p className="text-xs text-white/50">Total Loss</p>
          <p className="text-sm font-medium text-red-400">
            -{totalLoss.toFixed(2)} AUT
          </p>
        </div>
      </div>
      
      {/* Funding info */}
      <div className="border-t border-white/10 pt-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm text-white font-medium">Funding</p>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            fundingRate >= 0
              ? "bg-green-400/20 text-green-400"
              : "bg-red-400/20 text-red-400"
          }`}>
            {formatFundingRate()}
          </div>
        </div>
        
        <div className="flex justify-between text-xs">
          <p className="text-white/50">Next funding in:</p>
          <p className="text-white">{formatNextFundingTime()}</p>
        </div>
        
        <p className="text-xs text-white/50 mt-2">
          {fundingRate >= 0
            ? "Longs pay shorts"
            : "Shorts pay longs"} every 8 hours
        </p>
      </div>
    </motion.div>
  );
}

export default TradingStats;
