// ========================================
// DISFRACES FANTASÍA - JS OPTIMIZADO
// ========================================

const CLIENT_ID = CONFIG.CLIENT_ID;
const API_KEY = CONFIG.API_KEY;
const SPREADSHEET_ID = CONFIG.GOOGLE_SHEET_ID;
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email';

let tokenClient, gapiInited = false, gisInited = false;
let spreadsheetId = SPREADSHEET_ID, emailUsuario = '';
let usuarioLogueado = false, registroSeleccionado = null, ultimoRegistro = null;

// Utilidades
function debounce(fn, ms = 500) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; }
function safeGapi(fn, msg = 'Error') { return fn().catch(e => { console.error(msg, e); throw new Error(msg + ': ' + e.message); }); }
function mostrarMensaje(el, msg, tipo) { el.textContent = msg; el.className = 'mensaje-resultado ' + tipo; setTimeout(() => { el.className = 'mensaje-resultado'; }, 5000); }
function generarNumeroRecibo() { const f = new Date(); return 'DF' + f.getFullYear() + String(f.getMonth()+1).padStart(2,'0') + String(f.getDate()).padStart(2,'0') + '-' + String(f.getHours()).padStart(2,'0') + String(f.getMinutes()).padStart(2,'0') + String(f.getSeconds()).padStart(2,'0'); }

// Google API
function gapiLoaded() { gapi.load('client', initGapi); updateLoading('Conectando con Google...'); }
async function initGapi() {
    try {
        await gapi.client.init({ apiKey: API_KEY, discoveryDocs: [DISCOVERY_DOC] });
        gapiInited = true; checkReady();
    } catch (e) { console.error('Error GAPI:', e); updateLoading('Error de conexión'); }
}
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({ client_id: CLIENT_ID, scope: SCOPES, callback: handleToken });
    gisInited = true; checkReady();
}
function updateLoading(text) {
    const el = document.getElementById('loading-text');
    if (el) el.textContent = text;
}
function checkReady() {
    if (gapiInited && gisInited) {
        updateLoading('');
        const loading = document.getElementById('login-loading');
        if (loading) loading.classList.add('loading-complete');
        const btn = document.getElementById('btn-google-login');
        if (btn) btn.disabled = false;
    }
}
function handleToken(resp) {
    if (resp.error) { alert('Error al iniciar sesión'); return; }
    obtenerEmail();
}
async function obtenerEmail() {
    try {
        const r = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { 'Authorization': 'Bearer ' + gapi.client.getToken().access_token } });
        const u = await r.json();
        emailUsuario = u.email;
        const el = document.getElementById('usuario-logueado');
        if (el) el.textContent = '👤 ' + emailUsuario.split('@')[0];
        await verificarHojas();
    } catch (e) { emailUsuario = 'usuario'; await verificarHojas(); }
}

async function verificarHojas() {
    try {
        const r = await safeGapi(() => gapi.client.sheets.spreadsheets.get({ spreadsheetId }));
        const hojas = r.result.sheets.map(s => s.properties.title);
        if (!hojas.includes('Alquileres')) await crearHoja('Alquileres', 'Nombre', 'Cedula', 'Celular', 'Disfraz', 'PrecioAlquiler', 'FechaAlquiler', 'FechaDevolucion', 'Condiciones', 'GarantiaDinero', 'GarantiaObjeto', 'DescripcionGarantia', 'Observaciones', 'Estado', 'FechaRegistro', 'CondicionesDevolucion', 'NotasDevolucion', 'FechaDevolucionReal', 'NumeroRecibo', 'RegistradoPor');
        if (!hojas.includes('ClientesHabituales')) await crearHoja('ClientesHabituales', 'Nombre', 'Cedula', 'Celular', 'TotalAlquileres', 'UltimoAlquiler');
        document.getElementById('modal-login').classList.remove('active');
        document.getElementById('modal-clientes').classList.add('active');
        usuarioLogueado = true;
        cargarStats();
    } catch (e) { alert('Error: ' + e.message); }
}

