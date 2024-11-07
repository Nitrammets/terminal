import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface SubheaderProps {
  baseCurrency: string;
  quoteCurrency: string;
}

export function Subheader({ baseCurrency, quoteCurrency }: SubheaderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(true);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      const newScrollLeft =
        scrollContainerRef.current.scrollLeft +
        (direction === "left" ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="bg-background h-full w-full rounded-lg font-ibm relative flex flex-row">
      <div className="flex h-full">
        {/* Fixed section - Always visible */}
        <div className="flex items-center space-x-8 px-4 flex-shrink-0">
          {/* Selected ticker */}
          <h1 className="text-primaryText uppercase font-medium text-[20px]">
            {baseCurrency + quoteCurrency}
          </h1>

          {/* Price + change */}
          <div className="h-full flex flex-col justify-center items-start tracking-tighter">
            <div className="text-[20px] text-buy font-medium m-0 p-0 leading-[28px]">
              75929.6
            </div>
            <div className="text-[12px] text-sell font-medium">
              <span className="mr-2">1,545.40</span> <span>-2.10%</span>
            </div>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto no-scrollbar relative w-full">
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 h-full px-2 flex items-center"
          >
            <ChevronRight className="text-primaryText w-4 h-4" />
          </button>
        )}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 h-full px-2 flex items-center"
          >
            <ChevronLeft className="text-primaryText w-4 h-4" />
          </button>
        )}
        <div
          className="px-[16px] flex justify-between items-center h-full overflow-x-auto no-scrollbar relative space-x-4"
          ref={scrollContainerRef}
          onScroll={checkScroll}
        >
          {/* Mark price */}
          <div className="text-disabledText text-[12px] flex-shrink-0 min-w-max">
            <div className="text-nowrap">Mark</div>
            <div className="text-primaryText text-[12px]">75,885.0</div>
          </div>

          {/* Index price */}
          <div className="text-disabledText text-[12px] ">
            <div className="underline text-nowrap">Index</div>
            <div className="text-primaryText text-[12px]">75,885.0</div>
          </div>

          {/* Funding / countdown */}
          <div className="text-disabledText text-[12px]">
            <div className="text-nowrap">Funding / Countdown</div>
            <div className="text-primaryText text-[12px]">
              0.0100%{" "}
              <span className="underline decoration-dotted">07:45:51</span>
            </div>
          </div>

          {/* 24h high */}
          <div className="text-disabledText text-[12px] ">
            <div className="text-nowrap">24 High</div>
            <div className="text-primaryText text-[12px]">75,885.0</div>
          </div>

          {/* 24h low */}
          <div className="text-disabledText text-[12px] ">
            <div className="text-nowrap">24 low</div>
            <div className="text-primaryText text-[12px]">74,885.0</div>
          </div>

          {/* 24h Volume(Base currency) */}
          <div className="text-disabledText text-[12px] ">
            <div className="text-nowrap">{`24 Volume(${baseCurrency})`}</div>
            <div className="text-primaryText text-[12px]">248,885.0</div>
          </div>

          {/* 24h Volume(Quote Currency) */}
          <div className="text-disabledText text-[12px] ">
            <div className="text-nowrap">{`24 Volume(${quoteCurrency})`}</div>
            <div className="text-primaryText text-[12px]">
              724,885,551,123.0
            </div>
          </div>

          {/* Open interest (Quote currency)*/}
          <div className="text-disabledText text-[12px] ">
            <div className="text-nowrap">
              <span className="underline">Open Interest</span>
              <span>({quoteCurrency})</span>
            </div>
            <div className="text-primaryText text-[12px]">7,885,551,123.0</div>
          </div>
        </div>
      </div>
    </div>
  );
}
