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

## Automatic weekly crawl (runs entirely on GitHub, no machine required)

[`.github/workflows/crawl.yml`](.github/workflows/crawl.yml) runs every Monday at 06:00 UTC
on GitHub's own runners: it checks out the repo, runs the crawl, and commits + pushes
`docs/feed.xml` and `data/episodes.json` back to `main` if anything changed. That push is
what triggers GitHub Pages to redeploy the live URL. It also supports manual runs:

```bash
gh workflow run crawl.yml     # trigger a run on demand
gh run list --workflow=crawl.yml   # check recent run status
```

This requires the repo's default `GITHUB_TOKEN` to have write access (already configured
via `Settings → Actions → General → Workflow permissions → Read and write permissions`).

## Manual / local usage

```bash
npm install
npm run crawl   # scrapes + writes docs/feed.xml locally
npm run serve   # serves docs/feed.xml at http://localhost:8787/feed.xml for local testing
```

`scripts/crawl-and-deploy.sh` does the same crawl-then-push as the GitHub Actions job, if you
ever want to trigger + push a run from your own machine instead of waiting for the schedule
or using `gh workflow run`.

## Notes

- This is an unofficial mirror for personal use — not affiliated with 24-7 Prayer.
- If 24-7 Prayer restructures their site/markup, `src/scrape.js` selectors will need updating.
- If a scheduled run is ever missed, any devotional that scrolled off the site's listing
  before being scraped is gone for good — there's no deeper archive to backfill from.