async function crearHoja(nombre, ...headers) {
    await safeGapi(() => gapi.client.sheets.spreadsheets.batchUpdate({ spreadsheetId, resource: { requests: [{ addSheet: { properties: { title: nombre } } }] } }));
    await safeGapi(() => gapi.client.sheets.spreadsheets.values.update({ spreadsheetId, range: nombre + '!A1:' + String.fromCharCode(64 + headers.length) + '1', valueInputOption: 'RAW', resource: { values: [headers] } }));
}

// Modales
document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', function(e) { const h = this.getAttribute('href'); if (h !== '#') { e.preventDefault(); const t = document.querySelector(h); if (t) t.scrollIntoView({ behavior: 'smooth' }); } }));

const observer = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; } }), { threshold: 0.1 });
document.querySelectorAll('.servicio-card, .disfraz-card, .contacto-card').forEach(c => { c.style.opacity = '0'; c.style.transform = 'translateY(20px)'; c.style.transition = 'opacity 0.6s, transform 0.6s'; observer.observe(c); });

const modalLogin = document.getElementById('modal-login'), modalClientes = document.getElementById('modal-clientes'), modalRecibo = document.getElementById('modal-recibo');
document.getElementById('btn-clientes').addEventListener('click', e => { e.preventDefault(); if (usuarioLogueado) modalClientes.classList.add('active'); else modalLogin.classList.add('active'); });
document.querySelectorAll('.close-modal').forEach(b => b.addEventListener('click', () => { modalLogin.classList.remove('active'); modalClientes.classList.remove('active'); }));
document.getElementById('btn-cerrar-recibo').addEventListener('click', () => modalRecibo.classList.remove('active'));
window.addEventListener('click', e => { if (e.target === modalLogin || e.target === modalClientes || e.target === modalRecibo) { modalLogin.classList.remove('active'); modalClientes.classList.remove('active'); modalRecibo.classList.remove('active'); } });

// Login
document.getElementById('btn-google-login').addEventListener('click', () => {
    if (!gapiInited || !gisInited) return;
    gapi.client.getToken() === null ? tokenClient.requestAccessToken({ prompt: 'consent' }) : tokenClient.requestAccessToken({ prompt: '' });
});
document.getElementById('btn-logout').addEventListener('click', () => {
    const t = gapi.client.getToken(); if (t) { google.accounts.oauth2.revoke(t.access_token); gapi.client.setToken(''); }
    usuarioLogueado = false; modalClientes.classList.remove('active');
});

// Tabs
document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    const tab = document.getElementById('tab-' + b.dataset.tab);
    if (tab) tab.classList.add('active');
}));

// Cliente Habitual - Debounced
async function buscarClienteHabitual(cedula) {
    try {
        const [rc, ra] = await Promise.all([
            safeGapi(() => gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range: 'ClientesHabituales!A:E' })),
            safeGapi(() => gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range: 'Alquileres!A:M' }))
        ]);
        document.getElementById('cedula-loader').style.display = 'none';
        const pendientes = (ra.result.values || []).slice(1).filter(r => r[1]?.toString() === cedula && r[12] === 'Alquilado').map(r => ({ disfraz: r[3], fecha: r[6] }));
        const cliente = (rc.result.values || []).slice(1).find(r => r[1]?.toString() === cedula);
        if (cliente) {
            document.getElementById('nombre-cliente').value = cliente[0] || '';
            document.getElementById('celular').value = cliente[2] || '';
            const alert = document.getElementById('cliente-habitual-alert');
            alert.innerHTML = `<span class="alert-icon">⭐</span><span class="alert-text">Cliente frecuente</span><span class="alert-alquileres">${cliente[3] || 0} alquileres</span>`;
            alert.style.display = 'flex';
        } else { document.getElementById('cliente-habitual-alert').style.display = 'none'; }
        const deudas = document.getElementById('alerta-deudas');
        if (pendientes.length > 0) {
            deudas.innerHTML = `<div class="alerta-deuda">⚠️ <strong>${pendientes.length} disfraz(es) pendiente(s):</strong><ul class="deuda-lista">${pendientes.map(p => `<li> ${p.disfraz} - Debía: ${p.fecha}</li>`).join('')}</ul></div>`;
            deudas.style.display = 'block';
        } else { deudas.style.display = 'none'; }
    } catch (e) { document.getElementById('cedula-loader').style.display = 'none'; console.error(e); }
}

