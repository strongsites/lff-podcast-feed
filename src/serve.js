import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FEED_PATH = path.join(__dirname, "..", "docs", "feed.xml");
const PORT = process.env.PORT || 8787;

const server = createServer(async (req, res) => {
  if (req.url === "/feed.xml") {
    try {
      const xml = await readFile(FEED_PATH, "utf8");
      res.writeHead(200, { "Content-Type": "application/rss+xml; charset=utf-8" });
      res.end(xml);
    } catch {
      res.writeHead(404);
      res.end("feed.xml not found, run `npm run crawl` first");
    }
    return;
  }
  res.writeHead(404);
  res.end("Not found. Feed is served at /feed.xml");
});

server.listen(PORT, () => {
  console.log(`Serving feed at http://localhost:${PORT}/feed.xml`);
});
