import { defineConfig } from "vite";
import { resolve, relative, extname } from "path";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { fileURLToPath } from "node:url";
import { glob } from "glob";
import tailwindcss from "tailwindcss";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
});
