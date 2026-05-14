/* ──────────────────────────────────────────
   ICATEBCS – Consulta de CURP
   curp.js — Lógica de consulta a la API
   Token: reemplaza "pruebas" por tu token real
   de https://valida-curp.com.mx
────────────────────────────────────────── */

const TOKEN = '7a761a3a-be7b-4d18-9c00-16cc28541559'; // <-- cambia aquí tu token de producción

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

/* ── Usar CURP de ejemplo ── */
function usarEjemplo() {
  input.value = 'XAXX010101HBCXXX00';
  consultarCURP();
}

/* ── UI: mostrar loader ── */
function mostrarLoader() {
  state.style.display = 'block';
  state.innerHTML = `
    <div class="loader">
      <div class="spinner"></div>
      <p class="loader-text">Consultando registro en RENAPO…</p>
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
function iniciales(nombre) {
  if (!nombre) return '?';
  const partes = nombre.trim().split(/\s+/);
  return (partes[0]?.[0] || '') + (partes[1]?.[0] || '');
}

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
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const partes = f.includes('-') ? f.split('-') : f.split('/');
  if (partes.length === 3) {
    if (f.includes('-')) {
      const [y, m, d] = partes;
      return `${d} ${meses[+m - 1]} ${y}`;
    } else {
      const [d, m, y] = partes;
      return `${d} ${meses[+m - 1]} ${y}`;
    }
  }
  return f;
}

/* ── Construir tarjeta de resultado ── */
function buildResultCard(data, curp) {
  const r           = data.response || data;
  const nombre      = r.nombre             || r.names           || '';
  const aPaterno    = r.apellido_paterno   || r.first_lastname  || '';
  const aMaterno    = r.apellido_materno   || r.second_lastname || '';
  const nombreFull  = [nombre, aPaterno, aMaterno].filter(Boolean).join(' ');
  const sexo        = r.sexo               || r.gender          || '';
  const fechaNac    = r.fecha_nacimiento   || r.birth_date      || '';
  const entidad     = r.entidad_nacimiento || r.entity_birth    || '';
  const municipio   = r.municipio          || r.municipality    || '';
  const nacionalidad= r.nacionalidad       || r.nationality     || '';
  const estatus     = r.estatus            || r.status          || 'Activo';
  const docDocto    = r.documento          || r.document        || '';

  const inis = iniciales(nombreFull) || curp.substring(0, 2);

  return `
    <div class="result-card">

      <!-- Encabezado con nombre y CURP -->
      <div class="result-header">
        <div class="avatar">${inis.toUpperCase()}</div>
        <div>
          <div class="result-name">${nombreFull || 'Nombre no disponible'}</div>
          <div class="result-curp-tag">
            <div class="verified-dot"></div>
            ${curp}
          </div>
        </div>
      </div>

      <!-- Grid de datos -->
      <div class="data-grid">

        <div class="data-item">
          <div class="data-item-label">Nombre(s)</div>
          <div class="data-item-value big">${nombre || '—'}</div>
        </div>

        <div class="data-item">
          <div class="data-item-label">Apellido Paterno</div>
          <div class="data-item-value big">${aPaterno || '—'}</div>
        </div>

        <div class="data-item">
          <div class="data-item-label">Apellido Materno</div>
          <div class="data-item-value big">${aMaterno || '—'}</div>
        </div>

        <div class="data-item">
          <div class="data-item-label">Sexo</div>
          <div class="data-item-value">${sexoLabel(sexo)}</div>
        </div>

        <div class="data-item">
          <div class="data-item-label">Fecha de Nacimiento</div>
          <div class="data-item-value">${formatFecha(fechaNac)}</div>
        </div>

        <div class="data-item">
          <div class="data-item-label">Entidad de Nacimiento</div>
          <div class="data-item-value">${entidad || '—'}</div>
        </div>

        ${municipio ? `
        <div class="data-item">
          <div class="data-item-label">Municipio</div>
          <div class="data-item-value">${municipio}</div>
        </div>` : ''}

        ${nacionalidad ? `
        <div class="data-item">
          <div class="data-item-label">Nacionalidad</div>
          <div class="data-item-value">${nacionalidad}</div>
        </div>` : ''}

        ${docDocto ? `
        <div class="data-item">
          <div class="data-item-label">Documento</div>
          <div class="data-item-value">${docDocto}</div>
        </div>` : ''}

        <div class="data-item">
          <div class="data-item-label">CURP</div>
          <div class="data-item-value" style="font-size:.82rem;letter-spacing:.08em;font-family:monospace;">${curp}</div>
        </div>

        <div class="data-item">
          <div class="data-item-label">Estatus</div>
          <div class="data-item-value">
            <span class="chip chip-valid">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              ${estatus}
            </span>
          </div>
        </div>

      </div><!-- /data-grid -->

      <!-- Nota institucional -->
      <div style="padding:1rem 1.5rem;background:rgba(107,18,48,.03);border-top:1px solid rgba(107,18,48,.07);">
        <p style="font-size:.7rem;color:#999;letter-spacing:.03em;">
          ⓘ Información obtenida del Registro Nacional de Población (RENAPO) vía API Valida-CURP.
          Uso exclusivo del sistema interno de ICATEBCS.
        </p>
      </div>

    </div>`;
}

/* ── Función principal de consulta ── */
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
    const url = `https://api.valida-curp.com.mx/curp/obtener_datos/?token=${TOKEN}&curp=${curp}`;
    const res  = await fetch(url);
    const data = await res.json();

    state.style.display = 'none';

    if (data.error) {
      mostrarError(`No se encontró información: ${data.error_message || 'CURP no localizado en el padrón.'}`);
    } else {
      result.innerHTML = buildResultCard(data, curp);
    }
  } catch (err) {
    mostrarError('Error de conexión con el servidor de RENAPO. Intenta de nuevo en un momento.');
  } finally {
    btn.disabled = false;
  }
}