var window = globalThis;
import { USDMClient, WebsocketClient } from "binance";
import type { FuturesPosition, SymbolPrice, FuturesExchangeInfo } from "binance"

export interface FuturesAccountPositionExtended extends FuturesPosition {
  marginNotional: string;
  pnlNotational: string;
  pnlPercent: string;
  entryPriceFloat: number,
  leverageInt: number,
  liquidationPriceFloat: number,
  markPriceFloat: number,
  notionalFloat: number,
  maxNotionalValueFloat: number,
  positionAmtFloat: number,
  unrealizedProfitFloat: number,
  pricePrecision: number,
  quantityPrecision: number,
  marginFloat: number,
  quoteAsset: string,
  baseAsset: string,
  maintenanceMarginFloat: number
  tpOrder?:any;
  slOrder?:any;
}

const notationalFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const baseObj = {
  entryPriceFloat: 0,
  liquidationPriceFloat: 0,
  markPriceFloat: 0,
  notionalFloat: 0,
  maxNotionalValueFloat: 0,
  positionAmtFloat: 0,
  unrealizedProfitFloat: 0,
  marginFloat: 0,
  maintenanceMarginFloat: 0,
  leverageInt: 0,
  marginNotional: '',
  pnlPercent: '',
  pnlNotational: '',
  pricePrecision: 0,
  quantityPrecision: 0,
  quoteAsset: '',
  baseAsset: ''
}

class PositionWorker {
  wsClient: WebsocketClient;
  restClient: USDMClient;
  symbol: string;
  pair: [string, string];
  exchangeInfo: FuturesExchangeInfo;
  positions: FuturesAccountPositionExtended[];
  prices: Map<string, number>;
  userSymbols: Set<string>;
  subscriptions = new Map<string, Set<WebSocket>>;
  symbolInfo = new Map<string, any>();
  hideOtherSymbols = false;
  symbolUpdaters = new Map<string, NodeJS.Timer>();
  positionUpdater: NodeJS.Timer;

  constructor(symbol: string, usdmClientOptions: any, wsClientOptions: any, exchangeInfo: FuturesExchangeInfo, hideOthers: boolean) {
    this.symbol = symbol;
    this.restClient = new USDMClient(usdmClientOptions);
    this.wsClient = new WebsocketClient(wsClientOptions);
    this.exchangeInfo = exchangeInfo;
    this.hideOtherSymbols = hideOthers;
    this.init(symbol);
  }

  async init(symbol) {
    const promises = [
      this.restClient.getPositions(),
      this.restClient.getSymbolPriceTicker()
    ];
    const [positions, ticker] = await Promise.all(promises);
    for(const symbol of this.exchangeInfo.symbols) {
      this.symbolInfo.set(symbol.symbol, symbol)
    }
    this.pair = this.getPairFromSymbol(symbol);
    this.prices = new Map(Array.from((ticker as SymbolPrice[]).values(), (item) => [item.symbol, parseFloat(item.price.toString())]));
    this.next(positions);

    this.positionUpdater = setInterval(() => {
      if(this.hideOtherSymbols) {
        this.restClient.getPositions({ symbol }).then(positions => {
          this.next(positions);
        });
      } else {
        this.restClient.getPositions().then(positions => {
          this.next(positions);
        });
      }
    }, 1000)

    //this.wsClient.subscribeUsdFuturesUserDataStream();
    this.wsClient.on('formattedMessage', (data: any) => {
      switch(data.eventType) {
        case 'ACCOUNT_UPDATE': {
          if(data.updateData?.updatedPositions) {
            const currentPositions = this.positions;
            for(const positionUpdate of data.updateData.updatedPositions) {
              const position = currentPositions.find(position => position.symbol === positionUpdate.symbol);
              if(position) {
                position.positionAmt = positionUpdate.positionAmount?.toFixed(position.quantityPrecision);
                position.positionAmtFloat = positionUpdate.positionAmount;
                if(positionUpdate.entryPrice) {
                  position.entryPrice = notationalFormatter.format(positionUpdate.entryPrice?.toString());
                  position.entryPriceFloat = positionUpdate.entryPrice;
                }
              }
            }
            this.next(currentPositions);
          }
          break;
        }
        case 'kline': {
          this.prices.set(data.symbol, data.kline.close);
          if(this.userSymbols.has(data.symbol)) {
            this.next(this.positions);
          }
          break;
        }
        case 'markPriceUpdate': {
          const position = this.positions.find(position => position.symbol === data.symbol);
          if(position) {
            position.markPrice = data.markPrice?.toString();
            position.markPriceFloat = data.markPrice.toFixed(2);
          }
          this.next(this.positions);
          break;
        }
      }
    });
  }

