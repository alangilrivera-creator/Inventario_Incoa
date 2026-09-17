// ===========================
// STATE — caché en memoria (los datos reales viven en Neon)
// ===========================
const state = {
  articulos: [],   // { id, nombre, serie, estado: 'Disponible' | 'Prestado' }
  prestamos: []     // { id, articuloId, articuloNombre, articuloSerie, persona, codigo, seccion, fechaHora, estado, fechaDevolucion }
};

let editandoArticuloId = null; // null = creando nuevo

// ===========================
// NAVEGACIÓN
// ===========================
document.querySelectorAll('.nav-item[data-page]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const page = link.dataset.page;
    navigateTo(page);
    document.getElementById('sidebar').classList.remove('open');
  });
});

function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (activeLink) activeLink.classList.add('active');

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');
}

document.querySelectorAll('.stat-card[data-page]').forEach(card => {
  card.addEventListener('click', () => navigateTo(card.dataset.page));
});

// ===========================
// CONFIRMACIÓN PERSONALIZADA
// ===========================
let _confirmCallback = null;

function confirmar(mensaje, callback, titulo) {
  document.getElementById('confirmTitulo').textContent = titulo || '¿Confirmar acción?';
  document.getElementById('confirmMsg').textContent = mensaje;
  _confirmCallback = callback;
  document.getElementById('modalConfirmar').classList.add('open');
}

document.getElementById('confirmAceptar').addEventListener('click', () => {
  document.getElementById('modalConfirmar').classList.remove('open');
  if (_confirmCallback) { _confirmCallback(); _confirmCallback = null; }
});

document.getElementById('confirmCancelar').addEventListener('click', () => {
  document.getElementById('modalConfirmar').classList.remove('open');
  _confirmCallback = null;
});

// ===========================
// SIDEBAR / TOPBAR
// ===========================
document.getElementById('menuToggle').addEventListener('click', () => {
  const sidebar     = document.getElementById('sidebar');
  const mainWrapper = document.querySelector('.main-wrapper');
  const isMobile    = window.innerWidth <= 768;

  if (isMobile) {
    sidebar.classList.toggle('open');
  } else {
    sidebar.classList.toggle('collapsed');
    mainWrapper.classList.toggle('collapsed');
    localStorage.setItem('sip_sidebarCollapsed', sidebar.classList.contains('collapsed'));
  }
});

// ===========================
// MODALES
// ===========================
function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ===========================
// TOAST
// ===========================
function showToast(msg, isError) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.toggle('toast-error', !!isError);
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===========================
// HELPERS
// ===========================
function getVal(id) {
  return document.getElementById(id)?.value.trim() || '';
}

