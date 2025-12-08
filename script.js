// ========================================
// CONFIGURACIÓN - ¡IMPORTANTE!
// ========================================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxxwm052DUZV8KR-vAUsD6ppwDFuj_h5Tr8f17DpCApi_isKwRMnbYbhuyDbHSW2feL/exec';

const CREDENCIALES = {
    email: 'admin@disfracesfantasia.com',
    password: 'fantasia2025'
};

// ========================================
// VARIABLES GLOBALES
// ========================================
let usuarioLogueado = false;
let registroSeleccionado = null;
let ultimoRegistro = null;
let clientesHabituales = [];

// ========================================
// SMOOTH SCROLL & ANIMACIONES
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
});
document.querySelectorAll('.servicio-card, .disfraz-card, .contacto-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s, transform 0.6s';
    observer.observe(card);
});

// ========================================
// ELEMENTOS BASE
// ========================================
const modalLogin = document.getElementById('modal-login');
const modalClientes = document.getElementById('modal-clientes');
const modalRecibo = document.getElementById('modal-recibo');
const btnClientes = document.getElementById('btn-clientes');

// seguridad: chequear existencia antes de usar
if (btnClientes) {
    btnClientes.addEventListener('click', (e) => {
        e.preventDefault();
        usuarioLogueado ? modalClientes.classList.add('active') : modalLogin.classList.add('active');
    });
}

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        if (modalLogin) modalLogin.classList.remove('active');
        if (modalClientes) modalClientes.classList.remove('active');
    });
});

const btnCerrarRecibo = document.getElementById('btn-cerrar-recibo');
if (btnCerrarRecibo) btnCerrarRecibo.addEventListener('click', () => modalRecibo.classList.remove('active'));

window.addEventListener('click', (e) => {
    if (e.target === modalLogin) modalLogin.classList.remove('active');
    if (e.target === modalClientes) modalClientes.classList.remove('active');
    if (e.target === modalRecibo) modalRecibo.classList.remove('active');
});

// ========================================
// LOGIN
// ========================================
const formLogin = document.getElementById('form-login');
if (formLogin) {
    formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (email === CREDENCIALES.email && password === CREDENCIALES.password) {
            usuarioLogueado = true;
            if (modalLogin) modalLogin.classList.remove('active');
            if (modalClientes) modalClientes.classList.add('active');
            const usuarioEl = document.getElementById('usuario-logueado');
            if (usuarioEl) usuarioEl.textContent = '👤 ' + email;
            formLogin.reset();
            const loginError = document.getElementById('login-error');
            if (loginError) loginError.textContent = '';
            const fechaAlquiler = document.getElementById('fecha-alquiler');
            if (fechaAlquiler) fechaAlquiler.value = new Date().toISOString().split('T')[0];
            cargarClientesHabitualesEnMemoria();
        } else {
            const loginError = document.getElementById('login-error');
            if (loginError) loginError.textContent = '❌ Credenciales incorrectas';
        }
    });
}

const btnLogout = document.getElementById('btn-logout');
if (btnLogout) btnLogout.addEventListener('click', () => {
    usuarioLogueado = false;
    if (modalClientes) modalClientes.classList.remove('active');
});

// ========================================
// TABS
// ========================================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const tabId = 'tab-' + btn.dataset.tab;
        const tabEl = document.getElementById(tabId);
        if (tabEl) tabEl.classList.add('active');
    });
});

// ========================================
// AUTOCOMPLETADO CLIENTES HABITUALES
// ========================================
let busquedaTimeout = null;
const cedulaInput = document.getElementById('cedula');
if (cedulaInput) {
    cedulaInput.addEventListener('input', function() {
        clearTimeout(busquedaTimeout);
        const cedula = this.value.trim();

        if (cedula.length >= 5) {
            const loader = document.getElementById('cedula-loader');
            if (loader) loader.style.display = 'inline';
            busquedaTimeout = setTimeout(() => buscarClienteHabitual(cedula), 500);
        } else {
            const alert = document.getElementById('cliente-habitual-alert');
            if (alert) alert.style.display = 'none';
        }
    });
}

