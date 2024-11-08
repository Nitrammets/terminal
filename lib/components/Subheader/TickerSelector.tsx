import { ChevronDown } from "lucide-react";
import { useSearchActions, useSearchOpen } from "./Search/stores/searchStore";
import { Search } from "./Search";

interface TickerSelectorProps {
  baseCurrency: string;
  quoteCurrency: string;
}

export const TickerSelector = ({
  baseCurrency,
  quoteCurrency,
}: TickerSelectorProps) => {
  const { openSearch } = useSearchActions();
  const isSearchOpen = useSearchOpen();

  return (
    <div
      className="flex flex-row justify-center items-center cursor-pointer"
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
  );
};
