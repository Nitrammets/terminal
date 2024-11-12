import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./tailwind.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import NewTerminal from "./pages/new-terminal.tsx";
import Trade from "./pages/old-terminal.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <NewTerminal />,
  },
  {
    path: "/old",
    element: <Trade symbol={"BTCUSDT"} user={{}} />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