async function buscarClienteHabitual(cedula) {
    try {
        const response = await enviarAGoogleSheets({ accion: 'buscarClienteHabitual', cedula: cedula });
        const loader = document.getElementById('cedula-loader');
        if (loader) loader.style.display = 'none';

        if (response && response.success && response.cliente) {
            const c = response.cliente;
            const nombreEl = document.getElementById('nombre-cliente');
            const celularEl = document.getElementById('celular');
            if (nombreEl) nombreEl.value = c.nombre || '';
            if (celularEl) celularEl.value = c.celular || '';
            const alert = document.getElementById('cliente-habitual-alert');
            if (alert) alert.style.display = 'flex';
            const alertAlquileres = document.querySelector('.alert-alquileres');
            if (alertAlquileres) alertAlquileres.textContent = (c.totalAlquileres || 0) + ' alquileres';
        } else {
            const alert = document.getElementById('cliente-habitual-alert');
            if (alert) alert.style.display = 'none';
        }
    } catch (e) {
        const loader = document.getElementById('cedula-loader');
        if (loader) loader.style.display = 'none';
        console.error('Error buscarClienteHabitual', e);
    }
}

async function cargarClientesHabitualesEnMemoria() {
    try {
        const response = await enviarAGoogleSheets({ accion: 'obtenerClientesHabituales' });
        if (response && response.success) clientesHabituales = response.datos || [];
    } catch (e) { console.log('Error cargando clientes habituales', e); }
}

// ========================================
// REGISTRO DE CLIENTES
// ========================================
const formRegistro = document.getElementById('form-registro');
const mensajeRegistro = document.getElementById('mensaje-registro');
const btnImprimirRecibo = document.getElementById('btn-imprimir-recibo');

if (formRegistro) {
    formRegistro.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btnRegistrar = formRegistro.querySelector('.btn-registrar');
        const btnText = btnRegistrar ? btnRegistrar.querySelector('.btn-text') : null;
        const btnLoading = btnRegistrar ? btnRegistrar.querySelector('.btn-loading') : null;

        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'inline';
        if (btnRegistrar) btnRegistrar.disabled = true;

        const datos = {
            accion: 'registrar',
            nombre: (document.getElementById('nombre-cliente') || {}).value || '',
            cedula: (document.getElementById('cedula') || {}).value || '',
            celular: (document.getElementById('celular') || {}).value || '',
            disfraz: (document.getElementById('disfraz') || {}).value || '',
            precioAlquiler: (document.getElementById('precio-alquiler') || {}).value || '0',
            fechaAlquiler: (document.getElementById('fecha-alquiler') || {}).value || '',
            fechaDevolucion: (document.getElementById('fecha-devolucion') || {}).value || '',
            condiciones: (document.getElementById('condiciones') || {}).value || '',
            garantiaDinero: (document.getElementById('garantia-dinero') || {}).value || '0',
            garantiaObjeto: (document.getElementById('garantia-objeto') || {}).value || '',
            descripcionGarantia: (document.getElementById('descripcion-garantia') || {}).value || '',
            observaciones: (document.getElementById('observaciones') || {}).value || '',
            estado: 'Alquilado',
            fechaRegistro: new Date().toLocaleString('es-BO')
        };

        try {
            const response = await enviarAGoogleSheets(datos);

            if (response && response.success) {
                ultimoRegistro = { ...datos, numeroRecibo: response.numeroRecibo || generarNumeroRecibo() };
                mostrarMensaje(mensajeRegistro, '✅ ¡Registro guardado!', 'exito');
                if (btnImprimirRecibo) btnImprimirRecibo.style.display = 'inline-block';

                // Actualizar cliente habitual
                await enviarAGoogleSheets({
                    accion: 'actualizarClienteHabitual',
                    nombre: datos.nombre,
                    cedula: datos.cedula,
                    celular: datos.celular
                });
            } else {
                mostrarMensaje(mensajeRegistro, '❌ Error: ' + (response && response.error ? response.error : 'Desconocido'), 'error');
            }
        } catch (error) {
            mostrarMensaje(mensajeRegistro, '❌ Error de conexión', 'error');
            console.error(error);
        }

        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
        if (btnRegistrar) btnRegistrar.disabled = false;
    });
}

