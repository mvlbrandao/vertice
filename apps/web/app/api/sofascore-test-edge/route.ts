// Diagnóstico temporário: mesma checagem, rodando no runtime "edge" da Vercel
// (rede diferente da serverless Node) para comparar reputação de IP.
export const runtime = "edge";

export async function GET() {
  try {
    const res = await fetch("https://api.sofascore.com/api/v1/player/977679", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "application/json",
        Referer: "https://www.sofascore.com/",
      },
    });
    const text = await res.text();
    return Response.json({
      runtime: "edge",
      status: res.status,
      ok: res.ok,
      bodySnippet: text.slice(0, 200),
    });
  } catch (e) {
    return Response.json({ runtime: "edge", error: (e as Error).message }, { status: 500 });
  }
}
