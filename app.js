import {
  newClient,
  changeActivity,
  changeClient,
  closeClient,
  getCurrentState
} from "./timeEngine.js";

/* ===== TEXTOS ===== */
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
    name = prompt("Nombre del trabajador:\n(se usará en los reportes)");
    if (!name) name = "trabajador";
    localStorage.setItem("focowork_worker_name", name.trim());
  }
  return name.trim();
}

function safeName(str) {
  return str
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

const WORKER_NAME = getWorkerName();

/* ===== UI ===== */
const clientNameEl = document.getElementById("clientName");
const activityNameEl = document.getElementById("activityName");
const timerEl = document.getElementById("timer");
const activityButtons = document.querySelectorAll(".activity");

const focusBtn =
  document.getElementById("focusBtn") ||
  document.getElementById("focusReport");

const todayBtn =
  document.getElementById("todayBtn") ||
  document.getElementById("dailyReport");

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
