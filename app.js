const data = [
  { grupo: "PDA", tareas: ["iniciar parte"] },
  { grupo: "PLANTA PRINCIPAL", tareas: ["poner cartel de revisión"] },
  { grupo: "FOSO", tareas: ["stop de foso","escalera","distancia buf contrapeso","acuñamiento en foso","faldón","pesas del rescate"]},
  { grupo: "CABINA", tareas: ["pegatina mantenimiento","botonera y señalizaciones de cabina","nivelación en piso","llamadas y señalizaciones de piso","apertura y cierre de puertas de piso","holgura y guiado inferior","tiradores de puertas","limpieza de pisaderas","cristales","pasamanos","iluminación de cabina","espejos","barrera y retroceso","retráctil","oxidaciones"]},
  { grupo: "CUARTO DE MÁQUINAS", tareas: ["luz de hueco","libro de mantenimiento","histórico de averías","iluminación","acometida eléctrica","teleservicio","iluminación de emergencia","rescate","indicador zona de puertas","adherencia","deslizamiento de cables","acuñamiento de cabina","acuñamiento de contrapeso","contactores","finales de carrera"]},
  { grupo: "OPERADOR", tareas: ["patín","contacto de cabina","operador"]},
  { grupo: "TECHO", tareas: ["botonera de inspección","aceite máquina","freno","limitador de velocidad","teleservicio","bloque mecánico del chasis","poleas de desvío","barandilla","trampilla","iluminación de hueco","contacto y mecanismo de puertas de piso","limpieza de puertas y pisaderas","engrase de guías","cables de tracción","linealidad de las guías"]},
  { grupo: "FOSO", tareas: ["contacto y mecanismo de puerta de piso","limpieza de puerta y pisadera"]},
  { grupo: "CUARTO DE MÁQUINAS", tareas: ["luz de hueco"]},
  { grupo: "PLANTA PRINCIPAL", tareas: ["quitar cartel de revisión"]},
  { grupo: "PDA", tareas: ["finalizar parte"]}
];

const RECORD_INICIAL_MS = 90 * 60 * 1000;

let estado = JSON.parse(localStorage.getItem("checklist")) || {};
let startTime = localStorage.getItem("startTime") ? parseInt(localStorage.getItem("startTime")) : null;
let elapsedMs = 0;

const container     = document.getElementById("container");
const finalDiv      = document.getElementById("final");
const hofContainer  = document.getElementById("hofContainer");
const recordOverlay = document.getElementById("recordOverlay");

/* ── TEMA ── */

function aplicarTema(tema) {
  if (tema === "dark") {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }
  localStorage.setItem("tema", tema);

  document.getElementById("btnDia").classList.toggle("tema-activo", tema === "light");
  document.getElementById("btnNoche").classList.toggle("tema-activo", tema === "dark");
}

function setTema(tema) {
  aplicarTema(tema);
}

/* ── HOF ── */

function getHof() {
  let hof = JSON.parse(localStorage.getItem("hallOfFame"));
  if (!hof) {
    hof = [{ initials: "AAA", tiempoMs: RECORD_INICIAL_MS, tiempoStr: "90m 0s", fecha: "record" }];
    localStorage.setItem("hallOfFame", JSON.stringify(hof));
  }
  return hof;
}

function saveHof(hof) {
  hof.sort((a, b) => a.tiempoMs - b.tiempoMs);
  if (hof.length > 5) hof.length = 5;
  localStorage.setItem("hallOfFame", JSON.stringify(hof));
}

function esMejorRecord(ms) {
  const hof = getHof();
  if (hof.length < 3) return true;
  return ms < hof[Math.min(2, hof.length - 1)].tiempoMs;
}

function guardarEnHof(initials, ms, str) {
  const hof = getHof();
  const fecha = new Date().toLocaleDateString("es-ES");
  hof.push({ initials: initials.toUpperCase(), tiempoMs: ms, tiempoStr: str, fecha });
  saveHof(hof);
}

function renderHof() {
  if (!hofContainer) return;
  const hof = getHof();
  hofContainer.innerHTML = "";
  const div = document.createElement("div");
  div.className = "hof";
  const h = document.createElement("h2");
  h.textContent = "🏆 Hall of Fame";
  div.appendChild(h);
  const medals = ["🥇","🥈","🥉","4.","5."];
  hof.slice(0, 5).forEach((entry, i) => {
    const row = document.createElement("div");
    row.className = "hof-entry";
    row.innerHTML = `<span>${medals[i]} <span class="hof-initials">${entry.initials}</span></span><span>${entry.tiempoStr}</span><span style="color:#888;font-size:12px">${entry.fecha}</span>`;
    div.appendChild(row);
  });
  hofContainer.appendChild(div);
}

