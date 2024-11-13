import { Socket as ClientSocket } from "socket.io-client";

export interface MarketPriceUpdate {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  p: string; // Mark price
  i: string; // Index price
  P: string; // Estimated settlement price
  r: string; // Funding rate
  T: number; // Next funding time
}

export interface AggregatedTrade {
  e: string; // Event type
  E: number; // Event time
  s: string; // Symbol
  p: string; // Price
  q: string; // Quantity
  m: boolean; // Is buyer the market maker
  M: boolean; // Ignore
}

export interface WebSocketOptions {
  symbol: string;
  klineInterval?:
    | "1m"
    | "3m"
    | "5m"
    | "15m"
    | "30m"
    | "1h"
    | "2h"
    | "4h"
    | "6h"
    | "8h"
    | "12h"
    | "1d"
    | "3d"
    | "1w"
    | "1M";
  token?: string;
}

export interface WebSocketState {
  markPrice: string | null;
  lastPrice: string | null;
  errors: string[];
  notifications: string[];
  isConnected: boolean;
}

interface MarketDataSocketEvents {
  setKlineInterval: (interval: WebSocketOptions["klineInterval"]) => void;
  markPriceUpdate: (data: MarketPriceUpdate) => void;
  aggTrade: (data: AggregatedTrade) => void;
}

// Custom events for Trading Account Socket
interface TradingAccountSocketEvents {
  error: (error: string) => void;
  notification: (notification: string) => void;
}

// Extend the Socket type with our custom events
export interface MarketDataSocket
  extends ClientSocket<MarketDataSocketEvents> {}
export interface TradingAccountSocket
  extends ClientSocket<TradingAccountSocketEvents> {}

// Type guard to verify socket type
export function isMarketDataSocket(socket: any): socket is MarketDataSocket {
  return socket && "emit" in socket && "on" in socket;
}

export function isTradingAccountSocket(
  socket: any
): socket is TradingAccountSocket {
  return socket && "emit" in socket && "on" in socket;
}
