import { useMemo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { Subheader } from "../components/NewTerminal/Subheader";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import OrderBook from "../components/NewTerminal/OrderBook/OrderBook";

const UIBreakpoints = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
};

function NewTerminal() {
  const layouts = {
    lg: [
      {
        i: "subheader",
        x: 0,
        y: 2,
        w: 10,
        h: 2,
        minH: 2,
        maxH: 2,
      },
      {
        i: "order-book",
        x: 10,
        y: 2,
        w: 2,
        h: 12,
      },
    ],
    md: [
      {
        i: "subheader",
        x: 0,
        y: 2,
        w: 10,
        h: 2,
      },
    ],
    sm: [
      {
        i: "subheader",
        x: 0,
        y: 2,
        w: 6,
        h: 2,
      },
    ],
    xs: [
      {
        i: "subheader",
        x: 0,
        y: 2,
        w: 4,
        h: 2,
      },
    ],
  };

  const ResponsiveGridLayout = useMemo(() => WidthProvider(Responsive), []);

  return (
    <>
      <ResponsiveGridLayout
        className="layout"
        rowHeight={30}
        compactType={"vertical"}
        containerPadding={[0, 0]}
        margin={[4, 4]}
        breakpoints={UIBreakpoints}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
        layouts={layouts}
        draggableHandle=".drag-handle"
        onBreakpointChange={() => {
          setTimeout(() => {
            const event = new Event("resize");
            window.dispatchEvent(event);
          }, 0);
        }}
      >
        <div key="subheader" className="">
          <Subheader baseCurrency="BTC" quoteCurrency="USDT" />
        </div>
        <div key="order-book" className="">
          <OrderBook />
        </div>
      </ResponsiveGridLayout>
    </>
  );
}

export default NewTerminal;