  next(positions) {
    this.positions = this.transformPositions(positions);
    const holdingPositions = this.positions.filter(position => position.positionAmtFloat !== 0);
    this.userSymbols = new Set(Array.from(holdingPositions.values(), (item) => item.symbol));
    for(const { symbol } of holdingPositions) {
      if(!this.subscriptions.has(symbol)) {
        this.subscriptions.set(symbol, new Set([this.wsClient.subscribeKlines(symbol, '1m', 'usdm'), this.wsClient.subscribeMarkPrice(symbol, 'usdm')]));
      }
    }
    for(const [symbol, subscriptions] of this.subscriptions.entries()) {
      if(!this.userSymbols.has(symbol)) {
        subscriptions.forEach(sub => {
          this.wsClient.closeWs(sub, false);
        });
        this.subscriptions.delete(symbol);
      }
    }
    postMessage({ action: 'positions', data: holdingPositions });
  }

  transformPositions(positions: FuturesPosition[]): FuturesAccountPositionExtended[] {
    const positionsExtended: FuturesAccountPositionExtended[] = [];
    for(const position of positions) {
      if(!position) continue;
      const symbolData = this.symbolInfo.get(position.symbol);
      if(!symbolData) {
        //console.info("no symbol data for", position.symbol);
        continue;
      }
      const formatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: symbolData.pricePrecision, maximumFractionDigits: symbolData.pricePrecision });
      
      const pos = Object.assign(position, baseObj);
      pos.markPriceFloat = parseFloat(position.markPrice.toString().replace(/,/g, ''));
      pos.entryPriceFloat = parseFloat(position.entryPrice.toString().replace(/,/g, ''));
      pos.positionAmtFloat = parseFloat(position.positionAmt.toString().replace(/,/g, ''));
      pos.liquidationPriceFloat = parseFloat(position.liquidationPrice.toString().replace(/,/g, ''));
      pos.notionalFloat = parseFloat(position.notional.toString().replace(/,/g, ''));
      pos.maxNotionalValueFloat = parseFloat(position.maxNotionalValue.toString().replace(/,/g, ''));
      pos.leverageInt = parseInt(position.leverage.toString());
      pos.unrealizedProfitFloat = (this.prices.get(position.symbol) - pos.entryPriceFloat) * pos.positionAmtFloat;
      pos.marginFloat = Math.abs(pos.markPriceFloat * pos.positionAmtFloat / pos.leverageInt);
      pos.marginNotional = notationalFormatter.format(pos.marginFloat) + ' ' + symbolData.quoteAsset;
      pos.pnlPercent = (pos.unrealizedProfitFloat / pos.marginFloat * 100).toFixed(2) + '%';
      pos.entryPrice = formatter.format(pos.entryPriceFloat);
      pos.markPrice = formatter.format(pos.markPriceFloat);
      pos.liquidationPrice = formatter.format(pos.liquidationPriceFloat);
      pos.pnlNotational = (pos.unrealizedProfitFloat > 0 ? '+' : '') + notationalFormatter.format(pos.unrealizedProfitFloat) + ' ' + symbolData.quoteAsset;
      pos.pricePrecision = symbolData.pricePrecision;
      pos.quantityPrecision = symbolData.quantityPrecision;
      pos.quoteAsset = symbolData.quoteAsset;
      pos.baseAsset = symbolData.baseAsset;
      pos.maintenanceMarginFloat = 0;
      positionsExtended.push(pos);
    }
    return positionsExtended;
  }

  getPairFromSymbol(symbol: string): [string, string] {
    const pair = this.exchangeInfo.symbols.find(pair => pair.symbol === symbol);
    if(pair) return [pair.baseAsset, pair.quoteAsset];
    return ["",""];
  }

  setHideOtherSymbols(hideOtherSymbols: boolean) {
    this.hideOtherSymbols = hideOtherSymbols;
    clearInterval(this.positionUpdater);
    this.positionUpdater = setInterval(() => {
      if(this.hideOtherSymbols) {
        this.restClient.getPositions({ symbol: this.symbol }).then(positions => {
          this.next(positions);
        });
      } else {
        this.restClient.getPositions().then(positions => {
          this.next(positions);
        });
      }
    }, 1000)
  }

}

let PositionWorkerInstance: PositionWorker;

globalThis.onmessage = (e) => {
  if(e.data?.action === 'init') {
    PositionWorkerInstance = new PositionWorker(e.data.symbol, e.data.usdmClientOptions, e.data.wsClientOptions, e.data.exchangeInfo, e.data.hideOthers);
  }
  if(e.data?.action === 'setHideOtherSymbols') {
    PositionWorkerInstance.setHideOtherSymbols(e.data.value)
  }
};
