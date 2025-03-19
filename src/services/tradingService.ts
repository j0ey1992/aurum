import { ethers } from 'ethers';
import { Position, OrderParams, TradingStats, FundingInfo } from '@/components/tradingX/types';
import { tokenService } from './tokenService';

/**
 * Service for handling trading operations and calculations
 */
export const tradingService = {
  /**
   * Calculate liquidation price for a position
   * @param entryPrice Entry price of the position
   * @param leverage Leverage used
   * @param direction Long or short
   * @returns Liquidation price
   */
  calculateLiquidationPrice: (
    entryPrice: number,
    leverage: number,
    direction: "long" | "short"
  ): number => {
    // Maintenance margin is set to 5%
    const maintenanceMargin = 0.05;
    
    if (direction === "long") {
      // For long positions: liquidationPrice = entryPrice * (1 - (1 / leverage) + maintenanceMargin)
      return entryPrice * (1 - (1 / leverage) + maintenanceMargin);
    } else {
      // For short positions: liquidationPrice = entryPrice * (1 + (1 / leverage) - maintenanceMargin)
      return entryPrice * (1 + (1 / leverage) - maintenanceMargin);
    }
  },

  /**
   * Calculate PnL for a position
   * @param position Position object
   * @param currentPrice Current gold price
   * @returns PnL amount
   */
  calculatePnL: (position: Position, currentPrice: number): number => {
    const { direction, entryPrice, size, leverage } = position;
    
    if (direction === "long") {
      // For long positions: (currentPrice - entryPrice) / entryPrice * size * leverage
      return ((currentPrice - entryPrice) / entryPrice) * size;
    } else {
      // For short positions: (entryPrice - currentPrice) / entryPrice * size * leverage
      return ((entryPrice - currentPrice) / entryPrice) * size;
    }
  },

  /**
   * Check if a position should be liquidated
   * @param position Position to check
   * @param currentPrice Current gold price
   * @returns Boolean indicating if position should be liquidated
   */
  shouldLiquidate: (position: Position, currentPrice: number): boolean => {
    const { direction, liquidationPrice } = position;
    
    if (direction === "long") {
      return currentPrice <= liquidationPrice;
    } else {
      return currentPrice >= liquidationPrice;
    }
  },

  /**
   * Create a new position
   * @param params Order parameters
   * @param currentPrice Current gold price
   * @returns New position object
   */
  createPosition: (params: OrderParams, currentPrice: number): Position => {
    const { direction, margin, leverage, stopLoss, takeProfit } = params;
    const size = margin * leverage;
    
    // Calculate liquidation price
    const liquidationPrice = tradingService.calculateLiquidationPrice(
      currentPrice,
      leverage,
      direction
    );
    
    // Create position object
    const position: Position = {
      id: `pos-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      direction,
      status: "open",
      leverage,
      entryPrice: currentPrice,
      liquidationPrice,
      size,
      margin,
      stopLoss,
      takeProfit
    };
    
    return position;
  },

  /**
   * Close a position
   * @param position Position to close
   * @param currentPrice Current gold price
   * @param reason Reason for closing (take profit, stop loss, manual)
   * @returns Updated position
   */
  closePosition: (
    position: Position,
    currentPrice: number,
    reason: "take_profit" | "stop_loss" | "manual" | "liquidation" = "manual"
  ): Position => {
    // Calculate PnL
    const pnl = tradingService.calculatePnL(position, currentPrice);
    
    // Update position
    const updatedPosition: Position = {
      ...position,
      status: reason === "liquidation" ? "liquidated" : "closed",
      result: pnl > 0 ? "profit" : "loss",
      pnl,
      exitPrice: currentPrice
    };
    
    return updatedPosition;
  },

  /**
   * Calculate funding payment
   * @param position Open position
   * @param fundingRate Current funding rate
   * @returns Funding payment (positive means user pays, negative means user receives)
   */
  calculateFunding: (position: Position, fundingRate: number): number => {
    // Funding is calculated as: position size * funding rate
    // If long, user pays when rate is positive
    // If short, user pays when rate is negative
    const direction = position.direction === "long" ? 1 : -1;
    return position.size * fundingRate * direction;
  },

  /**
   * Calculate trading statistics
   * @param positions Array of all positions
   * @returns Trading statistics
   */
  calculateStats: (positions: Position[]): TradingStats => {
    let profit = 0;
    let loss = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    let leverageSum = 0;
    
    positions.forEach(position => {
      if (position.pnl) {
        if (position.pnl > 0) {
          profit++;
          totalProfit += position.pnl;
        } else {
          loss++;
          totalLoss += Math.abs(position.pnl);
        }
      }
      
      leverageSum += position.leverage;
    });
    
    const total = profit + loss;
    const winRate = total > 0 ? (profit / total) * 100 : 0;
    const averageLeverage = positions.length > 0 ? leverageSum / positions.length : 0;
    
    return {
      profit,
      loss,
      totalProfit,
      totalLoss,
      averageLeverage,
      winRate
    };
  },

  /**
   * Check if take profit or stop loss has been triggered
   * @param position Position to check
   * @param currentPrice Current gold price
   * @returns Object indicating if TP or SL was triggered
   */
  checkTakeProfitStopLoss: (
    position: Position,
    currentPrice: number
  ): { triggered: boolean; type: "take_profit" | "stop_loss" | null } => {
    const { direction, takeProfit, stopLoss } = position;
    
    if (direction === "long") {
      if (takeProfit && currentPrice >= takeProfit) {
        return { triggered: true, type: "take_profit" };
      }
      
      if (stopLoss && currentPrice <= stopLoss) {
        return { triggered: true, type: "stop_loss" };
      }
    } else {
      if (takeProfit && currentPrice <= takeProfit) {
        return { triggered: true, type: "take_profit" };
      }
      
      if (stopLoss && currentPrice >= stopLoss) {
        return { triggered: true, type: "stop_loss" };
      }
    }
    
    return { triggered: false, type: null };
  },

  /**
   * Place a trade using the token service
   * @param provider Ethers provider with signer
   * @param params Order parameters
   * @param currentPrice Current gold price
   * @returns Promise with position ID
   */
  placeTrade: async (
    provider: ethers.BrowserProvider,
    params: OrderParams,
    currentPrice: number
  ): Promise<string> => {
    try {
      const { direction, margin, leverage } = params;
      
      // In a real implementation, this would call the smart contract
      // For now, we'll simulate the trade
      console.log(`Placing trade: ${direction} with ${margin} AUT tokens at ${leverage}x leverage`);
      
      // Create position
      const position = tradingService.createPosition(params, currentPrice);
      
      // Approve token spending
      await tokenService.approveSpending(provider, margin.toString());
      
      return position.id;
    } catch (error) {
      console.error("Error placing trade:", error);
      throw error;
    }
  }
};
