const CATEGORY_COLORS = {
  official: "#4ad295",
  affiliate: "#4ea1ff",
  competitor_brand_thief: "#ff6b6b",
  unclear: "#8b93a5",
};

const CATEGORY_LABELS = {
  official: "Official",
  affiliate: "Affiliate",
  competitor_brand_thief: "Competitor Brand Thief",
  unclear: "Unclear",
};

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

function renderBadge(cat) {
  return `<span class="badge ${cat}">${CATEGORY_LABELS[cat] ?? cat}</span>`;
}

let pieChart = null;
function renderPie(counts) {
  const ctx = document.getElementById("pie").getContext("2d");
  const labels = Object.keys(counts).map((k) => CATEGORY_LABELS[k] ?? k);
  const data = Object.values(counts);
  const colors = Object.keys(counts).map((k) => CATEGORY_COLORS[k] ?? "#888");
  if (pieChart) pieChart.destroy();
  pieChart = new Chart(ctx, {
    type: "doughnut",
    data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: "#181b22", borderWidth: 2 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { color: "#e4e7ee", padding: 14 } },
      },
    },
  });
}

async function load() {
  const summary = await fetchJSON("/api/summary");
  const { snapshot } = await fetchJSON("/api/latest");

  document.getElementById("meta").textContent = snapshot
    ? `Query: "${summary.query}" • Geo: ${summary.geo} • Snapshot from ${new Date(snapshot.takenAt).toLocaleString()} • Source: ${snapshot.source} • Total results: ${summary.total}`
    : `No snapshot yet. Run \`npm run analyze:mock\` or \`npm run analyze\` first.`;

  renderPie(summary.counts);

  const sumTable = document.getElementById("summary-table");
  sumTable.innerHTML = Object.entries(summary.counts).map(([cat, n]) => {
    const pct = summary.percentages[cat] ?? 0;
    return `<tr><td>${renderBadge(cat)}</td><td>${n} <span class="muted">(${pct}%)</span></td></tr>`;
  }).join("");

  const tbody = document.getElementById("domains-tbody");
  if (!snapshot || snapshot.results.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="muted">No data</td></tr>';
    return;
  }
  tbody.innerHTML = snapshot.results.map((r) => {
    const finalDomain = r.scraped.redirectFinalDomain ?? "—";
    return `
      <tr>
        <td>${r.serp.position}</td>
        <td><a href="${escapeHtml(r.serp.url)}" target="_blank" rel="noopener">${escapeHtml(r.serp.domain)}</a></td>
        <td>${renderBadge(r.classification.category)}</td>
        <td>${r.classification.confidence.toFixed(2)}</td>
        <td>${escapeHtml(finalDomain)}</td>
        <td class="explain">${escapeHtml(r.classification.explanation)}</td>
      </tr>`;
  }).join("");
}

load().catch((err) => {
  document.getElementById("meta").textContent = `Error: ${err.message}`;
});
