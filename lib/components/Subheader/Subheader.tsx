import { ScrollableStats } from "./ScrollableStats";
import { HeaderInfo } from "./HeaderInfo";

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

  return (
    <div className="bg-background h-full w-full rounded-lg font-ibm relative flex flex-row">
      <HeaderInfo baseCurrency={baseCurrency} quoteCurrency={quoteCurrency} />
      <ScrollableStats
        baseCurrency={baseCurrency}
        quoteCurrency={quoteCurrency}
        stats={stats}
      />
    </div>
  );
}
