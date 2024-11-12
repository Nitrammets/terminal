import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "../Dialog";
import { authedRestClient, currentLeverageStore } from "../_connector";
import { Slider } from "../Slider";
import { useStore } from "@nanostores/react";
import { toast } from "react-toastify";

export default function MarginMultiplierSelector({ symbol }) {
  const leverage = useStore(currentLeverageStore);
  const [marginMultiplier, setMarginMultiplier] = useState(leverage);
  const dialogRef = useRef(null);

  useEffect(() => {
    setMarginMultiplier(leverage);
  }, [leverage]);

  return (
    <Dialog>
      <DialogTrigger
        ref={dialogRef}
        className="bg-gray-200 dark:bg-gray-700 text-sm py-1 flex-1 capitalize"
      >
        {leverage}x
      </DialogTrigger>
      <DialogContent className="mx-auto max-w-md rounded bg-white dark:bg-darkDarkBlue p-6">
        <DialogTitle className="flex flex-row items-center text-xl font-semibold gap-x-6 justify-between">
          {symbol} Adjust leverage
        </DialogTitle>

        <div className="flex flex-col gap-y-4">
          <div className="mt-8">
            <label htmlFor="leverage">Leverage</label>
            <div className="flex flex-row font-semibold mt-1">
              <button
                onClick={() => setMarginMultiplier(marginMultiplier - 1)}
                className="bg-gray-100 dark:bg-darkTerminalGray px-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 12h-15"
                  />
                </svg>
              </button>
              <input
                type="number"
                name="leverage"
                className="flex-1 bg-gray-100 border-transparent text-center"
                value={marginMultiplier}
                onChange={(e) => setMarginMultiplier(parseInt(e.target.value))}
              />
              <button
                onClick={() => setMarginMultiplier(marginMultiplier + 1)}
                className="bg-gray-100 dark:bg-darkTerminalGray px-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="pt-8 relative px-4">
            <div className="relative margin-slider">
              <Slider
                min={1}
                max={125}
                value={[marginMultiplier]}
                onValueChange={(e) => setMarginMultiplier(e[0])}
                className=""
              >
                <div className="relative" style={{ width: "calc(100% - 8px)" }}>
                  {Array.from(new Array(6).keys()).map((item, index) => (
                    <div key={index}>
                      <button
                        onClick={() => setMarginMultiplier(index * 25 || 1)}
                        name={"button" + index}
                        style={{
                          left: index * 20 + "%",
                          top: "-2px",
                          background:
                            index * 20 < marginMultiplier / 1.25
                              ? "#fdc156"
                              : "white",
                          outline:
                            index * 20 < marginMultiplier / 1.25
                              ? "2px solid white"
                              : "2px solid #dee2e6",
                          height: "8px",
                          width: "8px",
                        }}
                        className={`absolute rotate-45 }`}
                      ></button>
                      <label
                        onClick={() => setMarginMultiplier(index * 25 || 1)}
                        htmlFor={"button" + index}
                        className="absolute cursor-pointer"
                        style={{
                          marginLeft: "3px",
                          left: index * 20 + "%",
                          top: "20px",
                          transform: "translateX(-50%)",
                        }}
                      >
                        {index * 25 || 1}x
                      </label>
                    </div>
                  ))}
                </div>
              </Slider>
            </div>
          </div>
          <p className="text-sm mt-8">
            · Maximum position at current leverage: 50,000 USDT
          </p>
          <p className="text-sm">
            · Please note that leverage changing will also apply for open
            positions and open orders.
          </p>
          <p className="text-red-500 text-sm">
            Selecting higher leverage such as [10x] increases your liquidation
            risk. Always manage your risk levels. See binances{" "}
            <a
              href="https://www.binance.com/en/support/faq/360033525271"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              help article
            </a>{" "}
            for more information.
          </p>
          <button
            className="bg-accent dark:text-black w-full py-2 mt-6 font-semibold"
            onClick={async () =>
              authedRestClient
                .get()
                .setLeverage({ symbol, leverage: marginMultiplier })
                .then((data) => {
                  toast.success("Leverage adjustment successful");
                })
                .catch((err) => toast.error(err.message))
            }
          >
            Confirm
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
