import { useState, useMemo } from "react";
import type { FuturesAccountPositionExtended } from "../_workers/positionWorker";
import { truncate } from "../trading/Util";
import SelectableMenu from "../SelectableMenu";
import {
  breakPointStore,
  authedRestClient,
  maintenanceMarginStore,
  equityStore,
} from "../_connector";
import { DataGrid } from "@sylchi/reusable-components/dist/esm/index.mjs";
import { useStore } from "@nanostores/react";
import { Dialog, DialogContent, DialogTitle } from "../Dialog";
import { toast } from "react-toastify";

import { Sheet, SheetContent, SheetTrigger } from "../Drawer";

const ClosePositionSheet = ({
  position,
  setClosePosition,
}: {
  position: FuturesAccountPositionExtended;
  setClosePosition: any;
}) => {
  const [closeType, setType] = useState("Market");
  const [amount, setAmount] = useState(position.positionAmtFloat);
  const [price, setPrice] = useState(0);

  return (
    <Sheet open={true} onOpenChange={() => setClosePosition(null)}>
      <SheetContent
        position="bottom"
        size="content"
        className="w-full border-none dark:bg-[#1e2329] dark:text-white rounded-t-lg"
      >
        <div className="flex flex-row -mt-2 gap-x-4 font-medium text-gray-400 border-b border-gray-100 dark:border-gray-600">
          <div
            onClick={() => setType("Market")}
            className={`pb-2 ${
              closeType === "Market" &&
              "text-accent dark:text-white border-b border-accent"
            }`}
          >
            Market Close
          </div>
          <div
            onClick={() => setType("Limit")}
            className={`pb-2 ${
              closeType === "Limit" &&
              "text-accent dark:text-white border-b border-accent"
            }`}
          >
            Limit Close
          </div>
        </div>
        <div className="flex flex-col mt-8 gap-y-2">
          <div className="w-full relative">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value))}
              disabled={closeType === "Market"}
              name="price"
              className={`text-right block w-full`}
              style={{ paddingRight: "55px" }}
            />
            <label
              htmlFor="price"
              className="absolute text-gray-400 ml-2"
              style={{ top: "50%", transform: "translateY(-50%)" }}
            >
              Price
            </label>
            <label
              className="absolute text-black dark:text-white font-medium monofont text-left mr-2"
              style={{ top: "50%", transform: "translateY(-50%)", right: 0 }}
            >
              {position.quoteAsset}
            </label>
          </div>
          <div className="w-full relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              name="amount"
              className="text-right block w-full"
              style={{ paddingRight: "55px" }}
            />
            <label
              htmlFor="amount"
              className="absolute text-gray-400 ml-2"
              style={{ top: "50%", transform: "translateY(-50%)" }}
            >
              Amount
            </label>
            <label
              className="absolute text-accent font-medium monofont text-left mr-2"
              style={{ top: "50%", transform: "translateY(-50%)", right: 0 }}
            >
              {position.baseAsset}
            </label>
          </div>
          <div className="flex flex-row gap-x-2 monofont mt-2">
            {[10, 25, 50, 75, 100].map((percent) => (
              <button
                className="flex-1 border border-gray-300 text-black dark:border-gray-700 rounded-md bg-gray-200 dark:bg-gray-800 dark:text-gray-400 py-1"
                onClick={() => {
                  setAmount(
                    parseFloat(
                      ((position.positionAmtFloat * percent) / 100).toFixed(
                        position.quantityPrecision
                      )
                    )
                  );
                }}
              >
                {percent}%
              </button>
            ))}
          </div>
          <div className="mt-8 pb-6">
            <button
              className="bg-accent text-black py-2 rounded-md shadow-md w-full text-center font-medium"
              onClick={() => {
                if (closeType === "Market") {
                  authedRestClient
                    .get()
                    .submitNewOrder({
                      symbol: position.symbol,
                      side: position.positionAmtFloat > 0 ? "SELL" : "BUY",
                      type: "MARKET",
                      reduceOnly: "true",
                      quantity: amount,
                      positionSide: "BOTH",
                    })
                    .then((res) => {
                      setClosePosition(null);
                    })
                    .catch((err) => {
                      console.error(err);
                    });
                } else if (closeType === "Limit") {
                  authedRestClient
                    .get()
                    .submitNewOrder({
                      symbol: position.symbol,
                      side: position.positionAmtFloat > 0 ? "SELL" : "BUY",
                      type: "LIMIT",
                      quantity: amount,
                      price,
                      reduceOnly: "true",
                      timeInForce: "GTC",
                      positionSide: "BOTH",
                    })
                    .then((res) => {
                      setClosePosition(null);
                    })
                    .catch((err) => {
                      console.error(err);
                    });
                }
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const FuturesPositionMobile = ({
  position,
  marginRatio,
  setPosition,
  openOrders,
  setClosePosition,
}: {
  position: FuturesAccountPositionExtended;
  marginRatio: string;
  setPosition: any;
  openOrders: any[];
  setClosePosition: any;
}) => {
  const isLong = position.positionAmtFloat > 0;
  const orders = openOrders?.filter((order) => {
    const sameSymbol = order.symbol === position.symbol;
    const slTpOrder = [
      "TAKE_PROFIT_MARKET",
      "STOP_MARKET",
      "STOP",
      "TAKE_PROFIT",
    ].includes(order.type);
    return sameSymbol && slTpOrder;
  });
  const tpOrder = orders?.find(
    (order) =>
      order.type === "TAKE_PROFIT_MARKET" || order.type === "TAKE_PROFIT"
  );
  const slOrder = orders?.find(
    (order) => order.type === "STOP_MARKET" || order.type === "STOP"
  );
  return (
    <div key={position.symbol} className="p-2 flex flex-col gap-y-2">
      <div className="flex flex-row items-center justify-between">
        <div className="text-sm font-medium">
          <span className={isLong ? "text-positive" : "text-negative"}>
            &#x2022;&nbsp;
          </span>
          {position.symbol} Perpetual{" "}
          <span className="dark:bg-yellow-800 dark:text-yellow-400 bg-yellow-400 text-yellow-800 px-1">
            {position.leverage}x
          </span>
        </div>
        <button
          className="text-xs rounded-md py-1 px-2 bg-gray-200 dark:bg-gray-600 font-medium"
          onClick={() => setClosePosition(position)}
        >
          Close position
        </button>
      </div>
      <div className="flex flex-row items-center justify-between">
        <div className="text-xs text-gray-400">Size</div>
        <div
          className={`text-xs font-medium ${
            isLong ? "text-positive" : "text-negative"
          }`}
        >
          <span className="monofont">{position.positionAmt}</span>{" "}
          {position.baseAsset}
        </div>
      </div>
      <div className="flex flex-row items-center justify-between">
        <div className="text-xs text-gray-400">Notional size</div>
        <div className={`text-xs font-medium`}>
          <span className="monofont">
            {truncate(position.notionalFloat, position.pricePrecision)}
          </span>{" "}
          {position.quoteAsset}
        </div>
      </div>
      <div className="flex flex-row items-center justify-between">
        <div className="text-xs text-gray-400">Entry price</div>
        <div className={`text-xs font-medium`}>
          <span className="monofont">
            {truncate(position.entryPriceFloat, position.pricePrecision)}
          </span>
        </div>
      </div>
      <div className="flex flex-row items-center justify-between">
        <div className="text-xs text-gray-400">Mark price</div>
        <div className={`text-xs font-medium`}>
          <span className="monofont">
            {truncate(position.markPriceFloat, position.pricePrecision)}
          </span>
        </div>
      </div>
      <div className="flex flex-row items-center justify-between">
        <div className="text-xs text-gray-400">Liquidation price</div>
        <div className={`text-xs font-medium`}>
          <span className="monofont text-orange-500">
            {truncate(position.liquidationPriceFloat, position.pricePrecision)}
          </span>
        </div>
      </div>
      <div className="flex flex-row items-center justify-between">
        <div className="text-xs text-gray-400">Margin ratio</div>
        <div className={`text-xs font-medium`}>
          <span className="monofont">{marginRatio}</span>
        </div>
      </div>
      <div className="flex flex-row items-center justify-between">
        <div className="text-xs text-gray-400">Margin</div>
        <div className={`text-xs font-medium`}>
          <span className="monofont">
            {position.marginNotional} {} ({position.marginType})
          </span>
        </div>
      </div>
      <div className="flex flex-row items-center justify-between">
        <div className="text-xs text-gray-400">Margin</div>
        <div className={`text-xs font-medium`}>
          <span className="monofont">
            {position.marginNotional} {} ({position.marginType})
          </span>
        </div>
      </div>
      <div className="flex flex-row items-center justify-between">
        <div className="text-xs text-gray-400">Unrealized PNL(ROE %)</div>
        <div className={`text-xs font-medium`}>
          <div
            className={`${
              position.pnlNotational.startsWith("+")
                ? "text-positive"
                : position.pnlNotational.startsWith("-")
                ? "text-negative"
                : ""
            } flex items-center gap-x-2`}
          >
            <div className="monofont">{position.pnlNotational}</div>
            <div>
              (<span className="monofont">{position.pnlPercent}</span>)
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-row items-center justify-between">
        <div className="text-xs text-gray-400">TP/SL For entire position</div>
        <div className={`text-xs font-medium`}>
          <div
            key={position.symbol + "tp/sl"}
            className="flex flex-row items-center"
          >
            <div>
              <div>{tpOrder ? <span>{tpOrder.stopPrice}</span> : "--"} /</div>
              <div>{slOrder ? <span>{slOrder.stopPrice}</span> : "--"}</div>
            </div>
            <button
              onClick={() => {
                if (tpOrder) position.tpOrder = tpOrder;
                if (slOrder) position.slOrder = slOrder;
                setPosition(position);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                />
              </svg>
              <span className="sr-only">Edit TP/SL</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Positions({
  positions,
  hideOthers,
  symbol,
  openOrders,
}: {
  positions: FuturesAccountPositionExtended[];
  hideOthers: boolean;
  symbol: string;
  openOrders: any[];
}) {
  const [position, setPosition] = useState(null);
  const [closePosition, setClosePosition] = useState(null);
  const breakPoint = useStore(breakPointStore);
  const maintenanceMargin = useStore(maintenanceMarginStore);
  const equity = useStore(equityStore);

  return (
    <>
      {position && (
        <TPSLDialog
          position={position}
          setPosition={setPosition}
          isOpen={!!position}
        />
      )}
      {["xs", "sm"].includes(breakPoint) ? (
        <>
          {closePosition && (
            <ClosePositionSheet
              position={closePosition}
              setClosePosition={setClosePosition}
            />
          )}
          <div className="overflow-y-scroll relative no-scrollbar pb-16">
            {positions.map((position) => (
              <FuturesPositionMobile
                setClosePosition={setClosePosition}
                openOrders={openOrders}
                position={position}
                key={position.symbol}
                marginRatio={
                  ((maintenanceMargin / equity) * 100).toFixed(2) + "%"
                }
                setPosition={setPosition}
              />
            ))}
          </div>
        </>
      ) : (
        <DataGrid
          columns={[
            {
              title: "Symbol",
              field: "symbol",
              format: (val, row: FuturesAccountPositionExtended) => (
                <a
                  href={`/trade/${row.symbol}`}
                  key={row.symbol + ""}
                  className={`flex flex-row items-center border-l-4 ${
                    row.positionAmtFloat > 0
                      ? "border-positive"
                      : "border-negative"
                  } rounded-sm pl-2`}
                >
                  <div>
                    <div className="font-bold text-xs">{val}</div>
                    <div className="text-xs font-medium">Perpetual</div>
                  </div>
                  <div className="font-semibold ml-2 bg-yellow-100 px-1 text-orange-700">
                    {row.leverage}x
                  </div>
                </a>
              ),
            },
            {
              title: "Size",
              field: "positionAmt",
              format: (val, row: FuturesAccountPositionExtended) => (
                <span
                  key={row.symbol + "size"}
                  className={`${
                    row.positionAmtFloat > 0 ? "text-positive" : "text-negative"
                  } monofont`}
                >
                  {val + " " + row.baseAsset}
                </span>
              ),
            },
            {
              title: "Entry Price",
              field: "entryPrice",
              format: (val, row) => (
                <span key={row.symbol + "entryprice"} className="monofont">
                  {val}
                </span>
              ),
            },
            {
              title: "Mark price",
              field: "markPrice",
              format: (val, row) => (
                <span key={row.symbol + "markPrice"} className="monofont">
                  {val}
                </span>
              ),
            },
            {
              title: "Liq.Price",
              field: "liquidationPrice",
              format: (val, row) => (
                <span
                  key={row.symbol + "liquidationPrice"}
                  className="text-orange-500"
                >
                  {row.liquidationPriceFloat > 0 ? val : "- -"}
                </span>
              ),
            },
            {
              title: "Margin Ratio",
              field: "marginType",
              format: (val, row) => (
                <div key={row.symbol + "marginRatio"}>
                  <div>
                    {((maintenanceMargin / equity) * 100 || 0).toFixed(2)}%
                  </div>
                </div>
              ),
            },
            {
              title: "Margin",
              field: "marginNotional",
              format: (val, row: FuturesAccountPositionExtended) => (
                <div key={row.symbol + "margin"} className="mt-1">
                  <div className="monofont">{val}</div>
                  <div className="capitalize">({row.marginType})</div>
                </div>
              ),
            },
            {
              title: "PNL(ROE %)",
              field: "pnlNotational",
              format: (val, row) => {
                return (
                  <div
                    key={row.symbol + "pnl"}
                    className={
                      val?.startsWith("+") > 0
                        ? "text-positive"
                        : val?.startsWith("-")
                        ? "text-negative"
                        : ""
                    }
                  >
                    <div className="monofont">{val}</div>
                    <div>
                      (<span className="monofont">{row.pnlPercent}</span>)
                    </div>
                  </div>
                );
              },
            },
            {
              title: "Close All Positions",
              field: "",
              format: (val, row) => (
                <div
                  className="flex flex-row items-center gap-x-2"
                  key={row.symbol + "close"}
                >
                  <div className="flex flex-row items-center gap-x-2">
                    <button
                      className="text-orange-600"
                      onClick={(e) => {
                        const quantity = e.target.parentElement.querySelector(
                          'input[name="quantity"]'
                        ).value;
                        authedRestClient.get().submitNewOrder({
                          symbol: row.symbol,
                          side:
                            parseFloat(row.positionAmt) > 0 ? "SELL" : "BUY",
                          type: "MARKET",
                          reduceOnly: "true",
                          quantity,
                          positionSide: "BOTH",
                        });
                      }}
                    >
                      Market
                    </button>
                    <span>|</span>
                    <button
                      className="text-orange-600"
                      onClick={(e) => {
                        const quantity = e.target.parentElement.querySelector(
                          'input[name="quantity"]'
                        ).value;
                        const price = e.target.parentElement.querySelector(
                          'input[name="price"]'
                        ).value;
                        authedRestClient.get().submitNewOrder({
                          symbol: row.symbol,
                          side:
                            parseFloat(row.positionAmt) > 0 ? "SELL" : "BUY",
                          type: "LIMIT",
                          quantity,
                          price,
                          reduceOnly: "true",
                          timeInForce: "GTC",
                          positionSide: "BOTH",
                        });
                      }}
                    >
                      Limit
                    </button>
                    <input
                      className="h-5 monofont text-sm bg-gray-100 border-none rounded-md"
                      name="price"
                      style={{ width: "100px" }}
                      type="number"
                      step={row.pricePrecision}
                      defaultValue={truncate(
                        row.markPriceFloat,
                        row.pricePrecision
                      )}
                    ></input>
                    <input
                      className="h-5 monofont text-sm bg-gray-100 border-none rounded-md"
                      name="quantity"
                      style={{ width: "100px" }}
                      type="number"
                      step={row.quantityPrecision}
                      defaultValue={truncate(
                        Math.abs(row.positionAmtFloat),
                        row.quantityPrecision
                      )}
                    ></input>
                  </div>
                </div>
              ),
            },
            {
              title: "TP/SL for position",
              field: "",
              format: (val, row) => {
                const orders = openOrders?.filter((order) => {
                  const sameSymbol = order.symbol === row.symbol;
                  const slTpOrder = [
                    "TAKE_PROFIT_MARKET",
                    "STOP_MARKET",
                    "STOP",
                    "TAKE_PROFIT",
                  ].includes(order.type);
                  return sameSymbol && slTpOrder;
                });
                const tpOrder = orders?.find(
                  (order) =>
                    order.type === "TAKE_PROFIT_MARKET" ||
                    order.type === "TAKE_PROFIT"
                );
                const slOrder = orders?.find(
                  (order) =>
                    order.type === "STOP_MARKET" || order.type === "STOP"
                );
                return (
                  <div
                    key={row.symbol + "tp/sl"}
                    className="flex flex-row items-center"
                  >
                    <div>
                      <div>
                        {tpOrder ? <span>{tpOrder.stopPrice}</span> : "--"} /
                      </div>
                      <div>
                        {slOrder ? <span>{slOrder.stopPrice}</span> : "--"}
                      </div>
                    </div>
                    {row.dialog}
                    <button
                      onClick={() => {
                        if (tpOrder) row.tpOrder = tpOrder;
                        if (slOrder) row.slOrder = slOrder;
                        setPosition(row);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                        />
                      </svg>
                      <span className="sr-only">Edit TP/SL</span>
                    </button>
                  </div>
                );
              },
            },
          ]}
          rows={positions}
          classes={{
            cellClasses:
              "pl-2 flex flex-col justify-center text-sm text-gray-600 py-1 dark:text-gray-200 min-h-[50px]",
            headerClasses:
              "text-xs py-1 shadow-sm font-normal text-gray-600 dark:text-gray-300 h-min dark:bg-darkTerminalDark dark:border-b dark:border-darkTerminalBorder",
            containerClasses:
              "shadow-none overflow-y-scroll grid-rows-minContent no-scrollbar",
            evenRowClasses:
              "bg-inherit border-b border-gray-100 dark:border-gray-700 dark:bg-darkTerminalDark",
            oddRowClasses:
              "bg-inherit border-b border-gray-100 dark:border-gray-700 dark:bg-darkTerminalDark",
          }}
        />
      )}
    </>
  );
}

const TPSLDialog = (props: {
  position: FuturesAccountPositionExtended;
  isOpen: boolean;
  setPosition: Function;
}) => {
  const [tp, setTP] = useState("");
  const [tpType, setTPType] = useState<"Mark" | "Last">("Mark");
  const [sl, setSL] = useState("");
  const [slType, setSLType] = useState<"Mark" | "Last">("Mark");

  const {
    position: {
      symbol,
      entryPrice,
      entryPriceFloat,
      markPrice,
      leverage,
      positionAmtFloat,
      quoteAsset,
      tpOrder,
      slOrder,
      pricePrecision,
    },
    isOpen,
    setPosition,
  } = props;

  const [tpOrderOrig, setTPOrder] = useState(tpOrder);
  const [slOrderOrig, setSLOrder] = useState(slOrder);

  const profit = useMemo(
    () =>
      (
        positionAmtFloat * (tpOrder ? tpOrder.stopPriceFloat : parseFloat(tp)) -
        positionAmtFloat * entryPriceFloat
      ).toFixed(2),
    [positionAmtFloat, tp, tpOrder]
  );
  const loss = useMemo(
    () =>
      (
        positionAmtFloat * (slOrder ? slOrder.stopPriceFloat : parseFloat(sl)) -
        positionAmtFloat * entryPriceFloat
      ).toFixed(2),
    [positionAmtFloat, sl, slOrder]
  );

  const placeOrders = async () => {
    if (!tp && !sl) return;
    if (tp) {
      authedRestClient
        .get()
        .submitNewOrder({
          symbol,
          side: positionAmtFloat > 0 ? "SELL" : "BUY",
          positionSide: "BOTH", //TODO: figure out hedge mode,
          type: "TAKE_PROFIT_MARKET",
          timeInForce: "GTE_GTC",
          quantity: 0,
          stopPrice: parseFloat(tp),
          workingType: tpType === "Mark" ? "MARK_PRICE" : "CONTRACT_PRICE",
          closePosition: "true",
        })
        .then((res) => {
          toast.success("Take Profit order placed");
        })
        .catch((err) => {
          console.error(err);
        });
    }
    if (sl) {
      authedRestClient
        .get()
        .submitNewOrder({
          symbol,
          side: positionAmtFloat > 0 ? "SELL" : "BUY",
          positionSide: "BOTH", //TODO: figure out hedge mode,
          type: "STOP_MARKET",
          timeInForce: "GTE_GTC",
          quantity: 0,
          stopPrice: parseFloat(sl),
          workingType: tpType === "Mark" ? "MARK_PRICE" : "CONTRACT_PRICE",
          closePosition: "true",
        })
        .then((res) => {
          toast.success("Stop Loss order placed");
        })
        .catch((err) => {
          console.error(err);
        });
    }
    setPosition(null);
  };

  return (
    <Dialog
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setPosition(null);
        }
      }}
      defaultOpen={isOpen}
    >
      <DialogContent className="mx-auto max-w-md w-full rounded-lg shadow-lg bg-white p-6">
        <DialogTitle className="flex flex-row items-center text-xl font-semibold gap-x-6 justify-between">
          TP/SL for entire position
        </DialogTitle>

        <div className="flex flex-col gap-y-1 mt-8 text-sm font-medium">
          <div className="flex flex-row items-center justify-between">
            <div>Symbol</div>
            <div
              className={`${
                positionAmtFloat > 0 ? "text-positive" : "text-negative"
              } monofont`}
            >
              {symbol} Perpetual {leverage}x
            </div>
          </div>
          <div className="flex flex-row items-center justify-between">
            <div>Entry Price</div>
            <div className="monofont">
              {entryPrice} {quoteAsset}
            </div>
          </div>
          <div className="flex flex-row items-center justify-between">
            <div>Mark Price</div>
            <div className="monofont">
              {markPrice} {quoteAsset}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-y-4 mt-4">
          {tpOrderOrig ? (
            <div className="flex flex-row items-center justify-between w-full gap-x-2">
              <div>Take profit</div>
              <div className="flex items-center gap-x-4">
                <span>
                  {tpOrderOrig.workingType === "MARK_PRICE"
                    ? "Mark Price"
                    : "Last Price"}{" "}
                  &gt;= {tpOrderOrig.stopPrice}
                </span>
                <button
                  className="text-accent font-medium"
                  onClick={() => {
                    authedRestClient
                      .get()
                      .cancelOrder({
                        symbol: tpOrderOrig.symbol,
                        orderId: tpOrderOrig.orderId,
                      })
                      .then((res) => {
                        toast.success("Take Profit order cancelled");
                        setTPOrder(null);
                      })
                      .catch((err) => {
                        console.error(err);
                        toast.error("Failed to cancel Take Profit order");
                      });
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-row items-center gap-x-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  className="text-right w-full bg-gray-100 border-none"
                  placeholder="0.00"
                  name="takeProfit"
                  value={tp}
                  onInput={(e) => setTP(parseFloat(e.target.value))}
                  step={pricePrecision}
                />
                <label
                  htmlFor="takeProfit"
                  className="absolute"
                  style={{
                    top: "50%",
                    transform: "translateY(-50%)",
                    left: "10px",
                  }}
                >
                  Take Profit
                </label>
              </div>
              <SelectableMenu
                items={["Mark", "Last"]}
                selected={tpType}
                setSelected={(val: "Mark" | "Last") => setTPType(val)}
                className="bg-gray-100 dark:bg-darkTerminalGray p-2"
                style={{ minWidth: "80px" }}
              />
            </div>
          )}
          <div className="text-xs">
            When {tpType} Price reaches {tp} it will trigger Take Profit Market
            order to close this position. Estimated PNL will be{" "}
            <span
              className={`font-medium 
                ${
                  profit > 0
                    ? "text-positive"
                    : profit < 0
                    ? "text-negative"
                    : ""
                }
              `}
            >
              {profit}
            </span>{" "}
            {quoteAsset}
          </div>
        </div>

        <hr className="mt-3" />

        <div className="flex flex-col gap-y-4 mt-3">
          {slOrderOrig ? (
            <div className="flex flex-row items-center justify-between w-full gap-x-2">
              <div>Stop loss</div>
              <div className="flex items-center gap-x-4">
                <span>
                  {slOrderOrig.workingType === "MARK_PRICE"
                    ? "Mark Price"
                    : "Last Price"}{" "}
                  &gt;= {slOrderOrig.stopPrice}
                </span>
                <button
                  className="text-accent font-medium"
                  onClick={() => {
                    authedRestClient
                      .get()
                      .cancelOrder({
                        symbol: slOrderOrig.symbol,
                        orderId: slOrderOrig.orderId,
                      })
                      .then((res) => {
                        toast.success("Stop Loss order cancelled");
                        setSLOrder(null);
                      })
                      .catch((err) => {
                        console.error(err);
                        toast.error("Failed to cancel Stop Loss order");
                      });
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-row items-center gap-x-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  className="text-right w-full bg-gray-100 border-none"
                  placeholder="0.00"
                  name="takeProfit"
                  value={sl}
                  onInput={(e) => setSL(parseFloat(e.target.value))}
                  step={pricePrecision}
                />
                <label
                  htmlFor="takeProfit"
                  className="absolute"
                  style={{
                    top: "50%",
                    transform: "translateY(-50%)",
                    left: "10px",
                  }}
                >
                  Stop Loss
                </label>
              </div>
              <SelectableMenu
                items={["Mark", "Last"]}
                selected={slType}
                setSelected={(val: "Mark" | "Last") => setSLType(val)}
                className="bg-gray-100 dark:bg-darkTerminalGray p-2"
                style={{ minWidth: "80px" }}
              />
            </div>
          )}
          <div className="text-xs">
            When {slType} Price reaches {sl} it will trigger Stop Loss Market
            order to close this position. Estimated PNL will be{" "}
            <span
              className={`font-medium text-md
                ${loss < 0 ? "text-negative" : loss > 0 ? "text-positive" : ""}
              `}
            >
              {loss}
            </span>{" "}
            {quoteAsset}
          </div>
        </div>

        <div className="text-xs mt-4">
          · This setting applies to the entire position. Take-profit and
          stop-loss automatically cancel after closing the position. A market
          order is triggered when the stop price is reached. The order will be
          rejected if the position size exceeds the Max Market Order Qty limit.
        </div>

        <button
          onClick={placeOrders}
          className="w-full bg-accent text-black font-medium py-2 rounded-md mt-6"
        >
          Confirm
        </button>
      </DialogContent>
    </Dialog>
  );
};
