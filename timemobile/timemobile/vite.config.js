import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import commonjs from "@rollup/plugin-commonjs";

export default defineConfig({
  plugins: [vue(), commonjs()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["lokijs"],
  },
  build: {
    rollupOptions: {
      external: ["lokijs"], // optional if you want to exclude from bundle
    },
  },
});
