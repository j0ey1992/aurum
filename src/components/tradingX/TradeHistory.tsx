"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Clock, TrendingUp, TrendingDown, Info, Filter, X } from "lucide-react";
import { tradingService } from "@/services/tradingService";
import { ethers } from "ethers";
import { useAppKitAccount } from "@reown/appkit/react";

interface Trade {
  id: string;
  trader: string;
  direction: "long" | "short";
  price: number;
  size: number;
  leverage: number;
  timestamp: number;
  pnl?: number;
  status: "open" | "closed" | "liquidated";
}

interface TradeHistoryProps {
  currentPrice: number;
  className?: string;
}

export function TradeHistory({ currentPrice, className = "" }: TradeHistoryProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "long" | "short" | "closed" | "liquidated">("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  const { address, isConnected } = useAppKitAccount();

  // Generate mock data for demonstration
  const generateMockTrades = () => {
    const mockTrades: Trade[] = [];
    
    // Generate some mock trades
    for (let i = 1; i <= 20; i++) {
      const direction = Math.random() > 0.5 ? "long" : "short";
      const priceOffset = (Math.random() * 0.1) - 0.05; // -5% to +5%
      const price = currentPrice * (1 + priceOffset);
      const size = Math.floor(Math.random() * 1000) + 100;
      const leverage = Math.floor(Math.random() * 10) + 1;
      const timestamp = Date.now() - Math.floor(Math.random() * 86400000); // Last 24 hours
      
      // Determine status (70% open, 20% closed, 10% liquidated)
      let status: "open" | "closed" | "liquidated" = "open";
      const statusRand = Math.random();
      if (statusRand > 0.7 && statusRand <= 0.9) {
        status = "closed";
      } else if (statusRand > 0.9) {
        status = "liquidated";
      }
      
      // Calculate PnL for closed positions
      let pnl: number | undefined = undefined;
      if (status === "closed") {
        const pnlMultiplier = (Math.random() * 0.2) - 0.1; // -10% to +10%
        pnl = size * leverage * pnlMultiplier;
      } else if (status === "liquidated") {
        pnl = -size; // Full loss on liquidation
      }
      
      mockTrades.push({
        id: `trade-${i}`,
        trader: address || `0x${Math.random().toString(16).substring(2, 14)}`,
        direction,
        price,
        size,
        leverage,
        timestamp,
        pnl,
        status
      });
    }
    
    // Sort by timestamp (newest first)
    return mockTrades.sort((a, b) => b.timestamp - a.timestamp);
  };

  // Fetch trade history
  const fetchTradeHistory = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would fetch from the contract
      // For now, we'll use mock data
      const mockTrades = generateMockTrades();
      setTrades(mockTrades);
    } catch (err) {
      console.error("Error fetching trade history:", err);
      setError("Failed to load trade history data");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter trades based on selected filter
  const getFilteredTrades = () => {
    if (filter === "all") {
      return trades;
    }
    
    if (filter === "long" || filter === "short") {
      return trades.filter(trade => trade.direction === filter);
    }
    
    return trades.filter(trade => trade.status === filter);
  };

  // Format timestamp to readable date
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format price with appropriate precision
  const formatPrice = (price: number) => {
    return price.toFixed(4);
  };

  // Format PnL with sign and appropriate precision
  const formatPnL = (pnl: number) => {
    const sign = pnl >= 0 ? '+' : '';
    return `${sign}${pnl.toFixed(2)}`;
  };

  // Initial fetch
  useEffect(() => {
    fetchTradeHistory();
    
    // Set up interval to refresh data
    const interval = setInterval(fetchTradeHistory, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, [address]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-[#1a1a1a]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl ${className}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Trade History</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <Filter size={16} className="text-white/70" />
            </button>
            
            {/* Filter dropdown */}
            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-2 bg-[#2a2a2a] rounded-lg shadow-lg border border-white/10 p-2 z-10 w-36">
                <button
                  onClick={() => {
                    setFilter("all");
                    setShowFilterMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded text-sm ${filter === "all" ? "bg-amber-400/20 text-amber-400" : "text-white/70 hover:bg-white/5"}`}
                >
                  All Trades
                </button>
                <button
                  onClick={() => {
                    setFilter("long");
                    setShowFilterMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded text-sm ${filter === "long" ? "bg-green-400/20 text-green-400" : "text-white/70 hover:bg-white/5"}`}
                >
                  Long Positions
                </button>
                <button
                  onClick={() => {
                    setFilter("short");
                    setShowFilterMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded text-sm ${filter === "short" ? "bg-red-400/20 text-red-400" : "text-white/70 hover:bg-white/5"}`}
                >
                  Short Positions
                </button>
                <button
                  onClick={() => {
                    setFilter("closed");
                    setShowFilterMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded text-sm ${filter === "closed" ? "bg-blue-400/20 text-blue-400" : "text-white/70 hover:bg-white/5"}`}
                >
                  Closed Trades
                </button>
                <button
                  onClick={() => {
                    setFilter("liquidated");
                    setShowFilterMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded text-sm ${filter === "liquidated" ? "bg-purple-400/20 text-purple-400" : "text-white/70 hover:bg-white/5"}`}
                >
                  Liquidated
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={fetchTradeHistory}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            disabled={isLoading}
          >
            <RefreshCw size={16} className={`text-white/70 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Filter indicator */}
      {filter !== "all" && (
        <div className="flex items-center gap-2 mb-4 bg-white/5 rounded-lg px-3 py-2">
          <span className="text-white/70 text-sm">
            Filtered by: <span className="font-medium text-white">{filter.charAt(0).toUpperCase() + filter.slice(1)}</span>
          </span>
          <button
            onClick={() => setFilter("all")}
            className="p-1 rounded-full hover:bg-white/10"
          >
            <X size={14} className="text-white/70" />
          </button>
        </div>
      )}
      
      {/* Info banner */}
      <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg p-3 mb-4 flex items-start gap-2">
        <Info size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-white/70 text-sm">
          This shows recent trades on the AUT perpetual trading platform. Use the filter button to view specific types of trades.
        </p>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      
      {/* Trade history table */}
      <div className="overflow-hidden rounded-lg border border-white/10">
        {/* Table header */}
        <div className="grid grid-cols-6 bg-white/5 p-2 text-xs font-medium text-white/70">
          <div>Type</div>
          <div>Price</div>
          <div>Size</div>
          <div>Leverage</div>
          <div>PnL</div>
          <div>Time</div>
        </div>
        
        {/* Table body */}
        <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {isLoading ? (
            <div className="p-4 text-center text-white/50">
              <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
              Loading trade history...
            </div>
          ) : getFilteredTrades().length === 0 ? (
            <div className="p-4 text-center text-white/50">
              No trades found matching the selected filter.
            </div>
          ) : (
            getFilteredTrades().map((trade) => (
              <div 
                key={trade.id} 
                className={`grid grid-cols-6 p-2 text-sm border-t border-white/5 ${
                  trade.status === "liquidated" ? "bg-red-500/5" : ""
                }`}
              >
                <div className="flex items-center">
                  {trade.direction === "long" ? (
                    <TrendingUp size={14} className="text-green-400 mr-1" />
                  ) : (
                    <TrendingDown size={14} className="text-red-400 mr-1" />
                  )}
                  <span className={trade.direction === "long" ? "text-green-400" : "text-red-400"}>
                    {trade.direction.charAt(0).toUpperCase() + trade.direction.slice(1)}
                  </span>
                </div>
                <div className="text-white">${formatPrice(trade.price)}</div>
                <div className="text-white">{trade.size.toFixed(2)} AUT</div>
                <div className="text-white">{trade.leverage}x</div>
                <div className={`
                  ${trade.status === "open" ? "text-white/50" : 
                    trade.pnl && trade.pnl >= 0 ? "text-green-400" : "text-red-400"}
                `}>
                  {trade.status === "open" ? "-" : 
                    trade.pnl ? formatPnL(trade.pnl) : "-"}
                </div>
                <div className="text-white/70 flex items-center">
                  <Clock size={12} className="mr-1" />
                  {formatTimestamp(trade.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Disclaimer */}
      <p className="text-white/50 text-xs mt-4">
        Note: This is a simulated trade history for demonstration purposes. In the production version, this will display real trades from the AUT perpetual trading contract.
      </p>
    </motion.div>
  );
}

export default TradeHistory;
