/* ──────────────────────────────────────────
   ICATEBCS – Consulta de CURP (Modo Local)
   curp.js — Búsqueda por CURP y por Nombre
────────────────────────────────────────── */

/* ── Referencias DOM ── */
const input       = document.getElementById('curpInput');
const btn         = document.getElementById('btnBuscar');
const state       = document.getElementById('stateArea');
const result      = document.getElementById('resultArea');
const nombreInput = document.getElementById('nombreInput');
const sugerencias = document.getElementById('sugerencias');

/* ── Estado del dropdown ── */
let listaDocentes    = [];   // se llena al cargar el JSON
let highlightedIndex = -1;   // ítem activo con teclado

/* ── Cargar JSON al iniciar ── */
async function cargarDocentes() {
  try {
    const res = await fetch('docentes.json');
    listaDocentes = await res.json();
  } catch {
    // Si falla, la búsqueda por nombre mostrará error al usarse
  }
}
cargarDocentes();

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

/* Auto-mayúsculas */
input.addEventListener('input', () => {
  const pos = input.selectionStart;
  input.value = input.value.toUpperCase();
  input.setSelectionRange(pos, pos);
});
input.addEventListener('keydown', e => {
  if (e.key === 'Enter') consultarCURP();
});

function usarEjemplo(curp) {
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
    mostrarError('No se pudo cargar la base de datos. Usa Live Server (VSCode) en lugar de abrir el archivo directamente.');
  } finally {
    btn.disabled = false;
  }
}

/* ════════════════════════════════
   BÚSQUEDA POR NOMBRE (autocomplete)
════════════════════════════════ */

function onNombreInput() {
  highlightedIndex = -1;
  const q = nombreInput.value.trim();

  if (q.length < 2) {
    cerrarDropdown();
    return;
  }

  const terminos = q.toLowerCase().split(/\s+/);
  const coincidencias = listaDocentes.filter(d => {
    const texto = [d.nombre, d.apellido_paterno, d.apellido_materno]
      .join(' ').toLowerCase();
    return terminos.every(t => texto.includes(t));
  });

  renderDropdown(coincidencias, q);
}

function onNombreKeydown(e) {
  const items = sugerencias.querySelectorAll('.suggestion-item');
  if (!items.length) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
    actualizarHighlight(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    highlightedIndex = Math.max(highlightedIndex - 1, 0);
    actualizarHighlight(items);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (highlightedIndex >= 0) items[highlightedIndex].click();
  } else if (e.key === 'Escape') {
    cerrarDropdown();
  }
}

function actualizarHighlight(items) {
  items.forEach((el, i) => el.classList.toggle('highlighted', i === highlightedIndex));
  if (highlightedIndex >= 0) items[highlightedIndex].scrollIntoView({ block: 'nearest' });
}

function renderDropdown(lista, query) {
  if (!lista.length) {
    sugerencias.style.display = 'block';
    sugerencias.innerHTML = `<div class="no-results">Sin resultados para "<strong>${query}</strong>"</div>`;
    return;
  }

  sugerencias.style.display = 'block';
  sugerencias.innerHTML = lista.map((d, i) => {
    const nombreFull = [d.nombre, d.apellido_paterno, d.apellido_materno].filter(Boolean).join(' ');
    const nombreResaltado = resaltarCoincidencia(nombreFull, query);
    return `
      <div class="suggestion-item" data-index="${i}" onclick="seleccionarDocente(${listaDocentes.indexOf(d)})">
        <div class="sug-avatar">${d.foto_inicial || '??'}</div>
        <div class="sug-info">
          <div class="sug-name">${nombreResaltado}</div>
          <div class="sug-curp">${d.curp}</div>
        </div>
        <svg class="sug-arrow" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>`;
  }).join('');
}

/* Resalta los caracteres que coinciden con la búsqueda */
function resaltarCoincidencia(texto, query) {
  const terminos = query.trim().split(/\s+/).filter(Boolean);
  let result = texto;
  terminos.forEach(t => {
    const regex = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    result = result.replace(regex, '<mark>$1</mark>');
  });
  return result;
}

