/* ════════════════════════════════════════════
   ICATEBCS – Login
   login.js — Validaciones y UI
════════════════════════════════════════════ */

const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const btnTogglePwd = document.getElementById('btnTogglePwd');
const eyeIcon = document.getElementById('eyeIcon');
const stateArea = document.getElementById('loginStateArea');
const btnSubmit = document.getElementById('btnSubmit');

/* ── Mostrar/Ocultar Contraseña ── */
btnTogglePwd.addEventListener('click', () => {
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    // Cambia el ícono a "ojo cerrado"
    eyeIcon.innerHTML = `
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
    `;
  } else {
    passwordInput.type = 'password';
    // Regresa al ícono normal
    eyeIcon.innerHTML = `
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    `;
  }
});

/* ── Helpers de Interfaz ── */
function mostrarError(msg) {
  stateArea.style.display = 'block';
  stateArea.innerHTML = `
    <div class="error-box">
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      ${msg}
    </div>`;
}

function mostrarLoader(msg) {
  stateArea.style.display = 'block';
  stateArea.innerHTML = `
    <div class="loader">
      <div class="spinner"></div>
      <p class="loader-text">${msg}</p>
    </div>`;
}

function limpiarEstado() {
  stateArea.style.display = 'none';
  stateArea.innerHTML = '';
}

/* ── Manejo del Formulario ── */
loginForm.addEventListener('submit', (e) => {
  e.preventDefault(); // Evita que se recargue la página
  limpiarEstado();

  const user = usernameInput.value.trim();
  const pass = passwordInput.value.trim();

  // 1. Validaciones básicas
  if (!user && !pass) {
    mostrarError('Por favor ingresa tus credenciales.');
    usernameInput.focus();
    return;
  }
  if (!user) {
    mostrarError('El usuario o correo es obligatorio.');
    usernameInput.focus();
    return;
  }
  if (!pass) {
    mostrarError('La contraseña es obligatoria.');
    passwordInput.focus();
    return;
  }

  // 2. Simulación de carga (Loader institucional)
  mostrarLoader('Autenticando credenciales...');
  btnSubmit.disabled = true;

  // 3. Simulación de validación en el servidor
  setTimeout(() => {
    
    // Credenciales de prueba: admin / 123456
    if (user.toLowerCase() === 'admin' || user.includes('@icatebcs.gob.mx')) {
      if (pass === '123456') {
        // --- AQUÍ ESTÁ LA MAGIA NUEVA ---
        // Guardamos la sesión en el navegador
        localStorage.setItem('icatebcs_auth', 'true');
        // Redirige al sistema
        window.location.href = 'index.html';
      } else {
        mostrarError('Contraseña incorrecta. Inténtalo nuevamente.');
        btnSubmit.disabled = false;
        passwordInput.value = '';
        passwordInput.focus();
      }
    } else {
      mostrarError('Usuario no encontrado en la base de datos.');
      btnSubmit.disabled = false;
      usernameInput.focus();
    }

  }, 1200); // 1.2 segundos de espera simulada
});