if (formRegistro) {
    formRegistro.addEventListener('reset', () => {
        if (btnImprimirRecibo) btnImprimirRecibo.style.display = 'none';
        const alert = document.getElementById('cliente-habitual-alert');
        if (alert) alert.style.display = 'none';
        if (mensajeRegistro) mensajeRegistro.className = 'mensaje-resultado';
        const fechaAlquiler = document.getElementById('fecha-alquiler');
        if (fechaAlquiler) fechaAlquiler.value = new Date().toISOString().split('T')[0];
    });
}

// ========================================
// IMPRIMIR RECIBO
// ========================================
if (btnImprimirRecibo) btnImprimirRecibo.addEventListener('click', () => mostrarRecibo(ultimoRegistro));
const btnPrintRecibo = document.getElementById('btn-print-recibo');
if (btnPrintRecibo) btnPrintRecibo.addEventListener('click', () => window.print());

function mostrarRecibo(datos) {
    if (!datos) return;

    const numRecibo = datos.numeroRecibo || generarNumeroRecibo();
    const contenido = document.getElementById('recibo-contenido');

    if (!contenido) return;

    contenido.innerHTML = `
        <div class="recibo-header">
            <div class="recibo-logo">🎭</div>
            <div class="recibo-titulo">DISFRACES FANTASÍA</div>
            <div class="recibo-subtitulo">Alquiler de Disfraces</div>
            <div class="recibo-subtitulo">Calle Ayacucho, Oruro - Tel: 76133121</div>
        </div>

        <div class="recibo-info">
            <div class="recibo-linea">
                <span class="recibo-linea-label">Fecha:</span>
                <span>${datos.fechaAlquiler || ''}</span>
            </div>
            <div class="recibo-linea">
                <span class="recibo-linea-label">Cliente:</span>
                <span>${datos.nombre || ''}</span>
            </div>
            <div class="recibo-linea">
                <span class="recibo-linea-label">CI:</span>
                <span>${datos.cedula || ''}</span>
            </div>
            <div class="recibo-linea">
                <span class="recibo-linea-label">Celular:</span>
                <span>${datos.celular || ''}</span>
            </div>
        </div>

        <div class="recibo-seccion">
            <div class="recibo-seccion-titulo">🎭 DISFRAZ ALQUILADO</div>
            <div class="recibo-linea">
                <span>${datos.disfraz || ''}</span>
            </div>
            <div class="recibo-linea">
                <span class="recibo-linea-label">Estado:</span>
                <span>${datos.condiciones || ''}</span>
            </div>
        </div>

        <div class="recibo-seccion">
            <div class="recibo-seccion-titulo">📅 FECHAS</div>
            <div class="recibo-linea">
                <span class="recibo-linea-label">Alquiler:</span>
                <span>${datos.fechaAlquiler || ''}</span>
            </div>
            <div class="recibo-linea">
                <span class="recibo-linea-label">Devolución:</span>
                <span>${datos.fechaDevolucion || ''}</span>
            </div>
        </div>

        <div class="recibo-seccion">
            <div class="recibo-seccion-titulo">🛡️ GARANTÍA</div>
            <div class="recibo-linea">
                <span class="recibo-linea-label">Dinero:</span>
                <span>Bs. ${datos.garantiaDinero || '0'}</span>
            </div>
            ${datos.garantiaObjeto ? `<div class="recibo-linea"><span class="recibo-linea-label">Objeto:</span><span>${datos.garantiaObjeto}</span></div>` : ''}
            ${datos.descripcionGarantia ? `<div class="recibo-linea"><span style="font-size:0.8rem;color:#666;">${datos.descripcionGarantia}</span></div>` : ''}
        </div>

        <div class="recibo-total">
            <div class="recibo-total-label">PRECIO ALQUILER</div>
            <div class="recibo-total-monto">Bs. ${datos.precioAlquiler || '0'}</div>
        </div>

        ${datos.observaciones ? `<div class="recibo-seccion"><div class="recibo-seccion-titulo">📝 OBSERVACIONES</div><div>${datos.observaciones}</div></div>` : ''}

        <div class="recibo-footer">
            <p>La garantía será devuelta al entregar el disfraz en buen estado.</p>
            <p>Recargos por devolución tardía o daños.</p>
            <div class="recibo-gracias">¡Gracias por su preferencia!</div>
            <div class="recibo-numero">Recibo N° ${numRecibo}</div>
        </div>
    `;

    modalRecibo.classList.add('active');
}

