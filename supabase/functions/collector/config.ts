export interface PressFeed {
  name: string;
  url: string;
  lang: string;
}

export interface PlayerTarget {
  sofascorePlayerId: number;
  transfermarktId: string;
  fullName: string;
  nameKeywords: string[]; // usado no filtro de relevância das notícias
  contextKeywords: string[]; // clube/contexto — reduz falso positivo de nome comum
  pressFeeds: PressFeed[];
}

export const TARGETS: PlayerTarget[] = [
  {
    sofascorePlayerId: 977679,
    transfermarktId: "691316",
    fullName: "Luís Henrique Tomaz de Lima",
    nameKeywords: ["Luis Henrique", "Luís Henrique", "L. Henrique"],
    contextKeywords: ["Inter", "Internazionale", "Milão", "Milan"],
    pressFeeds: [
      {
        name: "Google News - Luis Henrique Inter",
        url: "https://news.google.com/rss/search?q=%22Luis+Henrique%22+Inter+when:14d&hl=it&gl=IT&ceid=IT:it",
        lang: "it",
      },
      {
        name: "Google News - Luis Henrique Inter (PT)",
        url: "https://news.google.com/rss/search?q=%22Luis+Henrique%22+Inter+de+Mil%C3%A3o+when:14d&hl=pt-BR&gl=BR&ceid=BR:pt-419",
        lang: "pt",
      },
    ],
  },
  {
    sofascorePlayerId: 1597270,
    transfermarktId: "1193867",
    fullName: "Pedro Henrique Cardoso de Lima",
    nameKeywords: ["Pedro Lima"],
    contextKeywords: ["Wolverhampton", "Wolves"],
    pressFeeds: [
      {
        name: "Google News - Pedro Lima Wolves (PT)",
        url: "https://news.google.com/rss/search?q=%22Pedro+Lima%22+Wolverhampton+when:14d&hl=pt-BR&gl=BR&ceid=BR:pt-419",
        lang: "pt",
      },
      {
        name: "Google News - Pedro Lima Wolves (EN)",
        url: "https://news.google.com/rss/search?q=%22Pedro+Lima%22+Wolves+when:14d&hl=en-GB&gl=GB&ceid=GB:en",
        lang: "en",
      },
    ],
  },
];

export const SOFASCORE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  Referer: "https://www.sofascore.com/",
};
