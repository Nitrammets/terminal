import { tradesStore, wsClient } from "../_connector";
import { useStore } from "@nanostores/react";

export default function Trades({ pair, formatterBase, formatterQuote }) {
  const trades = useStore(tradesStore);

  return (
    <div className="flex flex-col border-l border-b border-gray-100 bg-lightTerminalGray dark:border-darkTerminalBorder dark:bg-darkTerminalDark flex-1">
      <div className="text-sm font-semibold pt-4 pl-4 pr-4 drag-handle hidden lg:block">
        Trades
      </div>
      <div className="flex flex-row items-center justify-between p-4">
        <div className="w-4/12 text-[#474d57] dark:text-gray-300 text-xs">
          Price({pair[1]})
        </div>
        <div className="w-4/12 text-right text-[#474d57] dark:text-gray-300 text-xs">
          Amount({pair[0]})
        </div>
        <div className="w-4/12 text-right text-[#474d57] dark:text-gray-300 text-xs">
          Time
        </div>
      </div>
      <div
        className="flex flex-col gap-y-1 pl-4 pb-4 relative flex-1 no-scrollbar"
        id="scroll"
        style={{ overflowY: "scroll" }}
      >
        {trades.map((trade, index) => (
          <div
            key={trade.tradeId}
            className="flex flex-row items-center justify-between pr-4 font-medium"
          >
            <div
              className="w-4/12 monofont text-xs"
              style={{ color: !trade.maker ? "#0ecb81" : "#f6465d" }}
            >
              {formatterQuote.format(trade.price)}
            </div>
            <div className="text-right w-4/12 text-[#474d57] dark:text-gray-300 monofont text-xs">
              {formatterBase.format(trade.quantity)}
            </div>
            <div className="text-right w-4/12 text-[#474d57] dark:text-gray-300 monofont text-xs">
              {new Date(trade.time).toLocaleTimeString([], { hour12: false })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
