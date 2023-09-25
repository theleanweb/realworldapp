import * as path from 'node:path';
import { defineConfig } from "vite";
import { leanweb } from "leanweb-kit/vite";

export default defineConfig({
  plugins: [leanweb()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
