import { DataGrid } from "@sylchi/reusable-components/dist/esm/index.mjs";
import { authedRestClient, breakPointStore } from "../_connector";
import { useStore } from "@nanostores/react";
import type { OrderResultExtended } from "../_workers/openOrderWorker";

const FuturesOpenOrderMobile = ({
  openOrder,
}: {
  openOrder: OrderResultExtended;
}) => {
  const isLong = openOrder.side === "BUY";
  return (
    <div key={openOrder.symbol} className="p-2 flex flex-col gap-y-2">
      <div className="flex flex-row items-center justify-between">
        <div className="text-sm font-medium">
          <span className={isLong ? "text-positive" : "text-negative"}>
            &#x2022;&nbsp;
          </span>
          {openOrder.symbol} Perpetual
        </div>
        <button
          className="text-xs rounded-md py-1 px-2 bg-gray-200 dark:bg-gray-600 font-medium"
          onClick={() =>
            authedRestClient.get().cancelOrder({
              symbol: openOrder.symbol,
              orderId: openOrder.orderId,
            })
          }
        >
          Cancel
        </button>
      </div>
      <div className="flex flex-row items-center justify-between">
        <div className="text-xs text-gray-400">Price</div>
        <div className={`text-xs font-medium monofont`}>
          {openOrder.price || "-"}
        </div>
      </div>
      <div className="flex flex-row items-center justify-between">
        <div className="text-xs text-gray-400">Amount</div>
        <div className={`text-xs font-medium monofont`}>
          {openOrder.closePosition ? "Close Position" : openOrder.origQty}
        </div>
      </div>
      <div className="flex flex-row items-center justify-between">
        <div className="text-xs text-gray-400">Filled</div>
        <div className={`text-xs font-medium monofont`}>
          {openOrder.executedQty}{" "}
          {openOrder.symbol.replace("USDT", "").replace("BUSD", "")}
        </div>
      </div>
      <div className="flex flex-row items-center justify-between">
        <div className="text-xs text-gray-400">Reduce only</div>
        <div className={`text-xs font-medium`}>
          {openOrder.reduceOnly ? "Yes" : "No"}
        </div>
      </div>
      <div className="flex flex-row items-center justify-between">
        <div className="text-xs text-gray-400">Post only</div>
        <div className={`text-xs font-medium`}>
          {openOrder.timeInForce === "GTE_GTC" ? "Yes" : "No"}
        </div>
      </div>
      <div className="flex flex-row items-center justify-between">
        <div className="text-xs text-gray-400">Trigger Conditions</div>
        <div className={`text-xs font-medium`}>{openOrder.activatePrice}</div>
      </div>
      <div className="flex flex-row items-center justify-between">
        <div className="text-xs text-gray-400">TP/SL</div>
        <div className={`text-xs font-medium`}></div>
      </div>
      <div className="flex flex-row items-center justify-between">
        <div className="text-xs text-gray-400">Date</div>
        <div className={`text-xs font-medium`}>
          {new Date(openOrder.time).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default function OpenOrders({
  openOrders,
}: {
  openOrders: OrderResultExtended[];
}) {
  const breakPoint = useStore(breakPointStore);
  return ["xs", "sm"].includes(breakPoint) ? (
    <div className="overflow-y-scroll no-scrollbar relative pb-16">
      {openOrders.map((openOrder) => (
        <FuturesOpenOrderMobile
          key={openOrder.clientOrderId}
          openOrder={openOrder}
        />
      ))}
    </div>
  ) : (
    <DataGrid
      columns={[
        {
          title: "Time",
          field: "time",
          format: (val, row) => new Date(val).toLocaleString("et-EE"),
        },
        {
          title: "Symbol",
          field: "symbol",
          format: (val, row) => (
            <div className="flex flex-row items-center font-sans">
              <div>
                <div className="font-bold text-xs">{val}</div>
                <div className="text-xs font-medium">Perpetual</div>
              </div>
            </div>
          ),
        },
        {
          title: "Type",
          field: "type",
          format: (val) => (
            <span className="capitalize">
              {val.toLowerCase().replace(/_/g, " ")}
            </span>
          ),
        },
        {
          title: "Side",
          field: "side",
          format: (val) => (
            <span
              className={`capitalize ${
                val === "BUY" ? "text-positive" : "text-negative"
              }`}
            >
              {val.toLowerCase()}
            </span>
          ),
        },
        {
          title: "Price",
          field: "price",
        },
        {
          title: "Amount",
          field: "origQty",
          format: (val, row) => (row.closePosition ? "Close Position" : val),
        },
        {
          title: "Filled",
          field: "executedQty",
        },
        {
          title: "Reduce Only",
          field: "reduceOnly",
          format: (val) => (val ? "Yes" : "No"),
        },
        {
          title: "Post Only",
          field: "timeInForce",
          format: (val) => (val === "GTX" ? "Yes" : "No"),
        },
        {
          title: "Trigger Conditions",
          field: "stopPrice",
          format: (val, row) => (val ? val : "-"),
        },
        {
          title: "TP/SL",
          field: "",
        },
        {
          title: "Cancel All",
          field: "",
          format: (val, row) => (
            <button
              className="ml-2"
              onClick={() =>
                authedRestClient
                  .get()
                  .cancelOrder({ symbol: row.symbol, orderId: row.orderId })
              }
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
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </button>
          ),
        },
      ]}
      rows={openOrders}
      classes={{
        cellClasses:
          "pl-2 flex flex-col justify-center text-sm text-gray-600 monofont py-1 dark:text-gray-200",
        headerClasses:
          "text-xs py-1 shadow-sm font-normal text-gray-600 dark:text-gray-300 dark:bg-darkTerminalDark dark:border-b dark:border-darkTerminalBorder",
        containerClasses:
          "shadow-none overflow-y-scroll grid-rows-minContent no-scrollbar",
        evenRowClasses:
          "bg-inherit border-b border-gray-100 dark:border-gray-700 dark:bg-darkTerminalDark",
        oddRowClasses:
          "bg-inherit border-b border-gray-100 dark:border-gray-700 dark:bg-darkTerminalDark",
      }}
    />
  );
}
