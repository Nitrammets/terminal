import { DataGrid } from "@sylchi/reusable-components/dist/esm/index.mjs";
import { accountAssetStore } from "../_connector";
import { useStore } from "@nanostores/react";

export default function Assets() {
  const assets = useStore(accountAssetStore);
  return (
    <>
      <DataGrid
        columns={[
          { title: "Assets", field: "asset" },
          { title: "Wallet Balance", field: "walletBalance" },
          { title: "Unrealized PnL", field: "unrealizedProfit" },
          { title: "Margin Balance", field: "marginBalance" },
          { title: "Maint. Margin", field: "maintMargin" },
          { title: "Available for Order", field: "availableBalance" },
        ]}
        rows={assets}
        classes={{
          cellClasses:
            "pl-2 flex flex-col justify-center text-sm text-gray-600 py-1 dark:text-gray-200 py-1",
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
    </>
  );
}
