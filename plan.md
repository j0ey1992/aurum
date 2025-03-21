 # AUT Token Perpetual Trading Platform Implementation Plan

## Overview

This document outlines the implementation plan for transforming the Aurum project's simulated trading game into a real on-chain perpetual trading platform for the AUT token on Cronos Chain. The platform will allow users to take leveraged long or short positions on the AUT token price, with real profit and loss outcomes.

## Smart Contract Architecture

The platform will consist of the following core smart contracts:

1. **AUTPerpetualTrading.sol**
   - Main contract for managing the perpetual trading system
   - Handles opening/closing positions, liquidations, and funding rates
   - Interfaces with other system components

2. **PositionManager.sol**
   - Tracks all user positions
   - Calculates PnL, liquidation prices, and margin requirements
   - Manages position modifications and partial closures

3. **CollateralVault.sol**
   - Securely stores user collateral (AUT tokens)
   - Handles deposits and withdrawals
   - Manages insurance fund for system solvency

4. **PriceOracle.sol**
   - Fetches AUT token price from DEXs on Cronos Chain
   - Implements TWAP (Time-Weighted Average Price) for manipulation resistance
   - Includes fallback mechanisms for price feed failures

5. **FeeDistributor.sol**
   - Collects trading fees
   - Allocates percentage to burn mechanism
   - Distributes remaining to insurance fund and protocol revenue

## Price Feed Implementation

For reliable AUT token pricing:

1. **Primary Source**: VVS Finance AUT/WCRO pool
3. **Fallback**: Weighted average from all available DEX pools

Implementation approach:
- Use Chainlink-style aggregator pattern
- Implement TWAP over 30-minute window
- Include circuit breakers for extreme volatility

## Trading Mechanics

### Position Parameters
- **Leverage**: 1x to 10x
- **Minimum Position Size**: 100 AUT
- **Maximum Position Size**: 5% of total liquidity
- **Liquidation Threshold**: 80% of margin consumed

### Fee Structure
- **Opening Fee**: 0.1% of position size
- **Closing Fee**: 0.1% of position size
- **Liquidation Fee**: 1% of position size
- **Funding Rate**: Dynamic based on long/short imbalance (±0.01% per 8 hours)

### Fee Distribution
- **Burn Mechanism**: 40% of all fees
- **Insurance Fund**: 40% of all fees
- **Protocol Revenue**: 20% of all fees

## Frontend Modifications

### UI Component Updates

1. **TradingForm.tsx**
   - Update to interact with AUT perpetual contracts
   - Modify leverage selector for new limits
   - Add token price feed instead of gold price

2. **PositionList.tsx & PositionCard.tsx**
   - Update to display AUT-specific position data
   - Add blockchain transaction status indicators
   - Implement real-time updates via events

3. **TradingStats.tsx**
   - Add protocol-wide statistics (open interest, funding rates)
   - Display insurance fund size
   - Show burn statistics from trading fees

4. **New Components**
   - **OrderBook.tsx**: Display limit orders if implemented
   - **TradeHistory.tsx**: Show user's historical trades
   - **LiquidityInfo.tsx**: Display system liquidity information

### Service Updates

1. **tradingService.ts**
   - Refactor to interact with smart contracts
   - Implement transaction handling and confirmations
   - Add event listeners for position updates

2. **tokenService.ts**
   - Expand to support new contract interactions
   - Add methods for approving token spending for trading
   - Implement position management functions

## Implementation Roadmap

### Phase 1: Smart Contract Development (3-4 weeks)
- Fork and adapt GMX or Perpetual Protocol contracts
- Modify for AUT token specifics
- Implement price oracle for Cronos Chain DEXs
- Develop and test fee distribution system

### Phase 2: Frontend Integration (2-3 weeks)
- Update UI components to interact with contracts
- Implement transaction handling and confirmations
- Add real-time updates via contract events
- Create new components for additional functionality

### Phase 3: Testing & Security (2-3 weeks)
- Comprehensive smart contract testing
- Security audit (consider Trail of Bits or OpenZeppelin)
- Testnet deployment and community testing
- Bug bounty program

### Phase 4: Launch & Scaling (2 weeks)
- Mainnet deployment with position limits
- Liquidity mining program to bootstrap liquidity
- Marketing campaign focused on AUT token holders
- Gradual increase of position limits based on liquidity

## Technical Requirements

### Development Tools
- **Smart Contracts**: Solidity 0.8.x, Hardhat
- **Testing**: Waffle, Ethers.js
- **Frontend**: Next.js, Ethers.js, Reown AppKit

### Infrastructure
- **Blockchain**: Cronos Chain
- **Indexing**: The Graph or custom indexer
- **Monitoring**: Tenderly or similar

### External Dependencies
- **Price Feeds**: DEX subgraphs or direct contract calls
- **Wallet Connection**: Continue using Reown AppKit

## Risk Mitigation Strategies

1. **Price Manipulation Protection**
   - Implement TWAP for price feeds
   - Set position size limits relative to liquidity
   - Add circuit breakers for extreme volatility

2. **Smart Contract Security**
   - Multiple independent audits
   - Formal verification where possible
   - Timelocks for critical parameter changes

3. **Liquidity Risk**
   - Insurance fund from trading fees
   - Dynamic funding rates to balance longs/shorts
   - Partial liquidations to reduce market impact

## Governance & Upgradability

1. **Parameter Governance**
   - Timelock for parameter changes
   - Emergency pause functionality
   - Gradual parameter adjustment mechanism

2. **Contract Upgradability**
   - Proxy pattern for core contracts
   - Transparent upgrade process
   - Minimum timelock for non-emergency upgrades

## Advantages of AUT Token Perpetuals vs. Gold Perpetuals

1. **Simplified Oracle Requirements**
   - No need for external gold price oracles
   - AUT price is already available from DEXs on Cronos Chain
   - Can use existing DEX liquidity pools for price discovery

2. **Reduced Smart Contract Complexity**
   - Simpler funding rate calculations
   - Less complex liquidation mechanisms
   - No need for commodity-specific risk parameters

3. **Faster Implementation Path**
   - Could adapt existing protocols like GMX or Gains Network
   - Many open-source perpetual DEX contracts already support ERC20 tokens
   - Fewer custom components needed

4. **Technical Integration Benefits**
   - Direct integration with existing AUT token contract
   - Leverage existing wallet connections and token approvals
   - Simpler UI/UX for users already holding AUT

5. **Tokenomics Synergy**
   - Trading fees directly contribute to token burns
   - Creates additional utility for the AUT token
   - Might increase token velocity and liquidity

## Conclusion

This implementation plan provides a comprehensive roadmap for transforming the current simulated trading game into a real AUT token perpetual trading platform on Cronos Chain. The approach leverages existing protocols while customizing for AUT token specifics and integrating with the current frontend.

By focusing on AUT token perpetuals rather than gold perpetuals, we can achieve a faster implementation timeline with reduced complexity while still delivering a compelling trading experience that aligns with the project's goals.
