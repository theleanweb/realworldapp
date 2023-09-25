import * as path from "node:path";
import { defineConfig } from "vite";

import adapter from "@leanweb-kit/adapter-vercel";
import { leanweb } from "leanweb-kit/vite";

export default defineConfig({
  plugins: [leanweb({ adapter: adapter({ maxDuration: 1000 }) })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
