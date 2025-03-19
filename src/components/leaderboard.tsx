"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Award, Users, ArrowUpDown } from "lucide-react";
import { tokenService, LeaderboardEntry } from "@/services/tokenService";
import { ethers } from "ethers";

interface LeaderboardProps {
  className?: string;
}

export function Leaderboard({ className }: LeaderboardProps) {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"winnings" | "winRate">("winnings");

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        
        // In a real implementation, we would get the provider from the wallet connection
        // For now, we'll use the mock data from the service
        const mockProvider = {} as ethers.BrowserProvider;
        const data = await tokenService.getLeaderboard(mockProvider);
        
        setLeaderboardData(data);
      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Sort leaderboard data
  const sortedData = [...leaderboardData].sort((a, b) => {
    if (sortBy === "winnings") {
      return parseFloat(b.totalWinnings) - parseFloat(a.totalWinnings);
    } else {
      return b.winRate - a.winRate;
    }
  });

  // Get medal for position
  const getMedal = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy size={18} className="text-amber-400" />;
      case 1:
        return <Medal size={18} className="text-gray-400" />;
      case 2:
        return <Award size={18} className="text-amber-700" />;
      default:
        return <span className="text-white/50 text-sm font-medium">{position + 1}</span>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-[#1a1a1a]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 shadow-xl ${className}`}
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-amber-400" />
          <h2 className="text-xl font-bold text-white">Leaderboard</h2>
        </div>
        
        <div className="flex bg-[#2a2a2a] rounded-lg p-1">
          <button
            onClick={() => setSortBy("winnings")}
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              sortBy === "winnings"
                ? "bg-amber-400 text-black"
                : "text-white/70 hover:text-white"
            }`}
          >
            Winnings
          </button>
          <button
            onClick={() => setSortBy("winRate")}
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              sortBy === "winRate"
                ? "bg-amber-400 text-black"
                : "text-white/70 hover:text-white"
            }`}
          >
            Win Rate
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-400"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-12 text-xs text-white/50 font-medium mb-2 px-2">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Trader</div>
            <div className="col-span-3 text-right">
              <button 
                onClick={() => setSortBy("winnings")}
                className="flex items-center justify-end gap-1 hover:text-white/70"
              >
                Winnings
                {sortBy === "winnings" && <ArrowUpDown size={12} />}
              </button>
            </div>
            <div className="col-span-3 text-right">
              <button 
                onClick={() => setSortBy("winRate")}
                className="flex items-center justify-end gap-1 hover:text-white/70"
              >
                Win Rate
                {sortBy === "winRate" && <ArrowUpDown size={12} />}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            {sortedData.map((entry, index) => (
              <motion.div
                key={entry.address}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`grid grid-cols-12 items-center p-3 rounded-lg ${
                  index < 3 ? "bg-amber-400/5 border border-amber-400/20" : "bg-white/5"
                }`}
              >
                <div className="col-span-1 flex justify-center">
                  {getMedal(index)}
                </div>
                <div className="col-span-5 font-medium text-white">
                  {entry.address}
                </div>
                <div className="col-span-3 text-right font-medium text-amber-400">
                  ${entry.totalWinnings}
                </div>
                <div className="col-span-3 text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    entry.winRate > 60 
                      ? "bg-green-400/20 text-green-400" 
                      : entry.winRate > 40
                      ? "bg-amber-400/20 text-amber-400"
                      : "bg-red-400/20 text-red-400"
                  }`}>
                    {entry.winRate}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
          
          {sortedData.length === 0 && (
            <div className="text-center py-10 text-white/50">
              No data available yet
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

export default Leaderboard;
