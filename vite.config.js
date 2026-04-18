import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // 相对路径，方便在任意子路径部署
  base: "./",
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
  },
});
