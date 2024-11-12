import { useRef, useState, useEffect } from "react";

const useContainerHeight = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      if (ref.current) {
        setHeight(ref.current.clientHeight);
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    if (ref.current) {
      resizeObserver.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        resizeObserver.unobserve(ref.current);
      }
    };
  }, []);

  return [ref, height] as const;
};

interface Order {
  price: number;
  size: number;
  sum: number;
}

const OrderBook = () => {
  const generateOrders = (
    basePrice: number,
    count: number,
    isAsk: boolean
  ): Order[] => {
    return Array.from({ length: count }, (_, i) => {
      const price = basePrice + (isAsk ? i * 0.1 : -i * 0.1);
      const size = Math.floor(Math.random() * 50) + 1;
      return {
        price,
        size,
        sum: 0,
      };
    }).map((order, i, arr) => ({
      ...order,
      sum: arr.slice(0, i + 1).reduce((sum, o) => sum + o.size, 0),
    }));
  };

  const allAsks = generateOrders(88914.5, 100, true);
  const allBids = generateOrders(88873.5, 100, false);
  const currentPrice = 88880.8;

  // Refs and measurements
  const [containerRef, containerHeight] = useContainerHeight();
  const [headerRef, setHeaderRef] = useState<HTMLDivElement | null>(null);
  const [priceRef, setPriceRef] = useState<HTMLDivElement | null>(null);

  const calculateVisibleRows = () => {
    if (!headerRef || !priceRef) return 7;

    const availableHeight =
      containerHeight - headerRef.clientHeight - priceRef.clientHeight;
    const rowHeight = 20;
    return Math.floor(availableHeight / (rowHeight * 2));
  };

  const visibleRows = Math.max(calculateVisibleRows(), 5);

  const formatNumber = (num: number) => {
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });
  };

  const maxSum = Math.max(
    ...allAsks.slice(0, visibleRows).map((ask) => ask.sum),
    ...allBids.slice(0, visibleRows).map((bid) => bid.sum)
  );

  return (
    <div
      ref={containerRef}
      className="bg-background p-4 rounded-lg w-full h-full flex flex-col"
    >
      <div
        ref={setHeaderRef}
        className="flex justify-between items-center mb-4"
      >
        <h2 className="text-gray-300 text-sm">Order Book</h2>
        <span className="text-gray-400 text-xs">0.1</span>
      </div>

      <div className="flex-grow flex flex-col min-h-0">
        <div className="grid grid-cols-3 text-xs text-gray-500 mb-2">
          <div>Price(USD)</div>
          <div className="text-right">Size(Cont)</div>
          <div className="text-right">Sum(Cont)</div>
        </div>

        {/* Asks (Sell orders) */}
        <div className="flex-1 overflow-hidden">
          {allAsks.slice(0, visibleRows).map((ask) => (
            <div
              key={ask.price}
              className="grid grid-cols-3 text-xs relative py-0.5"
            >
              <div className="text-red-400 z-10">{formatNumber(ask.price)}</div>
              <div className="text-gray-300 text-right z-10">{ask.size}</div>
              <div className="text-gray-300 text-right z-10">{ask.sum}</div>
              <div
                className="absolute right-0 h-full bg-red-900/20"
                style={{ width: `${(ask.sum / maxSum) * 100}%` }}
              />
            </div>
          ))}
        </div>

        {/* Current Price */}
        <div ref={setPriceRef} className="grid grid-cols-3 text-xs py-2 my-1">
          <div className="text-green-400 flex items-center text-lg">
            {formatNumber(currentPrice)}
          </div>
        </div>

        {/* Bids (Buy orders) */}
        <div className="flex-1 overflow-hidden">
          {allBids.slice(0, visibleRows).map((bid) => (
            <div
              key={bid.price}
              className="grid grid-cols-3 text-xs relative py-0.5"
            >
              <div className="text-green-400 z-10">
                {formatNumber(bid.price)}
              </div>
              <div className="text-gray-300 text-right z-10">{bid.size}</div>
              <div className="text-gray-300 text-right z-10">{bid.sum}</div>
              <div
                className="absolute right-0 h-full bg-green-900/20"
                style={{ width: `${(bid.sum / maxSum) * 100}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
