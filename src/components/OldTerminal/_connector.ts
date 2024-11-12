import { atom } from "nanostores";
import { WebsocketClient, USDMClient } from "binance";
import type {
  WsMessageFuturesUserDataAccountUpdateFormatted,
  WsMessageAggTradeFormatted,
  WsMessageMarkPriceUpdateEventFormatted,
  FuturesAccountInformation,
  WsMessageFuturesUserDataAccountConfigUpdateEventFormatted,
  WsMessageFuturesUserDataTradeUpdateEventFormatted,
  WsMessagePartialBookDepthEventFormatted,
  ChangeStats24hr,
  WsMessage24hrTickerFormatted,
  RestClientOptions,
  WSClientConfigurableOptions,
  FuturesAccountAsset,
} from "binance";
import { selectedAccount } from "./trading/TradingAccountSelector";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
const backendUrl = import.meta.env.PUBLIC_BACKEND_URL;

// export const TESTNET_URL = `https://${backendUrl}/test`; //'https://testnet.binancefuture.com' / cors issues

const procotol = process.env.NODE_ENV !== "production" ? "http://" : "https://";

// What even is this conditional?
export const getBaseRestUrl = (authed: boolean) => {
  const baseUrl = `${procotol}${backendUrl}`;
  if (selectedAccount.get()?.mockTrading) {
    return `${baseUrl}/test`;
  } else {
    return authed && selectedAccount.get()?.apiKey ? baseUrl : baseUrl;
  }
};

export const getUSDMClientOptions = (authed = true): RestClientOptions => {
  const options: RestClientOptions = {
    baseUrl: getBaseRestUrl(authed),
  };

  if (authed) {
    options.api_key = selectedAccount.get()?.apiKey;
    options.api_secret = selectedAccount.get()?.apiSecret;
  }

  return options;
};

export const restClient = atom<USDMClient>(
  new USDMClient(getUSDMClientOptions(false))
);
export const authedRestClient = atom<USDMClient>(
  new USDMClient(getUSDMClientOptions(true))
);

export const refreshAuthedRestClient = () => {
  const updatedClient = new USDMClient(getUSDMClientOptions(true));
  authedRestClient.set(updatedClient);
};

//Browser does not allow sending ping/pong frames from client code
if (typeof window !== "undefined") {
  //@ts-ignore
  WebSocket.prototype.ping = function () {};
  //@ts-ignore
  WebSocket.prototype.pong = function () {};
}

export const getWsClientOptions = (
  authed = true
): WSClientConfigurableOptions => {
  const options: WSClientConfigurableOptions = {
    disableHeartbeat: true,
    beautify: true,
    restOptions: { baseUrl: getBaseRestUrl(authed) },
    wsUrl: selectedAccount.get()?.mockTrading
      ? "wss://stream.binancefuture.com"
      : "wss://fstream.binance.com",
  };
  if (authed) {
    options.api_key = selectedAccount.get()?.apiKey || "0000";
    options.api_secret = selectedAccount.get()?.apiSecret || "0000";
  }
  return options;
};

export const wsClient = atom<WebsocketClient>(
  new WebsocketClient(getWsClientOptions(false))
);
export const authedWsClient = atom<WebsocketClient>(
  new WebsocketClient(getWsClientOptions(true))
);

