const input = document.getElementById('curpInput');
const btn = document.getElementById('btnBuscar');
const state = document.getElementById('stateArea');
const result = document.getElementById('resultArea');
const nombreInput = document.getElementById('nombreInput');
const sugerencias = document.getElementById('sugerencias');
const docenteCurpInput = document.getElementById('docenteCurpInput');
const docenteNombreInput = document.getElementById('docenteNombreInput');
const docenteSugerencias = document.getElementById('docenteSugerencias');
const docenteResult = document.getElementById('docenteResult');
const docenteStateArea = document.getElementById('docenteStateArea');



let listaPersonas = [];
let listaDocentes = [];
let listaAlumnos = [];
let listaCursos = [];
let highlightedIndex = -1;

async function inicializar() {
  try {
    const docentesRes = await fetch('docentes.json');
    listaPersonas = await docentesRes.json();
    listaDocentes = listaPersonas.filter(p => normalizar(p.rol) === 'capacitador');
    listaAlumnos = listaPersonas.filter(p => normalizar(p.rol) === 'alumno');
    listaCursos = construirCursos(listaPersonas);
    renderDashboard();
    renderDocentes();
    renderCursos();
    renderAlumnos();
  } catch (e) {
    document.getElementById('kpiGrid').innerHTML = `
      <div class="error-box" style="grid-column:1/-1">
        No se pudo cargar la base de datos. Usa Live Server en VSCode para evitar restricciones CORS.
      </div>`;
  }
}

function showSection(id) {
  const sections = ['dashboard', 'docentes', 'cursos', 'alumnos'];
  sections.forEach(section => {
    document.getElementById(`section${capitalize(section)}`).style.display = id === section ? 'block' : 'none';
    document.getElementById(`nav${capitalize(section)}`).classList.toggle('active', id === section);
  });
  if (id === 'alumnos') input.focus();
}

