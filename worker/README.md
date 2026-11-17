# AI marker (Cloudflare Worker)

Marks IGCSE Computer Science (0478) answers on the public site with Claude (`claude-opus-5-5`). The site is static (GitHub Pages), so it cannot keep an API key secret; this Worker holds the key and the page calls it. The prompt and the output schema are in `public/ai-mark.js`, shared with the page.

## Deploy (once, about 5 minutes)

You need a free Cloudflare account and an Anthropic API key from https://console.anthropic.com.

```bash
cd worker
npm install
npx wrangler login                          # opens the browser
npx wrangler secret put ANTHROPIC_API_KEY   # paste the key when asked
npx wrangler deploy
```

`deploy` prints the Worker's address, e.g. `https://next-level-ai-marker.<you>.workers.dev`. Put it in `WORKER_URL` at the top of `public/ai-client.js`, then commit and push. Students can use **Check with AI** without a key from then on.

## Settings

In `wrangler.toml`:

- `ALLOWED_ORIGINS`: the sites that may call the Worker. Requests from anywhere else are refused.
- `SITE_URL`: where the question images are served from (Claude reads the diagrams by URL).
- `MARK_LIMIT`: at most 20 checks per minute per visitor. Change `limit` to adjust.

Every check is one Claude request, usually a few thousand input tokens with images. Set a monthly spend limit in the Anthropic Console so costs stay predictable.

## Without the Worker

While `WORKER_URL` is empty, the **Check with AI** button is hidden.
