import { ethers } from 'ethers';
import { Position, OrderParams, TradingStats, FundingInfo } from '@/components/tradingX/types';
import { tokenService } from './tokenService';
import { autPriceService } from './autPriceService';

// Contract addresses (to be replaced with actual deployed addresses)
export const AUT_PERPETUAL_TRADING_ADDRESS = '0x0000000000000000000000000000000000000000';
export const POSITION_MANAGER_ADDRESS = '0x0000000000000000000000000000000000000000';
export const COLLATERAL_VAULT_ADDRESS = '0x0000000000000000000000000000000000000000';
export const FEE_DISTRIBUTOR_ADDRESS = '0x0000000000000000000000000000000000000000';
export const PRICE_ORACLE_ADDRESS = '0x0000000000000000000000000000000000000000';

// Simplified ABI for AUTPerpetualTrading contract
const AUT_PERPETUAL_TRADING_ABI = [
  {
    inputs: [
      { name: '_isLong', type: 'bool' },
      { name: '_collateralAmount', type: 'uint256' },
      { name: '_leverage', type: 'uint256' }
    ],
    name: 'openPosition',
    outputs: [{ name: 'positionId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: '_isLong', type: 'bool' }],
    name: 'closePosition',
    outputs: [{ name: 'pnl', type: 'int256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: '_trader', type: 'address' },
      { name: '_isLong', type: 'bool' }
    ],
    name: 'liquidatePosition',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getAUTPrice',
    outputs: [{ name: 'price', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: '_trader', type: 'address' },
      { name: '_isLong', type: 'bool' }
    ],
    name: 'calculatePnL',
    outputs: [{ name: 'pnl', type: 'int256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getCurrentFundingRate',
    outputs: [{ name: 'fundingRate', type: 'int256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getLongOpenInterest',
    outputs: [{ name: 'openInterest', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getShortOpenInterest',
    outputs: [{ name: 'openInterest', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getInsuranceFundSize',
    outputs: [{ name: 'size', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
];

// Simplified ABI for PositionManager contract
const POSITION_MANAGER_ABI = [
  {
    inputs: [{ name: '_positionId', type: 'uint256' }],
    name: 'getPosition',
    outputs: [
      { name: 'trader', type: 'address' },
      { name: 'isLong', type: 'bool' },
      { name: 'size', type: 'uint256' },
      { name: 'collateral', type: 'uint256' },
      { name: 'entryPrice', type: 'uint256' },
      { name: 'leverage', type: 'uint256' },
      { name: 'liquidationPrice', type: 'uint256' },
      { name: 'timestamp', type: 'uint256' },
      { name: 'isOpen', type: 'bool' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: '_trader', type: 'address' }],
    name: 'getOpenPositionsForTrader',
    outputs: [{ name: 'openPositionIds', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: '_positionId', type: 'uint256' },
      { name: '_currentPrice', type: 'uint256' }
    ],
    name: 'calculatePnL',
    outputs: [{ name: 'pnl', type: 'int256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: '_positionId', type: 'uint256' },
      { name: '_currentPrice', type: 'uint256' }
    ],
    name: 'shouldLiquidate',
    outputs: [{ name: 'shouldLiquidate', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  }
];

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
    // Maintenance margin is set to 20%
    const maintenanceMargin = 0.2;
    
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
   * @param currentPrice Current AUT price
   * @returns PnL amount
   */
  calculatePnL: (position: Position, currentPrice: number): number => {
    const { direction, entryPrice, size } = position;
    
    if (direction === "long") {
      // For long positions: (currentPrice - entryPrice) / entryPrice * size
      return ((currentPrice - entryPrice) / entryPrice) * size;
    } else {
      // For short positions: (entryPrice - currentPrice) / entryPrice * size
      return ((entryPrice - currentPrice) / entryPrice) * size;
    }
  },

  /**
   * Check if a position should be liquidated
   * @param position Position to check
   * @param currentPrice Current AUT price
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
   * Create a position object from on-chain data
   * @param positionId Position ID
   * @param positionData Position data from contract
   * @param currentPrice Current AUT price
   * @returns Position object
   */
  createPositionFromContract: (
    positionId: string,
    positionData: any,
    currentPrice: number
  ): Position => {
    const [
      trader,
      isLong,
      size,
      collateral,
      entryPrice,
      leverage,
      liquidationPrice,
      timestamp,
      isOpen
    ] = positionData;
    
    // Convert values to appropriate formats
    const sizeNum = parseFloat(ethers.formatUnits(size, 30)); // 30 decimals for PRICE_PRECISION
    const collateralNum = parseFloat(ethers.formatUnits(collateral, 30));
    const entryPriceNum = parseFloat(ethers.formatUnits(entryPrice, 30));
    const liquidationPriceNum = parseFloat(ethers.formatUnits(liquidationPrice, 30));
    const leverageNum = parseInt(leverage.toString()) / 10000; // BASIS_POINTS_DIVISOR = 10000
    
    // Calculate PnL
    const pnl = isLong
      ? ((currentPrice - entryPriceNum) / entryPriceNum) * sizeNum
      : ((entryPriceNum - currentPrice) / entryPriceNum) * sizeNum;
    
    // Create position object
    const position: Position = {
      id: positionId,
      timestamp: parseInt(timestamp.toString()) * 1000, // Convert to milliseconds
      direction: isLong ? "long" : "short",
      status: isOpen ? "open" : "closed",
      leverage: leverageNum,
      entryPrice: entryPriceNum,
      liquidationPrice: liquidationPriceNum,
      size: sizeNum,
      margin: collateralNum,
      pnl: isOpen ? pnl : undefined,
      exitPrice: isOpen ? undefined : currentPrice
    };
    
    return position;
  },

  /**
   * Get all open positions for a trader
   * @param provider Ethers provider with signer
   * @param address Trader address
   * @returns Promise with array of positions
   */
  getOpenPositions: async (
    provider: ethers.BrowserProvider,
    address: string
  ): Promise<Position[]> => {
    try {
      const signer = await provider.getSigner();
      const positionManager = new ethers.Contract(
        POSITION_MANAGER_ADDRESS,
        POSITION_MANAGER_ABI,
        signer
      );
      
      // Get current AUT price
      const currentPrice = await tradingService.getCurrentAUTPrice(provider);
      
      // Get open position IDs
      const positionIds = await positionManager.getOpenPositionsForTrader(address);
      
      // Get position details for each ID
      const positions: Position[] = [];
      
      for (const positionId of positionIds) {
        const positionData = await positionManager.getPosition(positionId);
        positions.push(
          tradingService.createPositionFromContract(
            positionId.toString(),
            positionData,
            currentPrice
          )
        );
      }
      
      return positions;
    } catch (error) {
      console.error("Error getting open positions:", error);
      return [];
    }
  },

  /**
   * Get current AUT price from contract
   * @param provider Ethers provider
   * @returns Promise with current price
   */
  getCurrentAUTPrice: async (provider: ethers.BrowserProvider): Promise<number> => {
    try {
      const contract = new ethers.Contract(
        AUT_PERPETUAL_TRADING_ADDRESS,
        AUT_PERPETUAL_TRADING_ABI,
        provider
      );
      
      const priceRaw = await contract.getAUTPrice();
      return parseFloat(ethers.formatUnits(priceRaw, 30)); // 30 decimals for PRICE_PRECISION
    } catch (error) {
      console.error("Error getting AUT price from contract:", error);
      
      // Fallback to autPriceService
      const priceResult = await autPriceService.getCurrentPrice();
      return priceResult.currentPrice;
    }
  },

  /**
   * Get current funding rate
   * @param provider Ethers provider
   * @returns Promise with funding rate
   */
  getCurrentFundingRate: async (provider: ethers.BrowserProvider): Promise<number> => {
    try {
      const contract = new ethers.Contract(
        AUT_PERPETUAL_TRADING_ADDRESS,
        AUT_PERPETUAL_TRADING_ABI,
        provider
      );
      
      const fundingRateRaw = await contract.getCurrentFundingRate();
      return parseFloat(ethers.formatUnits(fundingRateRaw, 6)); // 6 decimals for FUNDING_RATE_PRECISION
    } catch (error) {
      console.error("Error getting funding rate:", error);
      return 0.01; // Default 0.01% funding rate
    }
  },

  /**
   * Get trading statistics
   * @param provider Ethers provider
   * @returns Promise with trading statistics
   */
  getTradingStats: async (provider: ethers.BrowserProvider): Promise<TradingStats> => {
    try {
      const contract = new ethers.Contract(
        AUT_PERPETUAL_TRADING_ADDRESS,
        AUT_PERPETUAL_TRADING_ABI,
        provider
      );
      
      // Get open interest
      const longOpenInterest = parseFloat(
        ethers.formatUnits(await contract.getLongOpenInterest(), 30)
      );
      const shortOpenInterest = parseFloat(
        ethers.formatUnits(await contract.getShortOpenInterest(), 30)
      );
      
      // Get insurance fund size
      const insuranceFundSize = parseFloat(
        ethers.formatUnits(await contract.getInsuranceFundSize(), 18)
      );
      
      // Get user's positions
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const positions = await tradingService.getOpenPositions(provider, address);
      
      // Calculate stats from positions
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
    } catch (error) {
      console.error("Error getting trading stats:", error);
      return {
        profit: 0,
        loss: 0,
        totalProfit: 0,
        totalLoss: 0,
        averageLeverage: 0,
        winRate: 0
      };
    }
  },

  /**
   * Place a trade using the AUT perpetual trading contract
   * @param provider Ethers provider with signer
   * @param params Order parameters
   * @returns Promise with position ID
   */
  placeTrade: async (
    provider: ethers.BrowserProvider,
    params: OrderParams
  ): Promise<string> => {
    try {
      const { direction, margin, leverage } = params;
      const isLong = direction === "long";
      
      // Get signer
      const signer = await provider.getSigner();
      
      // Create contract instance
      const contract = new ethers.Contract(
        AUT_PERPETUAL_TRADING_ADDRESS,
        AUT_PERPETUAL_TRADING_ABI,
        signer
      );
      
      // Approve token spending
      await tokenService.approveSpending(provider, margin.toString());
      
      // Convert margin to wei
      const marginWei = ethers.parseUnits(margin.toString(), 18);
      
      // Convert leverage to basis points (10000 = 1x)
      const leverageBasisPoints = Math.floor(leverage * 10000);
      
      // Open position
      const tx = await contract.openPosition(
        isLong,
        marginWei,
        leverageBasisPoints
      );
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Extract position ID from event logs
      const event = receipt.logs
        .map((log: any) => {
          try {
            return contract.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .find((event: any) => event && event.name === 'PositionOpened');
      
      if (!event || !event.args || !event.args.positionId) {
        throw new Error('Failed to extract positionId from transaction receipt');
      }
      
      return event.args.positionId.toString();
    } catch (error) {
      console.error("Error placing trade:", error);
      throw error;
    }
  },
  
  /**
   * Close a position
   * @param provider Ethers provider with signer
   * @param positionId Position ID
   * @returns Promise with transaction hash
   */
  closePosition: async (
    provider: ethers.BrowserProvider,
    positionId: string
  ): Promise<string> => {
    try {
      // Get signer
      const signer = await provider.getSigner();
      
      // Get position details to determine if long or short
      const positionManager = new ethers.Contract(
        POSITION_MANAGER_ADDRESS,
        POSITION_MANAGER_ABI,
        signer
      );
      
      const positionData = await positionManager.getPosition(positionId);
      const isLong = positionData[1]; // isLong is the second return value
      
      // Create contract instance
      const contract = new ethers.Contract(
        AUT_PERPETUAL_TRADING_ADDRESS,
        AUT_PERPETUAL_TRADING_ABI,
        signer
      );
      
      // Close position
      const tx = await contract.closePosition(isLong);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      return receipt.hash;
    } catch (error) {
      console.error("Error closing position:", error);
      throw error;
    }
  },
  
  /**
   * Check if take profit or stop loss has been triggered
   * @param position Position to check
   * @param currentPrice Current AUT price
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
  }
};
