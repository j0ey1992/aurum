"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Flame, 
  Shield, 
  Calendar, 
  Info, 
  Twitter,
  User,
  Percent,
  Clock,
  ExternalLink,
  BarChart3
} from "lucide-react";
import Link from "next/link";

export default function TransparencyPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4 sm:px-6">
        <section className="space-y-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="text-white">AurumTrust: </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-yellow-500">
                Transparency
              </span>
            </h1>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg md:text-xl text-white/70 max-w-2xl">
              Our commitment to transparency and sustainable tokenomics. AurumTrust operates with full disclosure of our deflationary mechanism, founder's role, and project timeline.
            </p>
          </motion.div>
          
          {/* Main content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Left column - Mechanism and Founder's Role */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2 space-y-6 sm:space-y-8"
            >
              {/* Mechanism card */}
              <div className="bg-[#1a1a1a]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Flame size={18} className="sm:text-[20px] text-red-500" />
                  <h3 className="text-lg sm:text-xl font-bold text-white">Mechanism</h3>
                </div>
                
                <div className="space-y-4">
                  <p className="text-white/70">
                    15% of weekly gold trading profits will be used to buy back and burn tokens, permanently removing them from circulation and increasing scarcity.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4">
                    <div className="bg-[#2a2a2a] rounded-xl p-3 sm:p-4 border border-white/10">
                      <div className="text-amber-400 text-xs sm:text-sm font-medium mb-1">Profit Allocation</div>
                      <div className="text-xl sm:text-2xl font-bold text-white">15%</div>
                      <div className="text-[10px] sm:text-xs text-white/50 mt-1">of weekly gold trading</div>
                    </div>
                    
                    <div className="bg-[#2a2a2a] rounded-xl p-3 sm:p-4 border border-white/10">
                      <div className="text-amber-400 text-xs sm:text-sm font-medium mb-1">First Burn Date</div>
                      <div className="text-xl sm:text-2xl font-bold text-white">April 14, 2025</div>
                      <div className="text-[10px] sm:text-xs text-white/50 mt-1">or earlier if profits allow</div>
                    </div>
                    
                    <div className="bg-[#2a2a2a] rounded-xl p-3 sm:p-4 border border-white/10">
                      <div className="text-amber-400 text-xs sm:text-sm font-medium mb-1">Burn Process</div>
                      <div className="text-xl sm:text-2xl font-bold text-white">Weekly</div>
                      <div className="text-[10px] sm:text-xs text-white/50 mt-1">transparent & verifiable</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:mt-6 bg-[#2a2a2a]/50 rounded-xl p-3 sm:p-4 border border-white/10">
                    <h4 className="text-white font-medium text-sm sm:text-base mb-2">Burn Mechanism Details</h4>
                    <ul className="space-y-2 text-white/70 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="h-5 w-5 flex-shrink-0 rounded-full bg-amber-500/10 flex items-center justify-center mt-0.5">
                          <span className="text-amber-400 text-xs">1</span>
                        </div>
                        <span>15% of weekly gold trading profits are allocated for token buybacks</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-5 w-5 flex-shrink-0 rounded-full bg-amber-500/10 flex items-center justify-center mt-0.5">
                          <span className="text-amber-400 text-xs">2</span>
                        </div>
                        <span>Tokens are purchased from the open market at current market prices</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-5 w-5 flex-shrink-0 rounded-full bg-amber-500/10 flex items-center justify-center mt-0.5">
                          <span className="text-amber-400 text-xs">3</span>
                        </div>
                        <span>Purchased tokens are sent to a verifiable burn address, permanently removing them from circulation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-5 w-5 flex-shrink-0 rounded-full bg-amber-500/10 flex items-center justify-center mt-0.5">
                          <span className="text-amber-400 text-xs">4</span>
                        </div>
                        <span>All transactions are posted publicly on our official X (Twitter) account</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Founder's Role card */}
              <div className="bg-[#1a1a1a]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <User size={18} className="sm:text-[20px] text-blue-500" />
                  <h3 className="text-lg sm:text-xl font-bold text-white">Founder's Role</h3>
                </div>
                
                <div className="space-y-4">
                  <p className="text-white/70">
                    The founder holds 40% of the supply and will only sell tokens to fund the trading account. Any unused tokens will be burned, further reducing supply.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                    <div className="bg-[#2a2a2a] rounded-xl p-3 sm:p-4 border border-white/10">
                      <div className="text-blue-400 text-xs sm:text-sm font-medium mb-1">Founder Allocation</div>
                      <div className="text-xl sm:text-2xl font-bold text-white">40%</div>
                      <div className="text-[10px] sm:text-xs text-white/50 mt-1">of total token supply</div>
                    </div>
                    
                    <div className="bg-[#2a2a2a] rounded-xl p-3 sm:p-4 border border-white/10">
                      <div className="text-blue-400 text-xs sm:text-sm font-medium mb-1">Usage Purpose</div>
                      <div className="text-xl sm:text-2xl font-bold text-white">Trading</div>
                      <div className="text-[10px] sm:text-xs text-white/50 mt-1">to fund gold trading account</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:mt-6 bg-[#2a2a2a]/50 rounded-xl p-3 sm:p-4 border border-white/10">
                    <h4 className="text-white font-medium text-sm sm:text-base mb-2">Founder's Commitment</h4>
                    <ul className="space-y-2 text-white/70 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="h-5 w-5 flex-shrink-0 rounded-full bg-blue-500/10 flex items-center justify-center mt-0.5">
                          <span className="text-blue-400 text-xs">•</span>
                        </div>
                        <span>Tokens will only be sold to fund the gold trading account that powers the burn mechanism</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-5 w-5 flex-shrink-0 rounded-full bg-blue-500/10 flex items-center justify-center mt-0.5">
                          <span className="text-blue-400 text-xs">•</span>
                        </div>
                        <span>All token sales will be announced in advance and conducted in a transparent manner</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-5 w-5 flex-shrink-0 rounded-full bg-blue-500/10 flex items-center justify-center mt-0.5">
                          <span className="text-blue-400 text-xs">•</span>
                        </div>
                        <span>Any tokens not needed for trading will be burned, further reducing the total supply</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-5 w-5 flex-shrink-0 rounded-full bg-blue-500/10 flex items-center justify-center mt-0.5">
                          <span className="text-blue-400 text-xs">•</span>
                        </div>
                        <span>The founder is committed to the long-term success of AurumTrust and its deflationary model</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Transparency & Duration card */}
              <div className="bg-[#1a1a1a]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Calendar size={18} className="sm:text-[20px] text-green-500" />
                  <h3 className="text-lg sm:text-xl font-bold text-white">Transparency & Duration</h3>
                </div>
                
                <div className="space-y-4">
                  <p className="text-white/70">
                    Weekly profits and buy-back transactions will be posted on the official X (Twitter) account. The experiment continues until all tokens are burned or the trading account is liquidated.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                    <div className="bg-[#2a2a2a] rounded-xl p-3 sm:p-4 border border-white/10">
                      <div className="text-green-400 text-xs sm:text-sm font-medium mb-1">Reporting Frequency</div>
                      <div className="text-xl sm:text-2xl font-bold text-white">Weekly</div>
                      <div className="text-[10px] sm:text-xs text-white/50 mt-1">profit & burn reports</div>
                    </div>
                    
                    <div className="bg-[#2a2a2a] rounded-xl p-3 sm:p-4 border border-white/10">
                      <div className="text-green-400 text-xs sm:text-sm font-medium mb-1">Project Duration</div>
                      <div className="text-xl sm:text-2xl font-bold text-white">Until Complete</div>
                      <div className="text-[10px] sm:text-xs text-white/50 mt-1">all tokens burned or account liquidated</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:mt-6 flex items-center gap-3 bg-[#2a2a2a]/50 rounded-xl p-3 sm:p-4 border border-white/10">
                    <Twitter size={20} className="text-blue-400 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-medium text-sm sm:text-base">Official Updates</h4>
                      <p className="text-white/70 text-xs sm:text-sm mt-1">
                        Follow our official X (Twitter) account for weekly updates on trading profits, token buybacks, and burn transactions.
                      </p>
                      <a 
                        href="https://x.com/AurumTrustCro" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 text-xs sm:text-sm mt-2"
                      >
                        <span>@AurumTrustCro</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Right column - Wyll and Deflationary Model */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6 sm:space-y-8"
            >
              {/* Wyll card */}
              <div className="bg-[#1a1a1a]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Shield size={18} className="sm:text-[20px] text-purple-500" />
                  <h3 className="text-lg sm:text-xl font-bold text-white">About Wyll</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-[#2a2a2a]/80 rounded-xl p-3 sm:p-4 border border-white/10">
                    <h4 className="text-white font-medium text-sm sm:text-base mb-2">Cronos Ambassador</h4>
                    <p className="text-white/70 text-sm">
                      Wyll is a Cronos Ambassador and early adopter in the Cronos ecosystem, with a vision to create sustainable and innovative projects on the chain.
                    </p>
                  </div>
                  
                  <div className="bg-[#2a2a2a]/80 rounded-xl p-3 sm:p-4 border border-white/10">
                    <h4 className="text-white font-medium text-sm sm:text-base mb-2">Long-Term Vision</h4>
                    <p className="text-white/70 text-sm">
                      As an early adopter in the Cronos ecosystem, Wyll aims to create a long-term sustainable token that provides real value through its unique deflationary mechanism backed by gold trading.
                    </p>
                  </div>
                  
                  <div className="bg-[#2a2a2a]/80 rounded-xl p-3 sm:p-4 border border-white/10">
                    <h4 className="text-white font-medium text-sm sm:text-base mb-2">Experience</h4>
                    <p className="text-white/70 text-sm">
                      With extensive experience in both traditional finance and cryptocurrency markets, Wyll brings a unique perspective to AurumTrust, combining gold trading expertise with blockchain innovation.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Deflationary Model card */}
              <div className="bg-[#1a1a1a]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <BarChart3 size={18} className="sm:text-[20px] text-amber-500" />
                  <h3 className="text-lg sm:text-xl font-bold text-white">Deflationary Model</h3>
                </div>
                
                <div className="space-y-4">
                  <p className="text-white/70">
                    AurumTrust's deflationary model, backed by gold trading, aims to increase scarcity over time, potentially enhancing token value for holders.
                  </p>
                  
                  <div className="bg-[#2a2a2a]/80 rounded-xl p-3 sm:p-4 border border-white/10">
                    <h4 className="text-white font-medium text-sm sm:text-base mb-2">How It Works</h4>
                    <ul className="space-y-2 text-white/70 text-sm">
                      <li className="flex items-start gap-2">
                        <div className="h-5 w-5 flex-shrink-0 rounded-full bg-amber-500/10 flex items-center justify-center mt-0.5">
                          <span className="text-amber-400 text-xs">1</span>
                        </div>
                        <span>Gold trading profits fund token buybacks</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-5 w-5 flex-shrink-0 rounded-full bg-amber-500/10 flex items-center justify-center mt-0.5">
                          <span className="text-amber-400 text-xs">2</span>
                        </div>
                        <span>Purchased tokens are permanently burned</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-5 w-5 flex-shrink-0 rounded-full bg-amber-500/10 flex items-center justify-center mt-0.5">
                          <span className="text-amber-400 text-xs">3</span>
                        </div>
                        <span>Supply decreases over time, increasing scarcity</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-5 w-5 flex-shrink-0 rounded-full bg-amber-500/10 flex items-center justify-center mt-0.5">
                          <span className="text-amber-400 text-xs">4</span>
                        </div>
                        <span>Process continues until all tokens are burned or trading account is liquidated</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Experimental Token Notice */}
              <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 flex items-start gap-3">
                <Info size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-white font-medium mb-1">Experimental Token Notice</h3>
                  <p className="text-white/70 text-sm">
                    AurumTrust is an experimental token with a deflationary model backed by gold trading. The experiment continues until all tokens are burned or the trading account is liquidated. All transactions are transparent and verifiable on the blockchain.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 sm:mt-12 text-center"
          >
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
              Join the AurumTrust Community
            </h3>
            <p className="text-white/70 text-sm sm:text-base max-w-2xl mx-auto mb-5 sm:mb-6">
              Follow our journey as we create a sustainable deflationary token backed by real gold trading profits.
            </p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              <a 
                href="https://x.com/AurumTrustCro" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base transition-colors"
              >
                <Twitter size={16} className="sm:text-[18px]" />
                <span>Follow on X</span>
              </a>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-300 to-yellow-500 text-black px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm sm:text-base font-medium transition-transform hover:scale-105"
              >
                <span>Back to Home</span>
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
