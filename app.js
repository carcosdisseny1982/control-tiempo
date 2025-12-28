import {
  newClient,
  changeActivity,
  changeClient,
  closeClient,
  getCurrentState
} from "./timeEngine.js";

document.addEventListener("DOMContentLoaded", () => {

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

  /* ===== ELEMENTOS UI ===== */
  const clientNameEl = document.getElementById("clientName");
  const activityNameEl = document.getElementById("activityName");
  const timerEl = document.getElementById("timer");
  const activityButtons = document.querySelectorAll(".activity");

  const
