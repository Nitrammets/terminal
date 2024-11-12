import { create } from "zustand";

interface SearchState {
  isSearchOpen: boolean;
  searchTerm: string;
  selectedSymbol: string | null;
  actions: {
    openSearch: () => void;
    closeSearch: () => void;
    toggleSearch: () => void;
    setSearchTerm: (term: string) => void;
    setSelectedSymbol: (symbol: string | null) => void;
    resetSearch: () => void;
  };
}

const useSearchStore = create<SearchState>((set) => ({
  isSearchOpen: false,
  searchTerm: "",
  selectedSymbol: null,
  actions: {
    openSearch: () => set({ isSearchOpen: true }),
    closeSearch: () => set({ isSearchOpen: false }),
    toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
    setSearchTerm: (term: string) => set({ searchTerm: term }),
    setSelectedSymbol: (symbol: string | null) =>
      set({ selectedSymbol: symbol }),
    resetSearch: () =>
      set({
        isSearchOpen: false,
        searchTerm: "",
        selectedSymbol: null,
      }),
  },
}));

export default useSearchStore;

export const useSearchOpen = () =>
  useSearchStore((state) => state.isSearchOpen);
export const useSearchTerm = () => useSearchStore((state) => state.searchTerm);
export const useSelectedSymbol = () =>
  useSearchStore((state) => state.selectedSymbol);
export const useSearchActions = () => useSearchStore((state) => state.actions);
