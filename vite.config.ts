import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  server: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4174,
    strictPort: true,
  },
  build: {
    assetsInlineLimit: 2_000,
    emptyOutDir: true,
    minify: "terser",
    sourcemap: false,
    terserOptions: {
      compress: {
        passes: 3,
      },
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
