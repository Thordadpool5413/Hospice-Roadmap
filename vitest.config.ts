import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["lib/**/__tests__/**/*.test.ts", "artifacts/**/__tests__/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@workspace/db": path.resolve(__dirname, "lib/db/src/index.ts"),
    },
  },
});
