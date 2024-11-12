import {
  equityStore,
  maintenanceMarginStore,
  longShortRatioStore,
  riskParamViolationStore,
  positionRiskStore,
} from "../_connector";
import { truncate } from "./Util";
import { useStore } from "@nanostores/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../Tooltip";

export default function MarginRatio({ user }) {
  const equity = useStore(equityStore);
  const maintenanceMargin = useStore(maintenanceMarginStore);
  const longShortRatio = useStore(longShortRatioStore);
  const riskParamViolation = useStore(riskParamViolationStore);
  const riskParams = JSON.parse(user?.riskParams || "{}");
  const positionRisk = useStore(positionRiskStore);

  return (
    <div className="bg-lightTerminalGray dark:bg-darkTerminalDark border-l border-b border-gray-200 dark:border-darkTerminalBorder p-4 flex-1">
      <div className="drag-handle font-semibold text-sm">Margin Ratio</div>
      {user ? (
        <div className="flex flex-col gap-y-2 text-sm mt-4">
          <div className="flex flex-row items-center justify-between">
            <div>Margin Ratio</div>
            <div className="flex flex-row items-center">
              <div className="text-lg font-medium monofont">
                {((maintenanceMargin / equity) * 100 || 0).toFixed(2)}%
              </div>
            </div>
          </div>
          <div className="flex flex-row items-center justify-between">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>Maintenance Margin</TooltipTrigger>
                <TooltipContent>
                  <div>
                    The minimum amount of margin balance required to keep your
                    open positions.
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="monofont">{truncate(maintenanceMargin, 2)} USD</div>
          </div>
          <div className="flex flex-row items-center justify-between">
            <div>Equity</div>
            <div className="monofont">{truncate(equity, 2)} USD</div>
          </div>
          <div className="flex flex-row items-center justify-between">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>udubu funds</TooltipTrigger>
                <TooltipContent>
                  <div>Amount of udubu funds allocated to your account.</div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="monofont">
              {truncate(user?.binanceFundsAllocated, 2)} USDT
            </div>
          </div>
          <div className="flex flex-row items-center justify-between">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>udubu fund allocation</TooltipTrigger>
                <TooltipContent>
                  <div>Amount of udubu funds allocated to your positions.</div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="monofont">
              {truncate(
                longShortRatio.platformFundsAllocationPercentage * 100,
                2
              )}{" "}
              %
            </div>
          </div>
          {riskParams.longShortRatioPercentage > -1 && (
            <div className="flex flex-row items-center justify-between">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>Position ratio</TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <div>
                      Ratio of udubu funds allocated to positions. If either of
                      your long or short positions go over{" "}
                      {riskParams.longShortRatioPercentage}% you will get{" "}
                      {riskParams.timeAllowedBeforeLiquidation / 60 / 1000}{" "}
                      minutes to fix the problem before your account gets
                      liquidated.
                      <br />
                      Account status:{" "}
                      {riskParamViolation > -1 ? (
                        <span className="text-red-500">
                          {truncate(
                            (riskParams.timeAllowedBeforeLiquidation -
                              (Date.now() - riskParamViolation)) /
                              1000 /
                              60,
                            0
                          )}{" "}
                          minutes to fix issues
                        </span>
                      ) : (
                        <span className="text-green-500">Safe</span>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="monofont">
                Long{" "}
                <span
                  className={`${
                    longShortRatio.long >=
                      riskParams.longShortRatioPercentage && "text-negative"
                  }`}
                >
                  {truncate(longShortRatio.long, 2)}%
                </span>{" "}
                / Short{" "}
                <span
                  className={`${
                    longShortRatio.short >=
                      riskParams.longShortRatioPercentage && "text-negative"
                  }`}
                >
                  {truncate(longShortRatio.short, 2)}%
                </span>
              </div>
            </div>
          )}
          {riskParams.maximumPositionSizePercentage > -1 && (
            <div className="flex flex-row items-center justify-between">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>Problematic positions</TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <div>
                      You can allocate{" "}
                      {riskParams.maximumPositionSizePercentage}% of udubu funds
                      to a single position.
                      <br />
                      If your position size goes over{" "}
                      {riskParams.maximumPositionSizePercentage}% you will get{" "}
                      {riskParams.timeAllowedBeforeLiquidation / 60 / 1000}{" "}
                      minutes to fix the problem before your account gets
                      liquidated.
                      <br />
                      Account status:{" "}
                      {riskParamViolation > -1 ? (
                        <span className="text-red-500">
                          {truncate(
                            (riskParams.timeAllowedBeforeLiquidation -
                              (Date.now() - riskParamViolation)) /
                              1000 /
                              60,
                            0
                          )}{" "}
                          minutes to fix issues
                        </span>
                      ) : (
                        <span className="text-green-500">Safe</span>
                      )}
                      {Object.entries(positionRisk).map(
                        ([key, value]: [string, number]) => (
                          <div key={key}>
                            <span>{key}: </span>
                            <span
                              className={`${
                                value >=
                                  riskParams.maximumPositionSizePercentage &&
                                "text-negative"
                              }`}
                            >
                              {truncate(value, 2)}%
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="monofont">
                {
                  Object.values(positionRisk).filter(
                    (item) => item >= riskParams.maximumPositionSizePercentage
                  ).length
                }{" "}
                / {Object.keys(positionRisk).length}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>Please log in first</div>
      )}
    </div>
  );
}