function seleccionarDocente(index) {
  const docente = listaDocentes[index];
  if (!docente) return;
  cerrarDropdown();
  nombreInput.value = [docente.nombre, docente.apellido_paterno, docente.apellido_materno]
    .filter(Boolean).join(' ');
  limpiar();
  result.innerHTML = buildResultCard(docente);
  // scroll suave al resultado
  setTimeout(() => result.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
}

function cerrarDropdown() {
  sugerencias.style.display = 'none';
  sugerencias.innerHTML = '';
  highlightedIndex = -1;
}

/* Cerrar dropdown al hacer clic fuera */
document.addEventListener('click', e => {
  if (!e.target.closest('#panelNombre')) cerrarDropdown();
});

/* ════════════════════════════════
   UI COMPARTIDA
════════════════════════════════ */

function mostrarLoader(msg = 'Cargando…') {
  state.style.display = 'block';
  state.innerHTML = `
    <div class="loader">
      <div class="spinner"></div>
      <p class="loader-text">${msg}</p>
    </div>`;
}

function mostrarError(msg) {
  state.style.display = 'block';
  state.innerHTML = `
    <div class="error-box">
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      ${msg}
    </div>`;
}

function limpiar() {
  state.style.display = 'none';
  state.innerHTML = '';
  result.innerHTML = '';
}

/* ════════════════════════════════
   TARJETA DE RESULTADO
════════════════════════════════ */

function sexoLabel(s) {
  if (!s) return '—';
  const up = s.toUpperCase();
  const esH = up === 'H' || up === 'HOMBRE';
  const esM = up === 'M' || up === 'MUJER';
  if (esH || esM) {
    return `<span class="chip ${esH ? 'chip-m' : 'chip-f'}">
      ${esH ? '♂ Hombre' : '♀ Mujer'}
    </span>`;
  }
  return s;
}

function formatFecha(f) {
  if (!f) return '—';
  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const partes = f.includes('-') ? f.split('-') : f.split('/');
  if (partes.length === 3) {
    if (f.includes('-')) {
      const [y, m, d] = partes;
      return `${+d} de ${meses[+m - 1]} de ${y}`;
    } else {
      const [d, m, y] = partes;
      return `${+d} de ${meses[+m - 1]} de ${y}`;
    }
  }
  return f;
}

function partidoBadge(partido) {
  const colores = {
    'MORENA': { bg: '#8B0000', text: '#fff' },
    'PRI':    { bg: '#006847', text: '#fff' },
    'PAN':    { bg: '#003087', text: '#fff' },
    'PRD':    { bg: '#FFCC00', text: '#333' },
  };
  const c = colores[partido] || { bg: '#555', text: '#fff' };
  return `<span style="
    display:inline-block;background:${c.bg};color:${c.text};
    border-radius:999px;padding:.2rem .7rem;
    font-size:.7rem;font-weight:700;letter-spacing:.06em;">
    ${partido}
  </span>`;
}

function buildResultCard(docente) {
  const nombreFull = [docente.nombre, docente.apellido_paterno, docente.apellido_materno]
    .filter(Boolean).join(' ');

  return `
    <div class="result-card">
      <div class="result-header">
        <div class="avatar">${docente.foto_inicial || '??'}</div>
        <div>
          <div class="result-name">${nombreFull}</div>
          <div class="result-curp-tag">
            <div class="verified-dot"></div>
            ${docente.curp}
          </div>
          <div style="margin-top:.5rem;font-size:.78rem;color:rgba(255,255,255,.75);">${docente.cargo}</div>
        </div>
      </div>

      <div class="data-grid">
        <div class="data-item">
          <div class="data-item-label">Nombre(s)</div>
          <div class="data-item-value big">${docente.nombre || '—'}</div>
        </div>
        <div class="data-item">
          <div class="data-item-label">Apellido Paterno</div>
          <div class="data-item-value big">${docente.apellido_paterno || '—'}</div>
        </div>
        <div class="data-item">
          <div class="data-item-label">Apellido Materno</div>
          <div class="data-item-value big">${docente.apellido_materno || '—'}</div>
        </div>
        <div class="data-item">
          <div class="data-item-label">Sexo</div>
          <div class="data-item-value">${sexoLabel(docente.sexo)}</div>
        </div>
        <div class="data-item">
          <div class="data-item-label">Fecha de Nacimiento</div>
          <div class="data-item-value">${formatFecha(docente.fecha_nacimiento)}</div>
        </div>
        <div class="data-item">
          <div class="data-item-label">Entidad de Nacimiento</div>
          <div class="data-item-value">${docente.entidad_nacimiento || '—'}</div>
        </div>
        <div class="data-item">
          <div class="data-item-label">Municipio</div>
          <div class="data-item-value">${docente.municipio || '—'}</div>
        </div>
        <div class="data-item">
          <div class="data-item-label">Nacionalidad</div>
          <div class="data-item-value">${docente.nacionalidad || '—'}</div>
        </div>
        <div class="data-item">
          <div class="data-item-label">Cargo</div>
          <div class="data-item-value">${docente.cargo || '—'}</div>
        </div>
        <div class="data-item">
          <div class="data-item-label">Período</div>
          <div class="data-item-value">${docente.periodo || '—'}</div>
        </div>
        <div class="data-item">
          <div class="data-item-label">Partido</div>
          <div class="data-item-value">${partidoBadge(docente.partido)}</div>
        </div>
        <div class="data-item">
          <div class="data-item-label">Estatus</div>
          <div class="data-item-value">
            <span class="chip chip-valid">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              ${docente.estatus || 'Activo'}
            </span>
          </div>
        </div>
      </div>

      <div style="padding:.9rem 1.5rem;background:rgba(107,18,48,.03);border-top:1px solid rgba(107,18,48,.07);display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
        <div>
          <div style="font-size:.62rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--guinda);opacity:.7;margin-bottom:.2rem;">CURP Completo</div>
          <div style="font-family:monospace;font-size:.9rem;letter-spacing:.1em;color:var(--text-dark);font-weight:600;">${docente.curp}</div>
        </div>
        <div style="margin-left:auto;">
          <p style="font-size:.68rem;color:#bbb;">Fuente: Base de datos local ICATEBCS</p>
        </div>
      </div>
    </div>`;
}

/* ════════════════════════════════
   EXPORTAR A .XLSX
════════════════════════════════ */

function exportarXLSX() {
  if (!listaDocentes.length) {
    mostrarError('No hay datos cargados para exportar. Espera a que cargue la base de datos.');
    return;
  }

  /* ── 1. Columnas en el mismo orden que el JSON ── */
  const columnas = [
    { key: 'curp',                label: 'CURP'                 },
    { key: 'nombre',              label: 'Nombre(s)'            },
    { key: 'apellido_paterno',    label: 'Apellido Paterno'     },
    { key: 'apellido_materno',    label: 'Apellido Materno'     },
    { key: 'sexo',                label: 'Sexo'                 },
    { key: 'fecha_nacimiento',    label: 'Fecha de Nacimiento'  },
    { key: 'entidad_nacimiento',  label: 'Entidad de Nacimiento'},
    { key: 'municipio',           label: 'Municipio'            },
    { key: 'nacionalidad',        label: 'Nacionalidad'         },
    { key: 'estatus',             label: 'Estatus'              },
    { key: 'cargo',               label: 'Cargo'                },
    { key: 'periodo',             label: 'Período'              },
    { key: 'partido',             label: 'Partido'              },
  ];

  /* ── 2. Construir filas ── */
  const filas = listaDocentes.map(d =>
    columnas.reduce((obj, col) => {
      obj[col.label] = d[col.key] ?? '';
      return obj;
    }, {})
  );

  /* ── 3. Crear hoja y libro ── */
  const hoja  = XLSX.utils.json_to_sheet(filas, { header: columnas.map(c => c.label) });
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Docentes');

  /* ── 4. Ancho de columnas proporcional al contenido ── */
  const anchos = columnas.map(col => {
    const maxContenido = listaDocentes.reduce((max, d) => {
      const val = String(d[col.key] ?? '');
      return Math.max(max, val.length);
    }, col.label.length);
    return { wch: Math.min(maxContenido + 4, 40) }; // +4 de padding, máx 40
  });
  hoja['!cols'] = anchos;

  /* ── 5. Nombre de archivo con fecha ── */
  const hoy = new Date();
  const fecha = `${hoy.getFullYear()}${String(hoy.getMonth()+1).padStart(2,'0')}${String(hoy.getDate()).padStart(2,'0')}`;
  const nombreArchivo = `ICATEBCS_Docentes_${fecha}.xlsx`;

  /* ── 6. Descargar ── */
  XLSX.writeFile(libro, nombreArchivo);

  /* ── 7. Toast de confirmación ── */
  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}