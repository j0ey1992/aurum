"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut } from "lucide-react";
import { tokenService, AUT_TOKEN_ADDRESS } from "@/services/tokenService";
import { ethers } from "ethers";
import { useAppKit, useAppKitAccount, useDisconnect } from "@reown/appkit/react";

interface WalletConnectProps {
  className?: string;
}

export function WalletConnect({ className }: WalletConnectProps) {
  // Use AppKit hooks for wallet connection state
  const { address, isConnected } = useAppKitAccount();
  
  // UI state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [autBalance, setAutBalance] = useState("0");
  const [isCopied, setIsCopied] = useState(false);

  // Format address for display
  const formatAddress = (addr: string | undefined) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Copy address to clipboard
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Use AppKit hook to open the modal
  const { open } = useAppKit();
  
  // Connect wallet function using Reown AppKit
  const connectWallet = () => {
    try {
      // Open the AppKit modal with the Connect view
      open({ view: 'Connect' });
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };
  
  // Use AppKit hook to disconnect
  const { disconnect } = useDisconnect();
  
  // Disconnect wallet function
  const disconnectWallet = () => {
    disconnect();
    setIsDropdownOpen(false);
    setAutBalance("0");
  };
  
  // Get AUT token balance
  useEffect(() => {
    const getTokenBalance = async () => {
      if (isConnected && address && typeof window !== 'undefined' && window.ethereum) {
        try {
          // Safely create a provider for token balance check
          const ethereum = window.ethereum as any;
          // Check if we can create an ethers provider
          if (ethereum) {
            // Use ethers to create a provider
            const provider = new ethers.BrowserProvider(ethereum);
            const balance = await tokenService.getBalance(provider, address);
            setAutBalance(balance);
          }
        } catch (error) {
          console.error("Error getting token balance:", error);
          setAutBalance("0");
        }
      }
    };

    if (isConnected && address) {
      getTokenBalance();
    }
  }, [isConnected, address]);

  return (
    <div className={`relative ${className}`}>
      {isConnected && address ? (
        <motion.button
          className="flex items-center rounded-full bg-[#2a2a2a] border border-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-[#2a2a2a]/80 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <div className="flex items-center">
            <div className="h-5 w-5 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center mr-2">
              <Wallet size={12} className="text-white" />
            </div>
            <span>{formatAddress(address)}</span>
            <ChevronDown size={14} className="ml-1 text-white/50" />
          </div>
        </motion.button>
      ) : (
        <motion.button 
          className="flex items-center rounded-full bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 px-4 py-1.5 text-sm font-medium text-black hover:shadow-lg hover:shadow-amber-500/20 transition-all"
          whileHover={{ scale: 1.03, boxShadow: "0 0 15px rgba(245, 158, 11, 0.3)" }}
          whileTap={{ scale: 0.97 }}
          onClick={connectWallet}
        >
          <Wallet className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Connect Wallet</span>
          <span className="sm:hidden">Connect</span>
        </motion.button>
      )}

      {/* Dropdown menu */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-72 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50"
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-white">Wallet</h3>
                <button 
                  onClick={() => setIsDropdownOpen(false)}
                  className="text-white/50 hover:text-white"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
              
              <div className="bg-[#2a2a2a]/50 rounded-lg p-3 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Address</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={copyAddress}
                      className="text-white/50 hover:text-white"
                      title="Copy address"
                    >
                      <Copy size={14} />
                    </button>
                    <a 
                      href={`https://cronoscan.com/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/50 hover:text-white"
                      title="View on explorer"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
                <div className="mt-1 flex items-center">
                  <span className="text-white font-medium">{formatAddress(address)}</span>
                  {isCopied && (
                    <span className="ml-2 text-xs text-green-400">Copied!</span>
                  )}
                </div>
              </div>
              
              <div className="bg-[#2a2a2a]/50 rounded-lg p-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">$AUT Balance</span>
                  <a 
                    href={`https://cronoscan.com/token/${AUT_TOKEN_ADDRESS}?a=${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/50 hover:text-white"
                    title="View token on explorer"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
                <div className="mt-1">
                  <span className="text-amber-400 font-medium text-lg">{autBalance} AUT</span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  disconnectWallet();
                  setIsDropdownOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              >
                <LogOut size={14} />
                <span>Disconnect</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WalletConnect;
