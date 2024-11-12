import { useEffect, useState, useReducer, useMemo, useRef } from "react";
import { Slider } from "../Slider";
import Button from "../Button";
import { Checkbox } from "../Checkbox";
import SelectableMenu from "../SelectableMenu";
import MarginModeSelector from "./MarginModeSelector";
import LeverageSelector from "./LeverageSelector";
import TradingAccountSelector from "./TradingAccountSelector";
import {
  lastPriceStore,
  markPriceStore,
  authedRestClient,
  accountAssetStore,
  currentLeverageStore,
  refreshAuthedRestClient,
} from "../_connector";
import { Decimal } from "decimal.js";
import { toast } from "react-toastify";
import { truncate } from "./Util";
import { highBidStore, lowAskStore } from "./OrderBook";
import { useStore } from "@nanostores/react";
import { positionStore } from "./UserInfo";
import { twMerge } from "tailwind-merge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../Tooltip";
import Spinner from "../Spinner";

const ORDER_TYPES_MAP = [
  {
    name: "Limit",
    type: "LIMIT",
    fields: ["price", "size"],
    tpSl: true,
    tif: true,
  },
  {
    name: "Market",
    type: "MARKET",
    fields: ["size"],
    tpSl: true,
  },
  {
    name: "Stop Limit",
    fields: ["price", "size", "stopPrice"],
    tpSl: true,
    type: ["TAKE_PROFIT", "STOP"],
    tif: true,
  },
  {
    name: "Stop Market",
    fields: ["size", "stopPrice"],
    type: ["TAKE_PROFIT_MARKET", "STOP_MARKET"],
    tpSl: true,
  },
  {
    name: "Trailing Stop",
    type: "TRAILING_STOP_MARKET",
    fields: ["callbackRate", "activationPrice", "size"],
    tpSl: false,
  },
  {
    name: "Post Only",
    type: "LIMIT",
    fields: ["price", "size"],
    tpSl: true,
  },
  {
    name: "TWAP",
    disabled: true,
    fields: ["size", "sliceInterval"],
  },
];

const placeOrder = async (orderDetails) => {
  for (let key in orderDetails) {
    if (typeof orderDetails[key] === "undefined") {
      delete orderDetails[key];
    }
  }
  authedRestClient
    .get()
    .submitNewOrder(orderDetails)
    .then((res) => {})
    .catch((err) => {
      toast.error(err.message);
    });
};

const isTakerOrMaker = (state) => {
  if (state.selectedType.name === "Market") return "TAKER";
};

const getMaxBuySell = (
  markPrice,
  state,
  availableBalance,
  highBid,
  lowAsk,
  sizePct,
  symbol
) => {
  if (!state.selectedType || !highBid || !lowAsk) return [0, 0, 0, 0];
  const position = positionStore
    .get()
    .find((position) => position.symbol === symbol);
  try {
    markPrice = new Decimal(markPrice);
    const assetPriceBuy = new Decimal(
      state.selectedType?.fields?.includes("price") ? state.price : lowAsk
    );
    const assetPriceSell = new Decimal(
      state.selectedType?.fields?.includes("price") ? state.price : highBid
    );
    const initialMarginBuy = assetPriceBuy.div(currentLeverageStore.get());
    const initialMarginSell = assetPriceSell.div(currentLeverageStore.get());
    const openLossBuy = new Decimal(
      Math.abs(Math.min(0, markPrice.minus(assetPriceBuy).toNumber()))
    );
    const openLossSell = new Decimal(
      Math.abs(Math.min(0, -1 * markPrice.minus(assetPriceSell).toNumber()))
    );
    let maxBuy = new Decimal(availableBalance)
      .div(initialMarginBuy.plus(openLossBuy))
      .mul(0.996);
    let maxSell = new Decimal(availableBalance)
      .div(initialMarginSell.plus(openLossSell))
      .mul(0.996);
    if (position) {
      if (position.positionAmtFloat > 0) {
        maxSell = maxSell.plus(
          new Decimal(position.positionAmtFloat * 2).abs()
        );
      } else if (position.positionAmtFloat < 0) {
        maxBuy = maxBuy.plus(new Decimal(position.positionAmtFloat * 2).abs());
      }
    }
    let sizeBuy = new Decimal(state.size || "0");
    let sizeSell = new Decimal(state.size || "0");
    sizePct = new Decimal(sizePct);
    if (sizePct > -1) {
      sizeBuy = maxBuy.mul(sizePct.div(100));
      sizeSell = maxSell.mul(sizePct.div(100));
    }
    const currentBuy = initialMarginBuy
      .mul(sizeBuy)
      .plus(openLossBuy.mul(sizeBuy));
    const currentSell = initialMarginSell
      .mul(sizeSell)
      .plus(openLossSell.mul(sizeSell));
    return [
      maxBuy.toNumber(),
      maxSell.toNumber(),
      currentBuy.toNumber(),
      currentSell.toNumber(),
    ];
  } catch (err) {
    console.error(err);
    return [0, 0, 0, 0];
  }
};

