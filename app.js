import {
  newClient,
  changeActivity,
  changeClient,
  closeClient,
  getCurrentState
} from "./timeEngine.js";

/* ===== MAPEO TEXTO VISIBLE ===== */
const ACTIVITY_LABELS = {
  trabajo: "Trabajo",
  telefono: "Teléfono",
  cliente: "Cliente",
  estudio: "Visitando",
  otros: "Otros"
};

/* ===== TRABAJADOR (UNA SOLA VEZ) ===== */
function getWorkerName() {
  let name = localStorage.getItem("focowork_worker_name");

  if (!name) {
    name = prompt(
      "Nombre del trabajador:\n(se usará en los reportes)"
    );
    if (name) {
      name = name.trim();
      localStorage.setItem("focowork_worker_name", name);
    } else {
      name = "trabajador";
    }
  }

  return name;
}

function safeName(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

const WORKER_NAME = getWorkerName();

/* ===== ELEMENTOS UI ===== */
const clientNameEl = document.getElementById("clientName");
const activityNameEl = document.getElementById("activityName");
const timerEl = document.getElementById("timer");
const activityButtons = document.querySelectorAll(".activity");

const focusBtn = document.getElementById("focusBtn");
const todayBtn = document.getElementById("todayBtn");

let timerInterval = null;
const FOCUS_WINDOW_MS = 90 * 60 * 1000;

/* ===== UTIL ===== */
function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

/* ===== TOTAL CLIENTE ===== */
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

/* ===== UI ===== */
function clearSelection() {
  activityButtons.forEach(b => b.classList.remove("selected"));
}

function selectActivity(activity) {
  clearSelection();
  const btn = document.querySelector(
    `.activity[data-activity="${activity}"]`
  );
  if (btn) btn.classList.add("selected");
}

function updateUI(lastActivity = null) {
  const { state, clients } = getCurrentState();
  const client = clients.find(c => c.id === state.currentClientId);

  clientNameEl.textContent = client
    ? `Cliente: ${client.nombre}`
    : "Sin cliente activo";

  activityNameEl.textContent = lastActivity
    ? `Actividad: ${ACTIVITY_LABELS[lastActivity] || lastActivity}`
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

/* ===== ACTIVIDADES ===== */
activityButtons.forEach(btn => {
  btn.onclick = () => {
    const { state } = getCurrentState();
    if (!state.currentClientId) return;

    const act = btn.dataset.activity;
    changeActivity(act);
    selectActivity(act);
    updateUI(act);
  };
});

/* ===== CLIENTES ===== */
document.getElementById("newClient").onclick = () => {
  const n = prompt("Nombre cliente:");
  if (!n) return;

  newClient(n.trim());
  changeActivity("trabajo");
  selectActivity("trabajo");
  updateUI("trabajo");
};

document.getElementById("changeClient").onclick = () => {
  const { clients } = getCurrentState();
  const open = clients.filter(c => c.estado === "abierto");
  if (!open.length) return;

  let txt = "Cliente:\n";
  open.forEach((c, i) => txt += `${i + 1}. ${c.nombre}\n`);
  const sel = parseInt(prompt(txt), 10) - 1;
  if (!open[sel]) return;

  changeClient(open[sel].id);
  changeActivity("trabajo");
  selectActivity("trabajo");
  updateUI("trabajo");
};

document.getElementById("closeClient").onclick = () => {
  closeClient();
  clearSelection();
  updateUI(null);
};

/* ===== 📅 HOY (TXT CON NOMBRE DE TRABAJADOR) ===== */
if (todayBtn) {
  todayBtn.onclick = () => {
    const { blocks } = getCurrentState();
    const now = new Date();
    const startDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();

    const byClient = {};

    blocks.forEach(b => {
      const s = Math.max(b.inicio, startDay);
      const e = Math.min(b.fin ?? Date.now(), Date.now());
      if (e <= s) return;

      byClient[b.cliente_id] =
        (byClient[b.cliente_id] || 0) + (e - s);
    });

    let txt = `REPORTE DIARIO - FocoWork\n`;
    txt += `Trabajador: ${WORKER_NAME}\n`;
    txt += `Fecha: ${now.toLocaleDateString()}\n\n`;

    Object.entries(byClient).forEach(([id, t]) => {
      txt += `Cliente ${id}: ${formatTime(t)}\n`;
    });

    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `focowork-${safeName(WORKER_NAME)}-${now.toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
}

updateUI();
