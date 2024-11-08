// HeaderInfo.tsx
import { PriceDisplay } from "./PriceDisplay";
import { useSearchActions } from "./Search/stores/searchStore";
import { TickerSelector } from "./TickerSelector";

interface HeaderInfoProps {
  baseCurrency: string;
  quoteCurrency: string;
}

export const HeaderInfo = ({
  baseCurrency,
  quoteCurrency,
}: HeaderInfoProps) => {
  const { closeSearch } = useSearchActions();

  return (
    <div className="flex h-full" onMouseLeave={closeSearch}>
      <div className="flex items-center space-x-8 px-4 flex-shrink-0">
        <TickerSelector
          baseCurrency={baseCurrency}
          quoteCurrency={quoteCurrency}
        />
        <PriceDisplay price={75929.6} change={1545.4} changePercentage={-2.1} />
      </div>
    </div>
  );
};
