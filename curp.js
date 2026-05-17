/* ════════════════════════════════════════════
   ICATEBCS – Sistema de Control Escolar
   curp.js — Dashboard · Búsqueda · PDF · Excel
════════════════════════════════════════════ */

/* ── Referencias DOM ── */
const input       = document.getElementById('curpInput');
const btn         = document.getElementById('btnBuscar');
const state       = document.getElementById('stateArea');
const result      = document.getElementById('resultArea');
const nombreInput = document.getElementById('nombreInput');
const sugerencias = document.getElementById('sugerencias');

/* ── Estado global ── */
let listaDocentes    = [];
let highlightedIndex = -1;

/* ════════════════════════════════
   INICIALIZACIÓN
════════════════════════════════ */
async function inicializar() {
  try {
    const res = await fetch('docentes.json');
    listaDocentes = await res.json();
    renderDashboard();
  } catch (e) {
    document.getElementById('kpiGrid').innerHTML =
      `<div class="error-box" style="grid-column:1/-1">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        No se pudo cargar la base de datos. Usa Live Server en VSCode para evitar restricciones CORS.
      </div>`;
  }
}

/* ════════════════════════════════
   NAVEGACIÓN ENTRE SECCIONES
════════════════════════════════ */
function showSection(id) {
  document.getElementById('sectionDashboard').style.display = id === 'dashboard' ? 'block' : 'none';
  document.getElementById('sectionBusqueda').style.display  = id === 'busqueda'  ? 'block' : 'none';
  document.getElementById('navDashboard').classList.toggle('active', id === 'dashboard');
  document.getElementById('navBusqueda').classList.toggle('active',  id === 'busqueda');
  if (id === 'busqueda') input.focus();
}

