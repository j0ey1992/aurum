import axios, { AxiosError } from 'axios';

// MetalpriceAPI constants
const METALPRICE_API_URL = 'https://api.metalpriceapi.com/v1';
const METALPRICE_API_KEY = 'ad99ad8706294ff67cc90652df08c8ab';
const GOLD_SYMBOL = 'XAU';

// Maximum number of retries for API calls
const MAX_RETRIES = 3;

// Delay between retries (in ms)
const RETRY_DELAY = 1000;

// Interface for gold price data
export interface GoldPriceData {
  date: string;
  price: number;
}

// Interface for MetalpriceAPI response
export interface MetalpriceAPIResponse {
  success: boolean;
  base: string;
  timestamp: number;
  rates: {
    [key: string]: number;
  };
}

// Interface for MetalpriceAPI historical response
export interface MetalpriceAPIHistoricalResponse {
  success: boolean;
  base: string;
  timestamp: number;
  rates: {
    [key: string]: number;
  };
}

// Interface for MetalpriceAPI timeframe response
export interface MetalpriceAPITimeframeResponse {
  success: boolean;
  base: string;
  start_date: string;
  end_date: string;
  rates: {
    [date: string]: {
      [currency: string]: number;
    };
  };
}

// Interface for price result with data source information
export interface PriceResult {
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  isRealData: boolean;
  dataSource: string;
}

/**
 * Helper function to delay execution
 * @param ms Milliseconds to delay
 */
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Service for fetching gold price data from multiple sources
 */
