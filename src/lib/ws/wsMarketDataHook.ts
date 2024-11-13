import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import type {
  WebSocketOptions,
  WebSocketState,
  MarketPriceUpdate,
  AggregatedTrade,
} from "./types";

const MARKET_DATA_URL = "https://bftev.com/market-data";
const TRADING_ACCOUNT_URL = "https://bftev.com/trading-account-data";

export const useMarketWebSocket = ({
  symbol,
  klineInterval = "15m",
  token = "5daa2e21-12ab-4c6d-bbf6-322506920001",
}: WebSocketOptions): WebSocketState => {
  const [state, setState] = useState<WebSocketState>({
    markPrice: null,
    lastPrice: null,
    errors: [],
    notifications: [],
    isConnected: false,
  });

  useEffect(() => {
    const marketDataSocket = io(MARKET_DATA_URL, {
      path: "/futures/stream",
      addTrailingSlash: false,
      transports: ["websocket"],
      query: { symbol },
    });

    const tradingAccountSocket = io(TRADING_ACCOUNT_URL, {
      path: "/futures/stream",
      addTrailingSlash: false,
      transports: ["websocket"],
      auth: { token },
    });

    marketDataSocket.on("connect", () => {
      setState((prev) => ({ ...prev, isConnected: true }));
      marketDataSocket.emit("setKlineInterval", klineInterval);
    });

    marketDataSocket.on("disconnect", () => {
      setState((prev) => ({ ...prev, isConnected: false }));
    });

    marketDataSocket.on("markPriceUpdate", (data: MarketPriceUpdate) => {
      setState((prev) => ({ ...prev, markPrice: data.p }));
    });

    marketDataSocket.on("aggTrade", (data: AggregatedTrade) => {
      setState((prev) => ({ ...prev, lastPrice: data.p }));
    });

    tradingAccountSocket.on("error", (error: string) => {
      setState((prev) => ({
        ...prev,
        errors: [...prev.errors, error],
      }));
    });

    tradingAccountSocket.on("notification", (notification: string) => {
      setState((prev) => ({
        ...prev,
        notifications: [...prev.notifications, notification],
      }));
    });

    return () => {
      marketDataSocket.disconnect();
      tradingAccountSocket.disconnect();
    };
  }, [symbol, klineInterval, token]);

  return state;
};
