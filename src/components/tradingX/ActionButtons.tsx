"use client";

import React from "react";
import { HelpCircle } from "lucide-react";

interface ActionButtonsProps {
  isWalletConnected: boolean;
  walletAddress?: string;
  onTrade: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onHelp: () => void;
}

export function ActionButtons({
  isWalletConnected,
  walletAddress,
  onTrade,
  onConnect,
  onDisconnect,
  onHelp,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 sm:mt-6 border-t border-white/5 pt-4">
      <div className="flex gap-2 w-full sm:w-auto">
        <button
          onClick={onTrade}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-300 to-yellow-400 text-black font-medium hover:shadow-lg hover:shadow-amber-500/20 transition-all w-full sm:w-auto"
          disabled={!isWalletConnected}
        >
          Trade AUT
        </button>
        
        {!isWalletConnected ? (
          <button
            onClick={onConnect}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all w-full sm:w-auto"
          >
            Connect Wallet
          </button>
        ) : (
          <button
            onClick={onDisconnect}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all w-full sm:w-auto"
          >
            Disconnect
          </button>
        )}
        
        {/* Help button */}
        <button
          onClick={onHelp}
          className="p-2 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all"
          aria-label="Help"
        >
          <HelpCircle size={16} />
        </button>
      </div>
      
      <div className="text-white/70 text-sm">
        {isWalletConnected ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <span>Connected: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
            <span>Wallet not connected</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActionButtons;
