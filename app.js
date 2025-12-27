import {
  newClient,
  changeActivity,
  changeClient,
  closeClient,
  getCurrentState
} from "./timeEngine.js";

const clientNameEl = document.getElementById("clientName");
const timerEl = document.getElementById("timer");
const activityButtons = document.querySelectorAll(".activity");

let timerInterval = null;

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

// ---------- UI ----------

function updateUI() {
  const { state, clients } = getCurrentState();
  const client = clients.find(c => c.id === state.currentClientId);

  clientNameEl.textContent = client
    ? `Cliente: ${client.nombre}`
    : "Sin cliente activo";

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

// BOTONES DE ACTIVIDAD (SIN BLOQUEOS)
activityButtons.forEach(btn => {
  btn.onclick = () => {
    changeActivity(btn.dataset.activity);
    updateUI();
  };
});

// NUEVO CLIENTE
document.getElementById("newClient").onclick = () => {
  const n = prompt("Nombre cliente:");
  if (n) {
    newClient(n.trim());
    updateUI();
  }
};

// CAMBIAR CLIENTE
document.getElementById("changeClient").onclick = () => {
  const { clients } = getCurrentState();
  const open = clients.filter(c => c.estado === "abierto");
  if (!open.length) return;

  let m = "Cliente:\n";
  open.forEach((c, i) => m += `${i + 1}. ${c.nombre}\n`);
  const s = parseInt(prompt(m), 10) - 1;
  if (open[s]) {
    changeClient(open[s].id);
    updateUI();
  }
};

// CERRAR CLIENTE
document.getElementById("closeClient").onclick = () => {
  closeClient();
  updateUI();
};

updateUI();