function generarNumeroRecibo() {
    const fecha = new Date();
    return 'DF' + fecha.getFullYear() +
           String(fecha.getMonth() + 1).padStart(2, '0') +
           String(fecha.getDate()).padStart(2, '0') + '-' +
           String(fecha.getHours()).padStart(2, '0') +
           String(fecha.getMinutes()).padStart(2, '0') +
           String(fecha.getSeconds()).padStart(2, '0');
}

// ========================================
// BUSCAR CLIENTES (BUSCAR & RESULTADOS)
// ========================================
const btnBuscar = document.getElementById('btn-buscar');
if (btnBuscar) btnBuscar.addEventListener('click', buscarCliente);
const buscarInput = document.getElementById('buscar-input');
if (buscarInput) buscarInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') buscarCliente(); });

async function buscarCliente() {
    const termino = (document.getElementById('buscar-input') || {}).value ? document.getElementById('buscar-input').value.trim() : '';
    const resultados = document.getElementById('resultados-busqueda');

    if (!termino) {
        if (resultados) resultados.innerHTML = '<p class="placeholder-text">Ingresa un nombre o cédula</p>';
        return;
    }

    if (resultados) resultados.innerHTML = '<div class="loading">Buscando...</div>';

    try {
        const response = await enviarAGoogleSheets({ accion: 'buscar', termino: termino });

        if (response && response.success && response.datos && response.datos.length > 0) {
            mostrarResultados(response.datos);
        } else {
            if (resultados) resultados.innerHTML = '<p class="placeholder-text">No se encontraron registros</p>';
        }
    } catch (e) {
        if (resultados) resultados.innerHTML = '<p class="placeholder-text">Error de conexión</p>';
        console.error('buscarCliente error', e);
    }
}

