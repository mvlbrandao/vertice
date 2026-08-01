/**
 * Tradução best-effort via endpoint não-oficial do Google Translate (sem chave/custo).
 * Se falhar (bloqueio, timeout, etc.), quem chama deve manter o texto original —
 * nunca travar a coleta por causa de tradução.
 */
export async function translateToPortuguese(text: string, sourceLang: string): Promise<string | null> {
  if (!text || sourceLang === "pt") return null;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=pt&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; VerticeScoutBot/1.0)" },
    });
    if (!res.ok) return null;
    const json = await res.json();
    // Formato: [[["texto traduzido","texto original",null,null,...], ...], ...]
    const segments = json?.[0];
    if (!Array.isArray(segments)) return null;
    const translated = segments.map((s: any) => s?.[0] ?? "").join("");
    return translated || null;
  } catch {
    return null;
  }
}