function renderDashboard() {
  const cursosActivos = listaCursos.filter(c => c.estatus === 'En curso').length;
  const inscripciones = listaCursos.reduce((sum, c) => sum + c.alumnos.length, 0);

  document.getElementById('kpiGrid').innerHTML = `
    ${kpiCard('accent-blue','bg-blue', iconUser(), listaDocentes.length, 'Docentes', 'Trabajadores academicos')}
    ${kpiCard('accent-green','bg-green', iconBook(), listaCursos.length, 'Cursos', `${cursosActivos} activos`)}
    ${kpiCard('accent-guinda','bg-guinda', iconGroup(), listaAlumnos.length, 'Alumnos', 'Participantes registrados')}
    ${kpiCard('accent-gold','bg-gold', iconLink(), inscripciones, 'Inscripciones', 'Relaciones curso-alumno')}
  `;

  const sedeCount = {};
  listaCursos.forEach(c => { sedeCount[c.sede] = (sedeCount[c.sede] || 0) + 1; });
  const maxSede = Math.max(...Object.values(sedeCount), 1);
  document.getElementById('chartSedes').innerHTML = Object.entries(sedeCount)
    .sort((a,b) => b[1]-a[1])
    .map(([sede, count]) => `
      <div class="chart-bar-row">
        <div class="chart-bar-label" title="${sede}">${sede}</div>
        <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${Math.round(count/maxSede*100)}%"></div></div>
        <div class="chart-bar-count">${count}</div>
      </div>`).join('') || '<p class="muted-empty">Sin datos</p>';

  document.getElementById('listaReciente').innerHTML = listaCursos
    .filter(c => c.estatus === 'En curso')
    .map(c => `
      <div class="recent-item" onclick="verCurso('${c.id}')">
        <div class="recent-avatar capacitador">${iniciales(c.nombre)}</div>
        <div class="recent-info">
          <div class="recent-name">${c.nombre}</div>
          <div class="recent-meta">${c.docente ? nombreCompleto(c.docente) : 'Sin docente asignado'} · ${c.alumnos.length} alumnos</div>
        </div>
        ${estatusBadge(c.estatus)}
      </div>`).join('') || '<p class="muted-empty">No hay cursos activos.</p>';

  document.getElementById('fechaHoy').textContent =
    new Date().toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

function renderDocentes() {
  const q = normalizar(document.getElementById('docenteFiltro')?.value || '');
  const docentes = listaDocentes.filter(doc => {
    const cursos = cursosDePersona(doc).map(c => c.nombre).join(' ');
    return normalizar(`${nombreCompleto(doc)} ${doc.municipio} ${cursos}`).includes(q);
  });
document.getElementById('docentesGrid').innerHTML = `

  <div class="section-header compact-header" style="grid-column:1/-1;">
    <div>
      <p class="section-eyebrow">Listado general</p>
      <h2 class="section-title">Docentes registrados</h2>
    </div>
  </div>

  ${docentes.map(doc => {

    const cursos = cursosDePersona(doc);
    const alumnosRelacionados = alumnosDeDocente(doc);

    return `
      <article class="entity-card">

        <div class="entity-topline">
          <div class="entity-avatar teacher">
            ${doc.foto_inicial || iniciales(nombreCompleto(doc))}
          </div>

          <div>
            <h3>${nombreCompleto(doc)}</h3>

            <p>
              ${doc.municipio || 'Sin municipio'}
              ·
              ${doc.correo || 'Sin correo'}
              ·
              ${doc.curp || 'Sin curp'}
            </p>
          </div>
        </div>

        <div class="metric-strip">
          <span><strong>${cursos.length}</strong> cursos</span>

          <span>
            <strong>
              ${cursos.filter(c => c.estatus === 'En curso').length}
            </strong>
            activos
          </span>

          <span>
            <strong>${alumnosRelacionados.length}</strong>
            alumnos
          </span>
        </div>

        <div class="mini-course-list">
          ${
            cursos.map(c => `
              <button
                class="mini-course"
                onclick="verCurso('${c.id}')">

                <span>${c.nombre}</span>

                ${estatusBadge(c.estatus)}

              </button>
            `).join('')
          }
        </div>

      </article>
    `;

  }).join('')}

`;
}

function renderCursos() {
  const q = normalizar(document.getElementById('cursoFiltro')?.value || '');
  const cursos = listaCursos.filter(c =>
    normalizar(`${c.nombre} ${c.sede} ${c.docente ? nombreCompleto(c.docente) : ''}`).includes(q)
  );

  document.getElementById('cursosGrid').innerHTML = cursos.map(c => `
    <article class="course-card" id="curso-${c.id}">
      <div class="course-card-head">
        <div>
          <p class="course-code">${c.id}</p>
          <h3>${c.nombre}</h3>
          <p>${c.sede} · ${formatFecha(c.fecha_inicio)} - ${formatFecha(c.fecha_fin)}</p>
        </div>
        ${estatusBadge(c.estatus)}
      </div>
      <div class="course-relationship">
        <div class="relationship-block">
          <span class="relationship-label">Docente</span>
          ${c.docente ? personPill(c.docente, 'teacher') : '<p class="muted-empty">Sin docente asignado</p>'}
        </div>
        <div class="relationship-block">
          <span class="relationship-label">Alumnos</span>
          <div class="student-pills">
            ${c.alumnos.length ? c.alumnos.map(a => personPill(a, 'student', true)).join('') : '<p class="muted-empty">Sin alumnos inscritos</p>'}
          </div>
        </div>
      </div>
    </article>`).join('') || '<div class="empty-panel">No se encontraron cursos.</div>';
}

function renderAlumnos() {
  document.getElementById('alumnosGrid').innerHTML = `
    <div class="section-header compact-header">
      <div>
        <p class="section-eyebrow">Listado general</p>
        <h2 class="section-title">Alumnos registrados</h2>
      </div>
    </div>
    ${listaAlumnos.map(alumno => `
      <article class="entity-card student-card">
        <div class="entity-topline">
          <div class="entity-avatar student">${alumno.foto_inicial || iniciales(nombreCompleto(alumno))}</div>
          <div>
            <h3>${nombreCompleto(alumno)}</h3>
            <p>${alumno.curp} · ${alumno.municipio || 'Sin municipio'}</p>
          </div>
        </div>
        <div class="mini-course-list">
          ${cursosDePersona(alumno).map(c => `
            <button class="mini-course" onclick="verCurso('${c.id}')">
              <span>${c.nombre}</span>
              ${estatusBadge(c.estatus)}
            </button>`).join('')}
        </div>
      </article>`).join('')}`;
}

function switchTab(tab) {
  document.getElementById('panelCurp').style.display = tab === 'curp' ? 'block' : 'none';
  document.getElementById('panelNombre').style.display = tab === 'nombre' ? 'block' : 'none';
  document.getElementById('tabCurp').classList.toggle('active', tab === 'curp');
  document.getElementById('tabNombre').classList.toggle('active', tab === 'nombre');
  limpiar();
  if (tab === 'nombre') nombreInput.focus();
  else input.focus();
}

input.addEventListener('input', () => {
  const pos = input.selectionStart;
  input.value = input.value.toUpperCase();
  input.setSelectionRange(pos, pos);
});
input.addEventListener('keydown', e => { if (e.key === 'Enter') consultarCURP(); });

function usarEjemplo(curp) {
  showSection('alumnos');
  switchTab('curp');
  input.value = curp;
  consultarCURP();
}

async function consultarCURP() {
  const curp = input.value.trim().toUpperCase();
  if (!curp) return mostrarError('Por favor ingresa un CURP para consultar.');
  if (curp.length !== 18) return mostrarError(`El CURP debe tener exactamente 18 caracteres. Ingresaste ${curp.length}.`);

  limpiar();
  mostrarLoader('Buscando en base de datos...');
  btn.disabled = true;
  try {
    const encontrado = listaAlumnos.find(d => limpiarCurp(d.curp) === limpiarCurp(curp));
    state.style.display = 'none';
    encontrado ? result.innerHTML = buildResultCard(encontrado) : mostrarError(`No se encontro ningun alumno con el CURP <strong>${curp}</strong>.`);
  } finally {
    btn.disabled = false;
  }
}

function onNombreInput() {
  highlightedIndex = -1;
  const q = nombreInput.value.trim();
  if (q.length < 2) return cerrarDropdown();
  const terminos = normalizar(q).split(/\s+/);
  const coincidencias = listaAlumnos.filter(d => {
    const texto = normalizar(nombreCompleto(d));
    return terminos.every(t => texto.includes(t));
  });
  renderDropdown(coincidencias, q);
}

function onNombreKeydown(e) {
  const items = sugerencias.querySelectorAll('.suggestion-item');
  if (!items.length) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1); actualizarHighlight(items); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); highlightedIndex = Math.max(highlightedIndex - 1, 0); actualizarHighlight(items); }
  else if (e.key === 'Enter') { e.preventDefault(); if (highlightedIndex >= 0) items[highlightedIndex].click(); }
  else if (e.key === 'Escape') cerrarDropdown();
}

