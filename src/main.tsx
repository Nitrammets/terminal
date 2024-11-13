import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./tailwind.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import NewTerminal from "./pages/new-terminal.tsx";
import Trade from "./pages/old-terminal.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Trade symbol={"BTCUSDT"} user={{}} />,
  },
  {
    path: "/new",
    element: <NewTerminal />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
