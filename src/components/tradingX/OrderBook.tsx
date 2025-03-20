"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Info, ArrowDown, ArrowUp } from "lucide-react";
import { tradingService } from "@/services/tradingService";
import { ethers } from "ethers";
import { useAppKitAccount } from "@reown/appkit/react";

interface Order {
  id: string;
  price: number;
  size: number;
  side: "buy" | "sell";
  timestamp: number;
  filled: number;
  status: "open" | "filled" | "cancelled";
}

interface OrderBookProps {
  currentPrice: number;
  className?: string;
}

export function OrderBook({ currentPrice, className = "" }: OrderBookProps) {
  const [buyOrders, setBuyOrders] = useState<Order[]>([]);
  const [sellOrders, setSellOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [maxSize, setMaxSize] = useState(0);
  const [sortBy, setSortBy] = useState<"price" | "size">("price");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  const { address, isConnected } = useAppKitAccount();

  // Generate mock data for demonstration
  const generateMockOrders = () => {
    const mockBuyOrders: Order[] = [];
    const mockSellOrders: Order[] = [];
    
    // Generate buy orders (below current price)
    for (let i = 1; i <= 10; i++) {
      const priceOffset = (Math.random() * 0.05) + (0.001 * i);
      const price = currentPrice * (1 - priceOffset);
      const size = Math.floor(Math.random() * 1000) + 100;
      
      mockBuyOrders.push({
        id: `buy-${i}`,
        price,
        size,
        side: "buy",
        timestamp: Date.now() - Math.floor(Math.random() * 3600000),
        filled: 0,
        status: "open"
      });
    }
    
    // Generate sell orders (above current price)
    for (let i = 1; i <= 10; i++) {
      const priceOffset = (Math.random() * 0.05) + (0.001 * i);
      const price = currentPrice * (1 + priceOffset);
      const size = Math.floor(Math.random() * 1000) + 100;
      
      mockSellOrders.push({
        id: `sell-${i}`,
        price,
        size,
        side: "sell",
        timestamp: Date.now() - Math.floor(Math.random() * 3600000),
        filled: 0,
        status: "open"
      });
    }
    
    return { mockBuyOrders, mockSellOrders };
  };

  // Fetch order book data
  const fetchOrderBook = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would fetch from the contract
      // For now, we'll use mock data
      const { mockBuyOrders, mockSellOrders } = generateMockOrders();
      
      // Sort orders
      const sortedBuyOrders = sortOrders(mockBuyOrders, sortBy, sortDirection);
      const sortedSellOrders = sortOrders(mockSellOrders, sortBy, sortDirection);
      
      setBuyOrders(sortedBuyOrders);
      setSellOrders(sortedSellOrders);
      
      // Calculate max size for visualization
      const allSizes = [...mockBuyOrders, ...mockSellOrders].map(order => order.size);
      setMaxSize(Math.max(...allSizes));
    } catch (err) {
      console.error("Error fetching order book:", err);
      setError("Failed to load order book data");
    } finally {
      setIsLoading(false);
    }
  };

  // Sort orders based on criteria
  const sortOrders = (orders: Order[], by: "price" | "size", direction: "asc" | "desc") => {
    return [...orders].sort((a, b) => {
      const aValue = a[by];
      const bValue = b[by];
      
      if (direction === "asc") {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  };

  // Handle sort change
  const handleSortChange = (by: "price" | "size") => {
    if (sortBy === by) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new sort column with default direction
      setSortBy(by);
      setSortDirection("desc");
    }
  };

  // Format price with appropriate precision
  const formatPrice = (price: number) => {
    return price.toFixed(4);
  };

  // Format size with appropriate precision
  const formatSize = (size: number) => {
    return size.toFixed(2);
  };

  // Calculate size percentage for visualization
  const getSizePercentage = (size: number) => {
    return (size / maxSize) * 100;
  };

  // Initial fetch
  useEffect(() => {
    fetchOrderBook();
    
    // Set up interval to refresh data
    const interval = setInterval(fetchOrderBook, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [sortBy, sortDirection]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-[#1a1a1a]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl ${className}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Order Book</h2>
        <button
          onClick={fetchOrderBook}
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
          This order book shows limit orders placed by traders. Buy orders (bids) are shown in green, and sell orders (asks) are shown in red.
        </p>
      </div>
      
      {/* Current price indicator */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-white/70 text-sm">Current AUT Price</span>
          <span className="text-white font-medium">${currentPrice.toFixed(4)}</span>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      
      {/* Order book table */}
      <div className="overflow-hidden rounded-lg border border-white/10">
        {/* Table header */}
        <div className="grid grid-cols-3 bg-white/5 p-2 text-xs font-medium text-white/70">
          <button 
            className="flex items-center gap-1 justify-self-start"
            onClick={() => handleSortChange("price")}
          >
            Price
            {sortBy === "price" && (
              sortDirection === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
            )}
          </button>
          <button 
            className="flex items-center gap-1 justify-self-center"
            onClick={() => handleSortChange("size")}
          >
            Size (AUT)
            {sortBy === "size" && (
              sortDirection === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
            )}
          </button>
          <div className="justify-self-end">Total</div>
        </div>
        
        {/* Sell orders (asks) */}
        <div className="max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {sellOrders.map((order) => (
            <div key={order.id} className="grid grid-cols-3 p-2 text-sm border-t border-white/5 relative">
              <div 
                className="absolute inset-0 bg-red-500/10 z-0" 
                style={{ width: `${getSizePercentage(order.size)}%`, right: 0, left: 'auto' }}
              />
              <div className="text-red-400 z-10 justify-self-start">${formatPrice(order.price)}</div>
              <div className="text-white z-10 justify-self-center">{formatSize(order.size)}</div>
              <div className="text-white/70 z-10 justify-self-end">
                ${formatPrice(order.price * order.size)}
              </div>
            </div>
          ))}
        </div>
        
        {/* Current price separator */}
        <div className="bg-amber-400/20 p-2 text-center">
          <span className="text-amber-400 text-sm font-medium">${currentPrice.toFixed(4)}</span>
        </div>
        
        {/* Buy orders (bids) */}
        <div className="max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {buyOrders.map((order) => (
            <div key={order.id} className="grid grid-cols-3 p-2 text-sm border-t border-white/5 relative">
              <div 
                className="absolute inset-0 bg-green-500/10 z-0" 
                style={{ width: `${getSizePercentage(order.size)}%`, right: 0, left: 'auto' }}
              />
              <div className="text-green-400 z-10 justify-self-start">${formatPrice(order.price)}</div>
              <div className="text-white z-10 justify-self-center">{formatSize(order.size)}</div>
              <div className="text-white/70 z-10 justify-self-end">
                ${formatPrice(order.price * order.size)}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Disclaimer */}
      <p className="text-white/50 text-xs mt-4">
        Note: This is a simulated order book for demonstration purposes. In the production version, this will display real limit orders from the AUT perpetual trading contract.
      </p>
    </motion.div>
  );
}

export default OrderBook;
