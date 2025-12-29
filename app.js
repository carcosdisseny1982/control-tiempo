import {
  newClient,
  changeActivity,
  changeClient,
  closeClient,
  getCurrentState
} from "./timeEngine.js";

document.addEventListener("DOMContentLoaded", () => {

  const ACTIVITY_LABELS = {
    trabajo: "Trabajo",
    telefono: "Teléfono",
    cliente: "Cliente",
    estudio: "Visitando",
    otros: "Otros"
  };

  function getWorkerName() {
    let name = localStorage.getItem("focowork_worker_name");
    if (!name) {
      name = prompt("Nombre del trabajador:");
      if (!name) name = "trabajador";
      localStorage.setItem("focowork_worker_name", name.trim());
    }
    return name.trim();
  }

  const WORKER_NAME = getWorkerName();

  const clientNameEl = document.getElementById("clientName");
  const activityNameEl = document.getElementById("activityName");
  const timerEl = document.getElementById("timer");
  const activityButtons = document.querySelectorAll(".activity");

  const focusBtn = document.getElementById("focusBtn");
  const todayBtn = document.getElementById("todayBtn");

  const infoPanel = document.getElementById("infoPanel");
  const infoText = document.getElementById("infoText");

  let timerInterval = null;
  const FOCUS_WINDOW_MS = 90 * 60 * 1000;

  function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  }

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

  function clearSelection() {
    activityButtons.forEach(b => b.classList.remove("selected"));
  }

  function selectActivity(act) {
    clearSelection();
    const btn = document.querySelector(`.activity[data-activity="${act}"]`);
    if (btn) btn.classList.add("selected");
  }

  function updateUI(lastActivity = null) {
    const { state, clients } = getCurrentState();
    const client = clients.find(c => c.id === state.currentClientId);

    clientNameEl.textContent = client
      ? `Cliente: ${client.nombre}`
      : "Sin cliente activo";

    activityNameEl.textContent = lastActivity
      ? `Actividad: ${ACTIVITY_LABELS[lastActivity]}`
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

  activityButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const { state } = getCurrentState();
      if (!state.currentClientId) return;

      const act = btn.dataset.activity;
      changeActivity(act);
      selectActivity(act);
      updateUI(act);
    });
  });

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
    const { state, clients } = getCurrentState();
    const client = clients.find(c => c.id === state.currentClientId);

    if (!client) return;

    const total = calculateClientTotal(client.id);
    closeClient();

    infoText.innerHTML = `
      Cliente: ${client.nombre}<br>
      Tiempo total: ${formatTime(total)}
    `;

    infoPanel.classList.remove("hidden");
    clearSelection();
    updateUI(null);
  };

  focusBtn.onclick = () => alert("🎯 Enfoque operativo");
  todayBtn.onclick = () => alert("📅 Reporte diario operativo");

  updateUI();
});