function renderTop3Final(nuevoMs) {
  const hof = getHof();
  const top3 = hof.slice(0, 3);
  const medals = ["🥇","🥈","🥉"];
  const el = document.getElementById("finalTop3");
  let html = `<div class="top3-title">TOP 3</div>`;
  top3.forEach((e, i) => {
    const esNuevo = (e.tiempoMs === nuevoMs && e.initials !== "AAA");
    html += `<div class="top3-row${esNuevo ? " nuevo" : ""}"><span>${medals[i]} ${e.initials}</span><span>${e.tiempoStr}</span></div>`;
  });
  el.innerHTML = html;
}

/* ── TIEMPO ── */

function formatTime(ms) {
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}m ${secs}s`;
}

/* ── INPUT GAMING RÉCORD ── */

function mostrarInputRecord(ms, str) {
  document.getElementById("recordTiempoDisplay").textContent = str;
  recordOverlay.classList.add("show");
  sonidoRecord();

  const boxes = [document.getElementById("l0"), document.getElementById("l1"), document.getElementById("l2")];
  boxes.forEach((box, i) => {
    box.value = "";
    box.oninput = () => {
      box.value = box.value.toUpperCase().replace(/[^A-Z]/g, "");
      if (box.value.length === 1 && i < 2) boxes[i + 1].focus();
    };
    box.onkeydown = (e) => {
      if (e.key === "Backspace" && box.value === "" && i > 0) boxes[i - 1].focus();
      if (e.key === "Enter") confirmarRecord();
    };
  });
  setTimeout(() => boxes[0].focus(), 100);
}

function confirmarRecord() {
  const boxes = ["l0","l1","l2"].map(id => document.getElementById(id).value.toUpperCase() || "A");
  const initials = boxes.join("");
  guardarEnHof(initials, elapsedMs, formatTime(elapsedMs));
  renderHof();
  recordOverlay.classList.remove("show");
  mostrarFinal();
}

/* ── PANTALLA FINAL ── */

function mostrarFinal() {
  renderTop3Final(elapsedMs);
  finalDiv.classList.add("show");
  lanzarParticulas();
}

/* ── PARTÍCULAS ── */

function lanzarParticulas() {
  for (let i = 0; i < 60; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.left = Math.random() * 100 + "%";
    p.style.bottom = "0px";
    p.style.background = `hsl(${Math.random()*360},100%,60%)`;
    finalDiv.appendChild(p);
    setTimeout(() => p.remove(), 2000);
  }
}

/* ── PROGRESO ── */

function actualizarProgreso() {
  let total = 0, done = 0;
  data.forEach((g, gi) => {
    g.tareas.forEach((_, ti) => {
      total++;
      if (estado[gi+"-"+ti]) done++;
    });
  });

  const pct = done / total;
  const pctInt = Math.round(pct * 100);

  const fill = document.getElementById("barra");
  const label = document.getElementById("barraLabel");

  fill.style.width = pctInt + "%";
  label.textContent = pctInt + "%";

  let color;
  if (pct < 0.5) {
    const g2 = Math.round(pct * 2 * 165);
    color = `rgb(220,${g2},0)`;
  } else {
    const r = Math.round((1 - (pct - 0.5) * 2) * 220);
    color = `rgb(${r},180,0)`;
  }
  fill.style.backgroundColor = color;

  if (pct === 1) {
    fill.style.backgroundColor = "#16a34a";
    label.textContent = "100%";
  }

  if (done === total) {
    elapsedMs = startTime ? Date.now() - startTime : 0;
    const str = formatTime(elapsedMs);
    document.getElementById("finalTime").textContent = `⏱️ Tiempo: ${str}`;
    sonidoVictoria();

    if (esMejorRecord(elapsedMs)) {
      setTimeout(() => mostrarInputRecord(elapsedMs, str), 800);
    } else {
      guardarEnHof("---", elapsedMs, str);
      renderHof();
      setTimeout(() => mostrarFinal(), 800);
    }
  }
}

/* ── RENDER ── */

function render() {
  container.innerHTML = "";

  const hayPendientes = data.some((g, gi) => g.tareas.some((_, ti) => !estado[gi+"-"+ti]));
  if (hayPendientes && !startTime) {
    startTime = Date.now();
    localStorage.setItem("startTime", startTime);
  }

  data.forEach((g, gi) => {
    const pendientes = g.tareas.filter((_, ti) => !estado[gi+"-"+ti]);
    if (!pendientes.length) return;

    const div = document.createElement("div");
    div.className = "grupo";

    const h = document.createElement("h2");
    h.textContent = g.grupo;
    div.appendChild(h);

    g.tareas.forEach((t, ti) => {
      const id = gi+"-"+ti;
      if (estado[id]) return;

      const label = document.createElement("label");
      label.className = "tarea";

      const input = document.createElement("input");
      input.type = "checkbox";

      input.onchange = () => {
        if (input.checked) {
          estado[id] = true;
          guardar();
          actualizarProgreso();
          label.remove();
          if (!g.tareas.some((_, tti) => !estado[gi+"-"+tti])) {
            div.classList.add("fade-out");
            setTimeout(render, 300);
          }
        } else {
          sonidoCancelacion();
          delete estado[id];
          guardar();
          actualizarProgreso();
        }
      };

      const span = document.createElement("span");
      span.textContent = t;
      label.appendChild(input);
      label.appendChild(span);
      div.appendChild(label);
    });

    container.appendChild(div);
  });

  actualizarProgreso();
}

function guardar() {
  localStorage.setItem("checklist", JSON.stringify(estado));
}

function pedirReset() {
  if (confirm("¿Reiniciar la revisión? Se perderá el progreso actual.")) {
    sonidoPenalizacion();
    setTimeout(() => resetChecklist(), 50);
  }
}

function resetChecklist() {
  estado = {};
  startTime = null;
  localStorage.removeItem("checklist");
  localStorage.removeItem("startTime");
  finalDiv.classList.remove("show");
  recordOverlay.classList.remove("show");
  render();
}

/* ── SONIDOS ── */

function sonidoVictoria() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  function nota(freq, tiempo, delay) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "square";
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + tiempo);
    osc.start(now);
    osc.stop(now + tiempo);
  }
  nota(523.25, 0.2, 0);
  nota(659.25, 0.2, 0.15);
  nota(783.99, 0.4, 0.3);
}

function sonidoCancelacion() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  function nota(freq, tiempo, delay) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + tiempo);
    osc.start(now);
    osc.stop(now + tiempo);
  }
  nota(440, 0.15, 0);
  nota(330, 0.2, 0.1);
  nota(220, 0.25, 0.22);
}

function sonidoRecord() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  function nota(freq, tipo, tiempo, delay) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = tipo;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime + delay;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + tiempo);
    osc.start(now);
    osc.stop(now + tiempo);
  }
  nota(330, "square", 0.1, 0);
  nota(392, "square", 0.1, 0.1);
  nota(494, "square", 0.1, 0.2);
  nota(659, "square", 0.35, 0.32);
  nota(784, "square", 0.5, 0.55);
}

function sonidoPenalizacion() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  function nota(freq, tipo, vol, tiempo, delay) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = tipo;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime + delay;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + tiempo);
    osc.start(now);
    osc.stop(now + tiempo);
  }
  nota(220, "sawtooth", 0.3, 0.12, 0);
  nota(185, "sawtooth", 0.3, 0.12, 0.13);
  nota(155, "sawtooth", 0.3, 0.12, 0.26);
  nota(130, "sawtooth", 0.35, 0.35, 0.39);
  nota(98,  "square",   0.25, 0.5,  0.6);
}

/* ── INIT ── */
const temaGuardado = localStorage.getItem("tema") || "light";
aplicarTema(temaGuardado);
getHof();
render();

/* ── EMAIL ── */

function abrirEmail() {
  document.getElementById("emailContrato").value = "";
  document.getElementById("emailMensaje").value = "";
  document.getElementById("emailOverlay").classList.add("show");
  setTimeout(() => document.getElementById("emailContrato").focus(), 100);
}

function cerrarEmail() {
  document.getElementById("emailOverlay").classList.remove("show");
}

function enviarEmail() {
  const contrato = document.getElementById("emailContrato").value.trim();
  const mensaje = document.getElementById("emailMensaje").value.trim();
  if (!mensaje) return;
  const asunto = contrato ? `Contrato ${contrato}` : "Notificación mantenimiento";
  const a = document.createElement("a");
  a.href = `mailto:garchaktali@gmail.com?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  cerrarEmail();
}
