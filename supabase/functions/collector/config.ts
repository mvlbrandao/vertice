// IDs de referência do atleta acompanhado em cada fonte.
// Ajuste aqui se um dia o time trocar de jogador-alvo ou se os IDs externos mudarem.
export const TARGET = {
  sofascorePlayerId: 977679,
  sofascoreTeamId: 2697, // Inter de Milão
  transfermarktId: "691316",
  transfermarktSlug: "luis-henrique",
  fbrefId: "f36d5624",
  fullName: "Luís Henrique Tomaz de Lima",
};

export const SOFASCORE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  Referer: "https://www.sofascore.com/",
};

export const PRESS_FEEDS: { name: string; url: string; lang: string }[] = [
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
];
