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

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function updateUI() {
  const { state, clients, blocks } = getCurrentState();
  const client = clients.find(c => c.id === state.currentClientId);
  const block = blocks.find(b => b.id === state.currentBlockId);

  clientNameEl.textContent = client ? `Cliente: ${client.nombre}` : "Sin cliente activo";
  activityNameEl.textContent = block ? `Actividad: ${block.actividad}` : "—";

  activityButtons.forEach(btn => {
    btn.classList.toggle("active", block && btn.dataset.activity === block.actividad);
  });

  if (timerInterval) clearInterval(timerInterval);

  if (block) {
    timerInterval = setInterval(() => {
      timerEl.textContent = formatTime(Date.now() - block.inicio);
    }, 1000);
  } else {
    timerEl.textContent = "00:00:00";
  }
}

activityButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    changeActivity(btn.dataset.activity);
    updateUI();
  });
});

document.getElementById("newClient").addEventListener("click", () => {
  const name = prompt("Nombre corto del cliente:");
  if (name) {
    newClient(name);
    updateUI();
  }
});

document.getElementById("changeClient").addEventListener("click", () => {
  const { clients } = getCurrentState();
  const openClients = clients.filter(c => c.estado === "abierto");
  if (openClients.length === 0) return;

  const names = openClients.map(c => c.nombre).join(", ");
  const selected = prompt(`Cambiar a cliente:
${names}`);
  const client = openClients.find(c => c.nombre === selected);

  if (client) {
    changeClient(client.id);
    updateUI();
  }
});

document.getElementById("closeClient").addEventListener("click", () => {
  closeClient();
  updateUI();
});

updateUI();
