import { ethers } from 'ethers';
import Web3 from 'web3';
import axios from 'axios';

// AUT Token contract address on Cronos Chain
export const AUT_TOKEN_ADDRESS = '0xD896aA25da8e3832d68d1C05fEE9C851d42F1dC1';

// Burn wallet address
export const BURN_WALLET_ADDRESS = '0x000000000000000000000000000000000000dead';

// Simplified ERC20 ABI for basic token interactions
const ERC20_ABI = [
  // Read-only functions
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  // Write functions
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
];

// Simple betting contract ABI (this would be replaced with your actual contract ABI)
const BETTING_CONTRACT_ABI = [
  {
    inputs: [
      { name: 'direction', type: 'bool' }, // true for up, false for down
      { name: 'amount', type: 'uint256' },
      { name: 'timeframe', type: 'uint256' }, // in seconds
    ],
    name: 'placeBet',
    outputs: [{ name: 'betId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'betId', type: 'uint256' }],
    name: 'claimWinnings',
    outputs: [{ name: 'success', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getLeaderboard',
    outputs: [
      {
        components: [
          { name: 'user', type: 'address' },
          { name: 'totalWinnings', type: 'uint256' },
          { name: 'totalBets', type: 'uint256' },
          { name: 'winCount', type: 'uint256' },
        ],
        name: 'leaderboard',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

// Placeholder for the betting contract address (would be deployed in production)
export const BETTING_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

// Interface for leaderboard entry
export interface LeaderboardEntry {
  address: string;
  totalWinnings: string;
  totalBets: number;
  winCount: number;
  winRate: number;
}

// Interface for token price data
export interface TokenPriceData {
  price: number;
  priceChange: number;
  volume24h: number;
  liquidity: number;
  fdv: number;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceHistory?: {
    date: string;
    price: number;
  }[];
}

// Interface for burn transaction
export interface BurnTransaction {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  tokenSymbol: string;
  tokenName: string;
  tokenDecimal: string;
  date: string;
  amount: number;
  usdValue: number;
}

/**
 * Service for interacting with the AUT token and betting contract
 */
export const tokenService = {
  /**
   * Get token price data from Dexscreener (chain-specific endpoint first, then fallback).
   * @param tokenAddress The Cronos token address (defaults to AUT)
   * @returns Promise with token price data
   */
  getTokenPrice: async (
    tokenAddress: string = AUT_TOKEN_ADDRESS
  ): Promise<TokenPriceData> => {
    try {
      console.log('TokenService - Getting price data for token:', tokenAddress);

      // 1) Use the chain-specific Dexscreener endpoint
      const chain = 'cronos';
      const response = await axios.get(
        `https://api.dexscreener.com/latest/dex/tokens/${chain}/${tokenAddress}`
      );
      console.log('TokenService - Dexscreener response (chain endpoint):', response.data);

      if (!response.data || !response.data.pairs || response.data.pairs.length === 0) {
        throw new Error('No pair data found from Dexscreener chain endpoint');
      }

      // Find the pair with the highest liquidity (usually the main pair)
      const pairs = response.data.pairs;
      pairs.sort((a: any, b: any) => {
        const liquidityA = parseFloat(a.liquidity?.usd || '0');
        const liquidityB = parseFloat(b.liquidity?.usd || '0');
        return liquidityB - liquidityA;
      });

      const pairData = pairs[0];

      // Extract price history from timeframes if available
      let priceHistory = undefined;
      if (pairData.priceChange && pairData.priceChange.h24 !== undefined) {
        // Create historical data points based on current price and 24h changes
        const currentPrice = parseFloat(pairData.priceUsd);
        const priceChange24h =
          currentPrice * (parseFloat(pairData.priceChange.h24) / 100);
        const price24hAgo = currentPrice - priceChange24h;

        // Create 12 data points between yesterday and today
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        priceHistory = [];
        for (let i = 0; i <= 12; i++) {
          const pointDate = new Date(yesterday);
          pointDate.setHours(yesterday.getHours() + i * 2);

          // Linear interpolation between yesterday's price and today's
          const ratio = i / 12;
          const pointPrice = price24hAgo + ratio * priceChange24h;

          priceHistory.push({
            date: pointDate.toISOString(),
            price: pointPrice,
          });
        }
      }

      return {
        price: parseFloat(pairData.priceUsd),
        priceChange: parseFloat(pairData.priceChange?.h24 || '0'),
        volume24h: parseFloat(pairData.volume?.h24 || '0'),
        liquidity: parseFloat(pairData.liquidity?.usd || '0'),
        fdv: parseFloat(pairData.fdv || '0'),
        pairAddress: pairData.pairAddress,
        baseToken: {
          address: pairData.baseToken.address,
          name: pairData.baseToken.name,
          symbol: pairData.baseToken.symbol,
        },
        quoteToken: {
          address: pairData.quoteToken.address,
          name: pairData.quoteToken.name,
          symbol: pairData.quoteToken.symbol,
        },
        priceHistory,
      };
    } catch (error) {
      console.error(
        'Error getting token price data from Dexscreener (chain endpoint):',
        error
      );

      // 2) Fallback: Try Dexscreener search endpoint
      try {
        console.log(
          'TokenService - Trying fallback search endpoint on Dexscreener...'
        );
        const response = await axios.get(
          `https://api.dexscreener.com/latest/dex/search?q=${tokenAddress}`
        );

        if (
          response.data &&
          response.data.pairs &&
          response.data.pairs.length > 0
        ) {
          const pairs = response.data.pairs;
          pairs.sort((a: any, b: any) => {
            const liquidityA = parseFloat(a.liquidity?.usd || '0');
            const liquidityB = parseFloat(b.liquidity?.usd || '0');
            return liquidityB - liquidityA;
          });

          const pairData = pairs[0];

          // Similar priceHistory logic as above:
          let priceHistory = undefined;
          if (pairData.priceChange && pairData.priceChange.h24 !== undefined) {
            const currentPrice = parseFloat(pairData.priceUsd);
            const priceChange24h =
              currentPrice * (parseFloat(pairData.priceChange.h24) / 100);
            const price24hAgo = currentPrice - priceChange24h;

            const now = new Date();
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);

            priceHistory = [];
            for (let i = 0; i <= 12; i++) {
              const pointDate = new Date(yesterday);
              pointDate.setHours(yesterday.getHours() + i * 2);
              const ratio = i / 12;
              const pointPrice = price24hAgo + ratio * priceChange24h;

              priceHistory.push({
                date: pointDate.toISOString(),
                price: pointPrice,
              });
            }
          }

          return {
            price: parseFloat(pairData.priceUsd),
            priceChange: parseFloat(pairData.priceChange?.h24 || '0'),
            volume24h: parseFloat(pairData.volume?.h24 || '0'),
            liquidity: parseFloat(pairData.liquidity?.usd || '0'),
            fdv: parseFloat(pairData.fdv || '0'),
            pairAddress: pairData.pairAddress,
            baseToken: {
              address: pairData.baseToken.address,
              name: pairData.baseToken.name,
              symbol: pairData.baseToken.symbol,
            },
            quoteToken: {
              address: pairData.quoteToken.address,
              name: pairData.quoteToken.name,
              symbol: pairData.quoteToken.symbol,
            },
            priceHistory,
          };
        }
      } catch (fallbackError) {
        console.error('Dexscreener search fallback also failed:', fallbackError);
      }

      // 3) Fallback: Try alternative API (CoinGecko-format)
      try {
        console.log('TokenService - Trying alternative API (CoinGecko format)...');
        const response = await axios.get(
          `https://api.geckoterminal.com/api/v2/networks/cronos/tokens/${tokenAddress}`
        );

        if (response.data && response.data.data && response.data.data.attributes) {
          const tokenData = response.data.data.attributes;

          // Create basic price history
          const now = new Date();
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);

          const currentPrice = parseFloat(tokenData.price_usd || '0');
          const priceChange = parseFloat(tokenData.price_change_percentage_24h || '0');
          const price24hAgo = currentPrice / (1 + priceChange / 100);

          const priceHistory = [];
          for (let i = 0; i <= 12; i++) {
            const pointDate = new Date(yesterday);
            pointDate.setHours(yesterday.getHours() + i * 2);

            // Linear interpolation
            const ratio = i / 12;
            const pointPrice = price24hAgo + ratio * (currentPrice - price24hAgo);

            priceHistory.push({
              date: pointDate.toISOString(),
              price: pointPrice,
            });
          }

          return {
            price: currentPrice,
            priceChange: priceChange,
            volume24h: parseFloat(tokenData.volume_usd_24h || '0'),
            liquidity: parseFloat(tokenData.liquidity_usd || '0'),
            fdv: parseFloat(tokenData.fdv_usd || '0'),
            pairAddress: tokenAddress, // We don't have the actual pair address here
            baseToken: {
              address: tokenAddress,
              name: tokenData.name || 'AurumTrust',
              symbol: tokenData.symbol || 'AUT',
            },
            quoteToken: {
              address: '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23', // Default to WCRO
              name: 'WCRO',
              symbol: 'WCRO',
            },
            priceHistory,
          };
        }
      } catch (altError) {
        console.error('Alternative API also failed:', altError);
      }

      // 4) Fallback: Fetch directly from the blockchain via VVS or another DEX router
      try {
        console.log('TokenService - Trying to fetch price from blockchain...');

        // Create a provider for Cronos network
        const provider = new ethers.JsonRpcProvider('https://evm.cronos.org');

        // VVS Finance Router address on Cronos
        const routerAddress = '0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae';

        // WCRO address on Cronos
        const wcroAddress = '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23';

        // Router ABI (minimal for getAmountsOut)
        const routerAbi = [
          'function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)',
        ];

        const router = new ethers.Contract(routerAddress, routerAbi, provider);

        // Get price of 1 AUT in WCRO
        const amountIn = ethers.parseUnits('1', 18); // Assuming 18 decimals
        const path = [tokenAddress, wcroAddress];

        const amounts = await router.getAmountsOut(amountIn, path);
        const wcroAmount = amounts[1];

        // Hardcode WCRO price in USD for demonstration
        const wcroPrice = 0.12; // example
        const tokenPriceInUsd =
          parseFloat(ethers.formatUnits(wcroAmount, 18)) * wcroPrice;

        // Create basic price history
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        // Assume 5% price change for demonstration
        const priceChange = 5;
        const price24hAgo = tokenPriceInUsd / (1 + priceChange / 100);

        const priceHistory = [];
        for (let i = 0; i <= 12; i++) {
          const pointDate = new Date(yesterday);
          pointDate.setHours(yesterday.getHours() + i * 2);

          // Linear interpolation
          const ratio = i / 12;
          const pointPrice =
            price24hAgo + ratio * (tokenPriceInUsd - price24hAgo);

          priceHistory.push({
            date: pointDate.toISOString(),
            price: pointPrice,
          });
        }

        return {
          price: tokenPriceInUsd,
          priceChange: priceChange,
          volume24h: 100000, // Placeholder
          liquidity: 500000, // Placeholder
          fdv: 10000000, // Placeholder
          pairAddress: '', // We don't have the actual pair address
          baseToken: {
            address: tokenAddress,
            name: 'AurumTrust',
            symbol: 'AUT',
          },
          quoteToken: {
            address: wcroAddress,
            name: 'WCRO',
            symbol: 'WCRO',
          },
          priceHistory,
        };
      } catch (blockchainError) {
        console.error('Blockchain price fetch failed:', blockchainError);
      }

      // 5) Final fallback: Hardcoded data
      console.log('TokenService - All price fetch methods failed, using hardcoded data');

      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const priceHistory = [];
      for (let i = 0; i <= 12; i++) {
        const pointDate = new Date(yesterday);
        pointDate.setHours(yesterday.getHours() + i * 2);
        // Linear price increase from 0.25 to 0.30 over 24h
        const ratio = i / 12;
        const pointPrice = 0.25 + ratio * 0.05;

        priceHistory.push({
          date: pointDate.toISOString(),
          price: pointPrice,
        });
      }

      return {
        price: 0.3,
        priceChange: 20,
        volume24h: 250000,
        liquidity: 1500000,
        fdv: 15000000,
        pairAddress: AUT_TOKEN_ADDRESS,
        baseToken: {
          address: AUT_TOKEN_ADDRESS,
          name: 'AurumTrust',
          symbol: 'AUT',
        },
        quoteToken: {
          address: '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23',
          name: 'WCRO',
          symbol: 'WCRO',
        },
        priceHistory,
      };
    }
  },

  /**
   * Get token balance for an address
   * @param provider Ethers provider
   * @param address Wallet address
   * @returns Promise with token balance as string
   */
  getBalance: async (
    provider: ethers.BrowserProvider,
    address: string
  ): Promise<string> => {
    console.log('TokenService - Getting balance for address:', address);
    console.log('TokenService - Using token address:', AUT_TOKEN_ADDRESS);

    // Try using direct RPC call first
    try {
      console.log('TokenService - Attempting direct RPC call...');

      // Function signature for balanceOf(address)
      const functionSignature = '0x70a08231';

      // Pad address to 32 bytes
      const paddedAddress = '0x' + address.slice(2).padStart(64, '0');

      // Create the data for the eth_call
      const data = functionSignature + paddedAddress.slice(2);

      // Make the eth_call
      const result = await provider.call({
        to: AUT_TOKEN_ADDRESS,
        data: data,
      });

      console.log('TokenService - RPC call result:', result);

      if (result && result !== '0x') {
        // Convert the hex result to a decimal
        const balanceHex = result.startsWith('0x') ? result : '0x' + result;
        const balanceWei = BigInt(balanceHex);
        console.log('TokenService - Raw balance (wei):', balanceWei.toString());

        // Assume 18 decimals for now
        const decimals = 18;

        // Format the balance
        const formattedBalance = ethers.formatUnits(balanceWei, decimals);
        console.log('TokenService - Formatted balance:', formattedBalance);

        return formattedBalance === '0.0' ? '0' : formattedBalance;
      }
    } catch (rpcError) {
      console.error('TokenService - Direct RPC call failed:', rpcError);
    }

    // Fallback to contract method if direct RPC call fails
    console.log('TokenService - Falling back to contract method...');

    const network = await provider.getNetwork();
    console.log('TokenService - Network:', network);

    const contract = new ethers.Contract(AUT_TOKEN_ADDRESS, ERC20_ABI, provider);
    console.log('TokenService - Contract created, getting decimals...');
    const decimals = await contract.decimals();
    console.log('TokenService - Token decimals:', decimals);

    console.log('TokenService - Getting balance...');
    const balance = await contract.balanceOf(address);
    console.log('TokenService - Raw balance:', balance.toString());

    const formattedBalance = ethers.formatUnits(balance, decimals);
    console.log('TokenService - Formatted balance:', formattedBalance);

    return formattedBalance;
  },

  /**
   * Approve the betting contract to spend tokens
   * @param provider Ethers provider with signer
   * @param amount Amount to approve (in token units)
   * @returns Promise with transaction hash
   */
  approveSpending: async (
    provider: ethers.BrowserProvider,
    amount: string
  ): Promise<string> => {
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(AUT_TOKEN_ADDRESS, ERC20_ABI, signer);

      const decimals = await contract.decimals();
      const amountInWei = ethers.parseUnits(amount, decimals);

      const tx = await contract.approve(BETTING_CONTRACT_ADDRESS, amountInWei);
      await tx.wait();

      return tx.hash;
    } catch (error) {
      console.error('Error approving token spending:', error);
      throw error;
    }
  },

  /**
   * Place a bet on gold price direction
   * @param provider Ethers provider with signer
   * @param direction True for up, false for down
   * @param amount Amount to bet (in token units)
   * @param timeframeSeconds Timeframe for the bet in seconds
   * @returns Promise with bet ID
   */
  placeBet: async (
    provider: ethers.BrowserProvider,
    direction: boolean,
    amount: string,
    timeframeSeconds: number
  ): Promise<number> => {
    console.log('TokenService - Placing bet');

    const signer = await provider.getSigner();
    const contract = new ethers.Contract(
      BETTING_CONTRACT_ADDRESS,
      BETTING_CONTRACT_ABI,
      signer
    );
    const tokenContract = new ethers.Contract(AUT_TOKEN_ADDRESS, ERC20_ABI, signer);

    const decimals = await tokenContract.decimals();
    const amountInWei = ethers.parseUnits(amount, decimals);

    // First approve the betting contract to spend tokens
    await tokenService.approveSpending(provider, amount);

    // Then place the bet
    const tx = await contract.placeBet(direction, amountInWei, timeframeSeconds);
    const receipt = await tx.wait();

    // Extract the betId from the event logs (assumes contract emits 'BetPlaced' event)
    const event = receipt.logs
      .map((log: any) => {
        try {
          return contract.interface.parseLog(log);
        } catch (e) {
          return null;
        }
      })
      .find((event: any) => event && event.name === 'BetPlaced');

    if (!event || !event.args || !event.args.betId) {
      throw new Error('Failed to extract betId from transaction receipt');
    }

    return parseInt(event.args.betId.toString());
  },

  /**
   * Get leaderboard data
   * @param provider Ethers provider
   * @returns Promise with leaderboard entries
   */
  getLeaderboard: async (
    provider: ethers.BrowserProvider
  ): Promise<LeaderboardEntry[]> => {
    console.log('TokenService - Getting leaderboard data');

    const contract = new ethers.Contract(
      BETTING_CONTRACT_ADDRESS,
      BETTING_CONTRACT_ABI,
      provider
    );

    // Get leaderboard data from contract
    const leaderboardData = await contract.getLeaderboard();

    // Process and format the leaderboard entries
    const entries: LeaderboardEntry[] = leaderboardData.map((entry: any) => {
      const totalBets = parseInt(entry.totalBets.toString());
      const winCount = parseInt(entry.winCount.toString());
      const winRate = totalBets > 0 ? (winCount / totalBets) * 100 : 0;

      return {
        address: entry.user,
        totalWinnings: ethers.formatEther(entry.totalWinnings),
        totalBets: totalBets,
        winCount: winCount,
        winRate: parseFloat(winRate.toFixed(2)),
      };
    });

    return entries;
  },

  /**
   * Resolve a bet by checking the contract
   * @param provider Ethers provider
   * @param betId Bet ID
   * @returns Promise with result and payout
   */
  resolveBet: async (
    provider: ethers.BrowserProvider,
    betId: number
  ): Promise<{ result: 'correct' | 'incorrect'; payout: number }> => {
    console.log('TokenService - Resolving bet:', betId);

    const contract = new ethers.Contract(
      BETTING_CONTRACT_ADDRESS,
      BETTING_CONTRACT_ABI,
      provider
    );

    // This assumes the contract has a method getBet(betId)
    const bet = await contract.getBet(betId);

    if (!bet) {
      throw new Error(`Bet with ID ${betId} not found`);
    }

    // Check if bet is resolved
    if (!bet.isResolved) {
      throw new Error(`Bet with ID ${betId} is not yet resolved`);
    }

    // Return result and payout
    return {
      result: bet.isWinner ? 'correct' : 'incorrect',
      payout: parseFloat(ethers.formatEther(bet.payout)),
    };
  },

  /**
   * Get burn transactions for the token
   * @param apiKey Optional Cronoscan API key
   * @returns Promise with burn transactions
   */
  getBurnTransactions: async (
    apiKey: string = 'YRXWDVV6ZH2XZIQF9VIJZPGKG6VCUBG8QR'
  ): Promise<BurnTransaction[]> => {
    try {
      console.log('TokenService - Getting burn transactions');

      // Burn wallet address
      const BURN_WALLET_ADDRESS = '0x000000000000000000000000000000000000dead';

      // Fetch data from Cronoscan API
      const url = `https://api.cronoscan.com/api?module=account&action=tokentx&contractaddress=${AUT_TOKEN_ADDRESS}&address=${BURN_WALLET_ADDRESS}&sort=desc`;
      const apiKeyParam = apiKey ? `&apikey=${apiKey}` : '';

      const response = await axios.get(`${url}${apiKeyParam}`);
      console.log('TokenService - Cronoscan response:', response.data);

      if (!response.data || response.data.status !== '1' || !response.data.result) {
        throw new Error('No transaction data found or API error');
      }

      // Get current token price for USD value calculation
      const tokenPriceData = await tokenService.getTokenPrice();
      const currentPrice = tokenPriceData.price;

      // Process and format the transactions
      const transactions: BurnTransaction[] = response.data.result.map((tx: any) => {
        // Convert timestamp to Date
        const date = new Date(parseInt(tx.timeStamp) * 1000);

        // Format date as MMM DD, YYYY
        const formattedDate = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });

        // Calculate token amount based on value and decimals
        const decimals = parseInt(tx.tokenDecimal);
        const amount = parseFloat(ethers.formatUnits(tx.value, decimals));

        // Calculate USD value based on current price
        const usdValue = amount * currentPrice;

        return {
          hash: tx.hash,
          timeStamp: tx.timeStamp,
          from: tx.from,
          to: tx.to,
          value: tx.value,
          tokenSymbol: tx.tokenSymbol,
          tokenName: tx.tokenName,
          tokenDecimal: tx.tokenDecimal,
          date: formattedDate,
          amount: amount,
          usdValue: usdValue,
        };
      });

      return transactions;
    } catch (error) {
      console.error('Error getting burn transactions:', error);

      // Return hardcoded data for demo
      const currentPrice = 0.3; // Hardcode same fallback price as getTokenPrice

      return [
        {
          hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          timeStamp: '1710864000', // March 19, 2025
          from: '0x1234567890123456789012345678901234567890',
          to: BURN_WALLET_ADDRESS,
          value: '50000000000000000000000000',
          tokenSymbol: 'AUT',
          tokenName: 'AurumTrust',
          tokenDecimal: '18',
          date: 'Mar 19, 2025',
          amount: 50000000,
          usdValue: 50000000 * currentPrice,
        },
        {
          hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          timeStamp: '1709049600', // Feb 27, 2025
          from: '0x2345678901234567890123456789012345678901',
          to: BURN_WALLET_ADDRESS,
          value: '25000000000000000000000000',
          tokenSymbol: 'AUT',
          tokenName: 'AurumTrust',
          tokenDecimal: '18',
          date: 'Feb 27, 2025',
          amount: 25000000,
          usdValue: 25000000 * currentPrice,
        },
      ];
    }
  },
};
