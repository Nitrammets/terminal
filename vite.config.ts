import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), dts({ include: ["lib"] })],
  build: {
    rollupOptions: {
      external: ["react", "react/jsx-runtime"],
      output: {
        // Prevent generating JS files in lib folder
        preserveModules: true,
        preserveModulesRoot: "src",
        dir: "dist", // Output to dist instead of lib
        format: "es",
        entryFileNames: "[name].js",
        // Prevent chunks
        manualChunks: undefined,
      },
    },
    sourcemap: false,
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, "lib/main.ts"),
      formats: ["es"],
    },
  },
});
