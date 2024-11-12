import { WebsocketClient } from "binance";
import Decimal from "decimal.js";
class SubscribableArray {
  subscribers = [];
  data = [];
  limit: number;
  constructor(data, limit?) {
    this.data = data;
    this.limit = limit || 100;
  }
  push(data) {
    this.data.push(data);
    if (this.limit > 1) this.data = this.data.slice(-this.limit);
    this.subscribers.forEach((subscriber) =>
      subscriber(this.data, this.data.at(-1))
    );
  }
  set(data) {
    this.data = data;
    this.subscribers.forEach((subscriber) =>
      subscriber(this.data, this.data.at(-1))
    );
  }
  get() {
    return this.data;
  }
  setLimit(limit) {
    this.limit = limit;
    this.data = [];
  }
  subscribe(subscriber) {
    this.subscribers.push(subscriber);
    return { unsubscribe: () => this.unsubscribe(subscriber) };
  }
  unsubscribe(subscriber) {
    this.subscribers = this.subscribers.filter(
      (_subscriber) => _subscriber !== subscriber
    );
  }
}

const depthUpdates = new SubscribableArray([]);

let bids = new Map();
let asks = new Map();
let pu;
export interface DepthUpdate {
  e: string;
  E: number;
  T: number;
  s: string;
  U: number;
  u: number;
  pu: number;
  b: Array<Record<string, string>>;
  a: Array<Record<string, string>>;
}

const getSnapshot = async (symbol, usdmClientOptions) => {
  const snapshot = await fetch(
    `${usdmClientOptions.baseUrl}/fapi/v1/depth?symbol=${symbol}&limit=1000`
  )
    .then((res) => res.json())
    .catch((err) => console.error(err));
  bids = new Map(snapshot.bids);
  asks = new Map(snapshot.asks);
  pu = snapshot.lastUpdateId;
};

const sync = async (symbol, usdmClientOptions) => {
  let synced = false;
  await getSnapshot(symbol, usdmClientOptions);
  const subscription = depthUpdates.subscribe(
    (updates: DepthUpdate[], data: DepthUpdate) => {
      if (!synced) {
        for (const data of updates) {
          if (data.U <= pu && data.u >= pu) {
            pu = data.u;
            synced = true;
            depthUpdates.setLimit(1);
            break;
          }
        }
      } else if (synced && data.pu === pu) {
        pu = data.u;
        data.b.forEach((bid) => {
          bid[1] === "0.000" ? bids.delete(bid[0]) : bids.set(bid[0], bid[1]);
        });
        data.a.forEach((ask) => {
          ask[1] === "0.000" ? asks.delete(ask[0]) : asks.set(ask[0], ask[1]);
        });
      } else if (synced) {
        depthUpdates.setLimit(100);
        subscription.unsubscribe();
        sync(symbol, usdmClientOptions);
      }
    }
  );
};

setInterval(() => {
  const sortedBids = Array.from(bids.entries(), ([price, quantity]) => {
    return [new Decimal(price).toNumber(), new Decimal(quantity).toNumber()];
  }).sort((a, b) => b[0] - a[0]);
  const sortedAsks = Array.from(asks.entries(), ([price, quantity]) => {
    return [new Decimal(price).toNumber(), new Decimal(quantity).toNumber()];
  }).sort((a, b) => a[0] - b[0]);

  const currentBalance = 9628.63;
  const leverage = 50;
  const availableAmount = currentBalance * leverage;
  let maxBuy = 0;
  let maxSell = 0;
  let currentPrice = 0;
  let currentAmount = 0;
  let done = false;

  for (const bid of sortedBids) {
    const [priceLevel, amount] = bid;
    const price = priceLevel * amount;
    if (!done && currentPrice + price >= availableAmount) {
      maxSell = currentAmount + (availableAmount - currentPrice) / priceLevel;
      done = true;
    }
    currentAmount += amount;
    currentPrice += price;
    bid.push(currentAmount);
  }

  currentPrice = 0;
  currentAmount = 0;
  done = false;

  for (const ask of sortedAsks) {
    const [priceLevel, amount] = ask;
    const price = priceLevel * amount;
    if (!done && currentPrice + price >= availableAmount) {
      maxSell = currentAmount + (availableAmount - currentPrice) / priceLevel;
      done = true;
    }
    currentAmount += amount;
    currentPrice += price;
    ask.push(currentAmount);
  }

  postMessage({
    maxBuy,
    maxSell,
    bids: sortedBids.slice(0, 25),
    asks: sortedAsks.slice(0, 25).reverse(),
    bidDepth: sortedBids?.length > 0 ? sortedBids.at(-1)[2] : 0,
    askDepth: sortedAsks?.length > 0 ? sortedAsks.at(-1)[2] : 0,
  });
}, 250);

export const initOrderBook = async (
  symbol: string,
  wsClientOptions: any,
  usdmClientOptions: any
) => {
  getSnapshot(symbol, usdmClientOptions);
  const wsClient = new WebsocketClient(wsClientOptions);
  wsClient.on("message", (data: any) => {
    if (data.e === "depthUpdate") {
      depthUpdates.push(data);
    }
  });
  wsClient.subscribeDiffBookDepth(symbol, 1000, "usdm");
  wsClient.on("open", () => sync(symbol, usdmClientOptions));
  wsClient.on("reconnected", () => sync(symbol, usdmClientOptions));
};

globalThis.onmessage = (e) => {
  if (e.data?.action === "init") {
    initOrderBook(
      e.data.symbol,
      e.data.wsClientOptions,
      e.data.usdmClientOptions
    );
  }
};

/*
  Open a stream to wss://fstream.binance.com/stream?streams=btcusdt@depth.
  Buffer the events you receive from the stream. For same price, latest received update covers the previous one.
  Get a depth snapshot from https://fapi.binance.com/fapi/v1/depth?symbol=BTCUSDT&limit=1000 .
  Drop any event where u is < lastUpdateId in the snapshot.
  The first processed event should have U <= lastUpdateId AND u >= lastUpdateId
  While listening to the stream, each new event's pu should be equal to the previous event's u, otherwise initialize the process from step 3.
  The data in each event is the absolute quantity for a price level.
  If the quantity is 0, remove the price level.
  Receiving an event that removes a price level that is not in your local order book can happen and is normal.
*/
