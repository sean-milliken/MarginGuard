import { build } from "esbuild";
import { writeFile } from "node:fs/promises";
await build({
  entryPoints: ["src/server.ts", "src/lambda.ts"],
  bundle: true,
  platform: "node",
  target: "node24",
  format: "esm",
  outdir: "dist",
  banner: {
    js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
  },
});

await writeFile("dist/package.json", JSON.stringify({ type: "module" }));
