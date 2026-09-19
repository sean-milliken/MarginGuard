import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { createApi } from "./api";
config({
  path: resolve(fileURLToPath(new URL("../../../.env", import.meta.url))),
});
config();
const api = createApi();
const staticRoot = resolve(
  fileURLToPath(new URL("../../../frontend/dist", import.meta.url)),
);
const types: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};
const server = createServer(async (req, res) => {
  try {
    const path = new URL(req.url ?? "/", "http://localhost").pathname;
    if (path.startsWith("/api/")) {
      if (
        req.method === "POST" &&
        !req.headers["content-type"]?.startsWith("application/json")
      ) {
        res.writeHead(415, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ error: "Content-Type must be application/json" }),
        );
        return;
      }
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 200000) {
          res.writeHead(413, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Request too large" }));
          return;
        }
      }
      const result = await api({ method: req.method ?? "GET", path, body });
      res.writeHead(result.statusCode, result.headers);
      res.end(result.body);
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      res.end();
      return;
    }
    const target = resolve(staticRoot, `.${decodeURIComponent(path)}`);
    if (target !== staticRoot && !target.startsWith(staticRoot + sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    try {
      const data = await readFile(
        extname(target) ? target : resolve(staticRoot, "index.html"),
      );
      res.writeHead(200, {
        "Content-Type":
          types[extname(target)] ??
          (extname(target) ? "application/octet-stream" : "text/html"),
      });
      res.end(data);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Frontend not built. Run npm run build, or use npm run dev.");
    }
  } catch {
    res.writeHead(400);
    res.end("Invalid request");
  }
});
server.listen(
  Number(process.env.PORT ?? 3001),
  process.env.HOST ?? "127.0.0.1",
  () =>
    console.log(
      `MarginGuard API: http://${process.env.HOST ?? "127.0.0.1"}:${process.env.PORT ?? 3001}`,
    ),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.close(() => process.exit(0)));
