"use client";

import React from "react";
import { Info } from "lucide-react";

interface EducationalBannerProps {
  onTermClick: (term: string) => void;
}

export function EducationalBanner({ onTermClick }: EducationalBannerProps) {
  return (
    <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 flex flex-col sm:flex-row items-start gap-3">
      <Info size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
      <div>
        <h3 className="text-white font-medium mb-1">Understanding Perpetual AUT Trading</h3>
        <p className="text-white/70 text-sm">
          Trade AUT tokens with leverage without expiry dates. Click on the terms below to learn more:
        </p>
        <div className="flex flex-wrap gap-2 mt-2 w-full">
          <button 
            onClick={() => onTermClick('perpetual')}
            className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white"
          >
            Perpetual Contracts
          </button>
          <button 
            onClick={() => onTermClick('leverage')}
            className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white"
          >
            Leverage
          </button>
          <button 
            onClick={() => onTermClick('liquidation')}
            className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white"
          >
            Liquidation
          </button>
          <button 
            onClick={() => onTermClick('funding')}
            className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white"
          >
            Funding Rate
          </button>
          <button 
            onClick={() => onTermClick('margin')}
            className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white"
          >
            Margin
          </button>
        </div>
      </div>
    </div>
  );
}

export default EducationalBanner;