function mostrarResultados(datos) {
    const cont = document.getElementById('resultados-busqueda');
    if (!cont) return;
    let html = '';

    datos.forEach((r) => {
        const esAlquilado = r.estado === 'Alquilado';
        html += `
            <div class="resultado-card ${esAlquilado ? 'alquilado' : 'devuelto'}">
                <div class="resultado-header">
                    <span class="resultado-nombre">👤 ${r.nombre}</span>
                    <span class="resultado-estado ${esAlquilado ? 'estado-alquilado' : 'estado-devuelto'}">
                        ${esAlquilado ? '🔴 Alquilado' : '🟢 Devuelto'}
                    </span>
                </div>
                <div class="resultado-info">
                    <span><strong>CI:</strong> ${r.cedula}</span>
                    <span><strong>Cel:</strong> ${r.celular}</span>
                    <span><strong>Disfraz:</strong> ${r.disfraz}</span>
                    <span><strong>Precio:</strong> Bs. ${r.precioAlquiler || '0'}</span>
                    <span><strong>Alquiler:</strong> ${r.fechaAlquiler}</span>
                    <span><strong>Devolución:</strong> ${r.fechaDevolucion}</span>
                    <span><strong>Garantía $:</strong> Bs. ${r.garantiaDinero || '0'}</span>
                    ${r.garantiaObjeto ? `<span><strong>Garantía Obj:</strong> ${r.garantiaObjeto}</span>` : ''}
                </div>
                <div class="resultado-actions">
                    ${esAlquilado ? `<button class="btn-devolucion" data-reg='${JSON.stringify(r)}'>📦 Registrar Devolución</button>` : ''}
                    <button class="btn-recibo-busqueda" data-reg='${JSON.stringify(r)}'>🖨️ Ver Recibo</button>
                </div>
            </div>
        `;
    });

    cont.innerHTML = html;

    // Delegación de eventos para botones dinámicos
    cont.querySelectorAll('.btn-devolucion').forEach(b => {
        b.addEventListener('click', (ev) => {
            const reg = JSON.parse(ev.currentTarget.getAttribute('data-reg'));
            iniciarDevolucion(reg);
        });
    });
    cont.querySelectorAll('.btn-recibo-busqueda').forEach(b => {
        b.addEventListener('click', (ev) => {
            const reg = JSON.parse(ev.currentTarget.getAttribute('data-reg'));
            mostrarRecibo(reg);
        });
    });
}

// ========================================
// DEVOLUCIÓN
// ========================================
function iniciarDevolucion(registro) {
    registroSeleccionado = registro;
    const info = document.getElementById('info-devolucion');
    if (info) info.innerHTML = `<strong>Cliente:</strong> ${registro.nombre}<br><strong>Disfraz:</strong> ${registro.disfraz}`;

    let garantiaTexto = '';
    if (registro.garantiaDinero && parseFloat(registro.garantiaDinero) > 0) {
        garantiaTexto += `💵 Dinero: Bs. ${registro.garantiaDinero}<br>`;
    }
    if (registro.garantiaObjeto) {
        garantiaTexto += `📦 Objeto: ${registro.garantiaObjeto}`;
        if (registro.descripcionGarantia) garantiaTexto += ` (${registro.descripcionGarantia})`;
    }

    const gd = document.getElementById('garantia-devolver-texto');
    if (gd) gd.innerHTML = garantiaTexto || 'Sin garantía registrada';
    const modalDev = document.getElementById('modal-devolucion');
    if (modalDev) modalDev.style.display = 'block';
}

const btnCancelarDevolucion = document.getElementById('btn-cancelar-devolucion');
if (btnCancelarDevolucion) btnCancelarDevolucion.addEventListener('click', () => {
    const modalDev = document.getElementById('modal-devolucion');
    if (modalDev) modalDev.style.display = 'none';
    registroSeleccionado = null;
});

const btnConfirmarDevolucion = document.getElementById('btn-confirmar-devolucion');
if (btnConfirmarDevolucion) btnConfirmarDevolucion.addEventListener('click', async () => {
    if (!registroSeleccionado) return;

    const btn = btnConfirmarDevolucion;
    btn.disabled = true;
    btn.textContent = '⏳ Procesando...';

    const datos = {
        accion: 'devolucion',
        fila: registroSeleccionado.fila,
        condicionesDevolucion: (document.getElementById('condiciones-devolucion') || {}).value || '',
        notasDevolucion: (document.getElementById('notas-devolucion') || {}).value || '',
        fechaDevolucionReal: new Date().toLocaleString('es-BO')
    };

    try {
        const response = await enviarAGoogleSheets(datos);

        if (response && response.success) {
            alert('✅ Devolución registrada. Recuerda devolver la garantía al cliente.');
            const modalDev = document.getElementById('modal-devolucion');
            if (modalDev) modalDev.style.display = 'none';
            buscarCliente();
        } else {
            alert('❌ Error al registrar: ' + (response && response.error ? response.error : 'Desconocido'));
        }
    } catch (e) {
        alert('❌ Error de conexión');
        console.error('devolucion error', e);
    }

    btn.disabled = false;
    btn.textContent = '✅ Confirmar';
    registroSeleccionado = null;
});

