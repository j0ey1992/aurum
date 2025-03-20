"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Flame, 
  TrendingUp, 
  Calendar, 
  Info, 
  ExternalLink, 
  BarChart3, 
  Percent,
  Clock,
  Twitter
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts";
import { AUT_TOKEN_ADDRESS, BURN_WALLET_ADDRESS, tokenService } from "@/services/tokenService";
import { ethers } from "ethers";

// Initial empty array for token supply data
const initialTokenSupplyData: { date: string; supply: number; price: number }[] = [];

// Initial empty array for burn events
const initialBurnEvents: { date: string; amount: number; usdValue: number; hash: string }[] = [];

// Supply distribution data
const supplyDistributionData = [
  { name: "Circulating", value: 500000, color: "#F59E0B" },
  { name: "Burned", value: 500000, color: "#EF4444" },
];

// Token allocation data
const tokenAllocationData = [
  { name: "Founder (40%)", value: 400000, color: "#3B82F6" },
  { name: "Public (60%)", value: 600000, color: "#10B981" },
];

interface AurumTrustProps {
  className?: string;
}

export function AurumTrust({ className = "" }: AurumTrustProps) {
  const [burnedTokens, setBurnedTokens] = useState(0);
  const [totalSupply, setTotalSupply] = useState(1000000);
  const [currentPrice, setCurrentPrice] = useState(0.2);
  const [initialPrice, setInitialPrice] = useState(0.1);
  const [priceIncrease, setPriceIncrease] = useState(0);
  const [nextBurnDate, setNextBurnDate] = useState("April 14, 2025");
  const [daysUntilBurn, setDaysUntilBurn] = useState(26);
  const [isLoading, setIsLoading] = useState(true);
  const [supplyDistribution, setSupplyDistribution] = useState(supplyDistributionData);
  const [tokenSupplyData, setTokenSupplyData] = useState(initialTokenSupplyData);
  const [burnEvents, setBurnEvents] = useState(initialBurnEvents);

  // Fetch token data from blockchain and Dexscreener
  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        setIsLoading(true);
        
        // Create a provider for Cronos network
        const provider = new ethers.JsonRpcProvider("https://evm.cronos.org");
        
        // Create contract instance
        const contract = new ethers.Contract(
          AUT_TOKEN_ADDRESS,
          [
            "function totalSupply() view returns (uint256)",
            "function balanceOf(address) view returns (uint256)",
            "function decimals() view returns (uint8)"
          ],
          provider
        );
        
        // Get token decimals
        const decimals = await contract.decimals();
        
        // Get total supply
        const supply = await contract.totalSupply();
        const formattedSupply = parseFloat(ethers.formatUnits(supply, decimals));
        setTotalSupply(formattedSupply);
        
        // Get burn wallet balance
        const burnBalance = await contract.balanceOf(BURN_WALLET_ADDRESS);
        const formattedBurnBalance = parseFloat(ethers.formatUnits(burnBalance, decimals));
        setBurnedTokens(formattedBurnBalance);
        
        // Get token price data from Dexscreener
        const tokenPriceData = await tokenService.getTokenPrice();
        
        // Set current price from Dexscreener
        setCurrentPrice(tokenPriceData.price);
        
        // Calculate price increase from Dexscreener data
        setPriceIncrease(tokenPriceData.priceChange);
        
        // Set initial price based on current price and price change
        // This is an approximation - in a real app you'd want to store the initial price
        const calculatedInitialPrice = tokenPriceData.price / (1 + (tokenPriceData.priceChange / 100));
        setInitialPrice(parseFloat(calculatedInitialPrice.toFixed(3)));
        
        // Update supply distribution data
        setSupplyDistribution([
          { name: "Circulating", value: formattedSupply - formattedBurnBalance, color: "#F59E0B" },
          { name: "Burned", value: formattedBurnBalance, color: "#EF4444" },
        ]);
        
        // Get burn transactions
        try {
          const burnTransactions = await tokenService.getBurnTransactions();
          
          // Format burn transactions for the chart
          const formattedBurnEvents = burnTransactions.map(tx => ({
            date: tx.date,
            amount: tx.amount,
            usdValue: tx.usdValue,
            hash: tx.hash
          }));
          
          // Sort by date (newest first)
          formattedBurnEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
          // Take only the most recent 5 transactions
          const recentBurnEvents = formattedBurnEvents.slice(0, 5);
          
          // Update state
          setBurnEvents(recentBurnEvents);
        } catch (error) {
          console.error("Error fetching burn transactions:", error);
        }
        
        // Use price history from Dexscreener if available
        if (tokenPriceData.priceHistory && tokenPriceData.priceHistory.length > 0) {
          // Map price history to our format
          const historicalData = tokenPriceData.priceHistory.map(point => {
            // Calculate supply at this point (approximation)
            // We're assuming linear burn rate for simplicity
            const pointDate = new Date(point.date);
            const today = new Date();
            const totalDays = (today.getTime() - new Date("2025-01-01").getTime()) / (1000 * 60 * 60 * 24);
            const daysPassed = (pointDate.getTime() - new Date("2025-01-01").getTime()) / (1000 * 60 * 60 * 24);
            const burnRatio = daysPassed / totalDays;
            const burnedAmount = formattedBurnBalance * burnRatio;
            const supplyAtPoint = formattedSupply - burnedAmount;
            
            return {
              date: point.date.split('T')[0], // YYYY-MM-DD format
              supply: supplyAtPoint,
              price: point.price
            };
          });
          
          // Add current point
          historicalData.push({
            date: new Date().toISOString().split('T')[0],
            supply: formattedSupply - formattedBurnBalance,
            price: tokenPriceData.price
          });
          
          // Sort by date
          historicalData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          // Update state with historical data
          setTokenSupplyData(historicalData);
        } else {
          // Fallback to generating historical data if not available from API
          const launchDate = new Date("2025-01-01"); // Token launch date
          const today = new Date();
          const monthsBetween = (today.getFullYear() - launchDate.getFullYear()) * 12 + 
                               (today.getMonth() - launchDate.getMonth());
          
          const historicalData = [];
          
          // Generate data points
          for (let i = 0; i <= monthsBetween; i++) {
            const date = new Date(launchDate);
            date.setMonth(launchDate.getMonth() + i);
            
            // Calculate burn percentage for this point in time
            // Assuming linear burn rate for simplicity
            const burnRatio = i / monthsBetween;
            const burnedAmount = formattedBurnBalance * burnRatio;
            const supplyAtPoint = formattedSupply - burnedAmount;
            
            // Calculate price at this point
            // Linear interpolation between initial and current price
            const priceAtPoint = calculatedInitialPrice + (burnRatio * (tokenPriceData.price - calculatedInitialPrice));
            
            historicalData.push({
              date: date.toISOString().split('T')[0], // YYYY-MM-DD format
              supply: supplyAtPoint,
              price: priceAtPoint
            });
          }
          
          // Add current point
          historicalData.push({
            date: today.toISOString().split('T')[0],
            supply: formattedSupply - formattedBurnBalance,
            price: tokenPriceData.price
          });
          
          // Sort by date
          historicalData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          
          // Update state with historical data
          setTokenSupplyData(historicalData);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching token data:", error);
        setIsLoading(false);
      }
    };
    
    fetchTokenData();
  }, []);
  
  // Calculate days until next burn
  useEffect(() => {
    const calculateDaysUntilBurn = () => {
      const burnDate = new Date("2025-04-14");
      const today = new Date();
      const diffTime = burnDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysUntilBurn(diffDays > 0 ? diffDays : 0);
    };

    calculateDaysUntilBurn();
  }, []);

  // Format date for chart tooltip
  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1a1a] p-3 border border-white/10 rounded-lg shadow-lg">
          <p className="text-white/70 text-xs">{formatDate(label)}</p>
          <p className="text-white font-medium">
            Supply: {payload[0].value.toLocaleString()}
          </p>
          <p className="text-amber-400 font-medium">
            Price: ${payload[1].value.toFixed(3)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for burn events
  const BurnEventTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1a1a] p-3 border border-white/10 rounded-lg shadow-lg">
          <p className="text-white/70 text-xs">{label}</p>
          <p className="text-white font-medium">
            Burned: {payload[0].value.toLocaleString()} AUT
          </p>
          <p className="text-amber-400 font-medium">
            Value: ${payload[1].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  // Format large numbers
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  // Calculate percentage of total supply
  const calculatePercentage = (amount: number) => {
    return ((amount / totalSupply) * 100).toFixed(1);
  };

  return (
    <section className={`space-y-8 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
          <span className="text-white">AurumTrust: </span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-yellow-500">
            Deflationary by Design
          </span>
        </h2>
        <p className="mt-3 sm:mt-4 text-base sm:text-lg text-white/70 max-w-2xl">
          AurumTrust is an experimental token featuring a buy-back and burn mechanism funded by gold trading profits, creating increasing scarcity over time.
        </p>
      </motion.div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left column - Burn mechanism */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Burn mechanism card */}
          <div className="bg-[#1a1a1a]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Flame size={18} className="sm:text-[20px] text-red-500" />
              <h3 className="text-lg sm:text-xl font-bold text-white">Burn Mechanism</h3>
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
                  <div className="text-xl sm:text-2xl font-bold text-white">{nextBurnDate}</div>
                  <div className="text-[10px] sm:text-xs text-white/50 mt-1">or earlier if profits allow</div>
                </div>
                
                <div className="bg-[#2a2a2a] rounded-xl p-3 sm:p-4 border border-white/10">
                  <div className="text-amber-400 text-xs sm:text-sm font-medium mb-1">Days Until Burn</div>
                  <div className="text-xl sm:text-2xl font-bold text-white">{daysUntilBurn}</div>
                  <div className="text-[10px] sm:text-xs text-white/50 mt-1">countdown to first burn</div>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-6">
                <h4 className="text-white font-medium text-sm sm:text-base mb-2 sm:mb-3">Recent Burn Events</h4>
                <div className="h-[180px] sm:h-[200px]">
                  {isLoading || burnEvents.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-400"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={burnEvents}
                        margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fill: '#999', fontSize: 12 }}
                          axisLine={{ stroke: '#333' }}
                          tickLine={{ stroke: '#333' }}
                        />
                        <YAxis 
                          yAxisId="left"
                          tick={{ fill: '#999', fontSize: 12 }}
                          axisLine={{ stroke: '#333' }}
                          tickLine={{ stroke: '#333' }}
                          tickFormatter={(value) => `${value >= 1000000 ? (value / 1000000).toFixed(0) + 'M' : (value / 1000).toFixed(0) + 'k'}`}
                        />
                        <YAxis 
                          yAxisId="right"
                          orientation="right"
                          tick={{ fill: '#999', fontSize: 12 }}
                          axisLine={{ stroke: '#333' }}
                          tickLine={{ stroke: '#333' }}
                          tickFormatter={(value) => `$${value >= 1000000 ? (value / 1000000).toFixed(0) + 'M' : (value / 1000).toFixed(0) + 'k'}`}
                        />
                        <Tooltip content={<BurnEventTooltip />} />
                        <Bar yAxisId="left" dataKey="amount" fill="#EF4444" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="usdValue" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
                {burnEvents.length > 0 && (
                  <div className="mt-2 text-xs text-center text-white/50">
                    <a 
                      href={`https://cronoscan.com/token/${AUT_TOKEN_ADDRESS}?a=${BURN_WALLET_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 text-amber-400 hover:text-amber-300"
                    >
                      <span>View all burn transactions</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Token Allocation card - moved from right column */}
          <div className="bg-[#1a1a1a]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <BarChart3 size={18} className="sm:text-[20px] text-blue-500" />
              <h3 className="text-lg sm:text-xl font-bold text-white">Token Allocation</h3>
            </div>
            
            <div className="h-[130px] sm:h-[150px] mb-3 sm:mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tokenAllocationData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    dataKey="value"
                    label={({ name, percent }) => `${name}`}
                  >
                    {tokenAllocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="space-y-3 text-sm">
              <p className="text-white/70">
                The founder holds 40% of the supply and will only sell tokens to fund the trading account.
              </p>
              <p className="text-white/70">
                Any unused tokens from the founder's allocation will be burned, further reducing supply.
              </p>
              <p className="text-white/70">
                Weekly profits and buy-back transactions will be posted on the official X (Twitter) account.
              </p>
            </div>
          </div>
          
          {/* Experimental Token Notice - moved from bottom */}
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
        
        {/* Right column - Burn wallet and stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >
          {/* Burn wallet card */}
          <div className="bg-[#1a1a1a]/50 backdrop-blur-sm border border-red-500/20 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/10 rounded-full blur-2xl"></div>
            
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Flame size={18} className="sm:text-[20px] text-red-500" />
              <h3 className="text-lg sm:text-xl font-bold text-white">Burn Wallet</h3>
            </div>
            
            <div className="space-y-4 relative z-10">
              <div className="bg-[#2a2a2a] rounded-xl p-3 sm:p-4 border border-red-500/20">
                <div className="text-xs text-white/50 mb-1">Address</div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-mono text-white break-all">
                    {BURN_WALLET_ADDRESS}
                  </div>
                  <a 
                    href={`https://cronoscan.com/token/${AUT_TOKEN_ADDRESS}?a=${BURN_WALLET_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:text-amber-300"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
              
              <div className="bg-[#2a2a2a] rounded-xl p-3 sm:p-4 border border-red-500/20">
                <div className="text-red-500 text-xs sm:text-sm font-medium mb-1">Burned Tokens</div>
                {isLoading ? (
                  <div className="flex flex-col space-y-2">
                    <div className="h-8 bg-white/5 rounded animate-pulse"></div>
                    <div className="h-4 bg-white/5 rounded animate-pulse w-2/3"></div>
                    <div className="h-2 bg-[#3a3a3a] rounded-full mt-3"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-xl sm:text-3xl font-bold text-white">{formatNumber(burnedTokens)} AUT</div>
                    <div className="text-[10px] sm:text-xs text-white/50 mt-1">{calculatePercentage(burnedTokens)}% of total supply</div>
                    
                    <div className="w-full h-2 bg-[#3a3a3a] rounded-full mt-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
                        style={{ width: `${calculatePercentage(burnedTokens)}%` }}
                      ></div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="h-[180px] sm:h-[200px]">
                {isLoading ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-400"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={supplyDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {supplyDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
          
          {/* Token info card */}
          <div className="bg-[#1a1a1a]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Info size={18} className="sm:text-[20px] text-amber-400" />
              <h3 className="text-lg sm:text-xl font-bold text-white">Token Info</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <div className="text-white/70">Token Name</div>
                <div className="text-white font-medium">AurumTrust</div>
              </div>
              
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <div className="text-white/70">Symbol</div>
                <div className="text-white font-medium">AUT</div>
              </div>
              
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <div className="text-white/70">Total Supply</div>
                {isLoading ? (
                  <div className="h-5 bg-white/5 rounded animate-pulse w-20"></div>
                ) : (
                  <div className="text-white font-medium">{formatNumber(totalSupply)}</div>
                )}
              </div>
              
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <div className="text-white/70">Circulating Supply</div>
                {isLoading ? (
                  <div className="h-5 bg-white/5 rounded animate-pulse w-20"></div>
                ) : (
                  <div className="text-white font-medium">{formatNumber(totalSupply - burnedTokens)}</div>
                )}
              </div>
              
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <div className="text-white/70">Contract</div>
                <div className="flex items-center gap-1">
                  <span className="text-white font-medium text-sm">
                    {AUT_TOKEN_ADDRESS.slice(0, 6)}...{AUT_TOKEN_ADDRESS.slice(-4)}
                  </span>
                  <a 
                    href={`https://cronoscan.com/token/${AUT_TOKEN_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:text-amber-300"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="text-white/70">Updates</div>
                <a 
                  href="https://twitter.com/AurumTrust"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-amber-400 hover:text-amber-300"
                >
                  <Twitter size={14} />
                  <span className="text-sm">@AurumTrust</span>
                </a>
              </div>
            </div>
          </div>
          
        </motion.div>
      </div>
      
    </section>
  );
}

export default AurumTrust;
