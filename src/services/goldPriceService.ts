import axios from 'axios';

// CoinGecko API base URL
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

// Gold ID in CoinGecko (XAU in USD)
const GOLD_ID = 'gold';

// Interface for gold price data
export interface GoldPriceData {
  date: string;
  price: number;
}

// Interface for market data
export interface MarketData {
  current_price: {
    usd: number;
  };
  price_change_24h_in_currency: {
    usd: number;
  };
  price_change_percentage_24h_in_currency: {
    usd: number;
  };
}

// Interface for gold price response
export interface GoldPriceResponse {
  market_data: MarketData;
}

/**
 * Service for fetching gold price data from CoinGecko
 */
export const goldPriceService = {
  /**
   * Get current gold price
   * @returns Promise with current price, 24h change, and 24h percentage change
   */
  getCurrentPrice: async (): Promise<{
    currentPrice: number;
    priceChange: number;
    priceChangePercent: number;
  }> => {
    try {
      const response = await axios.get<GoldPriceResponse>(
        `${COINGECKO_API_URL}/coins/${GOLD_ID}?localization=false&tickers=false&community_data=false&developer_data=false`
      );

      const { market_data } = response.data;

      return {
        currentPrice: market_data.current_price.usd,
        priceChange: market_data.price_change_24h_in_currency.usd,
        priceChangePercent: market_data.price_change_percentage_24h_in_currency.usd,
      };
    } catch (error) {
      console.error('Error fetching current gold price:', error);
      throw error;
    }
  },

  /**
   * Get historical gold price data
   * @param days Number of days of historical data to fetch
   * @returns Promise with array of gold price data points
   */
  getHistoricalData: async (days: number): Promise<GoldPriceData[]> => {
    try {
      const response = await axios.get(
        `${COINGECKO_API_URL}/coins/${GOLD_ID}/market_chart?vs_currency=usd&days=${days}`
      );

      // CoinGecko returns prices as [timestamp, price] pairs
      const priceData = response.data.prices.map((item: [number, number]) => {
        const date = new Date(item[0]);
        return {
          date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
          price: item[1],
        };
      });

      return priceData;
    } catch (error) {
      console.error('Error fetching historical gold price data:', error);
      throw error;
    }
  },

  /**
   * Fallback to generate mock data if API fails
   * @param days Number of days of mock data to generate
   * @returns Array of mock gold price data points
   */
  generateMockData: (days: number = 30): GoldPriceData[] => {
    const data: GoldPriceData[] = [];
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
  }
};