export const goldPriceService = {
  /**
   * Get current gold price with retry logic
   * @returns Promise with current price, 24h change, 24h percentage change, and data source info
   */
  getCurrentPrice: async (): Promise<PriceResult> => {
    // Try MetalpriceAPI first
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Attempting to fetch gold price from MetalpriceAPI (attempt ${attempt}/${MAX_RETRIES})`);
        
        // Get current price
        const response = await axios.get<MetalpriceAPIResponse>(
          `${METALPRICE_API_URL}/latest`,
          { 
            params: {
              api_key: METALPRICE_API_KEY,
              base: 'USD',
              currencies: GOLD_SYMBOL
            },
            timeout: 5000 // 5 second timeout
          }
        );

        console.log('MetalpriceAPI current price response:', response.data);

        // Check if the response is valid
        if (!response.data.success || !response.data.rates || !response.data.rates[GOLD_SYMBOL]) {
          throw new Error(`Invalid response from MetalpriceAPI: ${JSON.stringify(response.data)}`);
        }

        // Get yesterday's price to calculate price change
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayFormatted = yesterday.toISOString().split('T')[0];
        
        const yesterdayResponse = await axios.get<MetalpriceAPIHistoricalResponse>(
          `${METALPRICE_API_URL}/${yesterdayFormatted}`,
          { 
            params: {
              api_key: METALPRICE_API_KEY,
              base: 'USD',
              currencies: GOLD_SYMBOL
            },
            timeout: 5000
          }
        );
        
        console.log('MetalpriceAPI yesterday price response:', yesterdayResponse.data);

        // Check if the yesterday response is valid
        if (!yesterdayResponse.data.success || !yesterdayResponse.data.rates || !yesterdayResponse.data.rates[GOLD_SYMBOL]) {
          throw new Error(`Invalid yesterday response from MetalpriceAPI: ${JSON.stringify(yesterdayResponse.data)}`);
        }
        
        // Get the USD to XAU rate (how many XAU per 1 USD)
        const currentXauRate = response.data.rates[GOLD_SYMBOL];
        const yesterdayXauRate = yesterdayResponse.data.rates[GOLD_SYMBOL];
        
        // Calculate the price of 1 XAU in USD (reciprocal of the rate)
        const currentPrice = 1 / currentXauRate;
        const yesterdayPrice = 1 / yesterdayXauRate;
        
        // Calculate price change
        const priceChange = currentPrice - yesterdayPrice;
        const priceChangePercent = (priceChange / yesterdayPrice) * 100;
        
        console.log('Successfully fetched gold price from MetalpriceAPI');
        
        return {
          currentPrice: parseFloat(currentPrice.toFixed(2)),
          priceChange: parseFloat(priceChange.toFixed(2)),
          priceChangePercent: parseFloat(priceChangePercent.toFixed(2)),
          isRealData: true,
          dataSource: 'MetalpriceAPI'
        };
      } catch (error) {
        const axiosError = error as AxiosError | Error;
        if ('response' in axiosError) {
          console.error(`MetalpriceAPI error (attempt ${attempt}/${MAX_RETRIES}):`, 
            axiosError.response?.status || axiosError.message);
          
          // Log more detailed error information
          if (axiosError.response) {
            console.error('Error response data:', axiosError.response.data);
          }
        } else {
          console.error(`MetalpriceAPI error (attempt ${attempt}/${MAX_RETRIES}):`, axiosError.message);
        }
        
        if (attempt < MAX_RETRIES) {
          console.log(`Retrying in ${RETRY_DELAY}ms...`);
          await delay(RETRY_DELAY);
        }
      }
    }

    // If MetalpriceAPI fails, use mock data
    try {
      console.log('MetalpriceAPI failed, using fallback data source');
      
      // Generate a realistic gold price around $2000
      const mockPrice = 2000 + Math.random() * 50;
      const mockChange = (Math.random() - 0.5) * 20;
      const mockChangePercent = (mockChange / mockPrice) * 100;
      
      console.log('Using mock gold price data');
      
      return {
        currentPrice: parseFloat(mockPrice.toFixed(2)),
        priceChange: parseFloat(mockChange.toFixed(2)),
        priceChangePercent: parseFloat(mockChangePercent.toFixed(2)),
        isRealData: false,
        dataSource: 'Mock Data'
      };
    } catch (error) {
      console.error('All gold price data sources failed:', error);
      
      // Return a safe fallback value if all sources fail
      return {
        currentPrice: 2000.00,
        priceChange: 0.00,
        priceChangePercent: 0.00,
        isRealData: false,
        dataSource: 'Fallback'
      };
    }
  },

  /**
   * Get historical gold price data with retry logic
   * @param days Number of days of historical data to fetch
   * @returns Promise with array of gold price data points and data source info
   */
  getHistoricalData: async (days: number): Promise<{data: GoldPriceData[], isRealData: boolean, dataSource: string}> => {
    // Try to get historical data one day at a time instead of using timeframe
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Attempting to fetch historical gold data from MetalpriceAPI (attempt ${attempt}/${MAX_RETRIES})`);
        
        const priceData: GoldPriceData[] = [];
        const today = new Date();
        
        // Make a request for each day in the range
        for (let i = 0; i < days; i++) {
          const date = new Date();
          date.setDate(today.getDate() - i);
          const formattedDate = date.toISOString().split('T')[0];
          
          console.log(`Fetching historical data for date: ${formattedDate}`);
          
          try {
            const response = await axios.get<MetalpriceAPIHistoricalResponse>(
              `${METALPRICE_API_URL}/${formattedDate}`,
              { 
                params: {
                  api_key: METALPRICE_API_KEY,
                  base: 'USD',
                  currencies: GOLD_SYMBOL
                },
                timeout: 5000
              }
            );
            
            console.log(`Historical data response for ${formattedDate}:`, response.data);
            
            // Check if the response is valid
            if (response.data.success && response.data.rates && response.data.rates[GOLD_SYMBOL]) {
              const xauRate = response.data.rates[GOLD_SYMBOL];
              // Convert from USD/XAU to XAU/USD (price of 1 oz of gold in USD)
              const goldPriceUSD = 1 / xauRate;
              
              priceData.push({
                date: formattedDate,
                price: parseFloat(goldPriceUSD.toFixed(2))
              });
            } else {
              console.error(`Invalid response for date ${formattedDate}:`, response.data);
            }
          } catch (dayError) {
            console.error(`Error fetching data for date ${formattedDate}:`, dayError);
            // Continue with the next day even if this one fails
          }
          
          // Add a small delay to avoid rate limiting
          if (i < days - 1) {
            await delay(100);
          }
        }
        
        // If we got at least some data, return it
        if (priceData.length > 0) {
          console.log(`Successfully fetched ${priceData.length} historical gold price points from MetalpriceAPI`);
          
          return {
            data: priceData,
            isRealData: true,
            dataSource: 'MetalpriceAPI'
          };
        } else {
          throw new Error('No valid historical data points were retrieved');
        }
      } catch (error) {
        const axiosError = error as AxiosError | Error;
        if ('response' in axiosError) {
          console.error(`MetalpriceAPI historical API error (attempt ${attempt}/${MAX_RETRIES}):`, 
            axiosError.response?.status || axiosError.message);
          
          // Log more detailed error information
          if (axiosError.response) {
            console.error('Error response data:', axiosError.response.data);
          }
        } else {
          console.error(`MetalpriceAPI historical API error (attempt ${attempt}/${MAX_RETRIES}):`, axiosError.message);
        }
        
        if (attempt < MAX_RETRIES) {
          console.log(`Retrying in ${RETRY_DELAY}ms...`);
          await delay(RETRY_DELAY);
        }
      }
    }

    // If MetalpriceAPI fails, use mock data
    console.log('MetalpriceAPI historical API failed, using mock data');
    const mockData = goldPriceService.generateMockData(days);
    
    return {
      data: mockData,
      isRealData: false,
      dataSource: 'Mock Data'
    };
  },

  /**
   * Generate mock data for testing or when APIs fail
   * @param days Number of days of mock data to generate
   * @returns Array of mock gold price data points
   */
  generateMockData: (days: number = 30): GoldPriceData[] => {
    console.log(`Generating ${days} days of mock gold price data`);
    
    const data: GoldPriceData[] = [];
    let price = 2000 + Math.random() * 200; // Start around $2000
    
    // Create a more realistic price trend with some randomness
    const trendDirection = Math.random() > 0.5 ? 1 : -1; // Random trend direction
    const trendStrength = Math.random() * 5; // Random trend strength
    
    for (let i = days; i >= 0; i--) {
      // Add trend component
      const trendComponent = trendDirection * trendStrength * (Math.random() * 0.5 + 0.5);
      
      // Add random volatility
      const volatility = (Math.random() - 0.5) * 30;
      
      // Update price with trend and volatility
      price = price + trendComponent + volatility;
      
      // Ensure price stays within realistic bounds
      price = Math.max(price, 1500); // Gold unlikely to go below $1500
      price = Math.min(price, 2500); // Gold unlikely to go above $2500
      
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        price: parseFloat(price.toFixed(2)),
      });
    }
    
    return data;
  },
  
  /**
   * Check if the gold price API is working
   * @returns Promise with API status
   */
  checkApiStatus: async (): Promise<{isWorking: boolean, message: string}> => {
    try {
      // Make a simple request to check if the API is working
      const response = await axios.get(
        `${METALPRICE_API_URL}/latest`,
        { 
          params: {
            api_key: METALPRICE_API_KEY,
            base: 'USD',
            currencies: GOLD_SYMBOL
          },
          timeout: 3000
        }
      );
      
      console.log('API status check response:', response.data);
      
      if (response.data.success === true) {
        return {
          isWorking: true,
          message: 'Gold price API is operational'
        };
      } else {
        return {
          isWorking: false,
          message: `API returned unsuccessful response: ${JSON.stringify(response.data)}`
        };
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      return {
        isWorking: false,
        message: axiosError.response?.status 
          ? `API error: ${axiosError.response.status} - ${axiosError.response.statusText}`
          : `API connection error: ${axiosError.message}`
      };
    }
  }
};
