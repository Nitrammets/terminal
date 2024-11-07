import { useMemo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { Subheader } from "../lib/main";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const UIBreakpoints = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
};

function App() {
  const layouts = {
    lg: [
      {
        i: "subheader",
        x: 0,
        y: 2,
        w: 12,
        h: 2,
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
        margin={[0, 0]}
        breakpoints={UIBreakpoints}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
        layouts={layouts}
        draggableHandle=".drag-handle"
      >
        <div key="subheader" className="">
          <Subheader baseCurrency="BTC" quoteCurrency="USDT" />
        </div>
      </ResponsiveGridLayout>
      <Subheader baseCurrency="BTC" quoteCurrency="USDT" />
    </>
  );
}

export default App;
