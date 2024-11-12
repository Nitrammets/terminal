import {
  initStreams,
  breakPointStore,
  subscribeAccount,
  refreshAuthedRestClient,
} from "../components/OldTerminal/_connector";
import { useEffect, useState, useMemo } from "react";
import OrderBook from "../components/OldTerminal/trading/OrderBook";
import Trades from "../components/OldTerminal/trading/Trades";
import Chart from "../components/OldTerminal/trading/Chart";
import { Responsive, WidthProvider } from "react-grid-layout";
import TickerData from "../components/OldTerminal/trading/CoinInfo";
import UserInfo from "../components/OldTerminal/trading/UserInfo";
import TradeControls from "../components/OldTerminal/trading/TradeControls";
import MarginRatio from "../components/OldTerminal/trading/MarginRatio";

import { useStore } from "@nanostores/react";
import type { FuturesExchangeInfo } from "binance";
import { atom } from "nanostores";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "../components/OldTerminal/Drawer";

import { selectedAccount } from "../components/OldTerminal/trading/TradingAccountSelector";

const UIBreakpoints = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
};

export const exchangeInfo = atom<FuturesExchangeInfo>();

export default function Trade({ symbol, user }) {
  const [apiKey, setApiKey] = useState(selectedAccount.get()?.apiKey);
  const [symbolInfo, setSymbolInfo] = useState<any>(null);
  const [precisionBase, setPrecisionBase] = useState<number>(0);
  const [formatterBase, setFormatterBase] = useState<any>(null);
  const [formatterQuote, setFormatterQuote] = useState<any>(null);
  const [pair, setPair] = useState<string[]>([
    symbolInfo?.baseAsset,
    symbolInfo?.quoteAsset,
  ]);
  const [exInfo, setExInfo] = useState<FuturesExchangeInfo>(null);
  const breakPoint = useStore(breakPointStore);

  useEffect(() => {
    selectedAccount.subscribe((newValue) => setApiKey(newValue?.apiKey));
  }, []);

  useEffect(() => {
    refreshAuthedRestClient();

    fetch(
      selectedAccount.get()?.mockTrading
        ? "https://testnet.binancefuture.com/fapi/v1/exchangeInfo"
        : "https://fapi.binance.com/fapi/v1/exchangeInfo"
    )
      .then((res) => res.json())
      .then((info) => {
        if (selectedAccount.get()?.apiKey || user?.hasUdubuApiAccount) {
          subscribeAccount();
        }
        exchangeInfo.set(info);
        setExInfo(info);
        const symbolInfo = info.symbols.find((s: any) => s.symbol === symbol);

        const tickSize = symbolInfo.filters.find(
          (f: any) => f.filterType === "PRICE_FILTER"
        ).tickSize;
        const precisionQuote = parseFloat(tickSize)
          .toString()
          .split(".")[1].length;
        const precisionBase = symbolInfo.quantityPrecision;
        const formatterBase = new Intl.NumberFormat("en-US", {
          maximumFractionDigits: symbolInfo.quantityPrecision,
          minimumFractionDigits: symbolInfo.quantityPrecision,
        });
        const formatterQuote = new Intl.NumberFormat("en-US", {
          maximumFractionDigits: precisionQuote,
          minimumFractionDigits: precisionQuote,
        });
        setSymbolInfo(symbolInfo);
        setPrecisionBase(precisionBase);
        setFormatterBase(formatterBase);
        setFormatterQuote(formatterQuote);
        setPair([symbolInfo?.baseAsset, symbolInfo?.quoteAsset]);
        initStreams(symbol, formatterQuote, user);
      });
  }, [apiKey]);

  const pairInfo = (
    <TickerData
      exchangeInfo={exInfo}
      symbol={symbol}
      pair={pair}
      formatterBase={formatterBase}
      formatterQuote={formatterQuote}
    />
  );
  const chart = <Chart symbol={symbol} />;
  const orderBook = (
    <OrderBook
      formatter={formatterBase}
      formatterQuote={formatterQuote}
      pair={pair}
      symbol={symbol}
    />
  );
  const trades = (
    <Trades
      pair={pair}
      formatterBase={formatterBase}
      formatterQuote={formatterQuote}
    />
  );
  const tradeControls = (
    <TradeControls
      pair={pair}
      symbol={symbol}
      user={user}
      symbolInfo={symbolInfo}
      precisionBase={precisionBase}
    />
  );
  const userInfo = (
    <UserInfo exchangeInfo={exInfo} symbol={symbol} pair={pair} user={user} />
  );
  const marginRatio = <MarginRatio user={user} />;

  const layouts = {
    lg: [
      {
        i: "chart",
        x: 0,
        y: 2,
        w: 8,
        h: 20,
        resizeHandles: ["se"],
        component: chart,
      },
      {
        i: "orderBook",
        x: 8,
        y: 0,
        w: 2,
        h: 15,
        resizeHandles: ["se"],
        component: orderBook,
      },
      {
        i: "trades",
        x: 8,
        y: 4,
        w: 2,
        h: 7,
        resizeHandles: ["se"],
        component: trades,
      },
      {
        i: "tradeControls",
        x: 10,
        y: 0,
        w: 2,
        h: 22,
        resizeHandles: ["se"],
        component: tradeControls,
      },
      {
        i: "userInfo",
        x: 0,
        y: 24,
        w: 10,
        h: 15,
        resizeHandles: ["se"],
        component: userInfo,
      },
      {
        i: "marginRatio",
        x: 10,
        y: 24,
        w: 2,
        h: 15,
        resizeHandles: ["se"],
        component: marginRatio,
      },
      {
        i: "pairInfo",
        x: 0,
        y: 0,
        w: 8,
        h: 2,
        resizeHandles: ["se"],
        component: pairInfo,
      },
    ],
    md: [
      {
        i: "chart",
        x: 0,
        y: 2,
        w: 6,
        h: 20,
        resizeHandles: ["se"],
        component: chart,
      },
      {
        i: "orderBook",
        x: 6,
        y: 2,
        w: 2,
        h: 13,
        resizeHandles: ["se"],
        component: orderBook,
      },
      {
        i: "trades",
        x: 6,
        y: 4,
        w: 2,
        h: 7,
        resizeHandles: ["se"],
        component: trades,
      },
      {
        i: "tradeControls",
        x: 8,
        y: 2,
        w: 2,
        h: 20,
        resizeHandles: ["se"],
        component: tradeControls,
      },
      {
        i: "userInfo",
        x: 0,
        y: 24,
        w: 8,
        h: 15,
        resizeHandles: ["se"],
        component: userInfo,
      },
      {
        i: "marginRatio",
        x: 8,
        y: 24,
        w: 2,
        h: 15,
        resizeHandles: ["se"],
        component: marginRatio,
      },
      {
        i: "pairInfo",
        x: 0,
        y: 0,
        w: 10,
        h: 2,
        resizeHandles: ["se"],
        component: pairInfo,
      },
    ],
    sm: [
      {
        i: "chart",
        x: 0,
        y: 2,
        w: 4,
        h: 11,
        component: chart,
        isDraggable: false,
        isResizable: false,
      },
      {
        i: "orderBook",
        x: 2,
        y: 12,
        w: 2,
        h: 11,
        component: orderBook,
        isDraggable: false,
        isResizable: false,
      },
      {
        i: "trades",
        x: 0,
        y: 12,
        w: 2,
        h: 11,
        component: trades,
        isDraggable: false,
        isResizable: false,
      },
      {
        i: "tradeControls",
        x: 4,
        y: 0,
        w: 2,
        h: 22,
        component: tradeControls,
        isDraggable: false,
        isResizable: false,
      },
      {
        i: "userInfo",
        x: 0,
        y: 24,
        w: 4,
        h: 15,
        component: userInfo,
        isDraggable: false,
        isResizable: false,
      },
      {
        i: "marginRatio",
        x: 4,
        y: 24,
        w: 2,
        h: 15,
        component: marginRatio,
        isDraggable: false,
        isResizable: false,
      },
      {
        i: "pairInfo",
        x: 0,
        y: 0,
        w: 6,
        h: 2,
        component: pairInfo,
        isDraggable: false,
        isResizable: false,
      },
    ],
    xs: [
      {
        i: "chart",
        x: 0,
        y: 7,
        w: 4,
        h: 13,
        component: chart,
        isDraggable: false,
        isResizable: false,
      },
      {
        i: "userInfo",
        x: 0,
        y: 20,
        w: 4,
        h: 15,
        component: userInfo,
        isDraggable: false,
        isResizable: false,
      },
      {
        i: "pairInfo",
        x: 0,
        y: 0,
        w: 4,
        h: 7,
        component: pairInfo,
        isDraggable: false,
        isResizable: false,
      },
    ],
  };

  const ResponsiveGridLayout = useMemo(
    () => WidthProvider(Responsive),
    [breakPoint]
  );

  return (
    <main className="bg-gray-200 dark:bg-slate-800 relative">
      {symbolInfo && Array.isArray(symbolInfo.filters) && (
        <ResponsiveGridLayout
          className="layout"
          rowHeight={30}
          onBreakpointChange={(newBreakpoint) => {
            breakPointStore.set(newBreakpoint);
          }}
          compactType={"vertical"}
          containerPadding={[0, 0]}
          margin={[0, 0]}
          breakpoints={UIBreakpoints}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
          layouts={layouts}
          draggableHandle=".drag-handle"
        >
          {layouts[breakPoint].map((layout) => (
            <div key={layout.i} style={layout.style} className="flex">
              {layout.component}
            </div>
          ))}
        </ResponsiveGridLayout>
      )}
      {breakPoint === "xs" && (
        <Sheet>
          <SheetTrigger
            className={`flex flex-row items-center gap-x-2 px-2 py-4 w-full fixed bottom-0 dark:bg-[#161a1e] max-w-full`}
          >
            <div className="flex-1 bg-positive text-white py-2 rounded-sm font-semibold hover:bg-[#32d993]">
              Buy
            </div>
            <div className="flex-1 bg-negative text-white py-2 rounded-sm font-semibold hover:bg-[#ff707e]">
              Sell
            </div>
          </SheetTrigger>
          <SheetContent
            position="bottom"
            size="content"
            className="w-full border-none dark:bg-[#1e2329] dark:text-white rounded-t-lg"
          >
            <TradeControls
              pair={pair}
              symbol={symbol}
              user={user}
              symbolInfo={symbolInfo}
              precisionBase={precisionBase}
              className="border-none bg-transparent dark:bg-transparent"
            />
          </SheetContent>
        </Sheet>
      )}
    </main>
  );
}