function clearFields(...ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function renderTable(tbodySelector, rows, colspan) {
  const tbody = document.querySelector(tbodySelector);
  if (!tbody) return;
  tbody.innerHTML = '';
  if (rows.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="${colspan || 10}">No hay registros aún.</td></tr>`;
    return;
  }
  rows.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = row;
    tbody.appendChild(tr);
  });
}

function mostrarCargando() {
  document.querySelector('#tablaArticulos tbody').innerHTML =
    `<tr class="empty-row"><td colspan="5">Cargando datos...</td></tr>`;
  document.querySelector('#tablaPrestamos tbody').innerHTML =
    `<tr class="empty-row"><td colspan="8">Cargando datos...</td></tr>`;
}

function formatFechaHora(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  const fecha = d.toLocaleDateString('es-SV');
  const hora  = d.toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' });
  return `${fecha} · ${hora}`;
}

function generarSerie() {
  let serie = '';
  for (let i = 0; i < 10; i++) serie += Math.floor(Math.random() * 10);
  document.getElementById('articuloSerie').value = serie;
}

async function leerError(res, defaultMsg) {
  try {
    const data = await res.json();
    return data.error || defaultMsg;
  } catch {
    return defaultMsg;
  }
}

// ===========================
// CARGA DE DATOS DESDE LA API (Neon)
// ===========================
async function cargarArticulos() {
  const res = await fetch('/api/articulos');
  if (!res.ok) throw new Error('No se pudieron cargar los artículos.');
  const data = await res.json();
  state.articulos = data.map(a => ({
    id: a.id,
    nombre: a.nombre,
    serie: a.serie,
    estado: a.estado
  }));
}

async function cargarPrestamos() {
  const res = await fetch('/api/prestamos');
  if (!res.ok) throw new Error('No se pudieron cargar los préstamos.');
  const data = await res.json();
  state.prestamos = data.map(p => ({
    id: p.id,
    articuloId: p.articulo_id,
    articuloNombre: p.articulo_nombre,
    articuloSerie: p.articulo_serie,
    persona: p.persona,
    codigo: p.codigo,
    seccion: p.seccion,
    fechaHora: formatFechaHora(p.fecha_hora),
    estado: p.estado,
    fechaDevolucion: formatFechaHora(p.fecha_devolucion)
  }));
}

// ===========================
// ARTÍCULOS (INVENTARIO)
// ===========================
function abrirModalArticulo() {
  editandoArticuloId = null;
  document.getElementById('modalArticuloTitulo').textContent = 'Nuevo Artículo';
  clearFields('articuloNombre', 'articuloSerie');
  document.getElementById('articuloEstado').value = 'Disponible';
  document.getElementById('grupoEstadoArticulo').style.display = 'none'; // al crear, siempre Disponible
  openModal('modalArticulo');
}

function editarArticulo(id) {
  const a = state.articulos.find(x => x.id === id);
  if (!a) return;
  editandoArticuloId = id;
  document.getElementById('modalArticuloTitulo').textContent = 'Editar Artículo';
  document.getElementById('articuloNombre').value = a.nombre;
  document.getElementById('articuloSerie').value = a.serie;
  document.getElementById('articuloEstado').value = a.estado;
  document.getElementById('grupoEstadoArticulo').style.display = 'flex';
  openModal('modalArticulo');
}

async function guardarArticulo() {
  const nombre = getVal('articuloNombre');
  const serie  = getVal('articuloSerie');

  if (!nombre) { showToast('Por favor ingresa el nombre del artículo.', true); return; }
  if (!/^\d+$/.test(serie)) { showToast('El número de serie debe contener solo números.', true); return; }

  const esEdicion = editandoArticuloId !== null;
  const btnGuardar = document.querySelector('#modalArticulo .btn-primary');
  btnGuardar.disabled = true;

  try {
    let res;
    if (esEdicion) {
      const estado = getVal('articuloEstado');
      res = await fetch('/api/articulos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editandoArticuloId, nombre, serie, estado })
      });
    } else {
      res = await fetch('/api/articulos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, serie })
      });
    }

    if (!res.ok) {
      showToast(await leerError(res, 'No se pudo guardar el artículo.'), true);
      return;
    }

    closeModal('modalArticulo');
    await Promise.all([cargarArticulos(), cargarPrestamos()]);
    renderArticulos();
    renderPrestamos();
    updateDashboard();
    showToast(esEdicion ? 'Artículo actualizado correctamente.' : 'Artículo registrado correctamente.');
  } catch (e) {
    showToast('No se pudo conectar con el servidor. Verifica tu conexión.', true);
  } finally {
    btnGuardar.disabled = false;
  }
}

function eliminarArticulo(id) {
  const a = state.articulos.find(x => x.id === id);
  if (!a) return;
  if (a.estado === 'Prestado') {
    showToast('No puedes eliminar un artículo que está actualmente prestado.', true);
    return;
  }
  confirmar('¿Deseas eliminar este artículo del inventario? Esta acción no se puede deshacer.', async () => {
    try {
      const res = await fetch(`/api/articulos?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        showToast(await leerError(res, 'No se pudo eliminar el artículo.'), true);
        return;
      }
      await cargarArticulos();
      renderArticulos();
      updateDashboard();
      showToast('Artículo eliminado.');
    } catch (e) {
      showToast('No se pudo conectar con el servidor. Verifica tu conexión.', true);
    }
  }, '¿Eliminar artículo?');
}

function renderArticulos(lista) {
  const data = lista || state.articulos;
  const rows = data.map((a, i) => {
    const badgeClass = a.estado === 'Disponible' ? 'badge-done' : 'badge-pending';
    return `
      <td>${i + 1}</td>
      <td>${escapeHtml(a.nombre)}</td>
      <td>${a.serie}</td>
      <td><span class="badge ${badgeClass}">${a.estado}</span></td>
      <td>
        <button class="btn-action btn-edit" onclick="editarArticulo(${a.id})" title="Editar"><i class="fas fa-pen"></i></button>
        <button class="btn-action btn-delete" onclick="eliminarArticulo(${a.id})" title="Eliminar" ${a.estado === 'Prestado' ? 'disabled' : ''}><i class="fas fa-trash"></i></button>
      </td>
    `;
  });
  renderTable('#tablaArticulos tbody', rows, 5);
}