/* ════════════════════════════════
   DASHBOARD – MÉTRICAS
════════════════════════════════ */
function renderDashboard() {
  const total      = listaDocentes.length;
  const alumnos    = listaDocentes.filter(d => d.rol === 'Alumno').length;
  const capacitadores = listaDocentes.filter(d => d.rol === 'Capacitador').length;
  const cursosActivos = listaDocentes.reduce((sum, d) =>
    sum + (d.historial_cursos || []).filter(c => c.estatus === 'En curso').length, 0);

  /* KPI cards */
  document.getElementById('kpiGrid').innerHTML = `
    ${kpiCard('accent-guinda','bg-guinda',
      `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      total, 'Total Registrados', 'Alumnos y capacitadores')}
    ${kpiCard('accent-guinda','bg-guinda',
      `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`,
      alumnos, 'Total de Alumnos', `${Math.round(alumnos/total*100)}% del padrón`)}
    ${kpiCard('accent-blue','bg-blue',
      `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
      capacitadores, 'Capacitadores', `${Math.round(capacitadores/total*100)}% del padrón`)}
    ${kpiCard('accent-green','bg-green',
      `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
      cursosActivos, 'Cursos Activos', 'En curso actualmente')}
  `;

  /* Barras por sede */
  const sedeCount = {};
  listaDocentes.forEach(d => {
    (d.historial_cursos || []).forEach(c => {
      sedeCount[c.sede] = (sedeCount[c.sede] || 0) + 1;
    });
  });
  const maxSede = Math.max(...Object.values(sedeCount), 1);
  const sedeHTML = Object.entries(sedeCount)
    .sort((a,b) => b[1]-a[1])
    .map(([sede, count]) => `
      <div class="chart-bar-row">
        <div class="chart-bar-label" title="${sede}">${sede}</div>
        <div class="chart-bar-track">
          <div class="chart-bar-fill" style="width:${Math.round(count/maxSede*100)}%"></div>
        </div>
        <div class="chart-bar-count">${count}</div>
      </div>`).join('');
  document.getElementById('chartSedes').innerHTML = sedeHTML || '<p style="font-size:.8rem;color:#ccc;padding:.5rem 0;">Sin datos</p>';

  /* Lista reciente */
  document.getElementById('listaReciente').innerHTML = listaDocentes.map((d,i) => {
    const nombreFull = [d.nombre, d.apellido_paterno, d.apellido_materno].filter(Boolean).join(' ');
    const cursosD = (d.historial_cursos||[]).length;
    const rolClass = (d.rol||'').toLowerCase() === 'alumno' ? 'alumno' : 'capacitador';
    return `
      <div class="recent-item" onclick="irAConsulta('${d.curp}')">
        <div class="recent-avatar ${rolClass}">${d.foto_inicial || '?'}</div>
        <div class="recent-info">
          <div class="recent-name">${nombreFull}</div>
          <div class="recent-meta">${cursosD} curso${cursosD!==1?'s':''} · ${d.municipio||''}</div>
        </div>
        <span class="recent-badge badge-${rolClass}">${d.rol||'—'}</span>
      </div>`;
  }).join('');

  /* Fecha */
  const hoy = new Date();
  document.getElementById('fechaHoy').textContent =
    hoy.toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

function kpiCard(accent, iconBg, iconSVG, value, label, sub) {
  return `
    <div class="kpi-card ${accent}">
      <div class="kpi-icon ${iconBg}">${iconSVG}</div>
      <div class="kpi-value">${value}</div>
      <div class="kpi-label">${label}</div>
      <div class="kpi-sub">${sub}</div>
    </div>`;
}

function irAConsulta(curp) {
  showSection('busqueda');
  switchTab('curp');
  input.value = curp;
  consultarCURP();
}

/* ════════════════════════════════
   TABS
════════════════════════════════ */
function switchTab(tab) {
  document.getElementById('panelCurp').style.display   = tab === 'curp'   ? 'block' : 'none';
  document.getElementById('panelNombre').style.display = tab === 'nombre' ? 'block' : 'none';
  document.getElementById('tabCurp').classList.toggle('active',   tab === 'curp');
  document.getElementById('tabNombre').classList.toggle('active', tab === 'nombre');
  limpiar();
  if (tab === 'nombre') nombreInput.focus();
  else input.focus();
}

/* ════════════════════════════════
   BÚSQUEDA POR CURP
════════════════════════════════ */
input.addEventListener('input', () => {
  const pos = input.selectionStart;
  input.value = input.value.toUpperCase();
  input.setSelectionRange(pos, pos);
});
input.addEventListener('keydown', e => { if (e.key === 'Enter') consultarCURP(); });

function usarEjemplo(curp) {
  showSection('busqueda');
  switchTab('curp');
  input.value = curp;
  consultarCURP();
}

async function consultarCURP() {
  const curp = input.value.trim().toUpperCase();
  if (!curp) { mostrarError('Por favor ingresa un CURP para consultar.'); return; }
  if (curp.length !== 18) {
    mostrarError(`El CURP debe tener exactamente 18 caracteres. Ingresaste ${curp.length}.`);
    return;
  }
  limpiar();
  mostrarLoader('Buscando en base de datos…');
  btn.disabled = true;
  try {
    if (!listaDocentes.length) {
      const res = await fetch('docentes.json');
      listaDocentes = await res.json();
    }
    state.style.display = 'none';
    const curpLimpio = curp.replace(/[-\s]/g, '');
    const encontrado = listaDocentes.find(d => d.curp.replace(/[-\s]/g, '') === curpLimpio);
    encontrado
      ? (result.innerHTML = buildResultCard(encontrado))
      : mostrarError(`No se encontró ningún registro con el CURP <strong>${curp}</strong>.`);
  } catch {
    mostrarError('No se pudo cargar la base de datos. Usa Live Server (VSCode).');
  } finally {
    btn.disabled = false;
  }
}

/* ════════════════════════════════
   BÚSQUEDA POR NOMBRE
════════════════════════════════ */
function onNombreInput() {
  highlightedIndex = -1;
  const q = nombreInput.value.trim();
  if (q.length < 2) { cerrarDropdown(); return; }
  const terminos = q.toLowerCase().split(/\s+/);
  const coincidencias = listaDocentes.filter(d => {
    const texto = [d.nombre, d.apellido_paterno, d.apellido_materno].join(' ').toLowerCase();
    return terminos.every(t => texto.includes(t));
  });
  renderDropdown(coincidencias, q);
}

function onNombreKeydown(e) {
  const items = sugerencias.querySelectorAll('.suggestion-item');
  if (!items.length) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); highlightedIndex = Math.min(highlightedIndex+1, items.length-1); actualizarHighlight(items); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); highlightedIndex = Math.max(highlightedIndex-1, 0); actualizarHighlight(items); }
  else if (e.key === 'Enter') { e.preventDefault(); if (highlightedIndex >= 0) items[highlightedIndex].click(); }
  else if (e.key === 'Escape') cerrarDropdown();
}

function actualizarHighlight(items) {
  items.forEach((el,i) => el.classList.toggle('highlighted', i === highlightedIndex));
  if (highlightedIndex >= 0) items[highlightedIndex].scrollIntoView({ block:'nearest' });
}

function renderDropdown(lista, query) {
  if (!lista.length) {
    sugerencias.style.display = 'block';
    sugerencias.innerHTML = `<div class="no-results">Sin resultados para "<strong>${query}</strong>"</div>`;
    return;
  }
  sugerencias.style.display = 'block';
  sugerencias.innerHTML = lista.map(d => {
    const nombreFull = [d.nombre, d.apellido_paterno, d.apellido_materno].filter(Boolean).join(' ');
    const rolClass = (d.rol||'').toLowerCase() === 'alumno' ? 'alumno' : 'capacitador';
    return `
      <div class="suggestion-item" onclick="seleccionarDocente(${listaDocentes.indexOf(d)})">
        <div class="sug-avatar" style="${rolClass==='capacitador'?'background:linear-gradient(135deg,#1a3a6b,#2563EB)':''}">${d.foto_inicial||'?'}</div>
        <div class="sug-info">
          <div class="sug-name">${resaltarCoincidencia(nombreFull, query)}</div>
          <div class="sug-curp">${d.curp} · ${d.rol}</div>
        </div>
        <svg class="sug-arrow" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
      </div>`;
  }).join('');
}

function resaltarCoincidencia(texto, query) {
  const terminos = query.trim().split(/\s+/).filter(Boolean);
  let r = texto;
  terminos.forEach(t => {
    const rx = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
    r = r.replace(rx, '<mark>$1</mark>');
  });
  return r;
}

function seleccionarDocente(index) {
  const docente = listaDocentes[index];
  if (!docente) return;
  cerrarDropdown();
  nombreInput.value = [docente.nombre, docente.apellido_paterno, docente.apellido_materno].filter(Boolean).join(' ');
  limpiar();
  result.innerHTML = buildResultCard(docente);
  setTimeout(() => result.scrollIntoView({ behavior:'smooth', block:'start' }), 100);
}

function cerrarDropdown() {
  sugerencias.style.display = 'none';
  sugerencias.innerHTML = '';
  highlightedIndex = -1;
}
document.addEventListener('click', e => { if (!e.target.closest('#panelNombre')) cerrarDropdown(); });

/* ════════════════════════════════
   UI COMPARTIDA
════════════════════════════════ */
function mostrarLoader(msg = 'Cargando…') {
  state.style.display = 'block';
  state.innerHTML = `<div class="loader"><div class="spinner"></div><p class="loader-text">${msg}</p></div>`;
}
function mostrarError(msg) {
  state.style.display = 'block';
  state.innerHTML = `<div class="error-box"><svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${msg}</div>`;
}
function limpiar() {
  state.style.display = 'none';
  state.innerHTML = '';
  result.innerHTML = '';
}
function showToast(msg = 'Operación completada') {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}

/* ════════════════════════════════
   HELPERS DE FORMATO
════════════════════════════════ */
function formatFecha(f) {
  if (!f) return '—';
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const p = f.includes('-') ? f.split('-') : f.split('/');
  if (p.length === 3) {
    return f.includes('-')
      ? `${+p[2]} ${meses[+p[1]-1]} ${p[0]}`
      : `${+p[0]} ${meses[+p[1]-1]} ${p[2]}`;
  }
  return f;
}
function sexoLabel(s) {
  if (!s) return '—';
  const up = s.toUpperCase();
  const esH = up==='H'||up==='HOMBRE';
  return `<span class="chip ${esH?'chip-m':'chip-f'}">${esH?'♂ Hombre':'♀ Mujer'}</span>`;
}
function estatusBadge(e) {
  const map = {
    'Aprobado': 'aprobado',
    'En curso': 'encurso',
    'Baja':     'baja',
  };
  const cls = map[e] || 'baja';
  return `<span class="estatus-badge ${cls}"><span class="estatus-dot"></span>${e}</span>`;
}

/* ════════════════════════════════
   TARJETA DE PERFIL COMPLETA
════════════════════════════════ */
function buildResultCard(doc) {
  const nombreFull = [doc.nombre, doc.apellido_paterno, doc.apellido_materno].filter(Boolean).join(' ');
  const rolClass   = (doc.rol||'').toLowerCase() === 'alumno' ? 'alumno' : 'capacitador';
  const cursos     = doc.historial_cursos || [];
  const aprobados  = cursos.filter(c => c.estatus === 'Aprobado').length;

  return `
    <div class="result-card">

      <!-- Encabezado de perfil -->
      <div class="result-header">
        <div class="avatar">${doc.foto_inicial||'??'}</div>
        <div>
          <div class="result-name">${nombreFull}</div>
          <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.5rem;align-items:center;">
            <div class="result-curp-tag"><div class="verified-dot"></div>${doc.curp}</div>
            <div class="result-rol-tag ${rolClass}">${doc.rol||'—'}</div>
          </div>
          <div style="margin-top:.5rem;font-size:.75rem;color:rgba(255,255,255,.65);">
            ${doc.correo||''} ${doc.telefono ? '· '+doc.telefono : ''}
          </div>
        </div>
      </div>

      <!-- Grid de datos personales -->
      <div class="data-grid">
        <div class="data-item">
          <div class="data-item-label">Nombre(s)</div>
          <div class="data-item-value big">${doc.nombre||'—'}</div>
        </div>
        <div class="data-item">
          <div class="data-item-label">Apellido Paterno</div>
          <div class="data-item-value big">${doc.apellido_paterno||'—'}</div>
        </div>
        <div class="data-item">
          <div class="data-item-label">Apellido Materno</div>
          <div class="data-item-value big">${doc.apellido_materno||'—'}</div>
        </div>
        <div class="data-item">
          <div class="data-item-label">Sexo</div>
          <div class="data-item-value">${sexoLabel(doc.sexo)}</div>
        </div>
        <div class="data-item">
          <div class="data-item-label">Fecha de Nacimiento</div>
          <div class="data-item-value">${formatFecha(doc.fecha_nacimiento)}</div>
        </div>
        <div class="data-item">
          <div class="data-item-label">Municipio</div>
          <div class="data-item-value">${doc.municipio||'—'}</div>
        </div>
        <div class="data-item">
          <div class="data-item-label">Teléfono</div>
          <div class="data-item-value">${doc.telefono||'—'}</div>
        </div>
        <div class="data-item">
          <div class="data-item-label">Correo Electrónico</div>
          <div class="data-item-value"><a href="mailto:${doc.correo}">${doc.correo||'—'}</a></div>
        </div>
        <div class="data-item">
          <div class="data-item-label">Rol</div>
          <div class="data-item-value">
            <span class="chip ${rolClass==='alumno'?'chip-f':'chip-m'}">${doc.rol||'—'}</span>
          </div>
        </div>
        <div class="data-item">
          <div class="data-item-label">Cursos Aprobados</div>
          <div class="data-item-value">
            <span class="chip chip-valid">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
              ${aprobados} de ${cursos.length}
            </span>
          </div>
        </div>
      </div>

      <!-- Historial de cursos -->
      <div class="cursos-section">
        <div class="cursos-header">
          <div class="cursos-header-title">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            Historial de Cursos
            <span class="cursos-count">${cursos.length}</span>
          </div>
        </div>
        <div class="cursos-table-wrap">
          ${cursos.length === 0
            ? '<p style="font-size:.82rem;color:#bbb;padding:1rem 0;">Sin cursos registrados.</p>'
            : `<table class="cursos-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Curso</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Sede</th>
                    <th>Estatus</th>
                    <th>Constancia</th>
                  </tr>
                </thead>
                <tbody>
                  ${cursos.map((c, i) => `
                    <tr>
                      <td style="color:#ccc;font-size:.75rem;">${i+1}</td>
                      <td style="font-weight:600;">${c.nombre_curso}</td>
                      <td>${formatFecha(c.fecha_inicio)}</td>
                      <td>${formatFecha(c.fecha_fin)}</td>
                      <td style="font-size:.78rem;color:#777;">${c.sede}</td>
                      <td>${estatusBadge(c.estatus)}</td>
                      <td>
                        ${c.estatus === 'Aprobado'
                          ? `<button class="btn-constancia"
                               onclick="generarConstancia(${JSON.stringify(nombreFull)}, ${JSON.stringify(c.nombre_curso)}, ${JSON.stringify(c.fecha_fin)}, ${JSON.stringify(c.sede)})">
                               <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 15 12 18 15 15"/><line x1="12" y1="12" x2="12" y2="18"/></svg>
                               Generar PDF
                             </button>`
                          : `<span style="font-size:.7rem;color:#ddd;">—</span>`}
                      </td>
                    </tr>`).join('')}
                </tbody>
              </table>`}
        </div>
      </div>

      <!-- Footer de la tarjeta -->
      <div class="result-card-footer">
        <div>
          <div class="data-item-label" style="margin-bottom:.2rem;">CURP</div>
          <div class="curp-mono">${doc.curp}</div>
        </div>
        <div style="margin-left:auto;">
          <p style="font-size:.67rem;color:#ccc;">Fuente: Base de datos ICATEBCS · Solo uso interno</p>
        </div>
      </div>

    </div>`;
}

/* ════════════════════════════════
   GENERAR CONSTANCIA PDF
════════════════════════════════ */
function generarConstancia(nombreCompleto, nombreCurso, fechaFin, sede) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  /* ── Fondo crema ── */
  doc.setFillColor(250, 247, 242);
  doc.rect(0, 0, W, H, 'F');

  /* ── Borde exterior doble ── */
  doc.setDrawColor(107, 18, 48);
  doc.setLineWidth(2.5);
  doc.rect(8, 8, W-16, H-16);
  doc.setLineWidth(0.6);
  doc.setDrawColor(201, 168, 76);
  doc.rect(11, 11, W-22, H-22);

  /* ── Esquinas decorativas (cuadraditos dorados) ── */
  const ornament = (x, y) => {
    doc.setFillColor(201, 168, 76);
    doc.rect(x, y, 5, 5, 'F');
    doc.setFillColor(107, 18, 48);
    doc.rect(x+1.5, y+1.5, 2, 2, 'F');
  };
  ornament(8, 8); ornament(W-13, 8); ornament(8, H-13); ornament(W-13, H-13);

  /* ── Banda guinda superior ── */
  doc.setFillColor(107, 18, 48);
  doc.rect(11, 11, W-22, 22, 'F');

  /* ── ICATEBCS en banda ── */
  doc.setFont('helvetica','bold');
  doc.setFontSize(11);
  doc.setTextColor(232, 201, 122);
  doc.text('INSTITUTO DE CAPACITACIÓN PARA EL TRABAJO DEL ESTADO DE BAJA CALIFORNIA SUR', W/2, 24, { align:'center' });

  /* ── "CONSTANCIA DE CAPACITACIÓN" ── */
  doc.setTextColor(107, 18, 48);
  doc.setFontSize(11);
  doc.setFont('helvetica','bold');
  doc.text('CONSTANCIA DE CAPACITACIÓN', W/2, 46, { align:'center' });

  /* Línea dorada bajo título */
  doc.setDrawColor(201, 168, 76);
  doc.setLineWidth(0.8);
  doc.line(W/2-55, 50, W/2+55, 50);

  /* ── Texto "Hace constar que:" ── */
  doc.setTextColor(100, 60, 70);
  doc.setFont('times','italic');
  doc.setFontSize(11);
  doc.text('El Instituto de Capacitación para el Trabajo del Estado de B.C.S. hace constar que:', W/2, 65, { align:'center' });

  /* ── Nombre del participante ── */
  doc.setTextColor(74, 11, 32);
  doc.setFont('times','bolditalic');
  doc.setFontSize(26);
  doc.text(nombreCompleto, W/2, 85, { align:'center' });

  /* Línea bajo el nombre */
  doc.setDrawColor(107, 18, 48);
  doc.setLineWidth(0.4);
  const nameW = doc.getTextWidth(nombreCompleto);
  doc.line(W/2 - nameW/2, 89, W/2 + nameW/2, 89);

  /* ── Texto "ha acreditado satisfactoriamente" ── */
  doc.setTextColor(80, 70, 70);
  doc.setFont('times','italic');
  doc.setFontSize(11);
  doc.text('ha acreditado satisfactoriamente el curso de capacitación:', W/2, 100, { align:'center' });

  /* ── Nombre del curso ── */
  doc.setTextColor(107, 18, 48);
  doc.setFont('helvetica','bold');
  doc.setFontSize(20);
  doc.text(nombreCurso, W/2, 116, { align:'center' });

  /* ── Datos del curso ── */
  doc.setTextColor(100, 90, 90);
  doc.setFont('helvetica','normal');
  doc.setFontSize(9.5);
  const fechaFormateada = formatFecha(fechaFin);
  doc.text(`Sede: ${sede}    ·    Fecha de término: ${fechaFormateada}`, W/2, 127, { align:'center' });

  /* ── Folio ── */
  const folio = 'ICATEBCS-' + Date.now().toString(36).toUpperCase().slice(-6);
  doc.setTextColor(180, 160, 160);
  doc.setFontSize(8);
  doc.text(`Folio: ${folio}`, W/2, 136, { align:'center' });

  /* ── Líneas de firma ── */
  const firmaY = H - 36;
  doc.setDrawColor(107, 18, 48);
  doc.setLineWidth(0.5);
  doc.line(W*0.25-30, firmaY, W*0.25+30, firmaY);
  doc.line(W*0.75-30, firmaY, W*0.75+30, firmaY);

  doc.setFont('helvetica','bold');
  doc.setFontSize(8.5);
  doc.setTextColor(74, 11, 32);
  doc.text('DIRECTOR(A) GENERAL', W*0.25, firmaY+6, { align:'center' });
  doc.text('COORDINACIÓN ACADÉMICA', W*0.75, firmaY+6, { align:'center' });

  doc.setFont('helvetica','normal');
  doc.setFontSize(7.5);
  doc.setTextColor(160, 140, 140);
  doc.text('Instituto de Capacitación para el Trabajo', W*0.25, firmaY+11, { align:'center' });
  doc.text('Instituto de Capacitación para el Trabajo', W*0.75, firmaY+11, { align:'center' });

  /* ── Banda guinda inferior ── */
  doc.setFillColor(107, 18, 48);
  doc.rect(11, H-19, W-22, 8, 'F');
  doc.setFont('helvetica','normal');
  doc.setFontSize(7.5);
  doc.setTextColor(201, 168, 76);
  doc.text('ICATEBCS · Gobierno del Estado de Baja California Sur · www.icatebcs.gob.mx', W/2, H-14, { align:'center' });

  /* ── Descarga ── */
  const nombreArchivo = `Constancia_${nombreCurso.replace(/\s+/g,'_')}_${nombreCompleto.split(' ')[0]}.pdf`;
  doc.save(nombreArchivo);
  showToast(`Constancia de "${nombreCurso}" descargada`);
}

/* ════════════════════════════════
   EXPORTAR A .XLSX
════════════════════════════════ */
function exportarXLSX() {
  if (!listaDocentes.length) {
    mostrarError('No hay datos cargados para exportar.');
    return;
  }

  /* Hoja 1: Personas */
  const colsPersonas = [
    { key: 'curp',               label: 'CURP'               },
    { key: 'nombre',             label: 'Nombre(s)'          },
    { key: 'apellido_paterno',   label: 'Apellido Paterno'   },
    { key: 'apellido_materno',   label: 'Apellido Materno'   },
    { key: 'rol',                label: 'Rol'                },
    { key: 'sexo',               label: 'Sexo'               },
    { key: 'fecha_nacimiento',   label: 'Fecha de Nacimiento'},
    { key: 'entidad_nacimiento', label: 'Entidad'            },
    { key: 'municipio',          label: 'Municipio'          },
    { key: 'telefono',           label: 'Teléfono'           },
    { key: 'correo',             label: 'Correo'             },
  ];
  const filasPersonas = listaDocentes.map(d =>
    colsPersonas.reduce((o, c) => { o[c.label] = d[c.key] ?? ''; return o; }, {})
  );
  const hojaPersonas = XLSX.utils.json_to_sheet(filasPersonas, { header: colsPersonas.map(c=>c.label) });
  hojaPersonas['!cols'] = colsPersonas.map(col => ({
    wch: Math.min(Math.max(...listaDocentes.map(d => String(d[col.key]||'').length), col.label.length) + 4, 42)
  }));

  /* Hoja 2: Cursos (desnormalizado) */
  const filasCursos = [];
  listaDocentes.forEach(d => {
    const nombre = [d.nombre, d.apellido_paterno, d.apellido_materno].filter(Boolean).join(' ');
    (d.historial_cursos||[]).forEach(c => {
      filasCursos.push({
        'CURP':          d.curp,
        'Nombre':        nombre,
        'Rol':           d.rol,
        'Curso':         c.nombre_curso,
        'Fecha Inicio':  c.fecha_inicio,
        'Fecha Fin':     c.fecha_fin,
        'Sede':          c.sede,
        'Estatus':       c.estatus,
      });
    });
  });
  const hojaCursos = XLSX.utils.json_to_sheet(filasCursos);
  hojaCursos['!cols'] = [20,30,14,28,14,14,26,12].map(w => ({ wch: w }));

  /* Libro */
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hojaPersonas, 'Participantes');
  XLSX.utils.book_append_sheet(libro, hojaCursos,   'Historial Cursos');

  const hoy = new Date();
  const fecha = `${hoy.getFullYear()}${String(hoy.getMonth()+1).padStart(2,'0')}${String(hoy.getDate()).padStart(2,'0')}`;
  XLSX.writeFile(libro, `ICATEBCS_ControlEscolar_${fecha}.xlsx`);
  showToast('Excel descargado correctamente');
}

/* ── Arranque ── */
inicializar();