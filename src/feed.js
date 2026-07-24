const FEED_TITLE = "Lectio for Families (Private Feed)";
const FEED_LINK = "https://www.24-7prayer.com/lectioforfamilies/pray/";
const FEED_DESCRIPTION =
  "Unofficial private podcast feed mirroring 24-7 Prayer's Lectio for Families daily devotional audio. Not affiliated with 24-7 Prayer.";
const FEED_IMAGE = "https://www.24-7prayer.com/wp-content/uploads/2024/05/lff_image.jpg";
const FEED_LANGUAGE = "en-gb";

function escapeXml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc2822(date) {
  return new Date(date).toUTCString().replace("GMT", "+0000");
}

function episodeItem(ep) {
  const guid = ep.url;
  const pubDate = toRfc2822(ep.pubDate ?? Date.now());
  return `
    <item>
      <title>${escapeXml(ep.title)}</title>
      <link>${escapeXml(ep.url)}</link>
      <guid isPermaLink="true">${escapeXml(guid)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(ep.description)}</description>
      <enclosure url="${escapeXml(ep.audioUrl)}" length="${ep.audioBytes ?? 0}" type="${escapeXml(
    ep.audioType || "audio/mpeg"
  )}" />
      <itunes:title>${escapeXml(ep.title)}</itunes:title>
      <itunes:summary>${escapeXml(ep.description)}</itunes:summary>
      ${ep.image ? `<itunes:image href="${escapeXml(ep.image)}" />` : ""}
      <itunes:explicit>false</itunes:explicit>
    </item>`;
}

export function buildFeedXml(episodes) {
  const sorted = [...episodes]
    .filter((ep) => ep.audioUrl)
    .sort((a, b) => new Date(b.pubDate ?? 0) - new Date(a.pubDate ?? 0));

  const items = sorted.map(episodeItem).join("\n");
  const lastBuildDate = toRfc2822(Date.now());

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${escapeXml(FEED_LINK)}</link>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>${FEED_LANGUAGE}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <itunes:author>24-7 Prayer (unofficial mirror)</itunes:author>
    <itunes:explicit>false</itunes:explicit>
    <itunes:image href="${escapeXml(FEED_IMAGE)}" />
    <image>
      <url>${escapeXml(FEED_IMAGE)}</url>
      <title>${escapeXml(FEED_TITLE)}</title>
      <link>${escapeXml(FEED_LINK)}</link>
    </image>
    <itunes:category text="Religion &amp; Spirituality" />
${items}
  </channel>
</rss>
`;
}
