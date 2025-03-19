// Trading game types

export interface Position {
  id: string;
  timestamp: number;
  direction: "long" | "short";
  status: "open" | "closed" | "liquidated";
  result?: "profit" | "loss";
  leverage: number;
  entryPrice: number;
  liquidationPrice: number;
  size: number; // Position size in USD
  margin: number; // Collateral in AUT
  pnl?: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface TradingStats {
  profit: number;
  loss: number;
  totalProfit: number;
  totalLoss: number;
  averageLeverage: number;
  winRate: number;
}

export interface OrderParams {
  direction: "long" | "short";
  margin: number;
  leverage: number;
  orderType: "market" | "limit";
  limitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface FundingInfo {
  rate: number; // Percentage
  nextTime: Date;
  paid: number; // Total funding paid
  received: number; // Total funding received
}
