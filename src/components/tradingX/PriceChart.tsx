"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { AUTPriceData } from "@/services/autPriceService";

interface PriceChartProps {
  autData: AUTPriceData[];
  timeframe: "1D" | "1W" | "1M" | "3M" | "1Y";
  setTimeframe: (timeframe: "1D" | "1W" | "1M" | "3M" | "1Y") => void;
  isLoading: boolean;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  isRealData: boolean;
  dataSource: string;
  formatDate: (dateStr: string) => string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatDate: (dateStr: string) => string;
}

const CustomTooltip = ({ active, payload, label, formatDate }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a] p-3 border border-white/10 rounded-lg shadow-lg">
        <p className="text-white/70 text-xs">{formatDate(label || "")}</p>
        <p className="text-white font-medium">
          ${payload[0].value.toFixed(4)}
        </p>
      </div>
    );
  }
  return null;
};

export function PriceChart({
  autData,
  timeframe,
  setTimeframe,
  isLoading,
  currentPrice,
  priceChange,
  priceChangePercent,
  isRealData,
  dataSource,
  formatDate,
}: PriceChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[#1a1a1a]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl"
    >
      {/* Price header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-white">AUT Token Price</h2>
            {isLoading ? (
              <RefreshCw size={16} className="text-white/50 animate-spin" />
            ) : null}
            
            {/* Data source indicator */}
            <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              isRealData 
                ? 'bg-green-400/20 text-green-400' 
                : 'bg-amber-400/20 text-amber-400'
            }`}>
              {isRealData ? 'Live Data' : 'Simulated Data'}
            </div>
          </div>
          
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl sm:text-3xl font-bold text-white">${currentPrice.toFixed(4)}</p>
            <div className={`flex items-center ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {priceChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="text-sm font-medium ml-1">
                {priceChange >= 0 ? '+' : ''}{priceChange} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent}%)
              </span>
            </div>
          </div>
          
          <div className="text-xs text-white/50 mt-1">
            Source: {dataSource}
          </div>
        </div>
        
        {/* Timeframe selector */}
        <div className="flex bg-[#2a2a2a] rounded-lg p-1 overflow-x-auto sm:overflow-visible">
          {(["1D", "1W", "1M", "3M", "1Y"] as const).map((time) => (
            <button
              key={time}
              onClick={() => setTimeframe(time)}
              className={`px-3 py-1 text-xs font-medium rounded-md ${
                timeframe === time
                  ? 'bg-amber-400 text-black'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </div>
      
      {/* Chart */}
      <div className="h-[250px] sm:h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={autData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="autGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
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
              domain={['auto', 'auto']}
              tick={{ fill: '#999', fontSize: 12 }}
              axisLine={{ stroke: '#333' }}
              tickLine={{ stroke: '#333' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip formatDate={formatDate} />} />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#F59E0B" 
              strokeWidth={2}
              fill="url(#autGradient)" 
              activeDot={{ r: 6, fill: '#F59E0B', stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

export default PriceChart;