class TradeBuffer {
  trades: Array<any> = [];
  lastTrade: any;
  lastTrades = new Map<number, any>();
  lastEmit: number;
  interval: NodeJS.Timer;
  emitter: Function;
  constructor({
    trades,
    emitter,
    bufferInterval,
    symbol,
  }: {
    trades?: Array<any>;
    emitter: Function;
    bufferInterval: number;
    symbol: string;
  }) {
    this.emitter = emitter;
    this.trades = trades || [];
    restClient
      .get()
      .getRecentTrades({ symbol, limit: 50 })
      .then((trades) => {
        this.trades = trades.reverse().map((trade) => ({
          eventType: "aggTrade",
          eventTime: trade.time,
          tradeId: trade.id,
          symbol,
          price: parseFloat(trade.price.toString()),
          quantity: parseFloat(trade.qty.toString()),
          time: trade.time,
          maker: trade.isBuyerMaker,
        }));
        this.emit();
      });
    this.interval = setInterval(() => {
      if (this.lastTrade) {
        this.emit();
      }
    }, bufferInterval);
  }
  add(trade: any) {
    const lastTrade = structuredClone(this.lastTrade);
    const lastTradeBuffered = this.lastTrades.get(trade.price);
    if (lastTradeBuffered) {
      lastTradeBuffered.quantity += trade.quantity;
    } else {
      this.lastTrades.set(trade.price, trade);
    }
    if (!lastTrade) {
      this.lastTrade = trade;
    } else if (
      lastTrade.price === trade.price &&
      lastTrade.maker === trade.maker
    ) {
      this.lastTrade.quantity += trade.quantity;
    } else {
      this.lastTrade = trade;
    }
  }
  get() {
    return this.trades;
  }
  emit() {
    this.lastEmit = Date.now();
    if (this.lastTrade) {
      const lastTradeBuffered = this.lastTrades.get(this.lastTrade.price);
      if (lastTradeBuffered) {
        this.trades.unshift(lastTradeBuffered);
      } else {
        this.trades.unshift(this.lastTrade);
      }
    }
    this.lastTrades.clear();
    this.lastTrade = null;
    this.trades = this.trades.slice(0, 99);
    this.emitter(this.trades);
  }
}

type longRatio = {
  long: number;
  short: number;
  platformFundsAllocationPercentage: number;
};

export const currentLeverageStore = atom<number>(20);
export const currentMarginTypeStore = atom<string>("CROSSED");
export const accountDataStore = atom<FuturesAccountInformation>(null);
export const accountAssetStore = atom<FuturesAccountAsset[]>([]);
export const tradesStore = atom<any[]>([]);
export const lastPriceStore = atom<number>(0);
export const priceInfoStore =
  atom<WsMessageMarkPriceUpdateEventFormatted>(null);
export const orderBookStore = atom<any>(null);
export const markPriceStore = atom<number>(0);
export const leverageStore = atom<number>(0);
export const breakPointStore = atom<string>("lg");
export const equityStore = atom<number>(0);
export const maintenanceMarginStore = atom<number>(0);
export const longShortRatioStore = atom<longRatio>({
  long: 0,
  short: 0,
  platformFundsAllocationPercentage: 0,
});
export const riskParamViolationStore = atom<number>(0);
export const positionRiskStore = atom<any>({});

globalThis.clearStorage = () => {
  Object.keys(localStorage).forEach((key) => {
    if (key !== "binanceAccounts" && key !== "selectedAccount") {
      localStorage.removeItem(key);
    }
  });
};

type MessageTypes =
  | WsMessage24hrTickerFormatted
  | WsMessageAggTradeFormatted
  | WsMessageMarkPriceUpdateEventFormatted
  | WsMessageFuturesUserDataAccountUpdateFormatted
  | WsMessageFuturesUserDataAccountConfigUpdateEventFormatted
  | WsMessageFuturesUserDataTradeUpdateEventFormatted
  | WsMessagePartialBookDepthEventFormatted;

const updateAccountData = () => {
  authedRestClient
    .get()
    .getAccountInformation()
    .then((data) => {
      accountDataStore.set(data);
      accountAssetStore.set(data.assets);
    });
};

export const subscribeAccount = () => {
  authedWsClient.get().subscribeUsdFuturesUserDataStream();
  if (selectedAccount.get()?.apiKey) {
    setInterval(updateAccountData, 1000);
  }
  updateAccountData();
};

const handleAccountUpdate = async (
  data: WsMessageFuturesUserDataAccountUpdateFormatted
) => {
  updateAccountData();
  if (data.updateData.updatedPositions) {
    //TODO: update positions without making new request
  }
};