const buscarDebounced = debounce(buscarClienteHabitual, 600);
document.getElementById('cedula').addEventListener('input', function() {
    const v = this.value.trim();
    document.getElementById('cedula-loader').style.display = v.length >= 5 ? 'inline' : 'none';
    if (v.length >= 5) buscarDebounced(v);
    else { document.getElementById('cliente-habitual-alert').style.display = 'none'; document.getElementById('alerta-deudas').style.display = 'none'; }
});

// Registrar
document.getElementById('form-registro').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('.btn-registrar');
    btn.querySelector('.btn-text').style.display = 'none';
    btn.querySelector('.btn-loading').style.display = 'inline';
    btn.disabled = true;
    const datos = {
        nombre: document.getElementById('nombre-cliente').value, cedula: document.getElementById('cedula').value,
        celular: document.getElementById('celular').value, disfraz: document.getElementById('disfraz').value,
        precio: document.getElementById('precio-alquiler').value || '0', fechaAlq: document.getElementById('fecha-alquiler').value,
        fechaDev: document.getElementById('fecha-devolucion').value, condiciones: document.getElementById('condiciones').value,
        garantiaDin: document.getElementById('garantia-dinero').value || '0', garantiaObj: document.getElementById('garantia-objeto').value || '',
        descGar: document.getElementById('descripcion-garantia').value || '', obs: document.getElementById('observaciones').value || '',
        recibo: generarNumeroRecibo()
    };
    try {
        await safeGapi(() => gapi.client.sheets.spreadsheets.values.append({ spreadsheetId, range: 'Alquileres!A:S', valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS', resource: { values: [[datos.nombre, datos.cedula, datos.celular, datos.disfraz, datos.precio, datos.fechaAlq, datos.fechaDev, datos.condiciones, datos.garantiaDin, datos.garantiaObj, datos.descGar, datos.obs, 'Alquilado', new Date().toLocaleString('es-BO'), '', '', '', datos.recibo, emailUsuario]] } }));
        await actualizarCliente(datos);
        ultimoRegistro = datos;
        mostrarMensaje(document.getElementById('mensaje-registro'), '✅ ¡Registro guardado!', 'exito');
        document.getElementById('btn-imprimir-recibo').style.display = 'inline-block';
        cargarStats();
    } catch (err) { mostrarMensaje(document.getElementById('mensaje-registro'), '❌ ' + err.message, 'error'); }
    btn.querySelector('.btn-text').style.display = 'inline';
    btn.querySelector('.btn-loading').style.display = 'none';
    btn.disabled = false;
});

async function actualizarCliente(d) {
    try {
        const r = await safeGapi(() => gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range: 'ClientesHabituales!A:E' }));
        const rows = r.result.values || [];
        let fila = -1;
        for (let i = 1; i < rows.length; i++) { if (rows[i][1]?.toString() === d.cedula) { fila = i + 1; break; } }
        const total = fila > 0 ? (parseInt(rows[fila-1][3]) || 0) + 1 : 1;
        if (fila > 0) {
            await safeGapi(() => gapi.client.sheets.spreadsheets.values.update({ spreadsheetId, range: `ClientesHabituales!A${fila}:E${fila}`, valueInputOption: 'RAW', resource: { values: [[d.nombre, d.cedula, d.celular, total, d.fechaAlq]] } }));
        } else {
            await safeGapi(() => gapi.client.sheets.spreadsheets.values.append({ spreadsheetId, range: 'ClientesHabituales!A:E', valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS', resource: { values: [[d.nombre, d.cedula, d.celular, 1, d.fechaAlq]] } }));
        }
    } catch (e) { console.error(e); }
}

document.getElementById('form-registro').addEventListener('reset', () => {
    document.getElementById('btn-imprimir-recibo').style.display = 'none';
    document.getElementById('cliente-habitual-alert').style.display = 'none';
    document.getElementById('alerta-deudas').style.display = 'none';
    document.getElementById('mensaje-registro').className = 'mensaje-resultado';
});

// Recibo
document.getElementById('btn-imprimir-recibo').addEventListener('click', () => mostrarRecibo(ultimoRegistro));
document.getElementById('btn-print-recibo').addEventListener('click', () => window.print());

function mostrarRecibo(d) {
    if (!d) return;
    const f = new Date();
    document.getElementById('recibo-contenido').innerHTML = `
        <div class="recibo-header"><div class="recibo-brand">DISFRACES FANTASÍA</div><div class="recibo-sub">Ayacucho, Oruro • 76133121</div></div>
        <div class="recibo-numero">N° ${d.recibo || d.numeroRecibo || ''}</div>
        <div class="recibo-cliente"><div class="cliente-nombre">${d.nombre}</div><div class="cliente-dato">CI: ${d.cedula} • Cel: ${d.celular}</div></div>
        <div class="recibo-disfraz"><div class="disfraz-nombre">${d.disfraz}</div><div class="disfraz-estado">${d.condiciones}</div></div>
        <div class="recibo-fechas"><div class="fecha-item"><div class="fecha-label">Alquiler</div><div class="fecha-valor">${d.fechaAlquiler || d.fechaAlq}</div></div><div class="fecha-item"><div class="fecha-label">Devolución</div><div class="fecha-valor">${d.fechaDevolucion || d.fechaDev}</div></div></div>
        <div class="recibo-garantia"><div class="garantia-label">Garantía</div><div class="garantia-valor">Bs. ${d.garantiaDinero || d.garantiaDin || '0'}${(d.garantiaObjeto || d.garantiaObj) ? ' + ' + (d.garantiaObjeto || d.garantiaObj) : ''}</div></div>
        <div class="recibo-total"><div class="total-label">ALQUILER</div><div class="total-monto">Bs. ${d.precioAlquiler || d.precio || '0'}</div></div>
        <div class="recibo-firma"><div class="firma-linea"></div><div class="firma-texto">Firma del Cliente</div></div>
        <div class="recibo-condiciones">Me comprometo a devolver el disfraz en la fecha acordada. En caso de daño o pérdida, asumo el costo total. La garantía será devuelta al entregar en buen estado.</div>
        <div class="recibo-footer"><div class="footer-gracias">¡¡GRACIAS POR SU PREFERENCIA!!</div><div class="footer-fecha">${f.toLocaleDateString('es-BO')} • ${f.toLocaleTimeString('es-BO', {hour:'2-digit',minute:'2-digit'})}</div></div>`;
    modalRecibo.classList.add('active');
}

// Búsqueda
document.getElementById('btn-buscar').addEventListener('click', buscarCliente);
document.getElementById('buscar-input').addEventListener('keypress', e => { if (e.key === 'Enter') buscarCliente(); });

async function buscarCliente() {
    const t = document.getElementById('buscar-input').value.trim().toLowerCase();
    const res = document.getElementById('resultados-busqueda');
    if (!t) { res.innerHTML = '<p class="placeholder-text">Escribe para buscar</p>'; return; }
    res.innerHTML = '<div class="loading">Buscando</div>';
    try {
        const r = await safeGapi(() => gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range: 'Alquileres!A:R' }));
        const encontrados = (r.result.values || []).slice(1).filter(row => (row[0]||'').toLowerCase().includes(t) || (row[1]||'').toLowerCase().includes(t))
            .map((row, i) => ({ fila: i+2, nombre: row[0], cedula: row[1], celular: row[2], disfraz: row[3], precio: row[4], fechaAlq: row[5], fechaDev: row[6], condiciones: row[7], garantiaDin: row[8], garantiaObj: row[9], descGar: row[10], obs: row[11], estado: row[12], recibo: row[17] }));
        if (encontrados.length > 0) { mostrarResultados(encontrados); }
        else { res.innerHTML = '<p class="placeholder-text">No se encontraron resultados</p>'; }
    } catch (e) { res.innerHTML = '<p class="placeholder-text">Error de conexión</p>'; }
}

