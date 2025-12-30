let cliente = null;
let actividad = null;
let inicio = null;
let timerInterval = null;
let enfoque = false;

const clientName = document.getElementById("clientName");
const activityName = document.getElementById("activityName");
const timer = document.getElementById("timer");
const info = document.getElementById("info");

const clientesGuardados = JSON.parse(localStorage.getItem("clientes")) || [];
const reportes = JSON.parse(localStorage.getItem("reportes")) || [];

function formatear(ms) {
  const s = Math.floor(ms / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

function actualizarTimer() {
  timer.textContent = formatear(Date.now() - inicio);
}

document.querySelectorAll("[data-activity]").forEach(btn => {
  btn.onclick = () => {
    if (!cliente) return alert("Selecciona cliente primero");
    actividad = btn.dataset.activity;
    activityName.textContent = actividad;
    document.querySelectorAll("[data-activity]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  };
});

document.getElementById("btnNuevo").onclick = () => {
  if (clientesGuardados.length >= 2) {
    alert("Versión de prueba: máximo 2 clientes");
    return;
  }
  const nombre = prompt("Nombre del cliente:");
  if (!nombre) return;

  cliente = nombre;
  clientesGuardados.push(nombre);
  localStorage.setItem("clientes", JSON.stringify(clientesGuardados));

  inicio = Date.now();
  timerInterval = setInterval(actualizarTimer, 1000);

  clientName.textContent = "Cliente: " + cliente;
};

document.getElementById("btnCambiar").onclick = () => {
  const nombre = prompt("Cambiar a cliente:");
  if (!nombre) return;
  cliente = nombre;
  inicio = Date.now();
  clientName.textContent = "Cliente: " + cliente;
};

document.getElementById("btnCerrar").onclick = () => {
  if (!cliente) return;

  clearInterval(timerInterval);
  const total = Date.now() - inicio;

  reportes.push({
    fecha: new Date().toISOString().slice(0, 10),
    cliente,
    actividad,
    tiempo: total
  });

  localStorage.setItem("reportes", JSON.stringify(reportes));

  info.innerHTML = `✔ Cliente cerrado<br>
  Cliente: ${cliente}<br>
  Tiempo total: ${formatear(total)}<br>
  <span style="color:#2ecc71">Tiempo listo para facturación</span>`;

  cliente = null;
  actividad = null;
  inicio = null;
  timer.textContent = "00:00:00";
  clientName.textContent = "Sin cliente activo";
  activityName.textContent = "—";
};

document.getElementById("btnReporte").onclick = () => {
  let csv = "Fecha,Cliente,Actividad,Tiempo\n";
  reportes.forEach(r => {
    csv += `${r.fecha},${r.cliente},${r.actividad},${formatear(r.tiempo)}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "reporte_focowork.csv";
  a.click();
};

document.getElementById("btnEnfoque").onclick = () => {
  enfoque = !enfoque;
  document.body.classList.toggle("enfoque", enfoque);
  document.getElementById("btnEnfoque").classList.toggle("active", enfoque);
  alert(enfoque ? "🎯 Enfoque activado" : "🎯 Enfoque desactivado");
};
