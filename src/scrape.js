import * as cheerio from "cheerio";

const LISTING_URL = "https://www.24-7prayer.com/lectioforfamilies/pray/";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} fetching ${url}`);
  return res.text();
}

// The /pray page only lists the current week (rolling ~7 days), so we need
// to crawl it regularly to catch each day before it scrolls off.
export async function listCurrentWeekEpisodes() {
  const html = await fetchHtml(LISTING_URL);
  const $ = cheerio.load(html);

  const episodes = [];
  $(".lectio_posts .lectio_item").each((_, el) => {
    const $el = $(el);
    const url = $el.attr("href");
    const title = $el.find(".lectio_item__title").text().trim();
    const verse = $el.find(".lectio_item__verse").text().trim();
    if (url && title) episodes.push({ url, title, verse });
  });
  return episodes;
}

function decodeEntities(str) {
  return str
    .replace(/&hellip;/g, "…")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&nbsp;/g, " ");
}

// Episode pages set the real audio src via an inline script that overrides
// the template's placeholder `block-attributes` src, e.g.:
//   $('#presto-player-1').attr('src', 'https://downloads.24-7prayer.com/...mp3');
function extractAudioUrl(html) {
  const match = html.match(
    /\$\(['"]#presto-player-1['"]\)\.attr\(['"]src['"],\s*['"]([^'"]+)['"]\)/
  );
  return match ? match[1] : null;
}

function extractJsonLd(html) {
  const match = html.match(
    /<script type="application\/ld\+json" class="yoast-schema-graph">([\s\S]*?)<\/script>/
  );
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

export async function scrapeEpisode(url) {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const rawTitle = $('meta[property="og:title"]').attr("content") || $("title").text();
  const title = decodeEntities(rawTitle.replace(/\s*-\s*24-7 Prayer International\s*$/, "").trim());

  const description = decodeEntities(
    ($('meta[property="og:description"]').attr("content") || "").trim()
  );

  const image = $('meta[property="og:image"]').attr("content") || null;

  const audioUrl = extractAudioUrl(html);
  const audio = audioUrl ? await headAudio(audioUrl) : null;

  const jsonLd = extractJsonLd(html);
  const webPage = jsonLd?.["@graph"]?.find((node) => node["@type"] === "WebPage");
  const pubDate = webPage?.datePublished ? new Date(webPage.datePublished) : null;

  return {
    url,
    title,
    description,
    image,
    audioUrl,
    audioBytes: audio?.bytes ?? null,
    audioType: audio?.type ?? "audio/mpeg",
    pubDate,
  };
}

async function headAudio(audioUrl) {
  try {
    const res = await fetch(audioUrl, { method: "HEAD", headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return null;
    const bytes = res.headers.get("content-length");
    const type = res.headers.get("content-type");
    return { bytes: bytes ? Number(bytes) : null, type: type || "audio/mpeg" };
  } catch {
    return null;
  }
}