function mostrarResultados(datos) {
    document.getElementById('resultados-busqueda').innerHTML = datos.map(r => `
        <div class="resultado-card ${r.estado === 'Alquilado' ? 'alquilado' : 'devuelto'}">
            <div class="resultado-header"><span class="resultado-nombre"> ${r.nombre}</span><span class="resultado-estado ${r.estado === 'Alquilado' ? 'estado-alquilado' : 'estado-devuelto'}">${r.estado === 'Alquilado' ? '' : '🟢'} ${r.estado}</span></div>
            <div class="resultado-info"><span><strong>CI:</strong> ${r.cedula}</span><span><strong>Cel:</strong> ${r.celular}</span><span><strong>Disfraz:</strong> ${r.disfraz}</span><span><strong>Precio:</strong> Bs. ${r.precio || '0'}</span><span><strong>Alquiler:</strong> ${r.fechaAlq}</span><span><strong>Dev:</strong> ${r.fechaDev}</span></div>
            <div class="resultado-actions">
                ${r.estado === 'Alquilado' ? `<button class="btn-devolucion" onclick="iniciarDevolucion(${r.fila},'${r.nombre.replace(/'/g,"\\'")}','${r.disfraz.replace(/'/g,"\\'")}','${r.garantiaDin}','${(r.garantiaObj||'').replace(/'/g,"\\'")}')">📦 Devolución</button>` : ''}
                <button class="btn-recibo-busqueda" onclick="mostrarRecibo({nombre:'${r.nombre.replace(/'/g,"\\'")}',cedula:'${r.cedula}',celular:'${r.celular}',disfraz:'${r.disfraz.replace(/'/g,"\\'")}',precioAlquiler:'${r.precio}',fechaAlquiler:'${r.fechaAlq}',fechaDevolucion:'${r.fechaDev}',condiciones:'${r.condiciones}',garantiaDinero:'${r.garantiaDin}',garantiaObjeto:'${(r.garantiaObj||'').replace(/'/g,"\\'")}',descripcionGarantia:'${(r.descGar||'').replace(/'/g,"\\'")}',numeroRecibo:'${r.recibo||''}'})">🖨️ Recibo</button>
            </div>
        </div>`).join('');
}