function renderDropdown(lista, query) {
  sugerencias.style.display = 'block';
  if (!lista.length) {
    sugerencias.innerHTML = `<div class="no-results">Sin resultados para "<strong>${query}</strong>"</div>`;
    return;
  }
  sugerencias.innerHTML = lista.map(d => `
    <div class="suggestion-item" onclick="seleccionarAlumno('${d.curp}')">
      <div class="sug-avatar">${d.foto_inicial || '?'}</div>
      <div class="sug-info">
        <div class="sug-name">${resaltarCoincidencia(nombreCompleto(d), query)}</div>
        <div class="sug-curp">${d.curp} · ${cursosDePersona(d).length} cursos</div>
      </div>
      <svg class="sug-arrow" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M9 18l6-6-6-6"/></svg>
    </div>`).join('');
}

function seleccionarAlumno(curp) {
  const alumno = listaAlumnos.find(a => a.curp === curp);
  if (!alumno) return;
  cerrarDropdown();
  nombreInput.value = nombreCompleto(alumno);
  limpiar();
  result.innerHTML = buildResultCard(alumno);
  setTimeout(() => result.scrollIntoView({ behavior:'smooth', block:'start' }), 100);
}

function switchDocenteTab(tab) {

  document.getElementById('panelDocenteCurp').style.display =
    tab === 'curp' ? 'block' : 'none';

  document.getElementById('panelDocenteNombre').style.display =
    tab === 'nombre' ? 'block' : 'none';

  document.getElementById('tabDocenteCurp')
    .classList.toggle('active', tab === 'curp');

  document.getElementById('tabDocenteNombre')
    .classList.toggle('active', tab === 'nombre');
}

function consultarDocenteCURP() {

  const curp = docenteCurpInput.value.trim().toUpperCase();

  const docente = listaDocentes.find(
    d => limpiarCurp(d.curp) === limpiarCurp(curp)
  );

  if (!docente) {
    docenteResult.innerHTML =
      '<div class="error-box">Docente no encontrado.</div>';
    return;
  }

  docenteResult.innerHTML = buildResultCard(docente);
}

