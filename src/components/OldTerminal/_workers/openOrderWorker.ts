var window = globalThis;
import { USDMClient, WebsocketClient } from "binance";
import type {
  OrderResult,
  WsMessageFuturesUserDataTradeUpdateEventFormatted,
  FuturesExchangeInfo,
} from "binance";

export interface OrderResultExtended extends OrderResult {
  avgPriceFloat: number;
  cumQuoteFloat: number;
  executedQtyFloat: number;
  origQtyFloat: number;
  priceFloat: number;
  stopPriceFloat: number;
  activatePriceFloat: number;
  priceRateFloat: number;
}

const baseObj = {
  avgPriceFloat: 0,
  cumQuoteFloat: 0,
  executedQtyFloat: 0,
  origQtyFloat: 0,
  priceFloat: 0,
  stopPriceFloat: 0,
  activatePriceFloat: 0,
  priceRateFloat: 0,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class OpenOrderWorker {
  restClient: USDMClient;
  wsClient: WebsocketClient;
  orders: Array<OrderResultExtended | OrderResult>;
  exchangeInfo: FuturesExchangeInfo;
  filled = new Set();

  constructor(symbol, usdmClientOptions, wsClientOptions, exchangeInfo) {
    this.restClient = new USDMClient(usdmClientOptions);
    this.wsClient = new WebsocketClient(wsClientOptions);
    this.exchangeInfo = exchangeInfo;
    this.wsClient.subscribeUsdFuturesUserDataStream();
    this.wsClient.on(
      "formattedMessage",
      async (data: WsMessageFuturesUserDataTradeUpdateEventFormatted) => {
        if (data.eventType === "ORDER_TRADE_UPDATE") {
          const {
            order: {
              orderStatus,
              clientOrderId,
              orderFilledAccumulatedQuantity,
            },
          } = data;
          if (orderStatus === "NEW") {
            await sleep(200);
            this.restClient
              .getOrder({ symbol, origClientOrderId: clientOrderId })
              .then((order) => {
                if (this.filled.has(clientOrderId)) return;
                this.orders.push(order);
                this.next(this.orders);
              });
          }
          if (["CANCELED", "FILLED"].includes(orderStatus)) {
            this.next(
              this.orders.filter(
                (order) => order.clientOrderId !== clientOrderId
              )
            );
            this.filled.add(clientOrderId);
          }
          if (orderStatus === "PARTIALLY_FILLED") {
            const order = this.orders.find(
              (order) => order.clientOrderId === clientOrderId
            );
            if (!order) return;
            order.executedQty = orderFilledAccumulatedQuantity;
            this.next(this.orders);
          }
        }
      }
    );
    this.restClient
      .getAllOpenOrders(symbol)
      .then((orders) => this.next(orders));
  }

  formatOrder(order: OrderResult | OrderResultExtended): OrderResultExtended {
    const symbolData = this.exchangeInfo.symbols.find(
      (symbolData) => symbolData.symbol === order.symbol
    );
    const {
      quotePrecision,
      pricePrecision,
      quantityPrecision,
      quoteAsset,
      baseAsset,
    } = symbolData;
    const formatterQuote = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: pricePrecision,
      maximumFractionDigits: pricePrecision,
    });
    const formatterQuantity = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: quantityPrecision,
      maximumFractionDigits: quantityPrecision,
    });

    Object.assign(order, baseObj);
    for (const key of Object.keys(order)) {
      if (key.endsWith("Float")) {
        order[key] = parseFloat(
          order[key.replace("Float", "")]?.toString().replace(/,/g, "")
        );
      }
    }
    const orderRef = order as OrderResultExtended;
    order.price = formatterQuote.format(orderRef.priceFloat);
    order.origQty =
      formatterQuantity.format(orderRef.origQtyFloat) + " " + baseAsset;
    order.executedQty =
      formatterQuantity.format(orderRef.executedQtyFloat) + " " + baseAsset;
    order.stopPrice = formatterQuote.format(orderRef.stopPriceFloat);
    return order as OrderResultExtended;
  }

  next(orders) {
    this.orders = orders.map((order) => this.formatOrder(order));
    postMessage({ action: "orders", data: this.orders });
  }
}

globalThis.onmessage = (e) => {
  if (e.data?.action === "init") {
    new OpenOrderWorker(
      e.data.symbol,
      e.data.usdmClientOptions,
      e.data.wsClientOptions,
      e.data.exchangeInfo
    );
  }
};