// Devolución
function iniciarDevolucion(fila, nombre, disfraz, gDin, gObj) {
    registroSeleccionado = { fila, nombre, disfraz, gDin, gObj };
    document.getElementById('info-devolucion').innerHTML = `<strong>${nombre}</strong><br>${disfraz}`;
    document.getElementById('garantia-devolver-texto').innerHTML = (gDin && parseFloat(gDin) > 0 ? `💵 Bs. ${gDin}` : '') + (gObj ? `  ${gObj}` : '') || 'Sin garantía';
    document.getElementById('modal-devolucion').style.display = 'block';
}
document.getElementById('btn-cancelar-devolucion').addEventListener('click', () => { document.getElementById('modal-devolucion').style.display = 'none'; registroSeleccionado = null; });
document.getElementById('btn-confirmar-devolucion').addEventListener('click', async () => {
    if (!registroSeleccionado) return;
    const btn = document.getElementById('btn-confirmar-devolucion');
    btn.disabled = true; btn.textContent = '⏳...';
    try {
        await safeGapi(() => gapi.client.sheets.spreadsheets.values.update({ spreadsheetId, range: `Alquileres!M${registroSeleccionado.fila}`, valueInputOption: 'RAW', resource: { values: [['Devuelto']] } }));
        await safeGapi(() => gapi.client.sheets.spreadsheets.values.update({ spreadsheetId, range: `Alquileres!O${registroSeleccionado.fila}:Q${registroSeleccionado.fila}`, valueInputOption: 'RAW', resource: { values: [[document.getElementById('condiciones-devolucion').value, document.getElementById('notas-devolucion').value, new Date().toLocaleString('es-BO')]] } }));
        alert('✅ Devolución registrada');
        document.getElementById('modal-devolucion').style.display = 'none';
        buscarCliente(); cargarStats();
    } catch (e) { alert('❌ ' + e.message); }
    btn.disabled = false; btn.textContent = '✅ Confirmar';
    registroSeleccionado = null;
});

