import { defineConfig } from "vite";
import { leanweb } from "leanweb-kit/vite";

export default defineConfig({
  plugins: [leanweb()],
});
