"use client";

import React, { useState, useEffect } from "react";
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
import { TrendingUp, TrendingDown, RefreshCw, Clock, X, AlertCircle, Info, HelpCircle } from "lucide-react";
import { goldPriceService, GoldPriceData, PriceResult } from "@/services/goldPriceService";
import { tokenService } from "@/services/tokenService";
import { tradingService } from "../../services/tradingService";
import { ethers } from "ethers";
import { useAppKit, useAppKitAccount, useDisconnect, useAppKitNetwork } from "@reown/appkit/react";
import { Position, OrderParams, TradingStats as TradingStatsType } from "./types";
import { TradingForm } from "./TradingForm";
import { PositionList } from "./PositionList";
import { TradingStats } from "./TradingStats";

interface TradingGameProps {
  className?: string;
}

export function TradingGame({ className = "" }: TradingGameProps) {
  // Gold price data
  const [goldData, setGoldData] = useState<GoldPriceData[]>([]);
  const [timeframe, setTimeframe] = useState<"1D" | "1W" | "1M" | "3M" | "1Y">("1M");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [priceChangePercent, setPriceChangePercent] = useState(0);
  const [isRealData, setIsRealData] = useState(true);
  const [dataSource, setDataSource] = useState("Loading...");
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  
  // Trading state
  const [positions, setPositions] = useState<Position[]>([]);
  const [showTradingForm, setShowTradingForm] = useState(false);
  const [showPositionManager, setShowPositionManager] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [autBalance, setAutBalance] = useState("0");
  const [fundingRate, setFundingRate] = useState(0.01); // 0.01% per 8 hours
  const [nextFundingTime, setNextFundingTime] = useState<Date>(new Date(Date.now() + 8 * 60 * 60 * 1000));
  const [tradingStats, setTradingStats] = useState<TradingStatsType>({
    profit: 0,
    loss: 0,
    totalProfit: 0,
    totalLoss: 0,
    averageLeverage: 0,
    winRate: 0
  });
  
  // Wallet connection
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | undefined>(undefined);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  
  // Use AppKit hooks for wallet connection
  const { open } = useAppKit();
  const { address: appKitAddress, isConnected } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  const { chainId } = useAppKitNetwork();
  
  // Tooltip content for educational purposes
  const tooltips = {
    liquidation: "Liquidation occurs when the market price moves against your position enough to consume your margin. The liquidation price is calculated based on your leverage and position size.",
    leverage: "Leverage multiplies both potential profits and losses. Higher leverage means higher risk of liquidation with smaller price movements.",
    funding: "Funding rates are periodic payments between long and short traders. When the rate is positive, longs pay shorts. When negative, shorts pay longs.",
    margin: "Margin is the collateral you put up to open a position. It determines your position size when combined with leverage.",
    perpetual: "Perpetual contracts are derivatives that let you trade with leverage without an expiry date. They use funding rates to keep prices aligned with the underlying asset."
  };
  
  // Fetch gold price data
  const fetchGoldData = async (days: number) => {
    setIsLoading(true);
    
    try {
      // Check API status first
      const apiStatus = await goldPriceService.checkApiStatus();
      console.log("Gold price API status:", apiStatus);
      
      // Get historical gold price data
      const historicalResult = await goldPriceService.getHistoricalData(days);
      setGoldData(historicalResult.data);
      setIsRealData(historicalResult.isRealData);
      setDataSource(historicalResult.dataSource);
      
      // Get current gold price
      const priceResult: PriceResult = await goldPriceService.getCurrentPrice();
      
      setCurrentPrice(priceResult.currentPrice);
      setPriceChange(parseFloat(priceResult.priceChange.toFixed(2)));
      setPriceChangePercent(parseFloat(priceResult.priceChangePercent.toFixed(2)));
      
      // Update data source if different from historical data
      if (priceResult.dataSource !== historicalResult.dataSource) {
        setDataSource(`${historicalResult.dataSource} / ${priceResult.dataSource}`);
      }
      
      // If either is mock data, set isRealData to false
      if (!historicalResult.isRealData || !priceResult.isRealData) {
        setIsRealData(false);
      }
    } catch (error) {
      console.error("Error fetching gold price data:", error);
      
      // Fallback to mock data if all APIs fail
      const mockData = goldPriceService.generateMockData(days);
      setGoldData(mockData);
      setIsRealData(false);
      setDataSource("Fallback Data");
      
      if (mockData.length > 0) {
        setCurrentPrice(mockData[mockData.length - 1].price);
        
        // Calculate mock price change
        if (mockData.length > 1) {
          const prevPrice = mockData[mockData.length - 2].price;
          const change = mockData[mockData.length - 1].price - prevPrice;
          const changePercent = (change / prevPrice) * 100;
          
          setPriceChange(parseFloat(change.toFixed(2)));
          setPriceChangePercent(parseFloat(changePercent.toFixed(2)));
        }
      }
    } finally {
      setIsLoading(false);
    }
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
  
  // Update local state based on AppKit state
  useEffect(() => {
    setIsWalletConnected(isConnected);
    setWalletAddress(appKitAddress);
    
    // Get token balance when connected
    if (isConnected && appKitAddress && typeof window !== 'undefined' && window.ethereum) {
      const getBalance = async () => {
        try {
          const ethereum = window.ethereum as any;
          if (ethereum) {
            const provider = new ethers.BrowserProvider(ethereum);
            setProvider(provider);
            
            // Check if we're on Cronos chain (id: 25)
            console.log("TradingGame - Current chainId:", chainId);
            
            // Handle different possible formats of chainId (number, string, or CAIP format)
            // The chainId from useAppKitNetwork() could be:
            // 1. A number: 25
            // 2. A string: "25"
            // 3. In CAIP format: "eip155:25"
            const isCronos = 
              chainId === 25 || 
              chainId === "25" || 
              chainId === "eip155:25" || 
              (typeof chainId === "string" && chainId.endsWith(":25"));
            
            console.log("TradingGame - Is Cronos chain:", isCronos);
            
            // Always try to fetch the balance regardless of chain
            try {
              const balance = await tokenService.getBalance(provider, appKitAddress);
              console.log("TradingGame - Fetched AUT balance:", balance);
              setAutBalance(balance);
            } catch (error) {
              console.error("TradingGame - Error fetching AUT balance:", error);
              setAutBalance("0");
            }
          }
        } catch (error) {
          console.error("Error getting token balance:", error);
          setAutBalance("0");
        }
      };
      
      getBalance();
    }
  }, [isConnected, appKitAddress, chainId]);
  
  // Connect wallet using Reown AppKit
  const connectWallet = () => {
    try {
      // Open the AppKit modal with the Connect view
      open({ view: 'Connect' });
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };
  
  // Disconnect wallet using Reown AppKit
  const disconnectWallet = () => {
    disconnect();
    setAutBalance("0");
    setProvider(null);
  };
  
  // Update positions and check for liquidations/TP/SL
  useEffect(() => {
    if (positions.length === 0 || currentPrice === 0) return;
    
    const openPositions = positions.filter(pos => pos.status === "open");
    if (openPositions.length === 0) return;
    
    const updatedPositions = [...positions];
    let positionsUpdated = false;
    
    openPositions.forEach(position => {
      const index = updatedPositions.findIndex(p => p.id === position.id);
      if (index === -1) return;
      
      // Check for liquidation
      if (tradingService.shouldLiquidate(position, currentPrice)) {
        updatedPositions[index] = tradingService.closePosition(
          position,
          position.liquidationPrice,
          "liquidation"
        );
        positionsUpdated = true;
        return;
      }
      
      // Check for take profit / stop loss
      const { triggered, type } = tradingService.checkTakeProfitStopLoss(position, currentPrice);
      if (triggered && type) {
        updatedPositions[index] = tradingService.closePosition(
          position,
          currentPrice,
          type
        );
        positionsUpdated = true;
      }
    });
    
    if (positionsUpdated) {
      setPositions(updatedPositions);
      
      // Update trading stats
      const stats = tradingService.calculateStats(updatedPositions);
      setTradingStats(stats);
    }
  }, [positions, currentPrice]);
  
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
  
  // Handle opening a new position
  const handleOpenPosition = async (params: OrderParams) => {
    if (!isWalletConnected || !provider) {
      alert("Please connect your wallet first");
      return;
    }
    
    try {
      // Check if margin is greater than 0
      if (params.margin <= 0) {
        alert("Margin must be greater than 0");
        return;
      }
      
      // In a real implementation, this would call the smart contract
      // For now, we'll simulate the trade
      console.log(`Opening position: ${params.direction} with ${params.margin} AUT at ${params.leverage}x leverage`);
      
      // Create position
      const position = tradingService.createPosition(params, currentPrice);
      
      // Update positions
      setPositions([position, ...positions]);
      
      // Update balance
      const newBalance = parseFloat(autBalance) - params.margin;
      setAutBalance(newBalance.toString());
      
      // Close trading form
      setShowTradingForm(false);
    } catch (error) {
      console.error("Error opening position:", error);
    }
  };
  
  // Handle closing a position
  const handleClosePosition = (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    if (!position || position.status !== "open") return;
    
    // Close position
    const closedPosition = tradingService.closePosition(position, currentPrice);
    
    // Update positions
    const updatedPositions = positions.map(p => 
      p.id === positionId ? closedPosition : p
    );
    
    setPositions(updatedPositions);
    
    // Update balance
    const pnl = closedPosition.pnl || 0;
    const newBalance = parseFloat(autBalance) + position.margin + pnl;
    setAutBalance(newBalance.toString());
    
    // Update trading stats
    const stats = tradingService.calculateStats(updatedPositions);
    setTradingStats(stats);
  };
  
  // Handle managing a position
  const handleManagePosition = (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    if (!position) return;
    
    setSelectedPosition(position);
    setShowPositionManager(true);
  };
  
  // Get open positions
  const openPositions = positions.filter(p => p.status === "open");
  
  return (
    <div className={`space-y-8 ${className}`}>
      {/* Gold price chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
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
              <p className="text-3xl font-bold text-white">${currentPrice.toFixed(2)}</p>
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
        
        {/* Educational tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-[#2a2a2a] p-3 rounded-lg shadow-lg border border-white/10 max-w-md z-10"
            >
              <div className="flex gap-2">
                <Info size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white text-sm">{tooltips[showTooltip as keyof typeof tooltips]}</p>
                </div>
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#2a2a2a] border-r border-b border-white/10 rotate-45"></div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex justify-between items-center mt-6 border-t border-white/5 pt-4">
          <div className="flex gap-2">
            <button
              onClick={() => setShowTradingForm(true)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-300 to-yellow-400 text-black font-medium hover:shadow-lg hover:shadow-amber-500/20 transition-all"
              disabled={!isWalletConnected}
            >
              Trade Gold
            </button>
            
            {!isWalletConnected ? (
              <button
                onClick={connectWallet}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all"
              >
                Connect Wallet
              </button>
            ) : (
              <button
                onClick={disconnectWallet}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-all"
              >
                Disconnect
              </button>
            )}
            
            {/* Help button */}
            <button
              onClick={() => setShowTooltip(showTooltip ? null : 'perpetual')}
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
      </motion.div>
      
      {/* Educational banner */}
      <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 flex items-start gap-3">
        <Info size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-white font-medium mb-1">Understanding Perpetual Gold Trading</h3>
          <p className="text-white/70 text-sm">
            Trade gold with leverage without expiry dates. Click on the terms below to learn more:
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            <button 
              onClick={() => setShowTooltip('perpetual')}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white"
            >
              Perpetual Contracts
            </button>
            <button 
              onClick={() => setShowTooltip('leverage')}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white"
            >
              Leverage
            </button>
            <button 
              onClick={() => setShowTooltip('liquidation')}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white"
            >
              Liquidation
            </button>
            <button 
              onClick={() => setShowTooltip('funding')}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white"
            >
              Funding Rate
            </button>
            <button 
              onClick={() => setShowTooltip('margin')}
              className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white"
            >
              Margin
            </button>
          </div>
        </div>
      </div>

      {/* Trading interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trading stats */}
        <TradingStats
          stats={tradingStats}
          autBalance={autBalance}
          fundingRate={fundingRate}
          nextFundingTime={nextFundingTime}
        />
        
        {/* Position list */}
        <div className="lg:col-span-2">
          <PositionList
            positions={positions}
            currentPrice={currentPrice}
            onClosePosition={handleClosePosition}
            onManagePosition={handleManagePosition}
          />
        </div>
      </div>
      
      {/* Trading form modal */}
      <AnimatePresence>
        {showTradingForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setShowTradingForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-md w-full mx-auto my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setShowTradingForm(false)}
                  className="p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              
              <TradingForm
                currentPrice={currentPrice}
                maxMargin={parseFloat(autBalance)}
                onSubmit={handleOpenPosition}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Position manager modal */}
      <AnimatePresence>
        {showPositionManager && selectedPosition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setShowPositionManager(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1a1a1a]/80 backdrop-blur-sm border border-white/10 rounded-xl p-5 max-w-md w-full mx-auto my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Manage Position</h3>
                <button
                  onClick={() => setShowPositionManager(false)}
                  className="p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              
              {/* Position details */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-white/50">Direction</p>
                    <p className={`text-sm font-medium ${
                      selectedPosition.direction === "long" ? "text-green-400" : "text-red-400"
                    }`}>
                      {selectedPosition.direction === "long" ? "Long" : "Short"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50">Leverage</p>
                    <p className="text-sm font-medium text-white">{selectedPosition.leverage}x</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50">Entry Price</p>
                    <p className="text-sm font-medium text-white">${selectedPosition.entryPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50">Current Price</p>
                    <p className="text-sm font-medium text-white">${currentPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50">Liquidation Price</p>
                    <p className="text-sm font-medium text-red-400">${selectedPosition.liquidationPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/50">PnL</p>
                    <p className={`text-sm font-medium ${
                      tradingService.calculatePnL(selectedPosition, currentPrice) >= 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}>
                      {tradingService.calculatePnL(selectedPosition, currentPrice) >= 0 ? "+" : ""}
                      ${tradingService.calculatePnL(selectedPosition, currentPrice).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => {
                    handleClosePosition(selectedPosition.id);
                    setShowPositionManager(false);
                  }}
                  className="w-full py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium"
                >
                  Close Position
                </button>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowPositionManager(false)}
                    className="py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium"
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={() => {
                      // Add stop loss / take profit functionality here
                      setShowPositionManager(false);
                    }}
                    className="py-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium"
                  >
                    Update
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TradingGame;
