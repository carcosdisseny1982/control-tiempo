import {
  newClient,
  changeActivity,
  changeClient,
  closeClient,
  getCurrentState
} from "./timeEngine.js";

const clientNameEl = document.getElementById("clientName");
const activityNameEl = document.getElementById("activityName");
const timerEl = document.getElementById("timer");
const activityButtons = document.querySelectorAll(".activity");

let timerInterval = null;
const FOCUS_WINDOW_MS = 90 * 60 * 1000;

// ---------- UTILIDADES ----------

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// ---------- TOTAL CLIENTE ----------

function calculateClientTotal(clienteId) {
  const { blocks } = getCurrentState();
  const now = Date.now();
  let total = 0;

  blocks.forEach(b => {
    if (b.cliente_id === clienteId) {
      total += (b.fin ?? now) - b.inicio;
    }
  });

  return total;
}

// ---------- ENFOQUE 90 MIN ----------

function calculateFocusReport() {
  const { blocks } = getCurrentState();
  const now = Date.now();
  const startWindow = now - FOCUS_WINDOW_MS;

  const totals = {
    trabajo: 0, telefono: 0, cliente: 0, estudio: 0, otros: 0
  };

  blocks.forEach(b => {
    const start = Math.max(b.inicio, startWindow);
    const end = Math.min(b.fin ?? now, now);
    if (end > start) totals[b.actividad] += end - start;
  });

  const totalTime = Object.values(totals).reduce((a, b) => a + b, 0);
  const workPct = totalTime ? Math.round((totals.trabajo / totalTime) * 100) : 0;

  let status = "🟢 Enfocado";
  if (workPct < 40) status = "🔴 Dispersión";
  else if (workPct < 65) status = "🟡 Atención";

  return { totals, workPct, status };
}

function showFocusReport() {
  const r = calculateFocusReport();
  alert(
    `🎯 Enfoque (últimos 90 min)\n\n` +
    `🟦 Trabajo: ${formatTime(r.totals.trabajo)}\n` +
    `📞 Teléfono: ${formatTime(r.totals.telefono)}\n` +
    `👥 Cliente: ${formatTime(r.totals.cliente)}\n` +
    `📖 Estudio: ${formatTime(r.totals.estudio)}\n` +
    `⚙️ Otros: ${formatTime(r.totals.otros)}\n\n` +
    `Trabajo: ${r.workPct} %\nEstado: ${r.status}`
  );
}

// ---------- REPORTE DIARIO ----------

function showDailyReport() {
  const { blocks, clients } = getCurrentState();
  const now = new Date();
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const byClient = {};
  const byActivity = {
    trabajo: 0, telefono: 0, cliente: 0, estudio: 0, otros: 0
  };

  blocks.forEach(b => {
    const start = Math.max(b.inicio, startDay);
    const end = Math.min(b.fin ?? Date.now(), Date.now());
    if (end <= start) return;

    const duration = end - start;
    byActivity[b.actividad] += duration;

    const client = clients.find(c => c.id === b.cliente_id);
    if (!client) return;
    byClient[client.nombre] = (byClient[client.nombre] || 0) + duration;
  });

  let msg = `📅 Reporte de hoy\n\n`;

  const totalDay = Object.values(byActivity).reduce((a, b) => a + b, 0);
  msg += `Total: ${formatTime(totalDay)}\n\n`;

  msg += `Por cliente:\n`;
  Object.entries(byClient).forEach(([name, time]) => {
    msg += `- ${name}: ${formatTime(time)}\n`;
  });

  msg += `\nPor actividad:\n`;
  msg += `🟦 Trabajo: ${formatTime(byActivity.trabajo)}\n`;
  msg += `📞 Teléfono: ${formatTime(byActivity.telefono)}\n`;
  msg += `👥 Cliente: ${formatTime(byActivity.cliente)}\n`;
  msg += `📖 Estudio: ${formatTime(byActivity.estudio)}\n`;
  msg += `⚙️ Otros: ${formatTime(byActivity.otros)}\n`;

  alert(msg);
}

// ---------- UI ----------

function updateUI() {
  const { state, clients, blocks } = getCurrentState();
  const client = clients.find(c => c.id === state.currentClientId);
  const block = blocks.find(b => b.id === state.currentBlockId);

  clientNameEl.textContent = client
    ? `Cliente: ${client.nombre}`
    : "Sin cliente activo";

  activityNameEl.textContent = block
    ? `Actividad: ${block.actividad}`
    : "—";

  activityButtons.forEach(btn => {
    btn.classList.toggle(
      "active",
      block && btn.dataset.activity === block.actividad
    );
  });

  if (timerInterval) clearInterval(timerInterval);

  if (client) {
    timerInterval = setInterval(() => {
      timerEl.textContent = formatTime(
        calculateClientTotal(client.id)
      );
    }, 1000);
  } else {
    timerEl.textContent = "00:00:00";
  }
}

// ---------- EVENTOS ----------

activityButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    changeActivity(btn.dataset.activity);
    updateUI();
  });
});

document.getElementById("newClient").addEventListener("click", () => {
  const name = prompt("Nombre corto del cliente:");
  if (name) {
    newClient(name.trim());
    updateUI();
  }
});

document.getElementById("changeClient").addEventListener("click", () => {
  const { clients } = getCurrentState();
  const open = clients.filter(c => c.estado === "abierto");
  if (!open.length) return;

  let msg = "Cliente:\n\n";
  open.forEach((c, i) => msg += `${i + 1}. ${c.nombre}\n`);
  const sel = parseInt(prompt(msg), 10) - 1;

  if (open[sel]) {
    changeClient(open[sel].id);
    updateUI();
  }
});

document.getElementById("closeClient").addEventListener("click", () => {
  closeClient();
  updateUI();
});

document.getElementById("focusReport")
  .addEventListener("click", showFocusReport);

document.getElementById("dailyReport")
  .addEventListener("click", showDailyReport);

// ---------- INICIO ----------
updateUI();
