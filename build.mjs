import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { build } from "esbuild";
import { buildFeeds } from "./src/core/feeds.ts";

await build({
  entryPoints: ["src/cli.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  outfile: "dist/cli.js",
  banner: { js: "#!/usr/bin/env node" },
  legalComments: "none",
});
chmodSync("dist/cli.js", 0o755);

await build({
  entryPoints: ["src/web/main.ts"],
  bundle: true,
  platform: "browser",
  format: "esm",
  target: "es2020",
  outfile: "site/app.js",
  minify: true,
  legalComments: "none",
});

// Feeds cover last year to two years ahead, and roll forward on the monthly rebuild.
const now = new Date();
const year = now.getUTCFullYear();
const stamp = `${now.toISOString().slice(0, 10).replace(/-/g, "")}T000000Z`;
mkdirSync("site/feeds", { recursive: true });
for (const [name, content] of Object.entries(buildFeeds(year - 1, year + 2, stamp))) {
  writeFileSync(`site/feeds/${name}`, content);
}
