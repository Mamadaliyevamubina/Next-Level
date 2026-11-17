// Browser side of AI marking (loaded as a module by igcse.html). Exposes window.NLAI.
//
// Two ways to reach Claude:
//  1. WORKER_URL set: the page posts the question and answer to the Cloudflare Worker in worker/,
//     which holds the school's API key. Students need nothing. This is what the public site should use.
//  2. WORKER_URL empty: the visitor pastes their own Anthropic API key. It stays in this browser
//     (localStorage) and is sent only to api.anthropic.com.
import { buildParams, parseVerdict } from "./ai-mark.js";

// After deploying worker/ (see worker/README.md), put its address here and rebuild the page.
const WORKER_URL = "";

const KEY_STORE = "nl-anthropic-key";

function figureUrl(path) {
  // Claude fetches images by URL, so they only work when the page is served over http(s), e.g. GitHub Pages.
  if (!/^https?:$/.test(location.protocol)) return null;
  return new URL("public/" + path, location.href).href;
}

function getKey() { try { return localStorage.getItem(KEY_STORE) || ""; } catch (e) { return ""; } }

let sdk = null;
async function viaKey(item, answer) {
  if (!sdk) sdk = (await import("https://esm.sh/@anthropic-ai/sdk@1")).default;
  const client = new sdk({ apiKey: getKey(), dangerouslyAllowBrowser: true });
  try {
    const message = await client.beta.messages.create(buildParams(item, answer, figureUrl));
    return parseVerdict(message, item);
  } catch (e) {
    if (e instanceof sdk.AuthenticationError) throw new Error("That API key was not accepted. Check it and try again.");
    if (e instanceof sdk.RateLimitError) throw new Error("Too many requests right now. Wait a minute and try again.");
    if (e instanceof sdk.APIError) throw new Error("The AI marker is unavailable (" + (e.status || "network") + "). Try again later.");
    throw e;
  }
}

async function viaWorker(item, answer) {
  let res;
  try {
    res = await fetch(WORKER_URL.replace(/\/$/, "") + "/mark", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ item, answer }),
    });
  } catch (e) { throw new Error("Could not reach the AI marker. Check your internet connection."); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "The AI marker is unavailable (" + res.status + "). Try again later.");
  return data;
}

window.NLAI = {
  // true when marking can run without asking the visitor for anything.
  ready() { return !!WORKER_URL || !!getKey(); },
  needsKey() { return !WORKER_URL && !getKey(); },
  setKey(k) { try { localStorage.setItem(KEY_STORE, k.trim()); } catch (e) { /* storage blocked */ } },
  forgetKey() { try { localStorage.removeItem(KEY_STORE); } catch (e) { /* storage blocked */ } },
  usesOwnKey() { return !WORKER_URL; },
  mark(item, answer) { return WORKER_URL ? viaWorker(item, answer) : viaKey(item, answer); },
};
window.dispatchEvent(new Event("nlai-ready"));
