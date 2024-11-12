import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "../Dialog";
import { authedRestClient, currentMarginTypeStore } from "../_connector";
import { toast } from "react-toastify";
import { useStore } from "@nanostores/react";

const setAccountMarginMode = async ({ symbol, marginMode }) =>
  authedRestClient
    .get()
    .setMarginType({
      symbol,
      marginType: marginMode, //'ISOLATED' | 'CROSSED';
    })
    .then(() => {
      toast.success("Margin mode updated successfully");
      return true;
    })
    .catch((err) => {
      toast.error(err.message);
    });

export default function MarginModeSelector({ symbol }) {
  const currentMarginType = useStore(currentMarginTypeStore);
  const [currentMarginMode, setCurrentMarginMode] = useState(currentMarginType);
  const dialogRef = useRef(null);

  useEffect(() => {
    setCurrentMarginMode(currentMarginType);
  }, [currentMarginType]);

  return (
    <Dialog>
      <DialogTrigger
        ref={dialogRef}
        className="bg-gray-200 dark:bg-gray-700 text-sm py-1 flex-1 capitalize"
      >
        {currentMarginType === "CROSSED" ? "Cross" : "Isolated"}
      </DialogTrigger>
      <DialogContent className="mx-auto max-w-md rounded bg-white dark:bg-darkDarkBlue p-6">
        <DialogTitle className="flex flex-row items-center text-xl font-semibold gap-x-6 justify-between">
          {symbol} Perpetual Margin Mode
        </DialogTitle>

        <div className="flex flex-row items-center gap-x-2 mt-8 font-semibold">
          <button
            onClick={() => setCurrentMarginMode("CROSSED")}
            className={`flex-1 bg-gray-200 dark:bg-darkTerminalGray py-2 rounded border ${
              currentMarginMode === "CROSSED"
                ? "border-accent"
                : "border-transparent"
            }`}
          >
            Cross
          </button>
          <button
            onClick={() => setCurrentMarginMode("ISOLATED")}
            className={`flex-1 bg-gray-200 dark:bg-darkTerminalGray py-2 rounded border ${
              currentMarginMode === "ISOLATED"
                ? "border-accent"
                : "border-transparent"
            }`}
          >
            Isolated
          </button>
        </div>

        <p className="text-sm mt-6">
          · Switching the margin mode will only apply it to the selected
          contract.
        </p>
        <hr className="mt-4" />
        <p className="text-sm">
          <b>Cross Margin Mode:</b> All cross positions under the same margin
          asset share the same asset cross margin balance. In the event of
          liquidation, your assets full margin balance along with any remaining
          open positions under the asset may be forfeited.
        </p>
        <p className="text-sm">
          <b>Isolated Margin Mode:</b> Manage your risk on individual positions
          by restricting the amount of margin allocated to each. If the margin
          ratio of a position reached 100%, the position will be liquidated.
          Margin can be added or removed to positions using this mode.
        </p>
        <button
          className="bg-accent dark:text-black w-full py-2 mt-6 font-semibold"
          onClick={() => {
            setAccountMarginMode({ symbol, marginMode: currentMarginMode });
          }}
        >
          Confirm
        </button>
      </DialogContent>
    </Dialog>
  );
}
