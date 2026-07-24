import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listCurrentWeekEpisodes, scrapeEpisode } from "./scrape.js";
import { buildFeedXml } from "./feed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const STORE_PATH = path.join(DATA_DIR, "episodes.json");
const FEED_PATH = path.join(ROOT, "docs", "feed.xml");

async function loadStore() {
  try {
    return JSON.parse(await readFile(STORE_PATH, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return {};
    throw err;
  }
}

async function saveStore(store) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2));
}

async function main() {
  const store = await loadStore();
  const listing = await listCurrentWeekEpisodes();

  let added = 0;
  for (const { url } of listing) {
    if (store[url]) continue;
    console.log(`New episode found: ${url}`);
    try {
      const episode = await scrapeEpisode(url);
      if (!episode.audioUrl) {
        console.warn(`  no audio found on ${url}, skipping`);
        continue;
      }
      store[url] = episode;
      added += 1;
    } catch (err) {
      console.error(`  failed to scrape ${url}: ${err.message}`);
    }
  }

  await saveStore(store);

  const xml = buildFeedXml(Object.values(store));
  await mkdir(path.dirname(FEED_PATH), { recursive: true });
  await writeFile(FEED_PATH, xml);

  console.log(`Done. ${added} new episode(s) added, ${Object.keys(store).length} total.`);
  console.log(`Feed written to ${FEED_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