// ========================================
// HISTORIAL
// ========================================
const btnCargarHistorial = document.getElementById('btn-cargar-historial');
if (btnCargarHistorial) btnCargarHistorial.addEventListener('click', cargarHistorial);
const filtroEstado = document.getElementById('filtro-estado');
if (filtroEstado) filtroEstado.addEventListener('change', cargarHistorial);

async function cargarHistorial() {
    const tabla = document.getElementById('tabla-historial');
    if (!tabla) return;
    tabla.innerHTML = '<div class="loading">Cargando...</div>';

    try {
        const response = await enviarAGoogleSheets({ accion: 'historial', filtro: (document.getElementById('filtro-estado') || {}).value || 'todos' });

        if (response && response.success && response.datos && response.datos.length > 0) {
            mostrarHistorial(response.datos);
        } else {
            tabla.innerHTML = '<p class="placeholder-text">No hay registros</p>';
        }
    } catch (e) {
        tabla.innerHTML = '<p class="placeholder-text">Error de conexión</p>';
        console.error('cargarHistorial', e);
    }
}

function mostrarHistorial(datos) {
    const tabla = document.getElementById('tabla-historial');
    if (!tabla) return;

    let html = `
        <table class="tabla-registros">
            <thead>
                <tr>
                    <th>Nombre</th>
                    <th>CI</th>
                    <th>Disfraz</th>
                    <th>Precio</th>
                    <th>Garantía</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
    `;
    datos.forEach(r => {
        const esAlquilado = r.estado === 'Alquilado';
        html += `
            <tr>
                <td>${r.nombre}</td>
                <td>${r.cedula}</td>
                <td>${r.disfraz}</td>
                <td>Bs. ${r.precioAlquiler || '0'}</td>
                <td>Bs. ${r.garantiaDinero || '0'} ${r.garantiaObjeto ? '+ ' + r.garantiaObjeto : ''}</td>
                <td><span class="resultado-estado ${esAlquilado ? 'estado-alquilado' : 'estado-devuelto'}">${esAlquilado ? '🔴' : '🟢'}</span></td>
            </tr>
        `;
    });
    html += '</tbody></table>';
    tabla.innerHTML = html;
}

// ========================================
// CLIENTES HABITUALES (UI)
// ========================================
const btnCargarClientes = document.getElementById('btn-cargar-clientes');
if (btnCargarClientes) btnCargarClientes.addEventListener('click', cargarClientesHabituales);

async function cargarClientesHabituales() {
    const tabla = document.getElementById('tabla-clientes-habituales');
    if (!tabla) return;
    tabla.innerHTML = '<div class="loading">Cargando...</div>';

    try {
        const response = await enviarAGoogleSheets({ accion: 'obtenerClientesHabituales' });

        if (response && response.success && response.datos && response.datos.length > 0) {
            let html = `<table class="tabla-registros"><thead><tr><th>Nombre</th><th>CI</th><th>Celular</th><th>Total Alquileres</th><th>Último Alquiler</th></tr></thead><tbody>`;
            response.datos.forEach(c => {
                html += `<tr><td>⭐ ${c.nombre}</td><td>${c.cedula}</td><td>${c.celular}</td><td><strong>${c.totalAlquileres}</strong></td><td>${c.ultimoAlquiler || '-'}</td></tr>`;
            });
            html += '</tbody></table>';
            tabla.innerHTML = html;
        } else {
            tabla.innerHTML = '<p class="placeholder-text">No hay clientes habituales</p>';
        }
    } catch (e) {
        tabla.innerHTML = '<p class="placeholder-text">Error de conexión</p>';
        console.error('cargarClientesHabituales', e);
    }
}

