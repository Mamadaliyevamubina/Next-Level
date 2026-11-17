// Cloudflare Worker: marks IGCSE Computer Science answers with Claude for the public site.
// The API key lives here as a secret (ANTHROPIC_API_KEY), never in the web page.
// POST /mark  { item, answer }  ->  { mark, ticked, points, feedback }
import Anthropic from "@anthropic-ai/sdk";
import { buildParams, parseVerdict, cleanItem } from "../../public/ai-mark.js";

function cors(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);
  return allowed.includes(origin)
    ? { "access-control-allow-origin": origin, "access-control-allow-methods": "POST, OPTIONS", "access-control-allow-headers": "content-type", vary: "origin" }
    : null;
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("origin") || "";
    const headers = cors(origin, env);
    if (!headers) return json({ error: "This site is not allowed to use the AI marker." }, 403, {});
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/mark") return json({ error: "Not found" }, 404, headers);
    if (Number(request.headers.get("content-length") || 0) > 100_000) return json({ error: "Request too large." }, 413, headers);

    // Optional: Cloudflare rate limiting binding (see wrangler.toml), per visitor IP.
    if (env.MARK_LIMIT) {
      const { success } = await env.MARK_LIMIT.limit({ key: request.headers.get("cf-connecting-ip") || "anon" });
      if (!success) return json({ error: "You have checked a lot of answers in a short time. Wait a minute and try again." }, 429, headers);
    }

    let body;
    try { body = await request.json(); } catch (e) { return json({ error: "Bad request." }, 400, headers); }
    if (!body || typeof body.item !== "object" || typeof body.answer !== "string") return json({ error: "Bad request." }, 400, headers);
    const item = cleanItem(body.item);
    if (!item.criteria.length) return json({ error: "This question has no mark scheme points to mark against." }, 400, headers);

    // Images are only fetched from the site itself.
    const site = (env.SITE_URL || "").replace(/\/?$/, "/");
    const figureUrl = site ? (p) => site + "public/" + p : null;

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    try {
      const message = await client.beta.messages.create(buildParams(item, body.answer, figureUrl));
      return json(parseVerdict(message, item), 200, headers);
    } catch (e) {
      if (e instanceof Anthropic.RateLimitError) return json({ error: "The AI marker is busy. Try again in a minute." }, 429, headers);
      if (e instanceof Anthropic.APIError) {
        console.error("Anthropic API error", e.status, e.message);
        return json({ error: "The AI marker is unavailable right now. Try again later." }, 502, headers);
      }
      if (e instanceof Error) return json({ error: e.message }, 502, headers);
      throw e;
    }
  },
};
