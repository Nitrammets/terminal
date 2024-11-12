import { useEffect, useState } from "react";
import {
  authedRestClient,
  getUSDMClientOptions,
  getWsClientOptions,
  breakPointStore,
  currentLeverageStore,
  currentMarginTypeStore,
} from "../_connector";
import { selectedAccount } from "./TradingAccountSelector";

import type { FuturesAccountPositionExtended } from "../_workers/positionWorker";
import { OrderResultExtended } from "../_workers/openOrderWorker";
import { atom } from "nanostores";
import { useStore } from "@nanostores/react";
import Positions from "../userInfo/Positions";
import OrderHistory from "../userInfo/OrderHistory";
import OpenOrders from "../userInfo/OpenOrders";
import Assets from "../userInfo/Assets";
import { Checkbox } from "../Checkbox";

const TABS = ["Positions", "Open Orders", "Order History", "Assets"];

export const positionStore = atom([]);

export default function UserInfo({ symbol, pair, exchangeInfo, user }) {
  const [selectedTab, setSelectedTab] = useState<string>(TABS[0]);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [hideOthers, setHideOthers] = useState<boolean>(false);
  const [positions, setPositions] = useState<FuturesAccountPositionExtended[]>(
    []
  );
  const [openOrders, setOpenOrders] = useState<OrderResultExtended[]>([]);
  const [positionWorker, setPositionWorker] = useState<Worker>();
  const [openOrderWorker, setOpenOrderWorker] = useState<Worker>();
  const breakPoint = useStore(breakPointStore);

  const getPositions = () =>
    (hideOthers
      ? positions?.filter((item) => item.symbol === symbol)
      : positions) || [];

  useEffect(() => {
    if (positionWorker) {
      positionWorker.postMessage({
        action: "setHideOtherSymbols",
        value: hideOthers,
      });
    }
  }, [hideOthers]);

  useEffect(() => {
    if (selectedAccount.get()?.apiKey || user?.hasUdubuApiAccount) {
      const positionWorker = new Worker(
        new URL("../../_workers/positionWorker.ts", import.meta.url),
        { type: "module" }
      );
      const openOrderWorker = new Worker(
        new URL("../../_workers/openOrderWorker.ts", import.meta.url),
        { type: "module" }
      );
      positionWorker.onmessage = ({ data: { data } }) => {
        setPositions(data);
      };
      openOrderWorker.onmessage = ({ data: { data } }) => {
        setOpenOrders(data);
      };
      positionWorker.postMessage({
        action: "init",
        symbol,
        wsClientOptions: getWsClientOptions(true),
        usdmClientOptions: getUSDMClientOptions(true),
        exchangeInfo,
        hideOthers,
      });
      openOrderWorker.postMessage({
        action: "init",
        symbol,
        wsClientOptions: getWsClientOptions(true),
        usdmClientOptions: getUSDMClientOptions(true),
        exchangeInfo,
      });
      setPositionWorker(positionWorker);
      setOpenOrderWorker(openOrderWorker);

      return () => {
        positionWorker.terminate();
        openOrderWorker.terminate();
      };
    }
  }, []);

  useEffect(() => {
    if (selectedAccount.get()?.apiKey || user?.hasUdubuApiAccount) {
      switch (selectedTab) {
        case "Order History": {
          authedRestClient
            .get()
            .getAllOrders({ symbol })
            .then((history) => setOrderHistory(history.reverse()));
          break;
        }
      }
    }
  }, [selectedTab]);

  return (
    <div className="bg-lightTerminalGray dark:bg-darkTerminalDark dark:border-darkTerminalBorder border-l border-b border-gray-200 flex-grow-0 flex flex-col w-full">
      <div
        className="flex flex-row overflow-x-scroll no-scrollbar px-3"
        style={{ minHeight: "36px" }}
      >
        <div className="flex flex-row items-center gap-x-4 flex-grow-0 flex-shrink-0">
          {TABS.map((tab, index) => (
            <button
              key={index}
              onClick={() => setSelectedTab(tab)}
              className={`py-2 text-sm whitespace-nowrap font-medium ${
                selectedTab === tab ? "text-accent" : "text-gray-500"
              }`}
            >
              {tab}
              {tab === "Positions" && " (" + positions.length + ")"}
              {tab === "Open Orders" && " (" + (openOrders?.length || 0) + ")"}
            </button>
          ))}
        </div>
        {!["xs", "sm"].includes(breakPoint) && (
          <>
            <div className="drag-handle flex-1"></div>
            <div className="flex flex-row items-center gap-x-2 mr-3 text-gray-600 text-sm">
              <Checkbox
                name="hideOthers"
                checked={hideOthers}
                onCheckedChange={(checked) => setHideOthers(checked as boolean)}
              />
              <label htmlFor="hideOthers" className="dark:text-gray-400">
                Hide other symbols
              </label>
            </div>
          </>
        )}
      </div>

      {["xs", "sm"].includes(breakPoint) && (
        <div className="flex flex-row items-center gap-x-2 mr-3 ml-2 text-gray-600 text-sm">
          <Checkbox
            name="hideOthers"
            checked={hideOthers}
            onCheckedChange={(checked) => setHideOthers(checked as boolean)}
          />
          <label htmlFor="hideOthers">Hide other symbols</label>
        </div>
      )}

      {selectedTab === "Positions" && (
        <Positions
          positions={getPositions()}
          hideOthers={hideOthers}
          symbol={symbol}
          openOrders={openOrders}
        />
      )}
      {selectedTab === "Open Orders" && <OpenOrders openOrders={openOrders} />}
      {selectedTab === "Order History" && (
        <OrderHistory history={orderHistory || []} pair={pair} />
      )}
      {selectedTab === "Assets" && <Assets />}
    </div>
  );
}
