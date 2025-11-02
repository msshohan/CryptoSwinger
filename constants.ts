
import { ExchangeName, Market, OrderType } from './types';

export const EXCHANGES: ExchangeName[] = ['Binance', 'Bybit', 'Other'];
export const MARKETS: Market[] = ['Spot', 'Futures', 'Cross Margin', 'Isolated Margin', 'Options'];
// Fix: The OrderType was not imported. It is now imported from './types'.
export const ORDER_TYPES: OrderType[] = ['Limit', 'Market', 'Stop-Limit', 'Stop Market'];

interface FeeStructure {
  maker: number;
  taker: number;
}

export const FEES: Record<ExchangeName, Partial<Record<Market, FeeStructure>>> = {
  Binance: {
    Spot: { maker: 0.001, taker: 0.001 },
    Futures: { maker: 0.0002, taker: 0.0005 },
    'Cross Margin': { maker: 0.001, taker: 0.001 },
    'Isolated Margin': { maker: 0.001, taker: 0.001 },
    Options: { maker: 0.0002, taker: 0.0002 },
  },
  Bybit: {
    Spot: { maker: 0.001, taker: 0.001 },
    Futures: { maker: 0.0001, taker: 0.0006 },
    Options: { maker: 0.0002, taker: 0.0005 },
  },
  Other: {},
};