document.getElementById('searchArticulos').addEventListener('input', function () {
  const q = this.value.toLowerCase();
  const filtrada = state.articulos.filter(a =>
    a.nombre.toLowerCase().includes(q) || a.serie.includes(q)
  );
  renderArticulos(filtrada);
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===========================
// PRÉSTAMOS
// ===========================
async function abrirModalPrestamo() {
  try {
    await cargarArticulos();
  } catch (e) {
    showToast('No se pudo conectar con el servidor. Verifica tu conexión.', true);
    return;
  }

  const disponibles = state.articulos.filter(a => a.estado === 'Disponible');
  const select = document.getElementById('prestamoArticulo');

  if (disponibles.length === 0) {
    showToast('No hay artículos disponibles para prestar. Registra artículos en el Inventario primero.', true);
    return;
  }

  select.innerHTML = disponibles
    .map(a => `<option value="${a.id}">${escapeHtml(a.nombre)} — Serie: ${a.serie}</option>`)
    .join('');

  clearFields('prestamoPersona', 'prestamoCodigo', 'prestamoSeccion');
  openModal('modalPrestamo');
}

async function agregarPrestamo() {
  const articuloId = parseInt(getVal('prestamoArticulo'));
  const persona = getVal('prestamoPersona');
  const codigo  = getVal('prestamoCodigo');
  const seccion = getVal('prestamoSeccion');

  if (!articuloId) { showToast('Selecciona un artículo disponible.', true); return; }
  if (!persona || !codigo || !seccion) {
    showToast('Por favor completa Nombre, Código y Sección.', true);
    return;
  }

  const btnGuardar = document.querySelector('#modalPrestamo .btn-primary');
  btnGuardar.disabled = true;

  try {
    const res = await fetch('/api/prestamos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articuloId, persona, codigo, seccion })
    });

    if (!res.ok) {
      showToast(await leerError(res, 'No se pudo registrar el préstamo.'), true);
      return;
    }

    closeModal('modalPrestamo');
    await Promise.all([cargarPrestamos(), cargarArticulos()]);
    renderPrestamos();
    renderArticulos();
    updateDashboard();
    showToast('Préstamo registrado correctamente.');
  } catch (e) {
    showToast('No se pudo conectar con el servidor. Verifica tu conexión.', true);
  } finally {
    btnGuardar.disabled = false;
  }
}

function marcarDevuelto(id) {
  const p = state.prestamos.find(x => x.id === id);
  if (!p || p.estado === 'Devuelto') return;

  confirmar(`¿Confirmas que "${p.articuloNombre}" fue devuelto por ${p.persona}?`, async () => {
    try {
      const res = await fetch('/api/prestamos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) {
        showToast(await leerError(res, 'No se pudo actualizar el préstamo.'), true);
        return;
      }
      await Promise.all([cargarPrestamos(), cargarArticulos()]);
      renderPrestamos();
      renderArticulos();
      updateDashboard();
      showToast('Préstamo marcado como devuelto.');
    } catch (e) {
      showToast('No se pudo conectar con el servidor. Verifica tu conexión.', true);
    }
  }, '¿Marcar como devuelto?');
}

function eliminarPrestamo(id) {
  const p = state.prestamos.find(x => x.id === id);
  if (!p) return;

  const mensaje = p.estado === 'Prestado'
    ? 'Este préstamo sigue activo. Al eliminarlo, el artículo volverá a estar Disponible. ¿Deseas continuar?'
    : '¿Deseas eliminar este registro de préstamo? Esta acción no se puede deshacer.';

  confirmar(mensaje, async () => {
    try {
      const res = await fetch(`/api/prestamos?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        showToast(await leerError(res, 'No se pudo eliminar el préstamo.'), true);
        return;
      }
      await Promise.all([cargarPrestamos(), cargarArticulos()]);
      renderPrestamos();
      renderArticulos();
      updateDashboard();
      showToast('Préstamo eliminado.');
    } catch (e) {
      showToast('No se pudo conectar con el servidor. Verifica tu conexión.', true);
    }
  }, '¿Eliminar préstamo?');
}

function renderPrestamos(lista) {
  const data = lista || state.prestamos;
  const rows = data.map((p, i) => {
    const badgeClass = p.estado === 'Devuelto' ? 'badge-done' : 'badge-pending';
    return `
      <td>${i + 1}</td>
      <td>${escapeHtml(p.persona)}</td>
      <td>${escapeHtml(p.codigo)}</td>
      <td>${escapeHtml(p.seccion)}</td>
      <td>${escapeHtml(p.articuloNombre)} <span style="color:var(--text-muted); font-size:0.78rem;">(${p.articuloSerie})</span></td>
      <td>${p.fechaHora}</td>
      <td><span class="badge ${badgeClass}">${p.estado}</span></td>
      <td>
        <button class="btn-action btn-return" onclick="marcarDevuelto(${p.id})" title="Marcar como devuelto" ${p.estado === 'Devuelto' ? 'disabled' : ''}><i class="fas fa-check"></i></button>
        <button class="btn-action btn-delete" onclick="eliminarPrestamo(${p.id})" title="Eliminar"><i class="fas fa-trash"></i></button>
      </td>
    `;
  });
  renderTable('#tablaPrestamos tbody', rows, 8);
}

document.getElementById('searchPrestamos').addEventListener('input', function () {
  const q = this.value.toLowerCase();
  const filtrada = state.prestamos.filter(p =>
    p.persona.toLowerCase().includes(q) ||
    p.codigo.toLowerCase().includes(q) ||
    p.seccion.toLowerCase().includes(q) ||
    p.articuloNombre.toLowerCase().includes(q)
  );
  renderPrestamos(filtrada);
});

// ===========================
// DASHBOARD — contadores animados
// ===========================
function animateCount(el, target, duration = 500) {
  let start = 0;
  const step = target / (duration / 16) || target;
  const timer = setInterval(() => {
    start += step;
    if (start >= target) { el.textContent = target; clearInterval(timer); }
    else el.textContent = Math.floor(start);
  }, 16);
}

function updateDashboard() {
  const totalArticulos = state.articulos.length;
  const disponibles = state.articulos.filter(a => a.estado === 'Disponible').length;
  const prestados = state.articulos.filter(a => a.estado === 'Prestado').length;
  const prestamosActivos = state.prestamos.filter(p => p.estado === 'Prestado').length;

  const map = {
    'count-articulos': totalArticulos,
    'count-disponibles': disponibles,
    'count-prestados': prestados,
    'count-prestamos-activos': prestamosActivos
  };
  for (const [id, val] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) animateCount(el, val, 400);
  }

  const disponibilidad = totalArticulos === 0 ? 0 : Math.round((disponibles / totalArticulos) * 100);
  const resumenEl = document.getElementById('resumenDisponibilidad');
  if (resumenEl) resumenEl.textContent = `${disponibilidad}%`;
}

// ===========================
// MODO OSCURO Y PREFERENCIAS DE INTERFAZ
// (solo preferencias visuales del dispositivo; los datos reales están en Neon)
// ===========================
function applyDarkMode(dark) {
  document.body.classList.toggle('dark-mode', dark);
  const btn = document.getElementById('darkModeBtn');
  if (btn) {
    btn.innerHTML = dark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    btn.title = dark ? 'Modo claro' : 'Modo oscuro';
  }
}

document.getElementById('darkModeBtn').addEventListener('click', () => {
  const isDark = !document.body.classList.contains('dark-mode');
  localStorage.setItem('sip_darkMode', isDark);
  applyDarkMode(isDark);
});

// ===========================
// INIT
// ===========================
(async function init() {
  mostrarCargando();

  try {
    await Promise.all([cargarArticulos(), cargarPrestamos()]);
    renderArticulos();
    renderPrestamos();
  } catch (e) {
    console.warn('Error cargando datos', e);
    showToast('No se pudo conectar con el servidor. Verifica tu conexión a internet.', true);
  }

  updateDashboard();

  const darkSaved = localStorage.getItem('sip_darkMode') === 'true';
  applyDarkMode(darkSaved);

  if (localStorage.getItem('sip_sidebarCollapsed') === 'true') {
    document.getElementById('sidebar').classList.add('collapsed');
    document.querySelector('.main-wrapper').classList.add('collapsed');
  }
})();
