import { PRESS_FEEDS, TARGET } from "./config.ts";
import { translateToPortuguese } from "./translate.ts";
import type { Db } from "./db.ts";

function extractTag(xml: string, tag: string): string | null {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  if (!match) return null;
  return match[1]
    .replace(/^<!\[CDATA\[/, "")
    .replace(/\]\]>$/, "")
    .trim();
}

interface FeedItem {
  title: string;
  link: string;
  pubDate: string | null;
  description: string | null;
}

function parseRssItems(xml: string): FeedItem[] {
  const items: FeedItem[] = [];
  const chunks = xml.split("<item>").slice(1);
  for (const chunk of chunks) {
    const body = chunk.split("</item>")[0];
    const title = extractTag(body, "title");
    const link = extractTag(body, "link");
    if (!title || !link) continue;
    items.push({
      title,
      link,
      pubDate: extractTag(body, "pubDate"),
      description: extractTag(body, "description"),
    });
  }
  return items;
}

/** Coleta notícias recentes sobre o jogador via feeds RSS (Google News), traduz para
 * português quando a fonte não é PT, e grava como news_items. */
export async function syncPress(db: Db): Promise<number> {
  const { data: player } = await db
    .from("players")
    .select("id")
    .eq("sofascore_id", TARGET.sofascorePlayerId)
    .maybeSingle();

  let upserted = 0;
  for (const feed of PRESS_FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; VerticeScoutBot/1.0)" },
      });
      if (!res.ok) {
        console.error(`Feed ${feed.name} -> HTTP ${res.status}`);
        continue;
      }
      const xml = await res.text();
      const items = parseRssItems(xml);
      for (const item of items) {
        const translatedTitle = await translateToPortuguese(item.title, feed.lang);
        const { error } = await db.from("news_items").upsert(
          {
            player_id: player?.id ?? null,
            source: feed.name,
            title: translatedTitle ?? item.title,
            title_original: translatedTitle ? item.title : null,
            language_original: translatedTitle ? feed.lang : feed.lang === "pt" ? "pt" : null,
            url: item.link,
            published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
            summary: item.description,
            category: "geral",
          },
          { onConflict: "url" },
        );
        if (error) throw error;
        upserted++;
      }
    } catch (e) {
      console.error(`Falha no feed ${feed.name}:`, (e as Error).message);
    }
  }
  return upserted;
}
