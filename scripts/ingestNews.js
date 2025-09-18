
const RSSParser = require("rss-parser");
const axios = require("axios");
const cheerio = require("cheerio");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs-extra");
const path = require("path");

const OUTPUT_FILE = path.resolve("news_articles.jsonl");
const MAX_ARTICLES = 60;      
const PER_FEED_LIMIT = 12;     


const FEEDS = [
    "https://www.thehindu.com/news/national/feeder/default.rss", // India
  "https://economictimes.indiatimes.com/rssfeeds/1977021501.cms", // India Business
  "https://techcrunch.com/feed/", // Tech
  "https://www.espn.in/espn/rss/news",
    "https://feeds.bbci.co.uk/news/world/rss.xml",

]


const parser = new RSSParser();
const USER_AGENT = "VooshAssignmentIngestBot/0.1 (+your-email@example.com)";

function extractTextFromHtml(html) {
  const $ = cheerio.load(html);


  const articleTag = $("article");
  let paragraphs = [];
  if (articleTag.length) {
    articleTag.find("p").each((_, p) => {
      const t = $(p).text().trim();
      if (t) paragraphs.push(t);
    });
  }

  if (!paragraphs.length) {
    const selectors = [
      "div[itemprop='articleBody'] p",
      "div.article-body p",
      ".article-body p",
      ".story p",
      "div#content p",
      "section p",
      "main p"
    ];
    for (const sel of selectors) {
      $(sel).each((_, p) => {
        const t = $(p).text().trim();
        if (t) paragraphs.push(t);
      });
      if (paragraphs.length) break;
    }
  }


  if (!paragraphs.length) {
    let ptexts = [];
    $("p").each((_, p) => {
      const t = $(p).text().trim();
      if (t && t.length > 40) ptexts.push(t);
    });
    // sort by length desc and take top ones
    ptexts.sort((a, b) => b.length - a.length);
    paragraphs = ptexts.slice(0, 10);
  }

  // join with double newline for readability
  return paragraphs.join("\n\n");
}

async function fetchArticleText(url) {
  try {
    const res = await axios.get(url, {
      headers: { "User-Agent": USER_AGENT },
      timeout: 15000,
    });
    const html = res.data;
    const text = extractTextFromHtml(html);
    return text;
  } catch (err) {
    // console.warn("fetch error", url, err.message);
    return "";
  }
}

async function ingest() {
  console.log("Starting ingestion...");
  try {
    await fs.remove(OUTPUT_FILE); // remove old file if present
  } catch (e) {
    // ignore
  }
  const outStream = fs.createWriteStream(OUTPUT_FILE, { flags: "a", encoding: "utf8" });

  let saved = 0;
  const seenUrls = new Set();

  for (const feedUrl of FEEDS) {
    if (saved >= MAX_ARTICLES) break;
    console.log("Parsing feed:", feedUrl);
    let feed;
    try {
      feed = await parser.parseURL(feedUrl);
    } catch (err) {
      console.warn("Failed to parse feed:", feedUrl, err.message);
      continue;
    }

    const items = feed.items || [];
    for (const item of items.slice(0, PER_FEED_LIMIT)) {
      if (saved >= MAX_ARTICLES) break;
      const link = item.link || item.guid || item.id;
      if (!link || seenUrls.has(link)) continue;
      seenUrls.add(link);

      const title = (item.title || "").trim();
      const pubDate = item.pubDate || item.isoDate || null;
      // try to use content or contentSnippet if feed gives some text, else fetch full page
      const initialText = (item.content && item.content.trim()) || (item.contentSnippet && item.contentSnippet.trim()) || "";

      let fullText = initialText;
      if (!initialText || initialText.length < 200) {
        // fetch web page and try to extract article paragraph text
        fullText = await fetchArticleText(link);
      }

      // skip extremely short results
      if (!fullText || fullText.length < 200) {
        console.log("Skipping (too short):", title || link);
        continue;
      }

      const doc = {
        id: uuidv4(),
        title,
        date: pubDate,
        url: link,
        sourceFeed: feedUrl,
        text: fullText
      };

      outStream.write(JSON.stringify(doc) + "\n");
      saved += 1;
      console.log(`Saved (${saved}):`, title || link);

      // small polite delay to avoid hammering servers
      await new Promise((r) => setTimeout(r, 900));
    }
  }

  outStream.end();
  console.log("Ingestion finished. Total saved:", saved);
  console.log("File:", OUTPUT_FILE);
}

ingest().catch((err) => {
  console.error("Ingest error:", err);
  process.exit(1);
});
