# Lectio for Families — private podcast feed

Scrapes 24-7 Prayer's [Lectio for Families](https://www.24-7prayer.com/lectioforfamilies/pray/)
daily devotional pages and generates a private podcast RSS feed (`public/feed.xml`).

The feed links directly to 24-7 Prayer's own audio files on `downloads.24-7prayer.com` —
nothing is re-hosted or re-encoded, so `public/feed.xml` is the only file that needs hosting.

## How it works

- `https://www.24-7prayer.com/lectioforfamilies/pray/` only lists the **current week's**
  ~7 devotionals, so `npm run crawl` needs to run at least weekly to catch each day
  before it scrolls off that page.
- For every episode URL not already in `data/episodes.json`, it scrapes the episode page for
  title, description, publish date, and the real audio URL (which is set via an inline
  `<script>` on the page, not the template's placeholder `src`).
- `data/episodes.json` is the permanent store — episodes accumulate here across runs,
  so old ones keep showing up in the feed even after they scroll off the site's listing page.
- `public/feed.xml` is regenerated from that store on every run.

## Setup

```bash
npm install
npm run crawl   # scrapes + writes public/feed.xml
npm run serve   # serves public/feed.xml at http://localhost:8787/feed.xml
```

Point a podcast app at `http://localhost:8787/feed.xml` to test locally.

## Weekly auto-crawl (macOS launchd)

```bash
mkdir -p logs
sed -e "s|__PROJECT_DIR__|$(pwd)|g" -e "s|__NODE_PATH__|$(which node)|g" \
  com.lff-podcast-feed.crawl.plist > ~/Library/LaunchAgents/com.lff-podcast-feed.crawl.plist
launchctl load ~/Library/LaunchAgents/com.lff-podcast-feed.crawl.plist
```

This runs `npm run crawl`'s underlying script every Monday at 6am (and once immediately
on load). Logs go to `logs/crawl.log`. To stop it:

```bash
launchctl unload ~/Library/LaunchAgents/com.lff-podcast-feed.crawl.plist
```

## Hosting the feed for real podcast apps

`public/feed.xml` needs to be reachable over HTTPS from wherever your podcast app lives.
Since the feed only contains links (not audio), any static file host works, e.g.:

- Rsync/copy `public/feed.xml` to a personal web server or NAS after each crawl.
- Or serve the `public/` directory with any static hosting you already have (Cloudflare
  Pages, Netlify, GitHub Pages, an S3 bucket, etc.) and update it after each crawl.

Since this is meant to be **private**, avoid hosting it somewhere publicly indexed/guessable —
an unlisted URL (e.g. a UUID-suffixed path) is enough for personal use; add real auth if the
host supports it and you want stronger protection.

## Notes

- This is an unofficial mirror for personal use — not affiliated with 24-7 Prayer.
- If 24-7 Prayer restructures their site/markup, `src/scrape.js` selectors will need updating.