export type Props = {
  pair: Array<any>;
  symbol: string;
  user: any;
  symbolInfo: any;
  precisionBase: number;
  className?: string;
};

export default function TradeControls({
  pair,
  symbol,
  user,
  symbolInfo,
  precisionBase,
  className,
}: Props) {
  const lastPrice = useStore(lastPriceStore);
  const markPrice = useStore(markPriceStore);
  const highBid = useStore(highBidStore);
  const lowAsk = useStore(lowAskStore);
  let assets = useStore(accountAssetStore);

  const sizeRef = useRef(null);

  const [state, dispatch] = useReducer(
    (state, action) => {
      switch (action.type) {
        case "setSelectedType": {
          return {
            ...state,
            selectedType: action.payload,
            price: "",
            size: "",
            useMarkPrice: !action.payload.fields?.includes("price"),
            workingType: action.payload.fields?.includes("stopPrice")
              ? "CONTRACT_PRICE"
              : undefined,
          };
        }
        case "setActivationPrice": {
          if (action?.payload < 0) return state;
          return { ...state, activationPrice: action.payload };
        }
        case "setCallbackRate": {
          return { ...state, callBackRate: action.payload };
        }
        case "setPrice": {
          if (action?.payload < 0) return state;
          return { ...state, price: action.payload };
        }
        case "setStopPrice": {
          if (action?.payload < 0) return state;
          return { ...state, stopPrice: action.payload };
        }
        case "setWorkingType": {
          return {
            ...state,
            workingType:
              action.payload === "Mark" ? "MARK_PRICE" : "CONTRACT_PRICE",
          };
        }
        case "setSize": {
          if (action?.payload < 0) return state;
          return { ...state, size: action.payload };
        }
        case "setTimeInForce": {
          return { ...state, timeInForce: action.payload };
        }
        case "setReduceOnly": {
          return {
            ...state,
            tpSl: action.payload === true ? false : state.tpSl,
            reduceOnly: action.payload,
          };
        }
        case "setTpSl": {
          return { ...state, tpSl: action.payload };
        }
        default: {
          return state;
        }
      }
    },
    {
      useMarketPrice: false,
      selectedType: ORDER_TYPES_MAP[0],
      price: "",
      size: "",
      callBackRate: "",
      stopPrice: "",
      activationPrice: "",
      workingType: "",
      sizePct: "",
      marginMode: "cross",
      reduceOnly: false,
      tpSl: false,
      sizeInQuote: false,
      tpSlSettings: {
        tp: {
          price: "",
          type: "MARKET",
        },
        sl: {
          price: "",
          type: "MARKET",
        },
      },
      timeInForce: "GTC",
    }
  );

  let availableBalance = parseFloat(
    assets?.find((item) => item.asset === pair[1])?.availableBalance?.toString()
  );

  const [sizePct, setSizePct] = useState(-1);

  const [priceData, setPriceData] = useState({
    maxBuy: 0,
    maxSell: 0,
    currentBuy: 0,
    currentSell: 0,
  });

  useEffect(() => {
    const [maxBuy, maxSell, currentBuy, currentSell] = getMaxBuySell(
      markPrice,
      state,
      availableBalance,
      highBid,
      lowAsk,
      sizePct,
      symbol
    );
    setPriceData({ maxBuy, maxSell, currentBuy, currentSell });
  }, [highBid, lowAsk, markPrice, lastPrice, sizePct, state]);

  const stepSize = useMemo(
    () => symbolInfo.filters.find((f) => f.filterType === "LOT_SIZE").stepSize,
    [symbolInfo]
  );
  const tickSize = useMemo(
    () =>
      symbolInfo.filters.find((f) => f.filterType === "PRICE_FILTER").tickSize,
    [symbolInfo]
  );

  if (!state.price && lastPrice)
    dispatch({ type: "setPrice", payload: lastPrice });

  return (
    <div
      className={twMerge(
        "bg-white border-l border-b dark:bg-darkTerminalAccent dark:border-darkTerminalBorder border-gray-200 flex-1 p-4 flex flex-col",
        className
      )}
    >
      <div className="flex flex-row items-center gap-x-2">
        <TradingAccountSelector user={user} />
        <div className="flex flex-row gap-x-2 flex-1">
          <MarginModeSelector symbol={symbol} />
          <LeverageSelector symbol={symbol} />
        </div>
      </div>
      <div className="flex flex-row items-center justify-between mt-4">
        <div className="flex flex-row items-center gap-x-2">
          {ORDER_TYPES_MAP.slice(0, 2).map((item, index) => (
            <button
              key={index}
              className={`text-sm font-semibold ${
                state.selectedType.name === item.name
                  ? "tab-active"
                  : "text-gray-600 dark:text-gray-300"
              }`}
              onClick={() =>
                dispatch({ type: "setSelectedType", payload: item })
              }
            >
              {item.name}
            </button>
          ))}
          <SelectableMenu
            items={ORDER_TYPES_MAP.filter((item) => !item.disabled)
              .slice(2, ORDER_TYPES_MAP.length)
              .map((item) => item.name)}
            selected={state.selectedType.name}
            setSelected={(val) =>
              dispatch({
                type: "setSelectedType",
                payload: ORDER_TYPES_MAP.find((item) => item.name === val),
              })
            }
          />
        </div>
      </div>
      <div className="flex flex-row items-center mt-4 gap-x-1">
        <div className="text-sm text-gray-600 dark:text-gray-300">Avbl</div>
        <div className="dark:text-white text-sm font-medium">
          {truncate(availableBalance ? availableBalance.toFixed(2) : 0, 2)}{" "}
          {pair[1]}
        </div>
      </div>
      {state.selectedType.fields?.includes("callbackRate") && (
        <div className="flex flex-row items-center gap-x-1">
          <div className="relative mt-2 flex-1">
            <label
              htmlFor="callbackRate"
              className="absolute ml-3 text-gray-600 dark:text-gray-300 text-sm pointer-events-none"
              style={{ top: "50%", transform: "translateY(-50%)" }}
            >
              Callback Rate
            </label>
            <input
              min={0}
              autoComplete="off"
              name="callbackRate"
              type="number"
              value={state.callBackRate}
              onInput={(e) =>
                dispatch({
                  type: "setCallbackRate",
                  payload: parseFloat(e.target.value),
                })
              }
              className="w-full border-none text-right bg-gray-100 rounded-md pr-6 monofont"
            />
            <div
              className="absolute ml-3 text-gray-600 dark:text-gray-300"
              style={{
                top: "50%",
                transform: "translateY(-50%)",
                right: "10px",
              }}
            >
              <span className="text-gray-600 dark:text-gray-300">%</span>
            </div>
          </div>
          <button
            className="text-sm -mb-2 border border-gray-200 dark:border-transparent text-center px-2 py-2 bg-gray-100 dark:bg-[#2b3139] rounded-md monofont"
            onClick={() => dispatch({ type: "setCallbackRate", payload: 1 })}
          >
            1%
          </button>
          <button
            className="text-sm -mb-2 border border-gray-200 dark:border-transparent text-center px-2 py-2 bg-gray-100 dark:bg-[#2b3139] rounded-md monofont"
            onClick={() => dispatch({ type: "setCallbackRate", payload: 2 })}
          >
            2%
          </button>
        </div>
      )}
      {(state.selectedType.fields?.includes("stopPrice") ||
        state.selectedType.fields?.includes("activationPrice")) && (
        <div className="relative mt-2 z-20">
          <label
            htmlFor={
              state.selectedType.fields?.includes("stopPrice")
                ? "stopPrice"
                : "activationPrice"
            }
            className="absolute ml-3 text-sm text-gray-600 dark:text-gray-300 pointer-events-none"
            style={{ top: "50%", transform: "translateY(-50%)" }}
          >
            {state.selectedType.fields?.includes("stopPrice")
              ? "Stop Price"
              : "Activation Price"}
          </label>
          <input
            step={tickSize}
            autoComplete="off"
            min={0}
            name={
              state.selectedType.fields?.includes("stopPrice")
                ? "stopPrice"
                : "activationPrice"
            }
            type="number"
            value={
              state.selectedType.fields?.includes("stopPrice")
                ? state.stopPrice
                : state.activationPrice
            }
            onInput={(e) =>
              dispatch({
                type: state.selectedType.fields?.includes("stopPrice")
                  ? "setStopPrice"
                  : "setActivationPrice",
                payload: parseFloat(e.target.value),
              })
            }
            className="w-full border-none text-right bg-gray-100 rounded-md monofont"
          />
          <div
            className="absolute ml-3 text-gray-600 dark:text-gray-300"
            style={{ top: "50%", transform: "translateY(-50%)", right: "5px" }}
          >
            <SelectableMenu
              items={["Mark", "Last"]}
              selected={state.workingType}
              setSelected={(val) =>
                dispatch({ type: "setWorkingType", payload: val })
              }
            />
          </div>
        </div>
      )}
      {state.selectedType.fields?.includes("price") && (
        <div className="relative mt-2">
          <label
            htmlFor="price"
            className="absolute ml-3 pointer-events-none text-gray-600 dark:text-gray-300 text-sm"
            style={{ top: "50%", transform: "translateY(-50%)" }}
          >
            Price
          </label>
          <input
            step={tickSize}
            autoComplete="off"
            min={0}
            name="price"
            type="number"
            value={state.price}
            onInput={(e) =>
              dispatch({
                type: "setPrice",
                payload: parseFloat(e.target.value),
              })
            }
            className="w-full border-none text-right text-sm bg-gray-100 rounded-md monofont"
            style={{ paddingRight: "86px" }}
          />
          <div
            className="absolute ml-3 text-gray-600 dark:text-gray-300 flex items-center"
            style={{ top: "50%", transform: "translateY(-50%)", right: "10px" }}
          >
            <button
              className="font-semibold text-sm tab-active"
              onClick={() =>
                lastPrice && dispatch({ type: "setPrice", payload: lastPrice })
              }
            >
              Last
            </button>
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
              {pair[1]}
            </span>
          </div>
        </div>
      )}
      <div className="relative mt-2">
        <label
          htmlFor="size"
          className="absolute ml-3 pointer-events-none text-gray-600 dark:text-gray-300 text-sm"
          style={{ top: "50%", transform: "translateY(-50%)" }}
        >
          Size
        </label>
        <input
          onFocusCapture={() => setSizePct(-1)}
          name="size"
          type="number"
          step={stepSize}
          autoComplete="off"
          value={state.size}
          ref={sizeRef}
          onInput={(e) =>
            dispatch({ type: "setSize", payload: e.target.value })
          }
          className={`w-full border-none text-right bg-gray-100 rounded-md pr-12 monofont ${
            sizePct > -1 ? "hidden" : ""
          }`}
        />
        <input
          onFocusCapture={() => {
            setSizePct(-1);
            setTimeout(() => sizeRef.current?.focus(), 50);
          }}
          name="size"
          type="text"
          autoComplete="off"
          value={sizePct + "%"}
          readOnly={true}
          className={`w-full border-none text-right bg-gray-100 rounded-md pr-12 monofont ${
            sizePct === -1 ? "hidden" : ""
          }`}
        />
        <label
          className="absolute ml-3 text-gray-600 dark:text-gray-300 pointer-events-none"
          style={{ top: "50%", transform: "translateY(-50%)", right: "10px" }}
        >
          {pair[0]}
        </label>
      </div>

      <div className="pt-8 relative px-4">
        <div className="relative percent-slider">
          <Slider
            min={0}
            max={100}
            value={[sizePct]}
            onValueChange={(e) => setSizePct(e[0])}
            className=""
          >
            {Array.from(new Array(5).keys()).map((item, index) => (
              <button
                onClick={() => setSizePct(index * 25)}
                key={index}
                style={{
                  left: `calc(${index * 25}% - 3px)`,
                  top: "-2px",
                  background: index * 25 < sizePct && "#fdc156",
                  outline:
                    index * 25 < sizePct
                      ? "2px solid white"
                      : "2px solid #dee2e6",
                  height: "8px",
                  width: "8px",
                }}
                className={`absolute rotate-45 cursor-pointer bg-white dark:bg-black }`}
              ></button>
            ))}
          </Slider>
        </div>
        {user && (
          <div
            className="flex flex-row justify-between text-xs mt-6"
            style={{ width: "110%", marginLeft: "-5%" }}
          >
            <label className="block">
              Buy{" "}
              <span>
                {sizePct > 0
                  ? ((priceData.maxBuy / 100) * sizePct).toFixed(precisionBase)
                  : "0.000"}{" "}
                {pair[0]}
              </span>
            </label>
            <label className="block">
              Sell{" "}
              <span>
                {sizePct > 0
                  ? ((priceData.maxSell / 100) * sizePct).toFixed(precisionBase)
                  : "0.000"}{" "}
                {pair[0]}
              </span>
            </label>
          </div>
        )}
      </div>
      {user && (
        <>
          <div className="border-y border-gray-200 mt-8 py-4 text-sm flex flex-col gap-y-3">
            {state.selectedType.tpSl && false && (
              <>
                <div className="flex flex-row items-center gap-x-2">
                  <Checkbox
                    name="tpSl"
                    disabled={state.reduceOnly}
                    checked={state.tpSl}
                    onCheckedChange={(checked) =>
                      dispatch({ type: "setTpSl", payload: checked })
                    }
                  />
                  <label htmlFor="tpSl">TP/SL</label>
                </div>
                {state.tpSl && (
                  <div className="flex flex-col gap-y-2">
                    <input
                      type="number"
                      autoComplete="off"
                      className="bg-gray-100 monofont"
                      placeholder="Take profit"
                    />
                    <input
                      type="number"
                      autoComplete="off"
                      className="bg-gray-100 monofont"
                      placeholder="Stop loss"
                    />
                  </div>
                )}
              </>
            )}
            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-row items-center gap-x-2">
                <Checkbox
                  name="reduceOnly"
                  checked={state.reduceOnly}
                  onCheckedChange={(checked) =>
                    dispatch({ type: "setReduceOnly", payload: checked })
                  }
                />
                <label htmlFor="reduceOnly">Reduce-Only</label>
              </div>
              {state.selectedType.tif && (
                <div className="flex flex-row items-center gap-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="text-gray-800">TIF</div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="max-w-md">
                          <p>Time in Force</p>
                          <p>
                            • GTC (Good Till Cancel): Order will continue to
                            work until filled or canceled.
                          </p>
                          <p>
                            • IOC (Immediate Or Cancel): Order will execute all
                            or partial immediately and cancel any unfilled
                            portion of the order.
                          </p>
                          <p>
                            • FOK (Fill Or Kill): Order must be filled
                            immediately in its entirety or not executed at all.
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <SelectableMenu
                    items={["GTC", "IOC", "FOK"]}
                    selected={state.timeInForce}
                    setSelected={(val) =>
                      dispatch({ type: "setTimeInForce", payload: val })
                    }
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-row items-center gap-x-2 mt-6">
            <div className="flex-1 flex-col gap-y-2">
              <Button
                label="Buy/Long"
                className="w-full bg-positive text-white rounded py-2 font-bold"
                disabled={
                  state.selectedType.name === "Trailing Stop" &&
                  state.activationPrice >
                    (state.workingType === "MARK_PRICE" ? markPrice : lastPrice)
                }
                onClick={(e) => {
                  placeOrder({
                    placeType: "order-form",
                    positionSide: "BOTH", //TODO: figure out what it does
                    quantity:
                      sizePct > -1
                        ? parseFloat(
                            truncate(
                              (priceData.maxBuy / 100) * sizePct,
                              precisionBase
                            ).toString()
                          )
                        : state.size,
                    reduceOnly: state.reduceOnly,
                    side: "BUY",
                    symbol,
                    callbackRate: state.callBackRate,
                    workingType: state.workingType,
                    stopPrice: state.selectedType.fields?.includes("stopPrice")
                      ? state.stopPrice
                      : undefined,
                    price: state.selectedType.fields?.includes("price")
                      ? state.price
                      : undefined,
                    timeInForce: state.selectedType.tif
                      ? state.timeInForce
                      : state.selectedType.name === "Post Only"
                      ? "GTX"
                      : undefined,
                    type: Array.isArray(state.selectedType.type)
                      ? state.selectedType.type[0]
                      : state.selectedType.type,
                  });
                }}
              />
              <label className="block text-sm mt-2">
                Cost:{" "}
                <span className="monofont">
                  {truncate(priceData.currentBuy, 2)} {pair[1]}
                </span>
              </label>
              <label className="block text-sm">
                Max:{" "}
                <span className="monofont">
                  {truncate(priceData.maxBuy, precisionBase) || 0} {pair[0]}
                </span>
              </label>
            </div>
            <div className="flex-1 flex-col gap-y-2">
              <Button
                label="Sell/Short"
                className="w-full bg-negative text-white rounded py-2 font-bold"
                disabled={
                  state.selectedType.name === "Trailing Stop" &&
                  state.activationPrice <
                    (state.workingType === "MARK_PRICE" ? markPrice : lastPrice)
                }
                onClick={(e) => {
                  placeOrder({
                    placeType: "order-form",
                    positionSide: "BOTH", //TODO: figure out what it does
                    quantity:
                      sizePct > -1
                        ? parseFloat(
                            truncate(
                              (priceData.maxBuy / 100) * sizePct,
                              precisionBase
                            ).toString()
                          )
                        : state.size,
                    reduceOnly: state.reduceOnly,
                    side: "SELL",
                    symbol,
                    callbackRate: state.callBackRate,
                    workingType: state.workingType,
                    stopPrice: state.selectedType.fields?.includes("stopPrice")
                      ? state.stopPrice
                      : undefined,
                    price: state.selectedType.fields?.includes("price")
                      ? state.price
                      : undefined,
                    timeInForce: state.selectedType.tif
                      ? state.timeInForce
                      : state.selectedType.name === "Post Only"
                      ? "GTX"
                      : undefined,
                    type: Array.isArray(state.selectedType.type)
                      ? state.selectedType.type[1]
                      : state.selectedType.type,
                  });
                }}
              />
              <label className="block text-right text-sm mt-2">
                Cost:{" "}
                <span className="monofont">
                  {truncate(priceData.currentSell, 2)} {pair[1]}
                </span>
              </label>
              <label className="block text-right text-sm">
                Max:{" "}
                <span className="monofont">
                  {truncate(priceData.maxSell, precisionBase) || 0} {pair[0]}
                </span>
              </label>
            </div>
          </div>
        </>
      )}
      {!user && (
        <div className="flex flex-col gap-y-3 mt-8">
          <a
            href="/auth/register"
            className="block bg-accent py-2 w-full rounded-sm text-black font-medium text-center hover:opacity-70"
          >
            Register now
          </a>
          <a
            href="/auth/login"
            className="block bg-gray-500 py-2 w-full rounded-sm text-white font-medium text-center hover:opacity-70"
          >
            Sign in
          </a>
        </div>
      )}
    </div>
  );
}
