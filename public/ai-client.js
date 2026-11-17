// Browser side of AI marking (loaded as a module by igcse.html). Exposes window.NLAI.
// The page posts the question and answer to the Cloudflare Worker in worker/, which holds the API key.
// Students never need a key. While WORKER_URL is empty the "Check with AI" button is hidden.

// After deploying worker/ (see worker/README.md), put its address here, then commit and push.
const WORKER_URL = "";

async function mark(item, answer) {
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

window.NLAI = { ready: () => !!WORKER_URL, mark };
window.dispatchEvent(new Event("nlai-ready"));
