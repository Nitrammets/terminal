import {
  lastPriceStore,
  priceInfoStore,
  tradesStore,
  getWsClientOptions,
  getUSDMClientOptions,
} from "../_connector";
import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { Popover, PopoverContent, PopoverTrigger } from "../Popover";
import { ScrollArea } from "../ScrollArea";
import type {
  ChangeStats24hr,
  FuturesSymbolExchangeInfo,
  WsMessage24hrTickerFormatted,
} from "binance";
import { USDMClient, WebsocketClient } from "binance";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../Tooltip";

const MagnifyingGlassIcon = ({ className, style }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
    style={style}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
    />
  </svg>
);

const wsClient = new WebsocketClient(getWsClientOptions(false));
const restClient = new USDMClient(getUSDMClientOptions(false));

const formatter = Intl.NumberFormat("en-US", {
  compactDisplay: "short",
  notation: "compact",
  minimumFractionDigits: 3,
});

export default function CoinInfo({
  symbol,
  pair,
  formatterQuote,
  formatterBase,
  exchangeInfo,
}) {
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [tickerData, setTickerData] =
    useState<WsMessage24hrTickerFormatted>(null);
  const lastPrice = useStore(lastPriceStore);
  const priceInfo = useStore(priceInfoStore);
  const trades = useStore(tradesStore);
  const [symbols] = useState<FuturesSymbolExchangeInfo[]>(
    exchangeInfo.symbols.filter((s) => s.status === "TRADING")
  );
  const lastPriceWasHigher =
    Array.isArray(trades) && trades.length > 0 && !trades[0].maker;
  const lastPriceWasLower =
    Array.isArray(trades) && trades.length > 0 && trades[0].maker;
  const [priceData, setPriceData] = useState<Map<string, any>>(new Map());

  const timeLeft = (priceInfo?.nextFundingTime || Date.now()) - Date.now();

  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    setTimeout(() => {
      setLastUpdate(Date.now());
    }, 1000 - (Date.now() - lastUpdate));
  }, [lastUpdate]);

  useEffect(() => {
    wsClient.subscribeSymbol24hrTicker(symbol, "usdm");
    wsClient.on("formattedMessage", (data: WsMessage24hrTickerFormatted) => {
      setTickerData(data);
    });
  }, []);

  const hours = Math.floor(timeLeft / 3600_000) % 24;
  const minutes = Math.floor(timeLeft / 60_000) % 60;
  const seconds = Math.floor(timeLeft / 1000) % 60;

  return (
    <div className="relative z-10 bg-lightTerminalGray dark:bg-darkTerminalDark py-4 md:py-2 px-2 border-l border-b border-gray-200 dark:border-darkTerminalBorder grid grid-cols-2 md:flex flex-row md:items-center gap-x-1 flex-1">
      <div className="flex flex-col gap-y-1 gap-x-4 md:flex-row relative z-10">
        <Popover
          onOpenChange={(open) => {
            restClient
              .get24hrChangeStatistics()
              .then((data: ChangeStats24hr[]) => {
                setPriceData(new Map(data.map((d) => [d.symbol, d])));
              })
              .catch(console.error);
          }}
        >
          <PopoverTrigger>
            <div className="flex flex-row items-center pointer-events-none">
              <div>
                <h1 className="text-lg font-semibold">{symbol}</h1>
                <div className="-mt-1 text-sm font-medium text-left">
                  Perpetual
                </div>
              </div>
              <div className="arrow-down ml-2 dark:border-t-white"></div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="bg-white dark:bg-darkBlue p-4 shadow-md ml-4 rounded-md relative z-10 w-min text-sm">
            <div className="relative">
              <MagnifyingGlassIcon
                className="absolute h-6 w-6 text-gray-400"
                style={{
                  top: "50%",
                  left: "13px",
                  transform: "translateY(-50%)",
                }}
              />
              <input
                type="search"
                className="pl-12 w-full rounded-sm py-1 text-sm"
                placeholder="Search"
                value={filter}
                onChange={(e) => setFilter(e.target.value?.toUpperCase())}
              />
            </div>
            <ScrollArea className="h-[250px] mt-4 flex flex-col gap-y-1">
              <table>
                <thead>
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-800 dark:text-gray-300">
                      Symbol
                    </th>
                    <th className="text-right text-xs font-medium text-gray-800 dark:text-gray-300 whitespace-nowrap">
                      Last price
                    </th>
                    <th className="text-right text-xs font-medium text-gray-800 dark:text-gray-300">
                      24h %
                    </th>
                    <th className="text-right text-xs font-medium text-gray-800 dark:text-gray-300">
                      Vol
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {symbols
                    .filter((symbol) => symbol.symbol.includes(filter))
                    .map((symbol) => {
                      const priceChangePercentParsed = parseFloat(
                        priceData.get(symbol.symbol)?.priceChangePercent || "0"
                      );

                      return (
                        <tr
                          key={symbol.symbol}
                          onClick={() => {
                            window.location.href = `/trade/${symbol.symbol}`;
                          }}
                        >
                          <td className="text-left text-sm hover:text-accent">
                            <a href={`/trade/${symbol.symbol}`}>
                              <span className="font-semibold text-sm">
                                {symbol.symbol}
                              </span>
                              <span className="opacity-60 capitalize text-sm ml-2">
                                {symbol.contractType.toLowerCase()}
                              </span>
                            </a>
                          </td>
                          <td className="text-right px-2 text-sm">
                            {formatterQuote.format(
                              parseFloat(
                                priceData.get(symbol.symbol)?.lastPrice || "0"
                              )
                            )}
                          </td>
                          <td
                            className={`text-right text-sm ${
                              priceChangePercentParsed > 0
                                ? "text-positive"
                                : priceChangePercentParsed < 0
                                ? "text-negative"
                                : ""
                            }`}
                          >
                            {priceChangePercentParsed.toFixed(2)}%
                          </td>
                          <td className="text-right pl-2 text-sm">
                            {formatterBase.format(
                              parseFloat(
                                priceData.get(symbol.symbol)?.quoteVolume || "0"
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </ScrollArea>
          </PopoverContent>
        </Popover>
        <div
          className={`drag-handle text-2xl monofont my-auto ${
            lastPriceWasHigher && "text-positive"
          } ${lastPriceWasLower && "text-negative"}`}
        >
          {formatterQuote.format(lastPrice)}
        </div>
        <div
          className={`text-sm font-medium md:hidden monofont ${
            tickerData?.priceChange > 0
              ? "text-positive"
              : tickerData?.priceChange < 0
              ? "text-negative"
              : ""
          }`}
        >
          {tickerData?.priceChange?.toFixed(2)}{" "}
          {tickerData?.priceChangePercent?.toFixed(2)}%
        </div>
        <div className="flex-col gap-y-1 flex md:hidden mt-4">
          <div className="text-xs text-gray-800 dark:text-gray-300">
            Funding/Countdown
          </div>
          <div className="text-xs monofont flex flex-row items-center gap-x-3">
            <span className="text-orange-400">
              {new Intl.NumberFormat("en-US", {
                maximumFractionDigits: 4,
                minimumFractionDigits: 4,
              }).format(((priceInfo?.fundingRate || 0) / 100) * 10000)}
              %
            </span>{" "}
            <span>
              {hours.toString().padStart(2, "0")}:
              {minutes.toString().padStart(2, "0")}:
              {seconds.toString().padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
      <div className="md:flex flex-row grid grid-cols-2 gap-y-2 gap-x-4 text-[##1e2329]">
        <div className="flex flex-col gap-y-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="text-xs text-gray-800 dark:text-gray-300 text-left">
                  Mark
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-md">
                  Latest mark price for this contract. To prevent price
                  manipulation, the mark price is used for unrealized PNL and
                  margin calculations, and may differ from the last price. Mark
                  Price is calculated based on the index price. The Price Index
                  is a bucket of prices from the major Spot market exchanges,
                  weighted by their relative volume. The latest index price is{" "}
                  {formatterQuote.format(priceInfo?.indexPrice)}.
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="text-xs monofont">
            {formatterQuote.format(priceInfo?.markPrice)}
          </div>
        </div>
        <div className="flex flex-col gap-y-1">
          <div className="text-xs text-gray-800 dark:text-gray-300">
            <a
              href={`https://www.binance.com/en/futures/funding-history/perpetual/index?contract=${symbol}`}
              target="_blank"
              rel="noopener"
              className="underline hover:text-accent"
              style={{ marginTop: "-1px" }}
            >
              Index
            </a>
          </div>
          <div className="text-xs monofont">
            {formatterQuote.format(priceInfo?.indexPrice)}
          </div>
        </div>
        <div className="flex-col gap-y-1 hidden md:flex">
          <div className="text-xs text-gray-800 dark:text-gray-300">
            Funding/Countdown
          </div>
          <div className="text-xs monofont flex flex-row items-center gap-x-3">
            <span className="text-orange-400">
              {new Intl.NumberFormat("en-US", {
                maximumFractionDigits: 4,
                minimumFractionDigits: 4,
              }).format(((priceInfo?.fundingRate || 0) / 100) * 10000)}
              %
            </span>{" "}
            <span>
              {hours.toString().padStart(2, "0")}:
              {minutes.toString().padStart(2, "0")}:
              {seconds.toString().padStart(2, "0")}
            </span>
          </div>
        </div>
        <div className="flex-col gap-y-1 hidden md:flex">
          <div className="text-xs text-gray-800 dark:text-gray-300">
            24h Change
          </div>
          <div
            className={`text-xs monofont ${
              tickerData?.priceChange > 0
                ? "text-positive"
                : tickerData?.priceChange < 0
                ? "text-negative"
                : ""
            }`}
          >
            {tickerData?.priceChange?.toFixed(2)}{" "}
            {tickerData?.priceChangePercent?.toFixed(2)}%
          </div>
        </div>
        <div className="flex flex-col gap-y-1">
          <div className="text-xs text-gray-800 dark:text-gray-300">
            24h High
          </div>
          <div className="text-xs monofont">
            {formatterQuote.format(tickerData?.high)}
          </div>
        </div>
        <div className="flex flex-col gap-y-1">
          <div className="text-xs text-gray-800 dark:text-gray-300">
            24h Low
          </div>
          <div className="text-xs monofont">
            {formatterQuote.format(tickerData?.low)}
          </div>
        </div>
        <div className="flex flex-col gap-y-1">
          <div className="text-xs text-gray-800 dark:text-gray-300">
            24h Vol({pair[0]})
          </div>
          <div className="text-xs monofont">
            {formatter.format(tickerData?.baseAssetVolume)}
          </div>
        </div>
        <div className="flex flex-col gap-y-1">
          <div className="text-xs text-gray-800 dark:text-gray-300">
            24h Vol({pair[1]})
          </div>
          <div className="text-xs monofont">
            {formatter.format(tickerData?.quoteAssetVolume)}
          </div>
        </div>
      </div>
    </div>
  );
}
