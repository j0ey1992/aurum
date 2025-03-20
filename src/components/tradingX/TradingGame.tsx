"use client";

import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAppKit, useAppKitAccount, useDisconnect, useAppKitNetwork } from "@reown/appkit/react";
import { autPriceService, AUTPriceData, PriceResult } from "@/services/autPriceService";
import { tokenService } from "@/services/tokenService";
import { tradingService } from "../../services/tradingService";
import { Position, OrderParams, TradingStats as TradingStatsType } from "./types";

// Import modular components
import { PriceChart } from "./PriceChart";
import { EducationalTooltip } from "./EducationalTooltip";
import { ActionButtons } from "./ActionButtons";
import { EducationalBanner } from "./EducationalBanner";
import { TradingFormModal } from "./TradingFormModal";
import { PositionManagerModal } from "./PositionManagerModal";
import { TradingStats } from "./TradingStats";
import { PositionList } from "./PositionList";

interface TradingGameProps {
  className?: string;
}

export function TradingGame({ className = "" }: TradingGameProps) {
  // AUT price data
  const [autData, setAUTData] = useState<AUTPriceData[]>([]);
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
  
  // Protocol statistics
  const [insuranceFundSize, setInsuranceFundSize] = useState(0);
  const [burnedTokens, setBurnedTokens] = useState(0);
  const [openInterest, setOpenInterest] = useState({ long: 0, short: 0 });
  
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
  
  // Fetch AUT price data
  const fetchAUTData = async (days: number) => {
    setIsLoading(true);
    
    try {
      // Check API status first
      const apiStatus = await autPriceService.checkApiStatus();
      console.log("AUT price API status:", apiStatus);
      
      // Get historical AUT price data
      const historicalResult = await autPriceService.getHistoricalData(days);
      setAUTData(historicalResult.data);
      setIsRealData(historicalResult.isRealData);
      setDataSource(historicalResult.dataSource);
      
      // Get current AUT price
      const priceResult: PriceResult = await autPriceService.getCurrentPrice();
      
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
      console.error("Error fetching AUT price data:", error);
      
      // Fallback to mock data if all APIs fail
      const mockData = autPriceService.generateMockData(days);
      setAUTData(mockData);
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
    
    fetchAUTData(days);
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
            
            // Get funding rate and protocol statistics
            try {
              const rate = await tradingService.getCurrentFundingRate(provider);
              setFundingRate(rate);
              
              // Set next funding time (8 hours from now)
              const nextTime = new Date();
              nextTime.setHours(nextTime.getHours() + 8);
              setNextFundingTime(nextTime);
              
              // Get protocol statistics - these methods need to be implemented in tradingService
              try {
                // Mock values for now - these should be replaced with actual API calls
                setInsuranceFundSize(50000);
                setBurnedTokens(25000);
                setOpenInterest({ long: 150000, short: 120000 });
              } catch (error) {
                console.error("Error getting protocol statistics:", error);
              }
            } catch (error) {
              console.error("Error getting funding rate:", error);
            }
            
            // Get open positions
            try {
              const openPositions = await tradingService.getOpenPositions(provider, appKitAddress);
              setPositions(openPositions);
              
              // Get trading stats
              const stats = await tradingService.getTradingStats(provider);
              setTradingStats(stats);
            } catch (error) {
              console.error("Error getting open positions:", error);
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
    if (positions.length === 0 || currentPrice === 0 || !provider) return;
    
    const checkPositions = async () => {
      const openPositions = positions.filter(pos => pos.status === "open");
      if (openPositions.length === 0) return;
      
      let positionsUpdated = false;
      
      for (const position of openPositions) {
        // Check for take profit / stop loss
        const { triggered, type } = tradingService.checkTakeProfitStopLoss(position, currentPrice);
        if (triggered && type) {
          try {
            // Close position
            await tradingService.closePosition(provider, position.id);
            positionsUpdated = true;
          } catch (error) {
            console.error("Error closing position:", error);
          }
        }
      }
      
      if (positionsUpdated) {
        // Refresh positions
        const address = await provider.getSigner().then(signer => signer.getAddress());
        const updatedPositions = await tradingService.getOpenPositions(provider, address);
        setPositions(updatedPositions);
        
        // Update trading stats
        const stats = await tradingService.getTradingStats(provider);
        setTradingStats(stats);
      }
    };
    
    checkPositions();
  }, [positions, currentPrice, provider]);
  
  // Format date for chart tooltip
  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
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
      
      // Place trade using the trading service
      await tradingService.placeTrade(provider, params);
      
      // Refresh positions
      const address = await provider.getSigner().then(signer => signer.getAddress());
      const updatedPositions = await tradingService.getOpenPositions(provider, address);
      setPositions(updatedPositions);
      
      // Update balance
      const balance = await tokenService.getBalance(provider, address);
      setAutBalance(balance);
      
      // Update trading stats
      const stats = await tradingService.getTradingStats(provider);
      setTradingStats(stats);
      
      // Close trading form
      setShowTradingForm(false);
    } catch (error) {
      console.error("Error opening position:", error);
      alert("Error opening position. Please try again.");
    }
  };
  
  // Handle closing a position
  const handleClosePosition = async (positionId: string) => {
    if (!provider) return;
    
    try {
      // Close position
      await tradingService.closePosition(provider, positionId);
      
      // Refresh positions
      const address = await provider.getSigner().then(signer => signer.getAddress());
      const updatedPositions = await tradingService.getOpenPositions(provider, address);
      setPositions(updatedPositions);
      
      // Update balance
      const balance = await tokenService.getBalance(provider, address);
      setAutBalance(balance);
      
      // Update trading stats
      const stats = await tradingService.getTradingStats(provider);
      setTradingStats(stats);
    } catch (error) {
      console.error("Error closing position:", error);
      alert("Error closing position. Please try again.");
    }
  };
  
  // Handle managing a position
  const handleManagePosition = (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    if (!position) return;
    
    setSelectedPosition(position);
    setShowPositionManager(true);
  };
  
  return (
    <div className={`space-y-8 ${className}`}>
      {/* AUT price chart */}
      <PriceChart
        autData={autData}
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        isLoading={isLoading}
        currentPrice={currentPrice}
        priceChange={priceChange}
        priceChangePercent={priceChangePercent}
        isRealData={isRealData}
        dataSource={dataSource}
        formatDate={formatDate}
      />
      
      {/* Action buttons */}
      <ActionButtons
        isWalletConnected={isWalletConnected}
        walletAddress={walletAddress}
        onTrade={() => setShowTradingForm(true)}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
        onHelp={() => setShowTooltip(showTooltip ? null : 'perpetual')}
      />
      
      {/* Educational tooltip */}
      <EducationalTooltip
        showTooltip={showTooltip}
        setShowTooltip={setShowTooltip}
        tooltips={tooltips}
      />
      
      {/* Educational banner */}
      <EducationalBanner
        onTermClick={(term) => setShowTooltip(term)}
      />

      {/* Trading interface */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Trading stats */}
        <TradingStats
          stats={tradingStats}
          autBalance={autBalance}
          fundingRate={fundingRate}
          nextFundingTime={nextFundingTime}
          insuranceFundSize={insuranceFundSize}
          burnedTokens={burnedTokens}
          openInterest={openInterest}
        />
        
        {/* Position list */}
        <div className="md:col-span-2">
          <PositionList
            positions={positions}
            currentPrice={currentPrice}
            onClosePosition={handleClosePosition}
            onManagePosition={handleManagePosition}
          />
        </div>
      </div>
      
      {/* Trading form modal */}
      <TradingFormModal
        showTradingForm={showTradingForm}
        setShowTradingForm={setShowTradingForm}
        currentPrice={currentPrice}
        maxMargin={parseFloat(autBalance)}
        onSubmit={handleOpenPosition}
      />
      
      {/* Position manager modal */}
      <PositionManagerModal
        showPositionManager={showPositionManager}
        setShowPositionManager={setShowPositionManager}
        selectedPosition={selectedPosition}
      />
    </div>
  );
}

export default TradingGame;
