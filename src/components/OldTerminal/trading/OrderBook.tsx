import { useEffect, useState } from "react";
import {
  lastPriceStore,
  tradesStore,
  priceInfoStore,
  getWsClientOptions,
  getUSDMClientOptions,
} from "../_connector";
import { atom } from "nanostores";
import { useStore } from "@nanostores/react";

const orderBookStore = atom({ bids: [], asks: [] });

export const highBidStore = atom<number>(0);
export const lowAskStore = atom<number>(0);

orderBookStore.subscribe((orderBook) => {
  const highBid = orderBook.bids[0]?.[0] || 0;
  const lowAsk = orderBook.asks.at(-1)?.[0] || 0;
  if (highBid !== highBidStore.get()) highBidStore.set(highBid);
  if (lowAsk !== lowAskStore.get()) lowAskStore.set(lowAsk);
});

export default function OrderBook({ pair, formatter, formatterQuote, symbol }) {
  const lastPrice = useStore(lastPriceStore);
  const trades = useStore(tradesStore);
  const priceInfo = useStore(priceInfoStore);
  const orderBook = useStore(orderBookStore);

  useEffect(() => {
    const orderBookWorker = new Worker(
      new URL("../../_workers/orderBookWorker.ts", import.meta.url),
      { type: "module" }
    );
    orderBookWorker.onmessage = (e) => {
      orderBookStore.set(e.data);
    };
    orderBookWorker.postMessage({
      action: "init",
      symbol,
      wsClientOptions: getWsClientOptions(false),
      usdmClientOptions: getUSDMClientOptions(false),
    });
  }, []);

  useEffect(() => {
    document
      .getElementById("scroller")
      ?.scrollTo(0, document.getElementById("anchor")?.offsetTop);
  }, [orderBook]);

  return (
    <div className="flex flex-col gap-y-4 p-4 border-l border-b border-gray-100 bg-lightTerminalGray dark:border-darkTerminalBorder dark:bg-darkTerminalDark flex-1">
      <div className="text-sm font-semibold drag-handle hidden lg:block">
        Order book
      </div>
      <div className="flex flex-row items-center justify-between">
        <div className="w-6/12 text-gray-600 dark:text-gray-300 text-xs">
          Price({pair[1]})
        </div>
        <div className="w-3/12 text-right text-gray-600 dark:text-gray-300 text-xs">
          Size({pair[0]})
        </div>
        <div className="w-3/12 text-right text-gray-600 dark:text-gray-300 text-xs">
          Sum({pair[0]})
        </div>
      </div>
      <div className="flex flex-col gap-y-1 flex-1 overflow-hidden">
        <div
          className="flex flex-col gap-y-1 flex-1 overflow-y-scroll no-scrollbar font-medium"
          id="scroller"
        >
          {orderBook?.asks?.map(([price, amount, depth], index) => (
            <div
              key={price}
              className="relative hover:bg-gray-100 cursor-pointer flex flex-row items-center justify-between"
            >
              <div
                className="absolute"
                style={{
                  backgroundColor: "#f6465d20",
                  width: (depth / (orderBook?.askDepth / 25)) * 100 + "%",
                  right: 0,
                  top: "-2px",
                  bottom: "-2px",
                  zIndex: 0,
                }}
              ></div>
              <div className="w-6/12 text-[#f6465d] text-xs monofont font-medium">
                {formatterQuote.format(price)}
              </div>
              <div className="text-right w-3/12 text-gray-600 dark:text-gray-300 text-xs monofont">
                {formatter.format(amount)}
              </div>
              <div className="text-right w-3/12 text-gray-600 dark:text-gray-300 text-xs monofont">
                {formatter.format(depth)}
              </div>
            </div>
          ))}
          <div id="anchor"></div>
        </div>
        <div className="flex flex-row items-center gap-x-2">
          <div
            className={`${
              trades.length > 0 && !trades[0].maker
                ? "text-[#0ecb81]"
                : "text-[#f6465d]"
            } my-auto monofont font-medium`}
          >
            {formatterQuote.format(lastPrice)}
          </div>
          <span className="underline text-sm text-gray-600 underline-offset-2 monofont">
            {formatterQuote.format(priceInfo?.markPrice)}
          </span>
        </div>
        <div className="flex flex-col gap-y-1 flex-1 overflow-hidden font-medium">
          {orderBook?.bids?.map(([price, amount, depth], index) => (
            <div
              key={price}
              className="flex hover:bg-gray-100 cursor-pointer flex-row items-center justify-between relative"
            >
              <div
                className="absolute"
                style={{
                  backgroundColor: "#0ecb8120",
                  width: (depth / (orderBook?.bidDepth / 50)) * 100 + "%",
                  right: 0,
                  top: "-2px",
                  bottom: "-2px",
                  zIndex: 0,
                }}
              ></div>
              <div className="w-6/12 text-[#0ecb81] text-xs monofont font-medium">
                {formatterQuote.format(price)}
              </div>
              <div className="text-right w-3/12 text-gray-600 dark:text-gray-300 text-xs monofont">
                {formatter.format(amount)}
              </div>
              <div className="text-right w-3/12 text-gray-600 dark:text-gray-300 text-xs monofont">
                {formatter.format(depth)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
