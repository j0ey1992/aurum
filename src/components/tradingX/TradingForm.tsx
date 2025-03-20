"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  Info, 
  HelpCircle,
  ArrowRight,
  Check,
  X
} from "lucide-react";
import { LeverageSelector } from "./LeverageSelector";
import { OrderParams } from "./types";
import { tradingService } from "../../services/tradingService";

interface TradingFormProps {
  currentPrice: number;
  maxMargin: number;
  onSubmit: (params: OrderParams) => void;
  className?: string;
}

export function TradingForm({
  currentPrice,
  maxMargin,
  onSubmit,
  className = "",
}: TradingFormProps) {
  // Form state
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [margin, setMargin] = useState(10);
  const [leverage, setLeverage] = useState(1);
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitPrice, setLimitPrice] = useState<number | undefined>(undefined);
  const [stopLoss, setStopLoss] = useState<number | undefined>(undefined);
  const [takeProfit, setTakeProfit] = useState<number | undefined>(undefined);
  
  // UI state
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [formStep, setFormStep] = useState<"basic" | "advanced">("basic");
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Derived values
  const [positionSize, setPositionSize] = useState(margin * leverage);
  const [liquidationPrice, setLiquidationPrice] = useState(0);
  
  // Tooltip content
  const tooltips = {
    direction: "Choose whether you think AUT token price will go up (long) or down (short).",
    long: "Going long means you're betting the price will go up. You profit when the price rises above your entry price.",
    short: "Going short means you're betting the price will go down. You profit when the price falls below your entry price.",
    leverage: "Leverage multiplies your buying power, but also your risk. 2x leverage means you control $200 worth of AUT tokens with $100.",
    liquidation: "If the price moves against you enough to consume your margin, your position will be automatically closed (liquidated).",
    stopLoss: "A stop loss automatically closes your position when the price reaches a certain level, limiting your potential loss.",
    takeProfit: "A take profit automatically closes your position when the price reaches your target, securing your profit.",
    margin: "Margin is the collateral you put up to open a position. It determines your position size when combined with leverage."
  };
  
  // Update position size and liquidation price when inputs change
  useEffect(() => {
    setPositionSize(margin * leverage);
    
    const liqPrice = tradingService.calculateLiquidationPrice(
      currentPrice,
      leverage,
      direction
    );
    
    setLiquidationPrice(liqPrice);
  }, [margin, leverage, direction, currentPrice]);
  
  // Initialize limit price when switching to limit order
  useEffect(() => {
    if (orderType === "limit" && !limitPrice) {
      setLimitPrice(currentPrice);
    }
  }, [orderType, limitPrice, currentPrice]);
  
  // Handle margin input change
  const handleMarginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= maxMargin) {
      setMargin(value);
    }
  };
  
  // Handle limit price input change
  const handleLimitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setLimitPrice(value);
    }
  };
  
  // Handle stop loss input change
  const handleStopLossChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
    if (value === undefined || (!isNaN(value) && value > 0)) {
      setStopLoss(value);
    }
  };
  
  // Handle take profit input change
  const handleTakeProfitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
    if (value === undefined || (!isNaN(value) && value > 0)) {
      setTakeProfit(value);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formStep === "basic") {
      setFormStep("advanced");
      return;
    }
    
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }
    
    const params: OrderParams = {
      direction,
      margin,
      leverage,
      orderType,
      limitPrice: orderType === "limit" ? limitPrice : undefined,
      stopLoss,
      takeProfit,
    };
    
    onSubmit(params);
    setShowConfirmation(false);
  };
  
  // Calculate potential profit and loss
  const calculatePotential = () => {
    const priceMovement = currentPrice * 0.1; // 10% price movement
    
    let profitPrice, lossPrice;
    
    if (direction === "long") {
      profitPrice = currentPrice + priceMovement;
      lossPrice = currentPrice - priceMovement;
    } else {
      profitPrice = currentPrice - priceMovement;
      lossPrice = currentPrice + priceMovement;
    }
    
    const potentialProfit = ((Math.abs(profitPrice - currentPrice) / currentPrice) * positionSize).toFixed(2);
    const potentialLoss = ((Math.abs(lossPrice - currentPrice) / currentPrice) * positionSize).toFixed(2);
    
    return { potentialProfit, potentialLoss };
  };
  
  const { potentialProfit, potentialLoss } = calculatePotential();
  
  // Check if stop loss is valid
  const isStopLossValid = () => {
    if (!stopLoss) return true;
    
    if (direction === "long") {
      return stopLoss < currentPrice && stopLoss > liquidationPrice;
    } else {
      return stopLoss > currentPrice && stopLoss < liquidationPrice;
    }
  };
  
  // Check if take profit is valid
  const isTakeProfitValid = () => {
    if (!takeProfit) return true;
    
    if (direction === "long") {
      return takeProfit > currentPrice;
    } else {
      return takeProfit < currentPrice;
    }
  };
  
  // Render tooltip
  const renderTooltip = (key: string, content: string) => (
    <AnimatePresence>
      {showTooltip === key && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full mt-1 left-0 right-0 bg-[#2a2a2a] p-3 rounded-lg text-xs text-white/80 z-[500] border border-white/10 shadow-lg"
        >
          <div className="flex gap-2">
            <Info size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              {content}
            </div>
          </div>
          <button
            onClick={() => setShowTooltip(null)}
            className="absolute top-2 right-2 text-white/50 hover:text-white"
          >
            <X size={12} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#1a1a1a]/80 backdrop-blur-sm border border-white/10 rounded-xl p-4 sm:p-5 overflow-visible relative z-10 mt-4 ${className}`}
    >
      <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
        {formStep === "basic" ? "Open Position" : "Advanced Settings"}
        {formStep === "advanced" && (
          <button 
            type="button" 
            onClick={() => setFormStep("basic")}
            className="text-xs text-amber-400 font-normal ml-2"
          >
            Back to basics
          </button>
        )}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Step 1: Basic Settings */}
        {formStep === "basic" && (
          <>
            {/* Direction selector with tooltips */}
            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <label className="text-white/70 text-sm">Position Direction</label>
                <button
                  type="button"
                  onClick={() => setShowTooltip(showTooltip === "direction" ? null : "direction")}
                  className="text-white/50 hover:text-white"
                >
                  <HelpCircle size={14} />
                </button>
              </div>
              
              {renderTooltip("direction", direction === "long" ? tooltips.long : tooltips.short)}
              
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setDirection("long")}
                  className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl ${
                    direction === "long"
                      ? "bg-green-400/10 border border-green-400/30"
                      : "bg-white/5 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  <TrendingUp
                    size={20}
                    className={direction === "long" ? "text-green-400" : "text-white/70"}
                  />
                  <span
                    className={`mt-2 font-medium ${
                      direction === "long" ? "text-green-400" : "text-white/70"
                    }`}
                  >
                    Long
                  </span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setDirection("short")}
                  className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl ${
                    direction === "short"
                      ? "bg-red-400/10 border border-red-400/30"
                      : "bg-white/5 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  <TrendingDown
                    size={20}
                    className={direction === "short" ? "text-red-400" : "text-white/70"}
                  />
                  <span
                    className={`mt-2 font-medium ${
                      direction === "short" ? "text-red-400" : "text-white/70"
                    }`}
                  >
                    Short
                  </span>
                </button>
              </div>
              
              <p className="text-xs text-white/50 mt-1">
                {direction === "long" 
                  ? "You profit when AUT token price goes up" 
                  : "You profit when AUT token price goes down"}
              </p>
            </div>
        
            {/* Price display */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-2 sm:p-3">
              <div className="flex justify-between items-center">
                <p className="text-white/70 text-sm">Current AUT Token Price</p>
                <p className="text-white font-medium">${currentPrice.toFixed(4)}</p>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-white/70 text-sm">Order Type</p>
                <div className="flex bg-[#2a2a2a] rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setOrderType("market")}
                    className={`px-2 py-1 text-xs font-medium rounded-md ${
                      orderType === "market"
                        ? "bg-amber-400 text-black"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    Market
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType("limit")}
                    className={`px-2 py-1 text-xs font-medium rounded-md ${
                      orderType === "limit"
                        ? "bg-amber-400 text-black"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    Limit
                  </button>
                </div>
              </div>
              {orderType === "limit" && (
                <div className="mt-2">
                  <div className="flex justify-between items-center">
                    <p className="text-white/70 text-sm">Limit Price</p>
                    <div className="relative w-24">
                      <span className="absolute left-2 top-1.5 text-white/50">$</span>
                      <input
                        type="number"
                        value={limitPrice}
                        onChange={handleLimitPriceChange}
                        className="w-full bg-[#2a2a2a] border border-white/20 rounded-lg pl-6 pr-2 py-1 text-white text-sm"
                        step="0.01"
                        min="0.01"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
        
            {/* Margin input with tooltip */}
            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <label className="text-white/70 text-sm">Margin (Collateral)</label>
                <button
                  type="button"
                  onClick={() => setShowTooltip(showTooltip === "margin" ? null : "margin")}
                  className="text-white/50 hover:text-white"
                >
                  <HelpCircle size={14} />
                </button>
              </div>
              
              {renderTooltip("margin", tooltips.margin)}
              
              <div className="relative">
                <input
                  type="number"
                  value={margin}
                  onChange={handleMarginChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                  step="0.1"
                  min="0"
                  max={maxMargin}
                  required
                />
                <span className="absolute right-3 top-2.5 text-white/50">AUT</span>
              </div>
              
              <div className="flex justify-between text-xs text-white/50 mt-1">
                <span>Available: {maxMargin.toFixed(2)} AUT</span>
                <button 
                  type="button" 
                  onClick={() => setMargin(maxMargin)}
                  className="text-amber-400 hover:underline"
                >
                  Max
                </button>
              </div>
            </div>
        
            {/* Leverage selector with tooltip */}
            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <label className="text-white/70 text-sm">Leverage</label>
                <button
                  type="button"
                  onClick={() => setShowTooltip(showTooltip === "leverage" ? null : "leverage")}
                  className="text-white/50 hover:text-white"
                >
                  <HelpCircle size={14} />
                </button>
              </div>
              
              {renderTooltip("leverage", tooltips.leverage)}
              
              <LeverageSelector
                value={leverage}
                onChange={setLeverage}
                min={1}
                max={100}
              />
            </div>
        
            {/* Position summary */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-2 sm:p-3">
              <h4 className="text-sm font-medium text-white mb-2">Position Summary</h4>
              
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <p className="text-xs text-white/50">Position Size</p>
                  <p className="text-sm font-medium text-white">${positionSize.toFixed(2)}</p>
                </div>
                
                <div className="relative">
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-white/50">Liquidation Price</p>
                    <button
                      type="button"
                      onClick={() => setShowTooltip(showTooltip === "liquidation" ? null : "liquidation")}
                      className="text-white/50 hover:text-white"
                    >
                      <HelpCircle size={10} />
                    </button>
                  </div>
                  
                  {renderTooltip("liquidation", tooltips.liquidation)}
                  
                  <p className="text-sm font-medium text-red-400">${liquidationPrice.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-white/70">Entry Price</p>
                  <p className="text-sm font-medium text-white">
                    ${orderType === "market" ? currentPrice.toFixed(2) : (limitPrice || 0).toFixed(2)}
                  </p>
                </div>
                
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-white/70">Direction</p>
                  <p className={`text-sm font-medium ${direction === "long" ? "text-green-400" : "text-red-400"}`}>
                    {direction === "long" ? "Long" : "Short"}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Step 2: Advanced Settings */}
        {formStep === "advanced" && (
          <>
            {/* Stop Loss with tooltip */}
            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <label className="text-white/70 text-sm">Stop Loss (optional)</label>
                <button
                  type="button"
                  onClick={() => setShowTooltip(showTooltip === "stopLoss" ? null : "stopLoss")}
                  className="text-white/50 hover:text-white"
                >
                  <HelpCircle size={14} />
                </button>
              </div>
              
              {renderTooltip("stopLoss", tooltips.stopLoss)}
              
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-white/50">$</span>
                <input
                  type="number"
                  value={stopLoss || ""}
                  onChange={handleStopLossChange}
                  className={`w-full bg-white/10 border ${
                    stopLoss && !isStopLossValid()
                      ? "border-red-400"
                      : "border-white/20"
                  } rounded-lg pl-7 pr-3 py-2 text-white`}
                  step="0.01"
                  min="0.01"
                  placeholder="Optional"
                />
              </div>
              
              {stopLoss && !isStopLossValid() ? (
                <p className="text-xs text-red-400 mt-1 flex items-center">
                  <AlertTriangle size={10} className="mr-1" />
                  Invalid stop loss price
                </p>
              ) : (
                <p className="text-xs text-white/50 mt-1">
                  {direction === "long" 
                    ? "Set below entry price to limit losses" 
                    : "Set above entry price to limit losses"}
                </p>
              )}
              
              {/* Suggested stop loss */}
              {!stopLoss && (
                <div className="mt-2">
                  <p className="text-xs text-white/70">Suggested stop loss:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {[5, 10, 15].map(percent => {
                      const price = direction === "long"
                        ? currentPrice * (1 - percent / 100)
                        : currentPrice * (1 + percent / 100);
                      return (
                        <button
                          key={percent}
                          type="button"
                          onClick={() => setStopLoss(parseFloat(price.toFixed(2)))}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white"
                        >
                          {percent}% (${price.toFixed(2)})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            {/* Take Profit with tooltip */}
            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <label className="text-white/70 text-sm">Take Profit (optional)</label>
                <button
                  type="button"
                  onClick={() => setShowTooltip(showTooltip === "takeProfit" ? null : "takeProfit")}
                  className="text-white/50 hover:text-white"
                >
                  <HelpCircle size={14} />
                </button>
              </div>
              
              {renderTooltip("takeProfit", tooltips.takeProfit)}
              
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-white/50">$</span>
                <input
                  type="number"
                  value={takeProfit || ""}
                  onChange={handleTakeProfitChange}
                  className={`w-full bg-white/10 border ${
                    takeProfit && !isTakeProfitValid()
                      ? "border-red-400"
                      : "border-white/20"
                  } rounded-lg pl-7 pr-3 py-2 text-white`}
                  step="0.01"
                  min="0.01"
                  placeholder="Optional"
                />
              </div>
              
              {takeProfit && !isTakeProfitValid() ? (
                <p className="text-xs text-red-400 mt-1 flex items-center">
                  <AlertTriangle size={10} className="mr-1" />
                  Invalid take profit price
                </p>
              ) : (
                <p className="text-xs text-white/50 mt-1">
                  {direction === "long" 
                    ? "Set above entry price to secure profits" 
                    : "Set below entry price to secure profits"}
                </p>
              )}
              
              {/* Suggested take profit */}
              {!takeProfit && (
                <div className="mt-2">
                  <p className="text-xs text-white/70">Suggested take profit:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {[5, 10, 20].map(percent => {
                      const price = direction === "long"
                        ? currentPrice * (1 + percent / 100)
                        : currentPrice * (1 - percent / 100);
                      return (
                        <button
                          key={percent}
                          type="button"
                          onClick={() => setTakeProfit(parseFloat(price.toFixed(2)))}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white"
                        >
                          {percent}% (${price.toFixed(2)})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            {/* Position summary reminder */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-2 sm:p-3">
              <h4 className="text-sm font-medium text-white mb-2">Position Summary</h4>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/50">Direction:</span>
                  <span className={direction === "long" ? "text-green-400" : "text-red-400"}>
                    {direction === "long" ? "Long" : "Short"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Size:</span>
                  <span className="text-white">${positionSize.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Leverage:</span>
                  <span className="text-white">{leverage}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Entry:</span>
                  <span className="text-white">
                    ${orderType === "market" ? currentPrice.toFixed(2) : (limitPrice || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Confirmation step */}
            {showConfirmation && (
              <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg p-3 mt-4">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Confirm your trade</p>
                    <p className="text-white/70 text-sm mt-1">
                      You are about to {direction === "long" ? "long" : "short"} AUT token with {leverage}x leverage.
                      {stopLoss ? ` Stop loss set at $${stopLoss.toFixed(4)}.` : ""}
                      {takeProfit ? ` Take profit set at $${takeProfit.toFixed(4)}.` : ""}
                    </p>
                    <p className="text-white/70 text-sm mt-2">
                      This will use {margin.toFixed(2)} AUT from your balance.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Potential profit/loss */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 bg-white/5 rounded-lg p-2 sm:p-3">
          <div>
            <p className="text-xs text-white/70">Potential Profit (10% move)</p>
            <p className="text-sm font-medium text-green-400">
              +{potentialProfit} AUT
            </p>
          </div>
          
          <div>
            <p className="text-xs text-white/70">Potential Loss (10% move)</p>
            <p className="text-sm font-medium text-red-400">
              -{potentialLoss} AUT
            </p>
          </div>
        </div>
        
        {/* Submit button */}
        <button
          type="submit"
          className={`w-full py-2.5 sm:py-3 rounded-lg font-medium ${
            direction === "long"
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-red-500 hover:bg-red-600 text-white"
          }`}
          disabled={
            Boolean(stopLoss && !isStopLossValid()) ||
            Boolean(takeProfit && !isTakeProfitValid())
          }
        >
          {formStep === "basic" ? "Continue to Advanced Settings" : (
            showConfirmation ? (
              <span className="flex items-center justify-center gap-2">
                <Check size={16} /> Confirm {direction === "long" ? "Long" : "Short"}
              </span>
            ) : (
              `${direction === "long" ? "Long" : "Short"} AUT Token ${orderType === "market" ? "at Market Price" : "with Limit Order"}`
            )
          )}
        </button>
        
        {/* Disclaimer */}
        <div className="text-xs text-white/50 flex items-start gap-2">
          <Info size={12} className="mt-0.5 flex-shrink-0" />
          <p>
            Trading with leverage involves substantial risk. You can lose more than your initial margin.
            Make sure you understand the risks before trading.
          </p>
        </div>
      </form>
    </motion.div>
  );
}

export default TradingForm;
