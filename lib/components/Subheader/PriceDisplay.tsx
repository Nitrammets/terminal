interface PriceDisplayProps {
  price: number;
  change: number;
  changePercentage: number;
}

export const PriceDisplay = ({
  price,
  change,
  changePercentage,
}: PriceDisplayProps) => (
  <div className="h-full flex flex-col justify-center items-start tracking-tighter">
    <div className="text-[20px] text-buy font-medium m-0 p-0 leading-[28px]">
      {price.toLocaleString()}
    </div>
    <div className="text-[12px] text-sell font-medium">
      <span className="mr-2">{change.toLocaleString()}</span>
      <span>{changePercentage}%</span>
    </div>
  </div>
);
