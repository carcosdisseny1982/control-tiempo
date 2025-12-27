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

function calculateClientTotal(clienteId) {
  const { blocks } = getCurrentState();
  const now = Date.now();
  let total = 0;

  blocks.forEach(b => {
    if (b.cliente_id === clienteId) {
      const end = b.fin ?? now;
      total += end - b.inicio;
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
    trabajo: 0,
    telefono: 0,
    cliente: 0,
    estudio: 0,
    otros: 0
  };

  blocks.forEach(b => {
    const start = Math.max(b.inicio, startWindow);
    const end = Math.min(b.fin ?? now, now);

    if (end > start) {
      totals[b.actividad] += end - start;
    }
  });

  const totalTime =
    totals.trabajo +
    totals.telefono +
    totals.cliente +
    totals.estudio +
    totals.otros;

  const workPct = totalTime
    ? Math.round((totals.trabajo / totalTime) * 100)
    : 0;

  let status = "🟢 Enfocado";
  if (workPct < 40) status = "🔴 Dispersión";
  else if (workPct < 65) status = "🟡 Atención";

  return { totals, totalTime, workPct, status };
}

function showFocusReport() {
  const r = calculateFocusReport();

  let msg = "🎯 Enfoque (últimos 90 min)\n\n";
  msg += `🟦 Trabajo: ${formatTime(r.totals.trabajo)}\n`;
  msg += `📞 Teléfono: ${formatTime(r.totals.telefono)}\n`;
  msg += `👥 Cliente: ${formatTime(r.totals.cliente)}\n`;
  msg += `📖 Estudio: ${formatTime(r.totals.estudio)}\n`;
  msg += `⚙️ Otros: ${formatTime(r.totals.otros)}\n\n`;
  msg += `Trabajo: ${r.workPct} %\n`;
  msg += `Estado: ${r.status}`;

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
  const openClients = clients.filter(c => c.estado === "abierto");
  if (openClients.length === 0) return;

  let msg = "Toca el número del cliente:\n\n";
  openClients.forEach((c, i) => (msg += `${i + 1}. ${c.nombre}\n`));

  const sel = parseInt(prompt(msg), 10) - 1;
  if (openClients[sel]) {
    changeClient(openClients[sel].id);
    updateUI();
  }
});

document.getElementById("closeClient").addEventListener("click", () => {
  closeClient();
  updateUI();
});

document
  .getElementById("focusReport")
  .addEventListener("click", showFocusReport);

// ---------- INICIO ----------
updateUI();
