import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// Types for the terminal state
export interface Pair {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  isActive: boolean;
}

export type ChartInterval =
  | "1m"
  | "3m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "4h"
  | "6h"
  | "8h"
  | "12h"
  | "1d"
  | "3d"
  | "1w"
  | "1M";

export interface Layout {
  showOrderbook: boolean;
  showTrades: boolean;
  showChart: boolean;
  chartHeight: number;
  orderBookDepth: number;
}

interface TerminalState {
  // State
  selectedPair: Pair | null;
  watchlist: Pair[];
  favoritesPairs: string[];
  selectedInterval: ChartInterval;
  layout: Layout;
  isFullscreen: boolean;

  // Actions
  selectPair: (pair: Pair) => void;
  addToWatchlist: (pair: Pair) => void;
  removeFromWatchlist: (symbol: string) => void;
  toggleFavorite: (symbol: string) => void;
  setInterval: (interval: ChartInterval) => void;
  updateLayout: (layout: Partial<Layout>) => void;
  toggleFullscreen: () => void;
  resetLayout: () => void;
}

const DEFAULT_LAYOUT: Layout = {
  showOrderbook: true,
  showTrades: true,
  showChart: true,
  chartHeight: 600,
  orderBookDepth: 25,
};

export const useTerminalStore = create<TerminalState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        selectedPair: null,
        watchlist: [],
        favoritesPairs: [],
        selectedInterval: "15m",
        layout: DEFAULT_LAYOUT,
        isFullscreen: false,

        // Actions
        selectPair: (pair: Pair) => {
          set({ selectedPair: pair });
        },

        addToWatchlist: (pair: Pair) => {
          const { watchlist } = get();
          const exists = watchlist.some((p) => p.symbol === pair.symbol);

          if (!exists) {
            set({ watchlist: [...watchlist, pair] });
          }
        },

        removeFromWatchlist: (symbol: string) => {
          const { watchlist } = get();
          set({
            watchlist: watchlist.filter((pair) => pair.symbol !== symbol),
          });
        },

        toggleFavorite: (symbol: string) => {
          const { favoritesPairs } = get();
          const isFavorite = favoritesPairs.includes(symbol);

          set({
            favoritesPairs: isFavorite
              ? favoritesPairs.filter((s) => s !== symbol)
              : [...favoritesPairs, symbol],
          });
        },

        setInterval: (interval: ChartInterval) => {
          set({ selectedInterval: interval });
        },

        updateLayout: (layoutUpdate: Partial<Layout>) => {
          const { layout } = get();
          set({
            layout: {
              ...layout,
              ...layoutUpdate,
            },
          });
        },

        toggleFullscreen: () => {
          set((state) => ({ isFullscreen: !state.isFullscreen }));
        },

        resetLayout: () => {
          set({ layout: DEFAULT_LAYOUT });
        },
      }),
      {
        name: "terminal-storage",
        partialize: (state) => ({
          watchlist: state.watchlist,
          favoritesPairs: state.favoritesPairs,
          layout: state.layout,
          selectedInterval: state.selectedInterval,
        }),
      }
    )
  )
);

// Selector hooks for better performance
export const useSelectedPair = () =>
  useTerminalStore((state) => state.selectedPair);
export const useWatchlist = () => useTerminalStore((state) => state.watchlist);
export const useFavorites = () =>
  useTerminalStore((state) => state.favoritesPairs);
export const useLayout = () => useTerminalStore((state) => state.layout);
export const useInterval = () =>
  useTerminalStore((state) => state.selectedInterval);
