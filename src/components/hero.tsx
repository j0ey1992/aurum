"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, RefreshCw, Clock, Award } from "lucide-react";

// Mock gold price data (we would fetch real data in production)
const generateMockGoldData = (days = 30) => {
  const data = [];
  let price = 2000 + Math.random() * 200; // Start around $2000
  
  for (let i = days; i >= 0; i--) {
    // Add some volatility
    price = price + (Math.random() - 0.5) * 30;
    
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2)),
    });
  }
  
  return data;
};

interface Prediction {
  timestamp: number;
  direction: "up" | "down";
  result?: "correct" | "incorrect";
  priceAtPrediction: number;
}

export function Hero() {
  const [goldData, setGoldData] = useState(generateMockGoldData());
  const [timeframe, setTimeframe] = useState<"1D" | "1W" | "1M" | "3M" | "1Y">("1M");
  const [isLoading, setIsLoading] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(goldData[goldData.length - 1].price);
  const [priceChange, setPriceChange] = useState(0);
  const [priceChangePercent, setPriceChangePercent] = useState(0);
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });

  // Simulate fetching gold price data
  const fetchGoldData = (days: number) => {
    setIsLoading(true);
    
    // In a real app, we would fetch from an API
    // For demo purposes, we'll use our mock data generator
    setTimeout(() => {
      const newData = generateMockGoldData(days);
      setGoldData(newData);
      setCurrentPrice(newData[newData.length - 1].price);
      
      // Calculate price change
      const prevPrice = newData[newData.length - 2].price;
      const change = currentPrice - prevPrice;
      const changePercent = (change / prevPrice) * 100;
      
      setPriceChange(parseFloat(change.toFixed(2)));
      setPriceChangePercent(parseFloat(changePercent.toFixed(2)));
      
      setIsLoading(false);
    }, 800);
  };

  // Update data based on timeframe
  useEffect(() => {
    let days = 30;
    
    switch (timeframe) {
      case "1D":
        days = 1;
        break;
      case "1W":
        days = 7;
        break;
      case "1M":
        days = 30;
        break;
      case "3M":
        days = 90;
        break;
      case "1Y":
        days = 365;
        break;
    }
    
    fetchGoldData(days);
  }, [timeframe]);

  // Make a prediction
  const makePrediction = (direction: "up" | "down") => {
    const newPrediction: Prediction = {
      timestamp: Date.now(),
      direction,
      priceAtPrediction: currentPrice,
    };
    
    setPredictions([newPrediction, ...predictions]);
    setShowPredictionModal(false);
    
    // Simulate price change after 5 seconds
    setTimeout(() => {
      // Generate a new price with bias toward the actual trend
      // but still with some randomness to make the game interesting
      const randomFactor = Math.random();
      let newPrice;
      
      if (direction === "up") {
        // 70% chance to go up if prediction is up
        newPrice = randomFactor < 0.7 
          ? currentPrice + (Math.random() * 20) 
          : currentPrice - (Math.random() * 20);
      } else {
        // 70% chance to go down if prediction is down
        newPrice = randomFactor < 0.7 
          ? currentPrice - (Math.random() * 20) 
          : currentPrice + (Math.random() * 20);
      }
      
      // Determine if prediction was correct
      const result = (direction === "up" && newPrice > currentPrice) || 
                     (direction === "down" && newPrice < currentPrice)
                     ? "correct" as const : "incorrect" as const;
      
      // Update prediction with result
      const updatedPredictions = predictions.map((pred, index) => {
        if (index === 0) {
          return { ...pred, result };
        }
        return pred;
      });
      
      setPredictions(updatedPredictions);
      setCurrentPrice(parseFloat(newPrice.toFixed(2)));
      
      // Update stats
      setStats({
        correct: result === "correct" ? stats.correct + 1 : stats.correct,
        incorrect: result === "incorrect" ? stats.incorrect + 1 : stats.incorrect,
      });
      
      // Update chart data
      const newData = [...goldData];
      newData.push({
        date: new Date().toISOString().split('T')[0],
        price: newPrice,
      });
      
      if (newData.length > 31) {
        newData.shift(); // Remove oldest data point
      }
      
      setGoldData(newData);
      
      // Calculate new price change
      const change = newPrice - currentPrice;
      const changePercent = (change / currentPrice) * 100;
      
      setPriceChange(parseFloat(change.toFixed(2)));
      setPriceChangePercent(parseFloat(changePercent.toFixed(2)));
    }, 5000);
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
            ${payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="w-full py-16 md:py-24 lg:py-32 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Text content */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                <span className="text-white">Trade Gold with </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-yellow-500">
                  Confidence
                </span>
              </h1>
              <p className="mt-4 text-xl text-white/70 max-w-lg">
                Track real-time gold prices and test your prediction skills with our interactive mini-game.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button
                onClick={() => setShowPredictionModal(true)}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-amber-300 to-yellow-400 text-black font-medium hover:shadow-lg hover:shadow-amber-500/20 transition-all"
              >
                Predict Gold Price
              </button>
              <button className="px-6 py-3 rounded-lg bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all">
                Learn More
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-2 gap-4 mt-8"
            >
              <div className="bg-[#1a1a1a]/50 backdrop-blur-sm border border-white/5 rounded-xl p-4">
                <p className="text-white/60 text-sm">Your Predictions</p>
                <div className="flex items-center gap-4 mt-2">
                  <div>
                    <p className="text-green-400 font-medium">{stats.correct}</p>
                    <p className="text-xs text-white/50">Correct</p>
                  </div>
                  <div>
                    <p className="text-red-400 font-medium">{stats.incorrect}</p>
                    <p className="text-xs text-white/50">Incorrect</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#1a1a1a]/50 backdrop-blur-sm border border-white/5 rounded-xl p-4">
                <p className="text-white/60 text-sm">Accuracy Rate</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.correct + stats.incorrect > 0
                    ? `${Math.round((stats.correct / (stats.correct + stats.incorrect)) * 100)}%`
                    : "N/A"}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right side - Gold price chart */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-[#1a1a1a]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 shadow-xl"
          >
            {/* Price header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-white">Gold Price</h2>
                  {isLoading ? (
                    <RefreshCw size={16} className="text-white/50 animate-spin" />
                  ) : null}
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-bold text-white">${currentPrice.toFixed(2)}</p>
                  <div className={`flex items-center ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {priceChange >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    <span className="text-sm font-medium ml-1">
                      {priceChange >= 0 ? '+' : ''}{priceChange} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent}%)
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Timeframe selector */}
              <div className="flex bg-[#2a2a2a] rounded-lg p-1">
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
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={goldData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
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
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    fill="url(#goldGradient)" 
                    activeDot={{ r: 6, fill: '#F59E0B', stroke: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Recent predictions */}
            {predictions.length > 0 && (
              <div className="mt-6 border-t border-white/5 pt-4">
                <h3 className="text-white font-medium mb-3">Recent Predictions</h3>
                <div className="space-y-2 max-h-[120px] overflow-y-auto">
                  {predictions.slice(0, 5).map((pred, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded-full ${
                          pred.direction === 'up' ? 'bg-green-400/20' : 'bg-red-400/20'
                        }`}>
                          {pred.direction === 'up' ? (
                            <TrendingUp size={14} className="text-green-400" />
                          ) : (
                            <TrendingDown size={14} className="text-red-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-white">
                            Predicted {pred.direction}
                          </p>
                          <p className="text-xs text-white/50">
                            <Clock size={10} className="inline mr-1" />
                            {new Date(pred.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      {pred.result && (
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          pred.result === 'correct' 
                            ? 'bg-green-400/20 text-green-400' 
                            : 'bg-red-400/20 text-red-400'
                        }`}>
                          {pred.result === 'correct' ? (
                            <span className="flex items-center">
                              <Award size={12} className="mr-1" />
                              Correct
                            </span>
                          ) : (
                            'Incorrect'
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
      
      {/* Prediction Modal */}
      <AnimatePresence>
        {showPredictionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowPredictionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-4">Predict Gold Price Movement</h2>
              <p className="text-white/70 mb-6">
                Do you think the gold price will go up or down in the next 5 seconds?
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => makePrediction("up")}
                  className="flex flex-col items-center justify-center p-6 rounded-xl bg-green-400/10 border border-green-400/30 hover:bg-green-400/20 transition-colors"
                >
                  <TrendingUp size={32} className="text-green-400 mb-2" />
                  <span className="text-green-400 font-medium">Going Up</span>
                </button>
                
                <button
                  onClick={() => makePrediction("down")}
                  className="flex flex-col items-center justify-center p-6 rounded-xl bg-red-400/10 border border-red-400/30 hover:bg-red-400/20 transition-colors"
                >
                  <TrendingDown size={32} className="text-red-400 mb-2" />
                  <span className="text-red-400 font-medium">Going Down</span>
                </button>
              </div>
              
              <p className="text-white/50 text-xs mt-6 text-center">
                This is a simulated game. No real trading occurs.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
