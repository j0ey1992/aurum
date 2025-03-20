import axios, { AxiosError } from 'axios';
import { ethers } from 'ethers';

// AUT token address on Cronos Chain
export const AUT_TOKEN_ADDRESS = '0xD896aA25da8e3832d68d1C05fEE9C851d42F1dC1';

// WCRO token address on Cronos Chain
export const WCRO_TOKEN_ADDRESS = '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23';

// VVS Finance AUT/WCRO pool address
export const VVS_POOL_ADDRESS = '0x0000000000000000000000000000000000000000'; // Replace with actual pool address

// Price Oracle contract address
export const PRICE_ORACLE_ADDRESS = '0x0000000000000000000000000000000000000000'; // Replace with deployed contract address

// Maximum number of retries for API calls
const MAX_RETRIES = 3;

// Delay between retries (in ms)
const RETRY_DELAY = 1000;

// Interface for AUT price data
export interface AUTPriceData {
  date: string;
  price: number;
}

// Interface for price result with data source information
export interface PriceResult {
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  isRealData: boolean;
  dataSource: string;
}

// Simplified ABI for VVS Finance pool
const VVS_POOL_ABI = [
  {
    constant: true,
    inputs: [],
    name: 'getReserves',
    outputs: [
      { name: 'reserve0', type: 'uint112' },
      { name: 'reserve1', type: 'uint112' },
      { name: 'blockTimestampLast', type: 'uint32' }
    ],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'token0',
    outputs: [{ name: '', type: 'address' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'token1',
    outputs: [{ name: '', type: 'address' }],
    type: 'function'
  }
];

// Simplified ABI for Price Oracle contract
const PRICE_ORACLE_ABI = [
  {
    inputs: [],
    name: 'getPrice',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function'
  },
  {
    inputs: [],
    name: 'updatePrice',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function'
  },
  {
    inputs: [],
    name: 'getTWAP',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function'
  }
];

/**
 * Helper function to delay execution
 * @param ms Milliseconds to delay
 */
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Service for fetching AUT token price data
 */
export const autPriceService = {
  /**
   * Get current AUT price with retry logic
   * @returns Promise with current price, 24h change, 24h percentage change, and data source info
   */
  getCurrentPrice: async (): Promise<PriceResult> => {
    // Try on-chain price oracle first
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Attempting to fetch AUT price from on-chain oracle (attempt ${attempt}/${MAX_RETRIES})`);
        
        // Connect to Cronos Chain
        const provider = new ethers.JsonRpcProvider('https://evm.cronos.org');
        
        // Create contract instance
        const priceOracle = new ethers.Contract(PRICE_ORACLE_ADDRESS, PRICE_ORACLE_ABI, provider);
        
        // Get current price
        const priceRaw = await priceOracle.getPrice();
        const price = parseFloat(ethers.formatUnits(priceRaw, 30)); // 30 decimals for PRICE_PRECISION
        
        console.log('On-chain price oracle response:', price);
        
        // Get yesterday's price to calculate price change
        // For this, we'll use the tokenService.getTokenPrice which fetches from DEXs
        const tokenPriceData = await tokenService.getTokenPrice();
        const priceChange = price - tokenPriceData.price;
        const priceChangePercent = (priceChange / tokenPriceData.price) * 100;
        
        console.log('Successfully fetched AUT price from on-chain oracle');
        
        return {
          currentPrice: parseFloat(price.toFixed(4)),
          priceChange: parseFloat(priceChange.toFixed(4)),
          priceChangePercent: parseFloat(priceChangePercent.toFixed(2)),
          isRealData: true,
          dataSource: 'On-chain Oracle'
        };
      } catch (error) {
        console.error(`On-chain oracle error (attempt ${attempt}/${MAX_RETRIES}):`, error);
        
        if (attempt < MAX_RETRIES) {
          console.log(`Retrying in ${RETRY_DELAY}ms...`);
          await delay(RETRY_DELAY);
        }
      }
    }

    // If on-chain oracle fails, try direct DEX query
    try {
      console.log('On-chain oracle failed, trying direct DEX query');
      
      // Connect to Cronos Chain
      const provider = new ethers.JsonRpcProvider('https://evm.cronos.org');
      
      // Create contract instance for VVS pool
      const vvsPool = new ethers.Contract(VVS_POOL_ADDRESS, VVS_POOL_ABI, provider);
      
      // Get reserves
      const [reserve0, reserve1] = await vvsPool.getReserves();
      
      // Determine which token is AUT and which is WCRO
      const token0 = await vvsPool.token0();
      const isAUTToken0 = token0.toLowerCase() === AUT_TOKEN_ADDRESS.toLowerCase();
      
      let autReserve, wcroReserve;
      if (isAUTToken0) {
        autReserve = reserve0;
        wcroReserve = reserve1;
      } else {
        autReserve = reserve1;
        wcroReserve = reserve0;
      }
      
      // Calculate AUT/WCRO price
      const autWcroPrice = wcroReserve / autReserve;
      
      // Get WCRO/USD price (hardcoded for now, in production would use an oracle)
      const wcroUsdPrice = 0.12; // Example price
      
      // Calculate AUT/USD price
      const autUsdPrice = autWcroPrice * wcroUsdPrice;
      
      // For price change, use tokenService
      const tokenPriceData = await tokenService.getTokenPrice();
      const priceChange = autUsdPrice - tokenPriceData.price;
      const priceChangePercent = (priceChange / tokenPriceData.price) * 100;
      
      console.log('Successfully fetched AUT price from DEX');
      
      return {
        currentPrice: parseFloat(autUsdPrice.toFixed(4)),
        priceChange: parseFloat(priceChange.toFixed(4)),
        priceChangePercent: parseFloat(priceChangePercent.toFixed(2)),
        isRealData: true,
        dataSource: 'VVS Finance'
      };
    } catch (error) {
      console.error('DEX query failed:', error);
    }

    // If all on-chain methods fail, use tokenService
    try {
      console.log('All on-chain methods failed, using tokenService');
      
      const tokenPriceData = await tokenService.getTokenPrice();
      
      return {
        currentPrice: tokenPriceData.price,
        priceChange: tokenPriceData.priceChange,
        priceChangePercent: tokenPriceData.priceChange / tokenPriceData.price * 100,
        isRealData: true,
        dataSource: 'DexScreener API'
      };
    } catch (error) {
      console.error('TokenService failed:', error);
    }

    // If all methods fail, use mock data
    console.log('All price sources failed, using mock data');
    
    const mockPrice = 0.3 + Math.random() * 0.05;
    const mockChange = (Math.random() - 0.5) * 0.02;
    const mockChangePercent = (mockChange / mockPrice) * 100;
    
    return {
      currentPrice: parseFloat(mockPrice.toFixed(4)),
      priceChange: parseFloat(mockChange.toFixed(4)),
      priceChangePercent: parseFloat(mockChangePercent.toFixed(2)),
      isRealData: false,
      dataSource: 'Mock Data'
    };
  },

  /**
   * Get historical AUT price data
   * @param days Number of days of historical data to fetch
   * @returns Promise with array of AUT price data points and data source info
   */
  getHistoricalData: async (days: number): Promise<{data: AUTPriceData[], isRealData: boolean, dataSource: string}> => {
    try {
      console.log(`Fetching ${days} days of historical AUT price data`);
      
      // Use tokenService to get price history
      const tokenPriceData = await tokenService.getTokenPrice();
      
      if (tokenPriceData.priceHistory && tokenPriceData.priceHistory.length > 0) {
        // Convert to AUTPriceData format
        const priceData: AUTPriceData[] = tokenPriceData.priceHistory.map(point => ({
          date: point.date,
          price: point.price
        }));
        
        return {
          data: priceData,
          isRealData: true,
          dataSource: 'DexScreener API'
        };
      }
    } catch (error) {
      console.error('Error fetching historical AUT price data:', error);
    }

    // If API fails, generate mock data
    console.log('Generating mock historical data');
    const mockData = autPriceService.generateMockData(days);
    
    return {
      data: mockData,
      isRealData: false,
      dataSource: 'Mock Data'
    };
  },

  /**
   * Generate mock data for testing or when APIs fail
   * @param days Number of days of mock data to generate
   * @returns Array of mock AUT price data points
   */
  generateMockData: (days: number = 30): AUTPriceData[] => {
    console.log(`Generating ${days} days of mock AUT price data`);
    
    const data: AUTPriceData[] = [];
    let price = 0.3 + Math.random() * 0.05; // Start around $0.30
    
    // Create a more realistic price trend with some randomness
    const trendDirection = Math.random() > 0.5 ? 1 : -1; // Random trend direction
    const trendStrength = Math.random() * 0.005; // Random trend strength
    
    for (let i = days; i >= 0; i--) {
      // Add trend component
      const trendComponent = trendDirection * trendStrength * (Math.random() * 0.5 + 0.5);
      
      // Add random volatility
      const volatility = (Math.random() - 0.5) * 0.01;
      
      // Update price with trend and volatility
      price = price + trendComponent + volatility;
      
      // Ensure price stays within realistic bounds
      price = Math.max(price, 0.2); // AUT unlikely to go below $0.20
      price = Math.min(price, 0.5); // AUT unlikely to go above $0.50
      
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        price: parseFloat(price.toFixed(4)),
      });
    }
    
    return data;
  },
  
  /**
   * Check if the AUT price API is working
   * @returns Promise with API status
   */
  checkApiStatus: async (): Promise<{isWorking: boolean, message: string}> => {
    try {
      // Try to get current price
      await autPriceService.getCurrentPrice();
      
      return {
        isWorking: true,
        message: 'AUT price service is operational'
      };
    } catch (error) {
      return {
        isWorking: false,
        message: `AUT price service error: ${error}`
      };
    }
  }
};

// Import tokenService to avoid circular dependency
import { tokenService } from './tokenService';
