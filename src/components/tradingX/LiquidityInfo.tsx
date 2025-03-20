"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Info, DollarSign, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { tradingService } from "@/services/tradingService";
import { ethers } from "ethers";
import { useAppKitAccount } from "@reown/appkit/react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface LiquidityData {
  totalLiquidity: number;
  longOpenInterest: number;
  shortOpenInterest: number;
  insuranceFund: number;
  utilizationRate: number;
  maxLeverageAllowed: number;
  feesCollectedLast24h: number;
  tokensBurnedLast24h: number;
  liquidityProviders: number;
  liquidityDistribution: Array<{
    name: string;
    value: number;
  }>;
  historicalLiquidity: Array<{
    date: string;
    liquidity: number;
    openInterest: number;
  }>;
}

interface LiquidityInfoProps {
  className?: string;
}

export function LiquidityInfo({ className = "" }: LiquidityInfoProps) {
  const [liquidityData, setLiquidityData] = useState<LiquidityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "charts">("overview");
  
  const { address, isConnected } = useAppKitAccount();

  // Generate mock data for demonstration
  const generateMockLiquidityData = (): LiquidityData => {
    // Generate random values for liquidity metrics
    const totalLiquidity = 1000000 + Math.random() * 500000;
    const longOpenInterest = totalLiquidity * (0.3 + Math.random() * 0.2);
    const shortOpenInterest = totalLiquidity * (0.2 + Math.random() * 0.2);
    const insuranceFund = totalLiquidity * 0.1;
    const utilizationRate = ((longOpenInterest + shortOpenInterest) / totalLiquidity) * 100;
    
    // Generate historical data (30 days)
    const historicalLiquidity = [];
    let currentLiquidity = totalLiquidity * 0.7; // Start with 70% of current liquidity
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Random daily change (-3% to +5%)
      const dailyChange = currentLiquidity * (Math.random() * 0.08 - 0.03);
      currentLiquidity += dailyChange;
      
      // Random open interest (40% to 70% of liquidity)
      const openInterest = currentLiquidity * (0.4 + Math.random() * 0.3);
      
      historicalLiquidity.push({
        date: date.toISOString().split('T')[0],
        liquidity: Math.round(currentLiquidity),
        openInterest: Math.round(openInterest)
      });
    }
    
    return {
      totalLiquidity,
      longOpenInterest,
      shortOpenInterest,
      insuranceFund,
      utilizationRate,
      maxLeverageAllowed: 10,
      feesCollectedLast24h: totalLiquidity * 0.005,
      tokensBurnedLast24h: totalLiquidity * 0.002,
      liquidityProviders: Math.floor(50 + Math.random() * 100),
      liquidityDistribution: [
        { name: "Available Liquidity", value: totalLiquidity - longOpenInterest - shortOpenInterest },
        { name: "Long Positions", value: longOpenInterest },
        { name: "Short Positions", value: shortOpenInterest },
        { name: "Insurance Fund", value: insuranceFund }
      ],
      historicalLiquidity
    };
  };

  // Fetch liquidity data
  const fetchLiquidityData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would fetch from the contract
      // For now, we'll use mock data
      const mockData = generateMockLiquidityData();
      setLiquidityData(mockData);
    } catch (err) {
      console.error("Error fetching liquidity data:", err);
      setError("Failed to load liquidity information");
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency with appropriate precision
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  // Format percentage with appropriate precision
  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Format date for chart tooltip
  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1a1a] p-3 border border-white/10 rounded-lg shadow-lg">
          <p className="text-white/70 text-xs">{formatDate(label)}</p>
          <p className="text-white font-medium">
            {payload[0].name}: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-white font-medium">
            {payload[1].name}: {formatCurrency(payload[1].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Initial fetch
  useEffect(() => {
    fetchLiquidityData();
    
    // Set up interval to refresh data
    const interval = setInterval(fetchLiquidityData, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, []);

  // Colors for pie chart
  const COLORS = ['#4ade80', '#3b82f6', '#ef4444', '#f59e0b'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-[#1a1a1a]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl ${className}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Liquidity Information</h2>
        <button
          onClick={fetchLiquidityData}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          disabled={isLoading}
        >
          <RefreshCw size={16} className={`text-white/70 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* Info banner */}
      <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg p-3 mb-4 flex items-start gap-2">
        <Info size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-white/70 text-sm">
          This dashboard shows the current liquidity status of the AUT perpetual trading platform, including open interest, utilization rate, and insurance fund size.
        </p>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      
      {/* Loading state */}
      {isLoading && !liquidityData && (
        <div className="p-8 text-center text-white/50">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
          Loading liquidity information...
        </div>
      )}
      
      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-4">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "overview"
              ? "text-amber-400 border-b-2 border-amber-400"
              : "text-white/70 hover:text-white"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("charts")}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "charts"
              ? "text-amber-400 border-b-2 border-amber-400"
              : "text-white/70 hover:text-white"
          }`}
        >
          Charts
        </button>
      </div>
      
      {liquidityData && (
        <>
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Key metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white/70 text-sm">Total Liquidity</h3>
                    <DollarSign size={16} className="text-green-400" />
                  </div>
                  <p className="text-white text-xl font-medium mt-1">
                    {formatCurrency(liquidityData.totalLiquidity)}
                  </p>
                </div>
                
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white/70 text-sm">Open Interest</h3>
                    <BarChart3 size={16} className="text-blue-400" />
                  </div>
                  <p className="text-white text-xl font-medium mt-1">
                    {formatCurrency(liquidityData.longOpenInterest + liquidityData.shortOpenInterest)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center">
                      <TrendingUp size={12} className="text-green-400 mr-1" />
                      <span className="text-green-400 text-xs">
                        {formatCurrency(liquidityData.longOpenInterest)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <TrendingDown size={12} className="text-red-400 mr-1" />
                      <span className="text-red-400 text-xs">
                        {formatCurrency(liquidityData.shortOpenInterest)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white/70 text-sm">Utilization Rate</h3>
                    <div className="w-4 h-4 rounded-full border-2 border-amber-400 flex items-center justify-center">
                      <span className="text-amber-400 text-[8px] font-bold">%</span>
                    </div>
                  </div>
                  <p className="text-white text-xl font-medium mt-1">
                    {formatPercentage(liquidityData.utilizationRate)}
                  </p>
                  <p className="text-white/50 text-xs mt-1">
                    Max Leverage: {liquidityData.maxLeverageAllowed}x
                  </p>
                </div>
                
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white/70 text-sm">Insurance Fund</h3>
                    <div className="w-4 h-4 rounded-full bg-amber-400/20 flex items-center justify-center">
                      <span className="text-amber-400 text-[8px] font-bold">!</span>
                    </div>
                  </div>
                  <p className="text-white text-xl font-medium mt-1">
                    {formatCurrency(liquidityData.insuranceFund)}
                  </p>
                  <p className="text-white/50 text-xs mt-1">
                    {formatPercentage(liquidityData.insuranceFund / liquidityData.totalLiquidity * 100)} of total liquidity
                  </p>
                </div>
              </div>
              
              {/* Secondary metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h3 className="text-white/70 text-sm">Fees Collected (24h)</h3>
                  <p className="text-white text-lg font-medium mt-1">
                    {formatCurrency(liquidityData.feesCollectedLast24h)}
                  </p>
                </div>
                
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h3 className="text-white/70 text-sm">Tokens Burned (24h)</h3>
                  <p className="text-white text-lg font-medium mt-1">
                    {formatCurrency(liquidityData.tokensBurnedLast24h)}
                  </p>
                </div>
                
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <h3 className="text-white/70 text-sm">Liquidity Providers</h3>
                  <p className="text-white text-lg font-medium mt-1">
                    {liquidityData.liquidityProviders}
                  </p>
                </div>
              </div>
              
              {/* Distribution pie chart */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Liquidity Distribution</h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={liquidityData.liquidityDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        labelLine={false}
                      >
                        {liquidityData.liquidityDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="center"
                        formatter={(value) => <span className="text-white text-xs">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
          
          {/* Charts Tab */}
          {activeTab === "charts" && (
            <div className="space-y-4">
              {/* Historical liquidity chart */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Historical Liquidity (30 Days)</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={liquidityData.historicalLiquidity}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorLiquidity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorOpenInterest" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: '#999', fontSize: 12 }}
                        tickFormatter={formatDate}
                        axisLine={{ stroke: '#333' }}
                        tickLine={{ stroke: '#333' }}
                      />
                      <YAxis 
                        tick={{ fill: '#999', fontSize: 12 }}
                        axisLine={{ stroke: '#333' }}
                        tickLine={{ stroke: '#333' }}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="liquidity" 
                        name="Total Liquidity"
                        stroke="#4ade80" 
                        strokeWidth={2}
                        fill="url(#colorLiquidity)" 
                        activeDot={{ r: 6, fill: '#4ade80', stroke: '#fff' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="openInterest" 
                        name="Open Interest"
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        fill="url(#colorOpenInterest)" 
                        activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Long vs Short distribution */}
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <h3 className="text-white/70 text-sm mb-2">Long vs Short Distribution</h3>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: 'Open Interest',
                          long: liquidityData.longOpenInterest,
                          short: liquidityData.shortOpenInterest
                        }
                      ]}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#999', fontSize: 12 }} />
                      <YAxis 
                        tick={{ fill: '#999', fontSize: 12 }}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <Tooltip 
                        formatter={(value: any) => formatCurrency(value)}
                        labelFormatter={() => 'Open Interest'}
                      />
                      <Bar dataKey="long" name="Long Positions" fill="#4ade80" />
                      <Bar dataKey="short" name="Short Positions" fill="#ef4444" />
                      <Legend 
                        formatter={(value) => <span className="text-white text-xs">{value}</span>}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Disclaimer */}
      <p className="text-white/50 text-xs mt-4">
        Note: This is a simulated liquidity dashboard for demonstration purposes. In the production version, this will display real data from the AUT perpetual trading contracts.
      </p>
    </motion.div>
  );
}

export default LiquidityInfo;
