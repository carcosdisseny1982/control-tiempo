import {
  newClient,
  changeActivity,
  changeClient,
  closeClient,
  getCurrentState
} from "./timeEngine.js";

/* ===============================
   CONFIGURACIÓN INICIAL
================================ */

const WORKER_KEY = "focowork_worker_name";
let workerName = localStorage.getItem(WORKER_KEY);

if (!workerName) {
  workerName = prompt("Nombre del trabajador:");
  if (workerName) {
    localStorage.setItem(WORKER_KEY, workerName.trim());
  } else {
    workerName = "Sin nombre";
  }
}

const FOCUS_WINDOW_MS = 90 * 60 * 1000;

/* ===============================
   ELEMENTOS UI
================================ */

const clientNameEl = document.getElementById("clientName");
const activityNameEl = document.getElementById("activityName");
const timerEl = document.getElementById("timer");

const activityButtons = document.querySelectorAll(".activity");

let timerInterval = null;

/* ===============================
   UTILIDADES
================================ */

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/* ===============================
   TIEMPO TOTAL CLIENTE
================================ */

function calculateClientTotal(clientId) {
  const { blocks } = getCurrentState();
  const now = Date.now();
  let total = 0;

  blocks.forEach(b => {
    if (b.cliente_id === clientId) {
      total += (b.fin ?? now) - b.inicio;
    }
  });

  return total;
}

/* ===============================
   ENFOQUE (90 MIN)
================================ */

function calculateFocusReport() {
  const { blocks } = getCurrentState();
  const now = Date.now();
  const startWindow = now - FOCUS_WINDOW_MS;

  const totals = {
    trabajo: 0,
    telefono: 0,
    cliente: 0,
    visitando: 0,
    otros: 0
  };

  blocks.forEach(b => {
    const start = Math.max(b.inicio, startWindow);
    const end = Math.min(b.fin ?? now, now);
    if (end > start && totals[b.actividad] !== undefined) {
      totals[b.actividad] += end - start;
    }
  });

  const totalTime = Object.values(totals).reduce((a, b) => a + b, 0);
  const workPct = totalTime
    ? Math.round((totals.trabajo / totalTime) * 100)
    : 0;

  let status = "🟢 Enfocado";
  if (workPct < 40) status = "🔴 Dispersión";
  else if (workPct < 65) status = "🟡 Atención";

  return { totals, workPct, status };
}

function showFocusReport() {
  const r = calculateFocusReport();

  alert(
    `🎯 ENFOQUE (últimos 90 min)\n\n` +
    `Trabajo: ${formatTime(r.totals.trabajo)}\n` +
    `Teléfono: ${formatTime(r.totals.telefono)}\n` +
    `Cliente: ${formatTime(r.totals.cliente)}\n` +
    `Visitando: ${formatTime(r.totals.visitando)}\n` +
    `Otros: ${formatTime(r.totals.otros)}\n\n` +
    `Trabajo: ${r.workPct}%\n` +
    `Estado: ${r.status}`
  );
}

/* ===============================
   REPORTE DIARIO
================================ */

function buildDailyReportText() {
  const { blocks } = getCurrentState();
  const now = new Date();

  const startDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();

  const totals = {
    trabajo: 0,
    telefono: 0,
    cliente: 0,
    visitando: 0,
    otros: 0
  };

  blocks.forEach(b => {
    const start = Math.max(b.inicio, startDay);
    const end = Math.min(b.fin ?? Date.now(), Date.now());
    if (end > start && totals[b.actividad] !== undefined) {
      totals[b.actividad] += end - start;
    }
  });

  const totalDay = Object.values(totals).reduce((a, b) => a + b, 0);

  let txt =
`REPORTE DIARIO - FocoWork
Trabajador: ${workerName}
Fecha: ${now.toLocaleDateString()}

Trabajo:   ${formatTime(totals.trabajo)}
Teléfono:  ${formatTime(totals.telefono)}
Cliente:   ${formatTime(totals.cliente)}
Visitando: ${formatTime(totals.visitando)}
Otros:     ${formatTime(totals.otros)}

TOTAL: ${formatTime(totalDay)}
`;

  return txt;
}

/* ===============================
   DESCARGA ARCHIVO (UTF-8)
================================ */

function downloadDailyReport() {
  const text = buildDailyReportText();

  const blob = new Blob(
    [text],
    { type: "text/plain;charset=utf-8" } // 👈 ACENTOS CORREGIDOS
  );

  const dateStr = new Date().toISOString().slice(0, 10);
  const safeName = workerName.replace(/\s+/g, "_");

  const filename = `focowork-${safeName}-${dateStr}.txt`;

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;

  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    document.body.removeChild(link);
  }, 100);
}

/* ===============================
   UI
================================ */

function updateUI() {
  const { state, clients } = getCurrentState();
  const client = clients.find(c => c.id === state.currentClientId);

  clientNameEl.textContent = client
    ? `Cliente: ${client.nombre}`
    : "Sin cliente activo";

  activityNameEl.textContent = state.currentActivity
    ? `Actividad: ${state.currentActivity}`
    : "—";

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

/* ===============================
   EVENTOS
================================ */

activityButtons.forEach(btn => {
  btn.onclick = () => {
    changeActivity(btn.dataset.activity);
    updateUI();
  };
});

document.getElementById("newClient").onclick = () => {
  const n = prompt("Nombre del cliente:");
  if (n) {
    newClient(n.trim());
    updateUI();
  }
};

document.getElementById("changeClient").onclick = () => {
  const { clients } = getCurrentState();
  const open = clients.filter(c => c.estado === "abierto");
  if (!open.length) return;

  let m = "Cambiar a cliente:\n";
  open.forEach((c, i) => m += `${i + 1}. ${c.nombre}\n`);
  const s = parseInt(prompt(m), 10) - 1;

  if (open[s]) {
    changeClient(open[s].id);
    updateUI();
  }
};

document.getElementById("closeClient").onclick = () => {
  closeClient();
  updateUI();
};

document.getElementById("focusReport").onclick = showFocusReport;
document.getElementById("dailyPdf").onclick = downloadDailyReport;

/* ===============================
   INICIO
================================ */

updateUI();
