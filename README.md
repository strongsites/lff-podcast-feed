# Lectio for Families — private podcast feed

Scrapes 24-7 Prayer's [Lectio for Families](https://www.24-7prayer.com/lectioforfamilies/pray/)
daily devotional pages and generates a podcast RSS feed (`docs/feed.xml`), hosted live at:

**https://strongsites.github.io/lff-podcast-feed/feed.xml**

Add that URL to any podcast app to subscribe. The repo is public (required for free GitHub
Pages), but the feed itself just contains links to 24-7 Prayer's own public audio files —
nothing sensitive is exposed. Privacy comes from the URL being unlisted, not from secrecy of
the repo.

## How it works

- `https://www.24-7prayer.com/lectioforfamilies/pray/` only lists the **current week's**
  ~7 devotionals, so the crawl needs to run at least weekly to catch each day before it
  scrolls off that page.
- For every episode URL not already in `data/episodes.json`, it scrapes the episode page for
  title, description, publish date, and the real audio URL (which is set via an inline
  `<script>` on the page, not the template's placeholder `src`).
- `data/episodes.json` is the permanent store — episodes accumulate here across runs, so old
  ones keep showing up in the feed even after they scroll off the site's listing page.
- `docs/feed.xml` is regenerated from that store on every run and served by GitHub Pages
  (Pages is configured to serve from `main:/docs`).

## Manual usage

```bash
npm install
npm run crawl   # scrapes + writes docs/feed.xml locally
npm run serve   # serves docs/feed.xml at http://localhost:8787/feed.xml for local testing
```

## Weekly auto-crawl + auto-deploy (already set up on this machine)

`scripts/crawl-and-deploy.sh` runs the crawl, then commits and pushes `docs/feed.xml` +
`data/episodes.json` to GitHub if anything changed — which is what actually updates the
live Pages URL.

A macOS `launchd` job (`~/Library/LaunchAgents/com.lff-podcast-feed.crawl.plist`) runs that
script every Monday at 6am, and once immediately whenever it's loaded. Logs go to
`logs/crawl.log`.

```bash
# reinstall on a different machine, or after editing the plist:
mkdir -p logs
NODE_BIN_DIR=$(dirname "$(which node)")
sed -e "s|__PROJECT_DIR__|$(pwd)|g" -e "s|__NODE_BIN_DIR__|$NODE_BIN_DIR|g" \
  com.lff-podcast-feed.crawl.plist > ~/Library/LaunchAgents/com.lff-podcast-feed.crawl.plist
launchctl load ~/Library/LaunchAgents/com.lff-podcast-feed.crawl.plist
```

To stop it:

```bash
launchctl unload ~/Library/LaunchAgents/com.lff-podcast-feed.crawl.plist
```

**Caveat:** this only runs while the Mac is on and awake at the scheduled time (standard
`launchd` limitation) — a missed week means any devotional that scrolled off the site's
listing before being scraped is gone for good, since there's no deeper archive to backfill
from.

Pushing requires `gh` to be authenticated on this machine (`gh auth login` was run once to
set this up, and `gh auth setup-git` wired it into git's credential helper for
`https://github.com`).

## Notes

- This is an unofficial mirror for personal use — not affiliated with 24-7 Prayer.
- If 24-7 Prayer restructures their site/markup, `src/scrape.js` selectors will need updating.