export const initStreams = async (symbol: string, formatterQuote, user) => {
  if (selectedAccount.get() === null && user?.hasUdubuApiAccount) {
    const backendUrl = import.meta.env.PUBLIC_BACKEND_URL;
    const wsProtocol = import.meta.env.PROD ? "wss://" : "ws://";
    const socket = io(`${wsProtocol}${backendUrl}`, {
      reconnectionDelayMax: 10000,
      withCredentials: true,
    });
    socket.on("message", (parsedData) => {
      if (parsedData?.event === "marginRatio") {
        equityStore.set(parsedData.data.equity);
        maintenanceMarginStore.set(parsedData.data.maintenanceMargin);
        longShortRatioStore.set({
          long: parsedData.data.longRatio,
          short: parsedData.data.shortRatio,
          platformFundsAllocationPercentage:
            parsedData.data.platformFundsAllocationPercentage,
        });
        accountAssetStore.set(parsedData.data.assets);
        riskParamViolationStore.set(parsedData.data.riskParamViolationDetected);
        positionRiskStore.set(parsedData.data.positionRisk);
      }
    });
  }

  const tradeBuffer = new TradeBuffer({
    trades: [],
    emitter: tradesStore.set,
    bufferInterval: 500,
    symbol,
  });
  accountDataStore.subscribe((data) => {
    if (data) {
      if (data?.positions) {
        const position = data.positions.find(
          (position) => position.symbol === symbol
        );
        if (position) {
          currentLeverageStore.set(
            parseFloat(position.leverage?.toString() || "20")
          );
          currentMarginTypeStore.set(
            position.isolated ? "ISOLATED" : "CROSSED"
          );
        }
      }
      const { totalMarginBalance, totalMaintMargin } = data;
      const marginBalanceParsed = parseFloat(totalMarginBalance.toString());
      const totalMaintMarginParsed = parseFloat(totalMaintMargin.toString());
      maintenanceMarginStore.set(totalMaintMarginParsed);
      equityStore.set(marginBalanceParsed);
    }
  });

  wsClient.get().subscribeAggregateTrades(symbol, "usdm");
  wsClient.get().subscribeMarkPrice(symbol, "usdm");
  wsClient.get().subscribeSymbol24hrTicker(symbol, "usdm"); // seems to be about 500ms update interval
  wsClient.get().on("message", (data: any) => {
    if (data.e === "ACCOUNT_CONFIG_UPDATE") {
      if (data.ac && data.ac.l && data.ac.s === symbol) {
        currentLeverageStore.set(data.ac.l);
      }
    }
  });
  wsClient.get().on("formattedMessage", (data: MessageTypes) => {
    switch (data.eventType) {
      case "24hrTicker":
        lastPriceStore.set(data.currentClose);
        break;
      case "markPriceUpdate":
        priceInfoStore.set(data);
        markPriceStore.set(data.markPrice);
        break;
      case "ACCOUNT_UPDATE": {
        handleAccountUpdate(data);
        break;
      }
      case "aggTrade": {
        tradeBuffer.add(data);
        lastPriceStore.set(data.price);
        break;
      }
      case "ORDER_TRADE_UPDATE": {
        updateAccountData();
        if (data.order.orderStatus === "NEW") {
          toast.success(`Order submitted`);
        } else if (data.order.orderStatus === "CANCELED") {
          toast.info(
            `${data.order.orderType.toLowerCase()} ${data.order.orderSide.toLowerCase()} canceled`
          );
        } else if (
          data.order.orderStatus === "FILLED" &&
          data.order.orderType !== "MARKET"
        ) {
          toast.info(
            `${data.order.orderType.toLowerCase()} ${data.order.orderSide.toLowerCase()} order filled`
          );
        }
      }
    }
  });
  lastPriceStore.subscribe((price) => {
    document.title = `${formatterQuote.format(
      price
    )} | ${symbol} | udubu futures`;
  });
  restClient
    .get()
    .get24hrChangeStatistics({ symbol })
    .then((data: unknown) => {
      //@ts-ignore
      lastPriceStore.set(
        parseFloat((data as ChangeStats24hr).lastPrice.toString())
      );
    })
    .catch();
};

/**
 *  Account info endpoint weight 5
 *  Position info endpoint weight 5
 *  OpenOrders endpoint weight 40 without symbol 1 with symbol
 *  Could use allorders and filter out open orders?
 */