// ========================================
// COMUNICACIÓN CON GOOGLE SHEETS
// ========================================
async function enviarAGoogleSheets(datos) {
    // Modo demo si no configuras la URL (por seguridad)
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('TU_URL')) {
        console.warn('⚠️ Modo Demo - Configura Google Apps Script');
        return modoDemo(datos);
    }

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json;charset=utf-8' },
            body: JSON.stringify(datos)
        });

        // Intentamos parsear JSON real
        if (!response.ok) {
            const text = await response.text().catch(() => '');
            console.error('HTTP error', response.status, text);
            return { success: false, error: 'HTTP ' + response.status + ' - ' + text };
        }

        const resultado = await response.json().catch(() => null);
        return resultado || { success: false, error: 'Respuesta inválida' };

    } catch (e) {
        console.error('fetch error:', e);
        return { success: false, error: e.toString() };
    }
}

// ========================================
// MODO DEMO (si pruebas localmente sin Apps Script)
// ========================================
let datosDemo = [];
let clientesDemo = [];

function modoDemo(datos) {
    console.log('🎭 Demo:', datos.accion);
    switch (datos.accion) {
        case 'registrar': {
            const nuevo = { ...datos, fila: datosDemo.length + 2 };
            datosDemo.push(nuevo);
            const existeCliente = clientesDemo.find(c => c.cedula === datos.cedula);
            if (existeCliente) {
                existeCliente.totalAlquileres++;
                existeCliente.ultimoAlquiler = datos.fechaAlquiler;
            } else {
                clientesDemo.push({ nombre: datos.nombre, cedula: datos.cedula, celular: datos.celular, totalAlquileres: 1, ultimoAlquiler: datos.fechaAlquiler });
            }
            return { success: true, numeroRecibo: generarNumeroRecibo() };
        }
        case 'buscar': {
            const resultados = datosDemo.filter(r => (r.nombre || '').toLowerCase().includes((datos.termino||'').toLowerCase()) || (r.cedula || '').includes(datos.termino || ''));
            return { success: true, datos: resultados };
        }
        case 'buscarClienteHabitual': {
            const cliente = clientesDemo.find(c => c.cedula === datos.cedula);
            return { success: true, cliente: cliente || null };
        }
        case 'obtenerClientesHabituales': {
            return { success: true, datos: clientesDemo };
        }
        case 'actualizarClienteHabitual': {
            // simple: noop en demo (ya actualizado en registrar)
            return { success: true };
        }
        case 'devolucion': {
            const reg = datosDemo.find(r => r.fila === datos.fila);
            if (reg) {
                reg.estado = 'Devuelto';
                reg.condicionesDevolucion = datos.condicionesDevolucion;
                reg.notasDevolucion = datos.notasDevolucion;
                reg.fechaDevolucionReal = datos.fechaDevolucionReal;
            }
            return { success: true };
        }
        case 'historial': {
            let hist = [...datosDemo];
            if (datos.filtro && datos.filtro !== 'todos') hist = hist.filter(r => r.estado === datos.filtro);
            return { success: true, datos: hist.reverse() };
        }
        default:
            return { success: false, error: 'Acción demo no reconocida' };
    }
}

// ========================================
// UTILIDADES
// ========================================
function mostrarMensaje(el, msg, tipo) {
    if (!el) return;
    el.textContent = msg;
    el.className = 'mensaje-resultado ' + tipo;
    setTimeout(() => { el.className = 'mensaje-resultado'; el.textContent = ''; }, 5000);
}

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    const fechaAlq = document.getElementById('fecha-alquiler');
    if (fechaAlq) fechaAlq.value = new Date().toISOString().split('T')[0];
    console.log('🎭 Disfraces Fantasía - Sistema Cargado');
});
