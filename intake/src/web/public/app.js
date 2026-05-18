const $ = (sel) => document.querySelector(sel);

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body}`);
  }
  return res.json();
}

async function refreshStatus() {
  const s = await fetchJSON("/api/status");
  $("#poll-interval").textContent = String(s.pollIntervalSeconds);
  const statusEl = $("#auth-status");
  $("#auth-unconfigured").classList.toggle("hidden", s.googleCredsConfigured);
  $("#auth-unauthorized").classList.toggle("hidden", !s.googleCredsConfigured || s.authorized);
  $("#auth-authorized").classList.toggle("hidden", !s.authorized);
  if (!s.googleCredsConfigured) {
    statusEl.textContent = "OAuth credentials не налаштовані";
    statusEl.className = "status bad";
  } else if (!s.authorized) {
    statusEl.textContent = "Google не підключено";
    statusEl.className = "status";
  } else {
    statusEl.textContent = `Sheet: ${s.sheetId || "(не задано)"} • Range: ${s.sheetRange}`;
    statusEl.className = "status ok";
    if (s.sheetId) {
      const form = $("#sheet-config-form");
      form.elements.sheetId.value = s.sheetId;
      form.elements.sheetRange.value = s.sheetRange;
    }
  }
}

function renderStatusBadge(status) {
  return `<span class="badge status status-${status}">${status}</span>`;
}

function renderSource(source) {
  return `<span class="badge ${source}">${source}</span>`;
}

async function refreshTasks() {
  const { tasks } = await fetchJSON("/api/tasks");
  const tbody = $("#tasks-tbody");
  if (tasks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="muted">Черга порожня. Створіть задачу через форму або підключіть Google Sheet.</td></tr>`;
    return;
  }
  tbody.innerHTML = tasks
    .map((t) => {
      const isTerminal = t.status === "published" || t.status === "failed";
      const output = t.outputUrl
        ? `<a href="${t.outputUrl}" target="_blank" rel="noopener">link</a>`
        : '<span class="muted">—</span>';
      const actions = isTerminal
        ? '<span class="muted">—</span>'
        : `<button class="btn btn-sm" data-action="advance" data-id="${t.id}">→ next</button>
           <button class="btn btn-sm btn-danger" data-action="fail" data-id="${t.id}">fail</button>`;
      return `<tr>
        <td>${renderSource(t.source)}</td>
        <td>${escapeHtml(t.keyword)}</td>
        <td>${escapeHtml(t.geo)}</td>
        <td>${escapeHtml(t.brand)}</td>
        <td>${escapeHtml(t.contentType)}</td>
        <td>${renderStatusBadge(t.status)}</td>
        <td>${output}</td>
        <td>${actions}</td>
      </tr>`;
    })
    .join("");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

document.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  btn.disabled = true;
  try {
    await fetchJSON(`/api/tasks/${id}/${action}`, { method: "POST" });
    await refreshTasks();
  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
  }
});

$("#new-task-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const payload = {
    keyword: form.elements.keyword.value.trim(),
    geo: form.elements.geo.value.trim(),
    language: form.elements.language.value.trim(),
    brand: form.elements.brand.value.trim(),
    contentType: form.elements.contentType.value,
  };
  try {
    await fetchJSON("/api/tasks", { method: "POST", body: JSON.stringify(payload) });
    form.elements.keyword.value = "";
    await refreshTasks();
  } catch (err) {
    alert(err.message);
  }
});

$("#sheet-config-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const payload = {
    sheetId: form.elements.sheetId.value.trim(),
    sheetRange: form.elements.sheetRange.value.trim() || "Sheet1!A:H",
  };
  try {
    await fetchJSON("/api/sheets/config", { method: "POST", body: JSON.stringify(payload) });
    await refreshStatus();
  } catch (err) {
    alert(err.message);
  }
});

$("#sync-btn").addEventListener("click", async () => {
  const result = await fetchJSON("/api/sheets/sync", { method: "POST" });
  const msg = result.ok
    ? `seen ${result.rowsSeen}, ingested ${result.ingested}, skipped ${result.skippedExisting}`
    : `not ok: ${result.reason}`;
  $("#sync-result").textContent = msg;
  await refreshTasks();
});

$("#logout-btn").addEventListener("click", async () => {
  await fetchJSON("/auth/logout", { method: "POST" });
  await refreshStatus();
});

$("#refresh-btn").addEventListener("click", refreshTasks);

if (new URLSearchParams(location.search).get("auth") === "ok") {
  history.replaceState({}, "", "/");
}

await refreshStatus();
await refreshTasks();
setInterval(refreshTasks, 5000);
