import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { writeFileSync } from "fs";
import { resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Vite plugin that generates a version.json manifest in the build output.
 * Used by useVersionCheck hook to detect new deployments and auto-reload.
 * Only fires during `vite build` (closeBundle), never during `vite dev`.
 */
function versionStampPlugin() {
  let outDir = "dist";
  return {
    name: "version-stamp",
    configResolved(config: { build: { outDir: string } }) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const manifest = {
        buildId: Date.now().toString(),
        timestamp: new Date().toISOString(),
      };
      writeFileSync(resolve(outDir, "version.json"), JSON.stringify(manifest));
      console.log(`[version-stamp] Generated version.json: ${manifest.buildId}`);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), versionStampPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