// Historial
document.getElementById('btn-cargar-historial').addEventListener('click', cargarHistorial);
document.getElementById('filtro-estado').addEventListener('change', cargarHistorial);

async function cargarHistorial() {
    const tabla = document.getElementById('tabla-historial');
    tabla.innerHTML = '<div class="loading">Cargando</div>';
    const filtro = document.getElementById('filtro-estado').value;
    try {
        const r = await safeGapi(() => gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range: 'Alquileres!A:R' }));
        const datos = (r.result.values || []).slice(1).filter(row => filtro === 'todos' || row[12] === filtro)
            .map(row => ({ nombre: row[0], cedula: row[1], disfraz: row[3], precio: row[4], gDin: row[8], gObj: row[9], estado: row[12] })).reverse();
        if (datos.length > 0) {
            tabla.innerHTML = `<table class="tabla-registros"><thead><tr><th>Nombre</th><th>CI</th><th>Disfraz</th><th>Precio</th><th>Garantía</th><th>Estado</th></tr></thead><tbody>${datos.map(r => `<tr><td>${r.nombre}</td><td>${r.cedula}</td><td>${r.disfraz}</td><td>Bs. ${r.precio||'0'}</td><td>Bs. ${r.gDin||'0'} ${r.gObj?'+'+r.gObj:''}</td><td><span class="resultado-estado ${r.estado==='Alquilado'?'estado-alquilado':'estado-devuelto'}">${r.estado==='Alquilado'?'🔴':'🟢'}</span></td></tr>`).join('')}</tbody></table>`;
        } else { tabla.innerHTML = '<p class="placeholder-text">No hay registros</p>'; }
    } catch (e) { tabla.innerHTML = '<p class="placeholder-text">Error</p>'; }
}

// Clientes Habituales
document.getElementById('btn-cargar-clientes').addEventListener('click', async () => {
    const tabla = document.getElementById('tabla-clientes-habituales');
    tabla.innerHTML = '<div class="loading">Cargando</div>';
    try {
        const r = await safeGapi(() => gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range: 'ClientesHabituales!A:E' }));
        const rows = (r.result.values || []).slice(1);
        if (rows.length > 0) {
            tabla.innerHTML = `<table class="tabla-registros"><thead><tr><th>Nombre</th><th>CI</th><th>Celular</th><th>Alquileres</th><th>Último</th></tr></thead><tbody>${rows.map(r => `<tr><td>⭐ ${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td><strong>${r[3]||0}</strong></td><td>${r[4]||'-'}</td></tr>`).join('')}</tbody></table>`;
        } else { tabla.innerHTML = '<p class="placeholder-text">No hay clientes</p>'; }
    } catch (e) { tabla.innerHTML = '<p class="placeholder-text">Error</p>'; }
});

// Stats
async function cargarStats() {
    try {
        const r = await safeGapi(() => gapi.client.sheets.spreadsheets.values.get({ spreadsheetId, range: 'Alquileres!A:M' }));
        const rows = (r.result.values || []).slice(1);
        const hoy = new Date().toLocaleDateString('es-BO');
        document.getElementById('stat-hoy').textContent = rows.filter(r => r[13] && r[13].includes(hoy.split('/')[2])).length;
        document.getElementById('stat-pendientes').textContent = rows.filter(r => r[12] === 'Alquilado').length;
        document.getElementById('stat-devueltos').textContent = rows.filter(r => r[12] === 'Devuelto').length;
    } catch (e) { console.error('Stats:', e); }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    const f = document.getElementById('fecha-alquiler');
    if (f) f.value = new Date().toISOString().split('T')[0];
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
});
