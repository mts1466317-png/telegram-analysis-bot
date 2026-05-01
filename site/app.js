const BUTTON_IDS = ["ctaTop", "ctaMiddle", "ctaFinal", "ctaBottom", "channelTop"];

function applyLinks(config) {
  const botUrl = config.bot_url || "#";
  const channelUrl = config.channel_url || "#";

  for (const id of BUTTON_IDS) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.href = id === "channelTop" ? channelUrl : botUrl;
  }
}

async function initSite() {
  try {
    const response = await fetch("/site/config", { cache: "no-store" });
    if (!response.ok) throw new Error("config request failed");
    const config = await response.json();
    applyLinks(config);
  } catch (_error) {
    // Fallback if config endpoint is unavailable.
    applyLinks({
      bot_url: "https://t.me/GodStatistics_bot",
      channel_url: "https://t.me/higherself_connection",
    });
  }
}

function initRevealAnimations() {
  const nodes = document.querySelectorAll(".reveal");
  if (!nodes.length) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15 }
  );

  for (const node of nodes) observer.observe(node);
}

initSite();
initRevealAnimations();
