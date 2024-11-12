import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { persistentAtom } from "@nanostores/persistent";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const themeStore = persistentAtom<string>("theme");

themeStore.subscribe((theme) => {
  if (typeof window === "undefined") return;
  localStorage?.setItem("tradingview.current_theme.name", theme);
});
