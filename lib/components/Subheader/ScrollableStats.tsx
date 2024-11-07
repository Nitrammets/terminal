import { useRef, useState, useEffect } from "react";
import { ScrollButton } from "./ScrollButton";
import { StatItem } from "./StatItem";

// ScrollableStats.tsx
interface ScrollableStatsProps {
  baseCurrency: string;
  quoteCurrency: string;
  stats: {
    mark: number;
    index: number;
    funding: number;
    countdown: string;
    high24h: number;
    low24h: number;
    volumeBase: number;
    volumeQuote: number;
    openInterest: number;
  };
}

export const ScrollableStats = ({
  baseCurrency,
  quoteCurrency,
  stats,
}: ScrollableStatsProps) => {
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
      const scrollAmount = 150;
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
    <div className="overflow-x-auto no-scrollbar relative w-full">
      {showRightArrow && (
        <ScrollButton direction="right" onClick={() => scroll("right")} />
      )}
      {showLeftArrow && (
        <ScrollButton direction="left" onClick={() => scroll("left")} />
      )}
      <div
        className="px-[16px] flex justify-between items-center h-full overflow-x-auto no-scrollbar relative space-x-4"
        ref={scrollContainerRef}
        onScroll={checkScroll}
      >
        <StatItem label="Mark" value={stats.mark.toLocaleString()} />
        <StatItem
          label="Index"
          value={stats.index.toLocaleString()}
          isUnderlined
        />
        <StatItem
          label="Funding / Countdown"
          value={`${stats.funding}% ${stats.countdown}`}
        />
        <StatItem label="24 High" value={stats.high24h.toLocaleString()} />
        <StatItem label="24 Low" value={stats.low24h.toLocaleString()} />
        <StatItem
          label="24 Volume"
          value={stats.volumeBase.toLocaleString()}
          suffix={baseCurrency}
        />
        <StatItem
          label="24 Volume"
          value={stats.volumeQuote.toLocaleString()}
          suffix={quoteCurrency}
        />
        <StatItem
          label="Open Interest"
          value={stats.openInterest.toLocaleString()}
          suffix={quoteCurrency}
          isUnderlined
        />
      </div>
    </div>
  );
};