function onDocenteNombreInput() {

  const q = docenteNombreInput.value.trim();

  if (q.length < 2) {
    docenteSugerencias.style.display = 'none';
    return;
  }

  const terminos = normalizar(q).split(/\s+/);

  const coincidencias = listaDocentes.filter(d => {

    const texto = normalizar(nombreCompleto(d));

    return terminos.every(t => texto.includes(t));
  });

  docenteSugerencias.style.display = 'block';

  docenteSugerencias.innerHTML = coincidencias.map(d => `
    <div class="suggestion-item"
      onclick="seleccionarDocente('${d.curp}')">

      <div class="sug-avatar">
        ${d.foto_inicial || '?'}
      </div>

      <div class="sug-info">
        <div class="sug-name">
          ${nombreCompleto(d)}
        </div>

        <div class="sug-curp">
          ${d.curp}
        </div>
      </div>
    </div>
  `).join('');
}

function seleccionarDocente(curp) {

  const docente = listaDocentes.find(
    d => d.curp === curp
  );

  if (!docente) return;

  docenteNombreInput.value =
    nombreCompleto(docente);

  docenteSugerencias.style.display = 'none';

  docenteResult.innerHTML =
    buildResultCard(docente);
}



function buildResultCard(persona) {
  const cursos = cursosDePersona(persona);
  const aprobados = cursos.filter(c => c.estatus === 'Aprobado').length;
  return `
    <div class="result-card">
      <div class="result-header">
        <div class="avatar">${persona.foto_inicial || iniciales(nombreCompleto(persona))}</div>
        <div>
          <div class="result-name">${nombreCompleto(persona)}</div>
          <div style="display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.5rem;align-items:center;">
            <div class="result-curp-tag"><div class="verified-dot"></div>${persona.curp}</div>
            <div class="result-rol-tag alumno">${persona.rol || 'Alumno'}</div>
          </div>
          <div style="margin-top:.5rem;font-size:.75rem;color:rgba(255,255,255,.65);">
            ${persona.correo || ''} ${persona.telefono ? '· ' + persona.telefono : ''}
          </div>
        </div>
      </div>
      <div class="data-grid">
        ${dataItem('Nombre(s)', persona.nombre)}
        ${dataItem('Apellido paterno', persona.apellido_paterno)}
        ${dataItem('Apellido materno', persona.apellido_materno)}
        ${dataItem('Sexo', sexoLabel(persona.sexo))}
        ${dataItem('Fecha de nacimiento', formatFecha(persona.fecha_nacimiento))}
        ${dataItem('Municipio', persona.municipio)}
        ${dataItem('Telefono', persona.telefono)}
        ${dataItem('Correo electronico', `<a href="mailto:${persona.correo}">${persona.correo || '-'}</a>`)}
        ${dataItem('Cursos aprobados', `<span class="chip chip-valid">${aprobados} de ${cursos.length}</span>`)}
      </div>
      <div class="cursos-section">
        <div class="cursos-header">
          <div class="cursos-header-title">${iconBook()} Historial de Cursos <span class="cursos-count">${cursos.length}</span></div>
        </div>
        <div class="cursos-table-wrap">
          ${cursos.length ? `
            <table class="cursos-table">
              <thead>
                <tr><th>#</th><th>Curso</th><th>Docente</th><th>Inicio</th><th>Fin</th><th>Sede</th><th>Estatus</th><th>Constancia</th></tr>
              </thead>
              <tbody>
                ${cursos.map((c, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td style="font-weight:600;">${c.nombre}</td>
                    <td>${c.docente ? nombreCompleto(c.docente) : '-'}</td>
                    <td>${formatFecha(c.fecha_inicio)}</td>
                    <td>${formatFecha(c.fecha_fin)}</td>
                    <td>${c.sede}</td>
                    <td>${estatusBadge(c.estatus)}</td>
                    <td>${c.estatus === 'Aprobado' ? `<button class="btn-constancia" onclick="generarConstancia(${JSON.stringify(nombreCompleto(persona))}, ${JSON.stringify(c.nombre)}, ${JSON.stringify(c.fecha_fin)}, ${JSON.stringify(c.sede)})">Generar PDF</button>` : '<span class="muted-empty">-</span>'}</td>
                  </tr>`).join('')}
              </tbody>
            </table>` : '<p class="muted-empty">Sin cursos registrados.</p>'}
        </div>
      </div>
    </div>`;
}

function construirCursos(personas) {
  const cursos = new Map();
  personas.forEach(persona => {
    (persona.historial_cursos || []).forEach(curso => {
      const id = crearCursoId(curso.nombre_curso, curso.sede);
      if (!cursos.has(id)) {
        cursos.set(id, {
          id,
          nombre: curso.nombre_curso,
          sede: curso.sede,
          fecha_inicio: curso.fecha_inicio,
          fecha_fin: curso.fecha_fin,
          estatus: curso.estatus,
          docente: null,
          alumnos: []
        });
      }
      const actual = cursos.get(id);
      if (normalizar(persona.rol) === 'capacitador') actual.docente = persona;
      if (normalizar(persona.rol) === 'alumno') actual.alumnos.push(persona);
      if (curso.estatus === 'En curso') actual.estatus = 'En curso';
    });
  });
  return Array.from(cursos.values()).sort((a,b) => a.nombre.localeCompare(b.nombre, 'es'));
}

function cursosDePersona(persona) {
  return listaCursos.filter(c => c.docente?.id === persona.id || c.alumnos.some(a => a.id === persona.id));
}

function alumnosDeDocente(docente) {
  const alumnos = new Map();
  listaCursos.filter(c => c.docente?.id === docente.id).forEach(c => c.alumnos.forEach(a => alumnos.set(a.id, a)));
  return Array.from(alumnos.values());
}

function verCurso(id) {
  showSection('cursos');
  setTimeout(() => {
    const el = document.getElementById(`curso-${id}`);
    if (el) {
      el.scrollIntoView({ behavior:'smooth', block:'center' });
      el.classList.add('highlight-card');
      setTimeout(() => el.classList.remove('highlight-card'), 1800);
    }
  }, 80);
}

function exportarXLSX() {
  if (!listaPersonas.length) return mostrarError('No hay datos cargados para exportar.');
  const personas = listaPersonas.map(p => ({
    CURP: p.curp,
    Nombre: nombreCompleto(p),
    Rol: p.rol,
    Municipio: p.municipio,
    Telefono: p.telefono,
    Correo: p.correo
  }));
  const cursos = listaCursos.flatMap(c => {
    const base = {
      Curso: c.nombre,
      Sede: c.sede,
      Docente: c.docente ? nombreCompleto(c.docente) : '',
      Inicio: c.fecha_inicio,
      Fin: c.fecha_fin,
      Estatus: c.estatus
    };
    return c.alumnos.length ? c.alumnos.map(a => ({ ...base, Alumno: nombreCompleto(a), CURP: a.curp })) : [{ ...base, Alumno: '', CURP: '' }];
  });
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(personas), 'Personas');
  XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(cursos), 'Cursos');
  const hoy = new Date();
  const fecha = `${hoy.getFullYear()}${String(hoy.getMonth()+1).padStart(2,'0')}${String(hoy.getDate()).padStart(2,'0')}`;
  XLSX.writeFile(libro, `ICATEBCS_Docentes_Cursos_Alumnos_${fecha}.xlsx`);
  showToast('Excel descargado correctamente');
}

function generarConstancia(nombreCompleto, nombreCurso, fechaFin, sede) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  doc.setFillColor(250, 247, 242);
  doc.rect(0, 0, W, H, 'F');
  doc.setDrawColor(107, 18, 48);
  doc.setLineWidth(2);
  doc.rect(8, 8, W - 16, H - 16);
  doc.setFillColor(107, 18, 48);
  doc.rect(11, 11, W - 22, 22, 'F');
  doc.setFont('helvetica','bold');
  doc.setFontSize(11);
  doc.setTextColor(232, 201, 122);
  doc.text('INSTITUTO DE CAPACITACION PARA EL TRABAJO DEL ESTADO DE BAJA CALIFORNIA SUR', W/2, 24, { align:'center' });
  doc.setTextColor(107, 18, 48);
  doc.setFontSize(12);
  doc.text('CONSTANCIA DE CAPACITACION', W/2, 48, { align:'center' });
  doc.setFont('times','italic');
  doc.setFontSize(11);
  doc.text('Hace constar que:', W/2, 66, { align:'center' });
  doc.setFont('times','bolditalic');
  doc.setFontSize(26);
  doc.text(nombreCompleto, W/2, 86, { align:'center' });
  doc.setFont('helvetica','normal');
  doc.setFontSize(11);
  doc.text('ha acreditado satisfactoriamente el curso:', W/2, 101, { align:'center' });
  doc.setFont('helvetica','bold');
  doc.setFontSize(20);
  doc.text(nombreCurso, W/2, 117, { align:'center' });
  doc.setFont('helvetica','normal');
  doc.setFontSize(9.5);
  doc.text(`Sede: ${sede} · Fecha de termino: ${formatFecha(fechaFin)}`, W/2, 129, { align:'center' });
  const firmaY = H - 36;
  doc.line(W*0.25-30, firmaY, W*0.25+30, firmaY);
  doc.line(W*0.75-30, firmaY, W*0.75+30, firmaY);
  doc.setFont('helvetica','bold');
  doc.setFontSize(8.5);
  doc.text('DIRECTOR(A) GENERAL', W*0.25, firmaY+6, { align:'center' });
  doc.text('COORDINACION ACADEMICA', W*0.75, firmaY+6, { align:'center' });
  doc.save(`Constancia_${nombreCurso.replace(/\s+/g,'_')}_${nombreCompleto.split(' ')[0]}.pdf`);
  showToast(`Constancia de "${nombreCurso}" descargada`);
}


function mostrarLoader(msg = 'Cargando...') {
  state.style.display = 'block';
  state.innerHTML = `<div class="loader"><div class="spinner"></div><p class="loader-text">${msg}</p></div>`;
}
function mostrarError(msg) {
  state.style.display = 'block';
  state.innerHTML = `<div class="error-box">${msg}</div>`;
}
function limpiar() {
  state.style.display = 'none';
  state.innerHTML = '';
  result.innerHTML = '';
}
function showToast(msg = 'Operacion completada') {
  const t = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3200);
}
function cerrarDropdown() {
  sugerencias.style.display = 'none';
  sugerencias.innerHTML = '';
  highlightedIndex = -1;
}
function actualizarHighlight(items) {
  items.forEach((el,i) => el.classList.toggle('highlighted', i === highlightedIndex));
  if (highlightedIndex >= 0) items[highlightedIndex].scrollIntoView({ block:'nearest' });
}
document.addEventListener('click', e => { if (!e.target.closest('#panelNombre')) cerrarDropdown(); });

function kpiCard(accent, iconBg, iconSVG, value, label, sub) {
  return `<div class="kpi-card ${accent}"><div class="kpi-icon ${iconBg}">${iconSVG}</div><div class="kpi-value">${value}</div><div class="kpi-label">${label}</div><div class="kpi-sub">${sub}</div></div>`;
}
function estatusBadge(e) {
  const map = { 'Aprobado': 'aprobado', 'En curso': 'encurso', 'Baja': 'baja' };
  return `<span class="estatus-badge ${map[e] || 'baja'}"><span class="estatus-dot"></span>${e || '-'}</span>`;
}
function personPill(persona, type, clickable = false) {
  const action = clickable ? `onclick="usarEjemplo('${persona.curp}')"` : '';
  return `<button class="person-pill ${type}" ${action}><span>${persona.foto_inicial || iniciales(nombreCompleto(persona))}</span>${nombreCompleto(persona)}</button>`;
}
function dataItem(label, value) {
  return `<div class="data-item"><div class="data-item-label">${label}</div><div class="data-item-value">${value || '-'}</div></div>`;
}
function sexoLabel(s) {
  const up = (s || '').toUpperCase();
  return `<span class="chip ${up === 'H' ? 'chip-m' : 'chip-f'}">${up === 'H' ? 'Hombre' : 'Mujer'}</span>`;
}
function formatFecha(f) {
  if (!f) return '-';
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const p = f.includes('-') ? f.split('-') : f.split('/');
  if (p.length !== 3) return f;
  return f.includes('-') ? `${+p[2]} ${meses[+p[1]-1]} ${p[0]}` : `${+p[0]} ${meses[+p[1]-1]} ${p[2]}`;
}
function resaltarCoincidencia(texto, query) {
  return query.trim().split(/\s+/).filter(Boolean).reduce((acc, t) => {
    const rx = new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
    return acc.replace(rx, '<mark>$1</mark>');
  }, texto);
}
function nombreCompleto(p) {
  return [p.nombre, p.apellido_paterno, p.apellido_materno].filter(Boolean).join(' ');
}
function iniciales(texto) {
  return texto.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
}
function limpiarCurp(curp) {
  return (curp || '').replace(/[-\s]/g, '').toUpperCase();
}
function normalizar(texto) {
  return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
function crearCursoId(nombre, sede) {
  return normalizar(`${nombre}-${sede}`).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 42);
}
function capitalize(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
function iconUser() {
  return '<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/></svg>';
}
function iconGroup() {
  return '<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>';
}
function iconBook() {
  return '<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';
}
function iconLink() {
  return '<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';
}

function cerrarSesion() {
    localStorage.removeItem('icatebcs_auth');
    window.location.replace('login.html');
}

inicializar();
