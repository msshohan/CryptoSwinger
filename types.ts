
export type ExchangeName = 'Binance' | 'Bybit' | 'Other';
export type Market = 'Spot' | 'Futures' | 'Cross Margin' | 'Isolated Margin' | 'Options';
export type OrderType = 'Limit' | 'Market' | 'Stop-Limit' | 'Stop Market';
export type TradeAction = 'Buy' | 'Sell';
export type FeeType = 'Maker' | 'Taker' | 'Manual';

export interface Trade {
  id: string;
  action: TradeAction;
  price: number;
  amount: number;
  total: number;
  fee: number;
  feeRate: number;
  feeType: FeeType;
  timestamp: Date;
  leverage?: number;
  orderType: OrderType;
}

export interface Position {
  id:string;
  pair: string;
  exchange: ExchangeName;
  market: Market;
  trades: Trade[];
  notes?: string;
  savedToLedger?: boolean;
}

export interface User {
  name: string;
  email: string;
  avatarUrl?: string;
}