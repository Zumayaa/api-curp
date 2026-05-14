const input  = document.getElementById('curpInput');
const btn    = document.getElementById('btnBuscar');
const state  = document.getElementById('stateArea');
const result = document.getElementById('resultArea');

/* ── Auto-mayúsculas al escribir ── */
input.addEventListener('input', () => {
  const pos = input.selectionStart;
  input.value = input.value.toUpperCase();
  input.setSelectionRange(pos, pos);
});

/* ── Consultar con Enter ── */
input.addEventListener('keydown', e => {
  if (e.key === 'Enter') consultarCURP();
});

/* ── Usar CURP de ejemplo (Claudia Sheinbaum) ── */
function usarEjemplo() {
  input.value = 'PAOR691209HDFZRL04';
  consultarCURP();
}

/* ── UI: mostrar loader ── */
function mostrarLoader() {
  state.style.display = 'block';
  state.innerHTML = `
    <div class="loader">
      <div class="spinner"></div>
      <p class="loader-text">Buscando en base de datos local…</p>
    </div>`;
}

/* ── UI: mostrar error ── */
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

/* ── UI: limpiar estado y resultado ── */
function limpiar() {
  state.style.display = 'none';
  state.innerHTML = '';
  result.innerHTML = '';
}

/* ── Helpers ── */
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

/* Color de partido */
function partidoBadge(partido) {
  const colores = {
    'MORENA': { bg: '#8B0000', text: '#fff' },
    'PRI':    { bg: '#006847', text: '#fff' },
    'PAN':    { bg: '#003087', text: '#fff' },
    'PRD':    { bg: '#FFCC00', text: '#333' },
  };
  const c = colores[partido] || { bg: '#555', text: '#fff' };
  return `<span style="
    display:inline-block;
    background:${c.bg};color:${c.text};
    border-radius:999px;padding:.2rem .7rem;
    font-size:.7rem;font-weight:700;letter-spacing:.06em;
  ">${partido}</span>`;
}

/* ── Construir tarjeta de resultado ── */
function buildResultCard(docente) {
  const nombreFull = [docente.nombre, docente.apellido_paterno, docente.apellido_materno]
    .filter(Boolean).join(' ');

  return `
    <div class="result-card">

      <!-- Encabezado -->
      <div class="result-header">
        <div class="avatar">${docente.foto_inicial || '??'}</div>
        <div>
          <div class="result-name">${nombreFull}</div>
          <div class="result-curp-tag">
            <div class="verified-dot"></div>
            ${docente.curp}
          </div>
          <div style="margin-top:.5rem;font-size:.78rem;color:rgba(255,255,255,.75);">
            ${docente.cargo}
          </div>
        </div>
      </div>

      <!-- Grid de datos -->
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

      </div><!-- /data-grid -->

      <!-- CURP completo -->
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

/* ── Función principal: busca en el JSON local ── */
async function consultarCURP() {
  const curp = input.value.trim().toUpperCase();

  if (!curp) {
    mostrarError('Por favor ingresa un CURP para consultar.');
    return;
  }
  if (curp.length !== 18) {
    mostrarError(`El CURP debe tener exactamente 18 caracteres. Ingresaste ${curp.length}.`);
    return;
  }

  limpiar();
  mostrarLoader();
  btn.disabled = true;

  try {
    const res   = await fetch('docentes.json');
    const lista = await res.json();

    state.style.display = 'none';

    // Búsqueda insensible a guiones y espacios
    const curpLimpio = curp.replace(/[-\s]/g, '');
    const encontrado = lista.find(d =>
      d.curp.replace(/[-\s]/g, '') === curpLimpio
    );

    if (encontrado) {
      result.innerHTML = buildResultCard(encontrado);
    } else {
      mostrarError(`No se encontró ningún registro con el CURP <strong>${curp}</strong> en la base de datos local.`);
    }

  } catch (err) {
    mostrarError('No se pudo cargar la base de datos. Abre el proyecto con Live Server (VSCode) o un servidor local, no como archivo directo.');
  } finally {
    btn.disabled = false;
  }
}