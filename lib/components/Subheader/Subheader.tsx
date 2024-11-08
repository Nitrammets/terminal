import { ChevronDown } from "lucide-react";
import { PriceDisplay } from "./PriceDisplay";
import { ScrollableStats } from "./ScrollableStats";
import { useSearchActions, useSearchOpen } from "./Search/stores/searchStore";
import { Search } from "./Search";

export interface SubheaderProps {
  baseCurrency: string;
  quoteCurrency: string;
}
export function Subheader({ baseCurrency, quoteCurrency }: SubheaderProps) {
  const stats = {
    mark: 75885.0,
    index: 75885.0,
    funding: 0.01,
    countdown: "07:45:51",
    high24h: 75885.0,
    low24h: 74885.0,
    volumeBase: 248885.0,
    volumeQuote: 724885551123.0,
    openInterest: 7885551123.0,
  };

  const { openSearch, closeSearch } = useSearchActions();
  const isSearchOpen = useSearchOpen();

  return (
    <div className="bg-background h-full w-full rounded-lg font-ibm relative flex flex-row">
      <div className="flex h-full" onMouseLeave={closeSearch}>
        <div className="flex items-center space-x-8 px-4 flex-shrink-0">
          <div
            className="flex flex-row justify-center items-center cursor-pointer "
            onMouseEnter={openSearch}
          >
            <h1 className="text-primaryText uppercase font-medium text-[20px]">
              {baseCurrency + quoteCurrency}
            </h1>
            <div className="ml-1 cursor-pointer hover:text-primaryText transition-colors">
              <ChevronDown size={12} className="text-disabledText ml-0" />
            </div>
            {isSearchOpen && (
              <div className="absolute top-full left-0">
                <Search />
              </div>
            )}
          </div>
          <PriceDisplay
            price={75929.6}
            change={1545.4}
            changePercentage={-2.1}
          />
        </div>
      </div>
      <ScrollableStats
        baseCurrency={baseCurrency}
        quoteCurrency={quoteCurrency}
        stats={stats}
      />
    </div>
  );
}
