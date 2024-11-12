import { useEffect, useState } from "react";
import * as TradingView from "../../../../charting_library";
import { useStore } from "@nanostores/react";
import { themeStore } from "../../../lib/utils";
import { selectedAccount } from "./TradingAccountSelector";
import { wsClient } from "../_connector";
import type { KlineInterval, WsMessageKlineFormatted } from "binance";

themeStore.subscribe((theme) => {});

const baseUrl = selectedAccount.get()?.mockTrading
  ? "https://testnet.binancefuture.com"
  : "https://fapi.binance.com";

const INTERVALMAP = {
  "1": "1m",
  "3": "3m",
  "5": "5m",
  "15": "15m",
  "30": "30m",
  "60": "1h",
  "120": "2h",
  "240": "4h",
  "360": "6h",
  "480": "8h",
  "720": "12h",
  "1D": "1d",
  "3D": "3d",
  "1W": "1w",
  "1M": "1M",
};

let latest: string = null;

export default function Chart({ symbol }) {
  const [tvWidget, setTvWidget] =
    useState<TradingView.IChartingLibraryWidget>();
  const theme = useStore(themeStore);

  useEffect(() => {
    const tvWidget = new TradingView.widget({
      library_path: "/charting_library/",
      //debug: true, // uncomment this line to see Library errors and warnings in the console
      symbol:
        (selectedAccount.get()?.mockTrading ? "BINANCE_MOCK" : "BINANCE") +
        ":" +
        symbol,
      autosize: true,
      timezone: Intl.DateTimeFormat().resolvedOptions()
        .timeZone as TradingView.Timezone,
      interval: (localStorage.getItem(
        "tradingview.chart.lastUsedTimeBasedResolution"
      ) || "1D") as TradingView.ResolutionString,
      container: "tv_chart_container",
      datafeed: {
        onReady: async (callback) => {
          setTimeout(
            () =>
              callback({
                supported_resolutions: [
                  "1",
                  "3",
                  "5",
                  "15",
                  "30",
                  "60",
                  "120",
                  "240",
                  "360",
                  "480",
                  "720",
                  "1D",
                  "3D",
                  "1W",
                  "1M",
                ] as TradingView.ResolutionString[],
                supports_marks: false,
                supports_timescale_marks: false,
                supports_time: false,
              }),
            0
          );
        },
        resolveSymbol: async (
          symbolName,
          onSymbolResolvedCallback,
          onResolveErrorCallback
        ) => {
          setTimeout(
            () =>
              onSymbolResolvedCallback({
                ticker: symbolName,
                name: symbolName,
                listed_exchange: "Binance",
                full_name:
                  (selectedAccount.get()?.mockTrading
                    ? "BinanceMock"
                    : "Binance"
                  ).toUpperCase() + symbolName,
                format: "price",
                description: symbolName,
                type: "crypto",
                session: "24x7",
                timezone: "Etc/UTC",
                exchange: selectedAccount.get()?.mockTrading
                  ? "Binance Mock"
                  : "Binance",
                minmov: 1,
                pricescale: 100,
                has_intraday: true,
                intraday_multipliers: [
                  "1",
                  "3",
                  "5",
                  "15",
                  "30",
                  "60",
                  "120",
                  "240",
                  "360",
                  "480",
                  "720",
                ] as TradingView.ResolutionString[],
                has_weekly_and_monthly: false,
                supported_resolutions: [
                  "1",
                  "3",
                  "5",
                  "15",
                  "30",
                  "60",
                  "120",
                  "240",
                  "360",
                  "480",
                  "720",
                  "1D",
                  "3D",
                  "1W",
                  "1M",
                ] as TradingView.ResolutionString[],
                volume_precision: 2,
                data_status: "streaming",
              }),
            0
          );
        },
        getBars: async (
          symbolInfo,
          resolution,
          { from, to, countBack },
          onResult,
          onError
        ) => {
          const bars = await fetch(
            baseUrl +
              "/fapi/v1/klines?" +
              new URLSearchParams({
                symbol: symbolInfo.ticker.split(":")[1],
                startTime: (from * 1000).toString(),
                endTime: (to * 1000).toString(),
                limit: countBack.toString(),
                interval: INTERVALMAP[resolution] as KlineInterval,
              }).toString()
          )
            .then((res) => res.json())
            .then((data) => {
              return data.map((bar) => {
                return {
                  time: bar[0],
                  open: parseFloat(bar[1].toString()),
                  high: parseFloat(bar[2].toString()),
                  low: parseFloat(bar[3].toString()),
                  close: parseFloat(bar[4].toString()),
                  volume: bar[5],
                };
              }) as TradingView.Bar[];
            })
            .catch((err) => {
              console.error(err);
              return [];
            });
          setTimeout(() => {
            onResult(bars);
          }, 0);
        },
        searchSymbols: async (
          userInput,
          exchange,
          symbolType,
          onResultReadyCallback
        ) => {},
        subscribeBars: async (
          symbolInfo,
          resolution,
          onTick,
          listenerGuid,
          onResetCacheNeededCallback
        ) => {
          console.log("subscribeBars", resolution);
          latest = INTERVALMAP[resolution];
          const socket = await wsClient
            .get()
            .subscribeKlines(
              symbolInfo.ticker.split(":")[1],
              INTERVALMAP[resolution] as KlineInterval,
              "usdm"
            );
          wsClient
            .get()
            .on("formattedMessage", (data: WsMessageKlineFormatted) => {
              if (data.eventType === "kline") {
                if (data.kline.interval === latest) {
                  onTick({
                    time: data.kline.startTime,
                    open: data.kline.open,
                    high: data.kline.high,
                    low: data.kline.low,
                    close: data.kline.close,
                    volume: data.kline.volume,
                  });
                }
              }
            });
        },
        unsubscribeBars: (listenerGuid) => {
          console.log("unsubscribeBars", listenerGuid);
        },
      },
      locale: "en",
      custom_css_url: "/trading/custom_chart.css",
      disabled_features: ["header_symbol_search"],
      enabled_features: [],
      theme: theme === "dark" ? "Dark" : "Light",
      overrides: {
        "paneProperties.backgroundGradientStartColor": "#161a1e",
        "paneProperties.backgroundGradientEndColor": "#161a1e",
        "paneProperties.background": "#fafafa",
        "paneProperties.backgroundType": "solid",
      },
    });

    setTvWidget(tvWidget);

    return () => {
      tvWidget?.remove();
    };
  }, []);

  useEffect(() => {
    setTimeout(() => {
      tvWidget?.changeTheme(theme === "dark" ? "Dark" : "Light");
      tvWidget?.applyOverrides({
        "paneProperties.backgroundGradientStartColor": "#161a1e",
        "paneProperties.backgroundGradientEndColor": "#161a1e",
        "paneProperties.background": theme === "dark" ? "#161a1e" : "#fafafa",
        "paneProperties.backgroundType": "solid",
      });
    }, 10);
  }, [theme]);

  return (
    <div className="dark:bg-darkTerminalDark border-l border-b border-gray-200 dark:border-darkTerminalBorder flex-1 flex flex-col">
      <div
        id="tv_chart_container"
        className="flex-1 dark:bg-darkTerminalDark"
      ></div>
    </div>
  );
}
