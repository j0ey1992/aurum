import { ethers } from 'ethers';
import Web3 from 'web3';

// AUT Token contract address on Cronos Chain
export const AUT_TOKEN_ADDRESS = '0xD896aA25da8e3832d68d1C05fEE9C851d42F1dC1';

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

/**
 * Service for interacting with the AUT token and betting contract
 */
export const tokenService = {
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
    try {
      console.log('TokenService - Getting balance for address:', address);
      console.log('TokenService - Using token address:', AUT_TOKEN_ADDRESS);
      
      // Try using direct RPC call first
      try {
        console.log('TokenService - Attempting direct RPC call...');
        
        // Function signature for balanceOf(address)
        const functionSignature = '0x70a08231';
        
        // Pad address to 32 bytes (remove 0x prefix, pad with zeros, add 0x prefix back)
        const paddedAddress = '0x' + address.slice(2).padStart(64, '0');
        
        // Create the data for the eth_call
        const data = functionSignature + paddedAddress.slice(2);
        
        // Make the eth_call
        const result = await provider.call({
          to: AUT_TOKEN_ADDRESS,
          data: data
        });
        
        console.log('TokenService - RPC call result:', result);
        
        if (result && result !== '0x') {
          // Convert the hex result to a decimal
          const balanceHex = result.startsWith('0x') ? result : '0x' + result;
          const balanceWei = BigInt(balanceHex);
          console.log('TokenService - Raw balance (wei):', balanceWei.toString());
          
          // Assume 18 decimals for now (most ERC20 tokens use 18)
          const decimals = 18;
          
          // Format the balance
          const formattedBalance = ethers.formatUnits(balanceWei, decimals);
          console.log('TokenService - Formatted balance:', formattedBalance);
          
          // Return a non-zero balance or "0" if it's zero
          return formattedBalance === '0.0' ? '0' : formattedBalance;
        }
      } catch (rpcError) {
        console.error('TokenService - Direct RPC call failed:', rpcError);
      }
      
      // Fallback to contract method if direct RPC call fails
      console.log('TokenService - Falling back to contract method...');
      
      // Get the chain ID from the provider
      const network = await provider.getNetwork();
      console.log('TokenService - Network:', network);
      
      const contract = new ethers.Contract(
        AUT_TOKEN_ADDRESS,
        ERC20_ABI,
        provider
      );
      
      console.log('TokenService - Contract created, getting decimals...');
      const decimals = await contract.decimals();
      console.log('TokenService - Token decimals:', decimals);
      
      console.log('TokenService - Getting balance...');
      const balance = await contract.balanceOf(address);
      console.log('TokenService - Raw balance:', balance.toString());
      
      // Format balance with proper decimals
      const formattedBalance = ethers.formatUnits(balance, decimals);
      console.log('TokenService - Formatted balance:', formattedBalance);
      
      return formattedBalance;
    } catch (error) {
      console.error('Error getting token balance:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // For testing purposes, return a mock balance
      // Remove this in production
      console.log('TokenService - Returning mock balance for testing');
      return '100.0';
    }
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
      const contract = new ethers.Contract(
        AUT_TOKEN_ADDRESS,
        ERC20_ABI,
        signer
      );
      
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
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        BETTING_CONTRACT_ADDRESS,
        BETTING_CONTRACT_ABI,
        signer
      );
      
      const tokenContract = new ethers.Contract(
        AUT_TOKEN_ADDRESS,
        ERC20_ABI,
        signer
      );
      
      const decimals = await tokenContract.decimals();
      const amountInWei = ethers.parseUnits(amount, decimals);
      
      // First approve the betting contract to spend tokens
      await tokenService.approveSpending(provider, amount);
      
      // Then place the bet
      const tx = await contract.placeBet(direction, amountInWei, timeframeSeconds);
      const receipt = await tx.wait();
      
      // In a real implementation, we would extract the betId from the event logs
      // For now, we'll just return a mock ID
      return Date.now();
    } catch (error) {
      console.error('Error placing bet:', error);
      throw error;
    }
  },

  /**
   * Get leaderboard data
   * @param provider Ethers provider
   * @returns Promise with leaderboard entries
   */
  getLeaderboard: async (
    provider: ethers.BrowserProvider
  ): Promise<LeaderboardEntry[]> => {
    try {
      // In a real implementation, this would call the contract's getLeaderboard function
      // For now, we'll return mock data
      return [
        {
          address: '0x1234...5678',
          totalWinnings: '1250.45',
          totalBets: 15,
          winCount: 9,
          winRate: 60,
        },
        {
          address: '0xabcd...ef01',
          totalWinnings: '987.30',
          totalBets: 12,
          winCount: 7,
          winRate: 58.33,
        },
        {
          address: '0x2468...1357',
          totalWinnings: '756.20',
          totalBets: 10,
          winCount: 6,
          winRate: 60,
        },
      ];
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  },

  /**
   * Mock function to simulate bet resolution
   * This would be handled by the contract in production
   * @param betId Bet ID
   * @param direction Predicted direction
   * @param finalPrice Final price at the end of the timeframe
   * @param initialPrice Initial price at the time of the bet
   * @returns Object with result and payout
   */
  resolveBet: (
    betId: number,
    direction: boolean,
    finalPrice: number,
    initialPrice: number
  ): { result: 'correct' | 'incorrect'; payout: number } => {
    const priceWentUp = finalPrice > initialPrice;
    const isCorrect = (direction && priceWentUp) || (!direction && !priceWentUp);
    
    return {
      result: isCorrect ? 'correct' : 'incorrect',
      payout: isCorrect ? 1.9 : 0, // 90% profit if correct, 100% loss if incorrect
    };
  },
};
