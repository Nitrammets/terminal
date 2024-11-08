import { Search as SearchIcon } from "lucide-react";
import { useSearchTerm, useSearchActions } from "./stores/searchStore";

const items = [
  {
    id: 1,
    ticker: "USDTBTC",
    volume: "26.3B",
    lastPrice: "740322",
    h24Change: "+2.3%",
    fundingRate: "0.005%",
  },
  {
    id: 2,
    ticker: "1000PEPEUSDC",
    volume: "26.4M",
    lastPrice: "0.0000007212",
    h24Change: "+2.3%",
    fundingRate: "0.002%",
  },
  {
    id: 3,
    ticker: "1000PEPEUSDC",
    volume: "26.4M",
    lastPrice: "0.0000007212",
    h24Change: "+2.3%",
    fundingRate: "0.002%",
  },
  {
    id: 4,
    ticker: "1000PEPEUSDC",
    volume: "26.4M",
    lastPrice: "0.0000007212",
    h24Change: "+2.3%",
    fundingRate: "0.002%",
  },
  {
    id: 5,
    ticker: "1000PEPEUSDC",
    volume: "26.4M",
    lastPrice: "0.0000007212",
    h24Change: "+2.3%",
    fundingRate: "0.002%",
  },
  {
    id: 6,
    ticker: "1000PEPEUSDC",
    volume: "26.4M",
    lastPrice: "0.0000007212",
    h24Change: "+2.3%",
    fundingRate: "0.002%",
  },
  {
    id: 7,
    ticker: "1000PEPEUSDC",
    volume: "26.4M",
    lastPrice: "0.0000007212",
    h24Change: "+2.3%",
    fundingRate: "0.002%",
  },
  {
    id: 8,
    ticker: "1000PEPEUSDC",
    volume: "26.4M",
    lastPrice: "0.0000007212",
    h24Change: "+2.3%",
    fundingRate: "0.002%",
  },
  {
    id: 9,
    ticker: "1000PEPEUSDC",
    volume: "26.4M",
    lastPrice: "0.0000007212",
    h24Change: "+2.3%",
    fundingRate: "0.002%",
  },
  {
    id: 10,
    ticker: "1000PEPEUSDC",
    volume: "26.4M",
    lastPrice: "0.0000007212",
    h24Change: "+2.3%",
    fundingRate: "0.002%",
  },

  {
    id: 11,
    ticker: "1000PEPEUSDC",
    volume: "26.4M",
    lastPrice: "0.0000007212",
    h24Change: "+2.3%",
    fundingRate: "0.002%",
  },
  {
    id: 12,
    ticker: "1000PEPEUSDC",
    volume: "26.4M",
    lastPrice: "0.0000007212",
    h24Change: "+2.3%",
    fundingRate: "0.002%",
  },
  {
    id: 13,
    ticker: "1000PEPEUSDC",
    volume: "26.4M",
    lastPrice: "0.0000007212",
    h24Change: "+2.3%",
    fundingRate: "0.002%",
  },
];

export const Search = () => {
  const searchTerm = useSearchTerm();
  const { setSearchTerm, setSelectedSymbol, closeSearch } = useSearchActions();

  const handleItemClick = (ticker: string) => {
    setSelectedSymbol(ticker);
    closeSearch();
  };

  const filteredItems = items.filter((item) =>
    item.ticker.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className="w-[480px] max-h-[70vh] bg-cardBg rounded-b-[8px] shadow-lg z-50">
      {/* Search Bar */}
      <div className="p-3 border-b border-line">
        <div className="relative flex items-center w-full border-[1px] border-inputLine rounded-lg transition-all hover:border-primaryText focus-within:border-primaryText">
          <div className="absolute left-3 text-tertiaryText">
            <SearchIcon size={16} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-primaryText pl-10 pr-3 py-2 rounded-lg outline-none text-sm font-medium"
            placeholder="Search"
            spellCheck="false"
            autoComplete="off"
          />
        </div>
      </div>
      <div className="pt-2 pb-2 min-w-[200px]">
        <div className="mt-3 max-h-[400px] overflow-y-auto">
          {/* Headers */}
          <div className="grid grid-cols-4 gap-4 mb-2 text-tertiaryText px-2 ">
            <div className="text-xs text-tertiaryText">Symbols/Vol</div>
            <div className="text-xs text-tertiaryText text-right">
              Last Price
            </div>
            <div className="text-xs text-tertiaryText text-right">24h %</div>
            <div className="text-xs text-tertiaryText text-right">
              Funding Rate
            </div>
          </div>
          {/* Items */}
          {filteredItems.map((item) => (
            <div
              onClick={() => handleItemClick(item.ticker)}
              key={item.id}
              className="grid grid-cols-4 gap-4 py-1 cursor-pointer transition-all hover:bg-input"
            >
              <div className="flex flex-col pl-3">
                <span className="text-sm text-primaryText">{item.ticker}</span>
                <span className="text-xs text-tertiaryText">
                  Vol {item.volume}
                </span>
              </div>
              <div className="text-sm text-primaryText text-right">
                {item.lastPrice}
              </div>
              <div
                className={`text-sm text-right ${
                  item.h24Change.startsWith("+") ? "text-buy" : "text-sell"
                }`}
              >
                {item.h24Change}
              </div>
              <div className="text-sm text-primaryText text-right pr-3">
                {item.fundingRate}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
