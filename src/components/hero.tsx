"use client";

import React from "react";
import { motion } from "framer-motion";
import { Leaderboard } from "@/components/leaderboard";
import { TradingGame } from "@/components/tradingX/TradingGame";
import { AurumTrust } from "@/components/AurumTrust";

export function Hero() {
  return (
    <section className="w-full py-16 md:py-24 lg:py-32 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="space-y-16">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="text-white">AurumTrust: </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-yellow-500">
                Scarcity By Design
              </span>
            </h1>
            <p className="mt-4 text-xl text-white/70 max-w-lg">
              The gold-backed deflationary token experiment on Cronos Chain. Burn mechanism funded by real gold trading profits.
            </p>
          </motion.div>
          
          {/* Trading Game */}
          <TradingGame />
          
          {/* AurumTrust Token Information */}
          <AurumTrust />
          
          {/* Leaderboard */}
          <div className="mt-16">
            <Leaderboard />
          </div>
        </div>
      </div>
    </section>
  );
}
