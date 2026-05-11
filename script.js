// ========================================
// DISFRACES FANTASÍA - SCRIPT OPTIMIZADO
// ========================================

// ========================================
// CONFIGURACIÓN DE GOOGLE SHEETS API
// ========================================
const CLIENT_ID = CONFIG.CLIENT_ID;
const API_KEY = CONFIG.API_KEY;
const SPREADSHEET_ID = CONFIG.GOOGLE_SHEET_ID;
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email';

// Variables de autenticación
let tokenClient;
let gapiInited = false;
let gisInited = false;
let spreadsheetId = SPREADSHEET_ID;
let emailUsuario = '';

// Variables globales
let usuarioLogueado = false;
let registroSeleccionado = null;
let ultimoRegistro = null;
let usuarioGoogle = null;

// ========================================
// UTILIDADES GENERALES
// ========================================

/**
 * Debounce: retrasa la ejecución hasta que pasen ms sin nuevos calls
 */
function debounce(fn, ms = 500) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), ms);
    };
}

/**
 * Wrapper seguro para llamadas a Google API
 */
async function safeGapiCall(fn, errorMsg = 'Error de conexión') {
    try {
        return await fn();
    } catch (error) {
        console.error(errorMsg, error);
        throw new Error(`${errorMsg}: ${error.message}`);
    }
}

/**
 * Muestra mensajes de resultado
 */
function mostrarMensaje(el, msg, tipo) {
    el.textContent = msg;
    el.className = 'mensaje-resultado ' + tipo;
    setTimeout(() => { el.className = 'mensaje-resultado'; el.textContent = ''; }, 5000);
}

/**
 * Genera número de recibo único
 */
function generarNumeroRecibo() {
    const f = new Date();
    return 'DF' + f.getFullYear() + String(f.getMonth()+1).padStart(2,'0') + String(f.getDate()).padStart(2,'0') + '-' + String(f.getHours()).padStart(2,'0') + String(f.getMinutes()).padStart(2,'0') + String(f.getSeconds()).padStart(2,'0');
}

// ========================================
// INICIALIZACIÓN DE GOOGLE API
// ========================================
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    try {
        await gapi.client.init({ apiKey: API_KEY, discoveryDocs: [DISCOVERY_DOC] });
        gapiInited = true;
        console.log('✅ Google API inicializada');
        checkReady();
    } catch (error) {
        console.error('❌ Error inicializando GAPI:', error);
    }
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: handleTokenResponse,
    });
    gisInited = true;
    console.log('✅ Google Identity Services cargado');
    checkReady();
}

function checkReady() {
    if (gapiInited && gisInited) {
        console.log('🎭 Sistema listo para autenticación');
    }
}

function handleTokenResponse(resp) {
    if (resp.error !== undefined) {
        console.error('Error de autenticación:', resp);
        alert('Error al iniciar sesión con Google');
        return;
    }
    usuarioGoogle = true;
    console.log('✅ Autenticado con Google');
    obtenerEmailUsuario();
}

async function obtenerEmailUsuario() {
    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { 'Authorization': 'Bearer ' + gapi.client.getToken().access_token }
        });
        const userInfo = await response.json();
        emailUsuario = userInfo.email;
        console.log('👤 Usuario:', emailUsuario);
        const elUsuario = document.getElementById('usuario-logueado');
        if (elUsuario) elUsuario.textContent = '👤 ' + emailUsuario;
        await verificarHojas();
    } catch (error) {
        console.error('Error obteniendo email:', error);
        emailUsuario = 'desconocido';
        await verificarHojas();
    }
}

// ========================================
// VERIFICAR Y CREAR HOJAS
// ========================================
async function verificarHojas() {
    try {
        const response = await safeGapiCall(() =>
            gapi.client.sheets.spreadsheets.get({ spreadsheetId: spreadsheetId })
        );

        const hojas = response.result.sheets.map(s => s.properties.title);
        console.log('Hojas existentes:', hojas);

        if (!hojas.includes('Alquileres')) await crearHojaAlquileres();
        if (!hojas.includes('ClientesHabituales')) await crearHojaClientes();

        // Mostrar modal de clientes
        const modalLogin = document.getElementById('modal-login');
        const modalClientes = document.getElementById('modal-clientes');
        if (modalLogin) modalLogin.classList.remove('active');
        if (modalClientes) modalClientes.classList.add('active');
        usuarioLogueado = true;

    } catch (error) {
        console.error('Error verificando hojas:', error);
        alert('Error accediendo a la hoja de cálculo: ' + error.message);
    }
}

async function crearHojaAlquileres() {
    await safeGapiCall(() =>
        gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: spreadsheetId,
            resource: { requests: [{ addSheet: { properties: { title: 'Alquileres' } } }] }
        })
    );

    await safeGapiCall(() =>
        gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: 'Alquileres!A1:S1',
            valueInputOption: 'RAW',
            resource: {
                values: [['Nombre', 'Cedula', 'Celular', 'Disfraz', 'PrecioAlquiler', 'FechaAlquiler', 'FechaDevolucion', 'Condiciones', 'GarantiaDinero', 'GarantiaObjeto', 'DescripcionGarantia', 'Observaciones', 'Estado', 'FechaRegistro', 'CondicionesDevolucion', 'NotasDevolucion', 'FechaDevolucionReal', 'NumeroRecibo', 'RegistradoPor']]
            }
        })
    );
    console.log('✅ Hoja Alquileres creada');
}

async function crearHojaClientes() {
    await safeGapiCall(() =>
        gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId: spreadsheetId,
            resource: { requests: [{ addSheet: { properties: { title: 'ClientesHabituales' } } }] }
        })
    );

    await safeGapiCall(() =>
        gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId,
            range: 'ClientesHabituales!A1:E1',
            valueInputOption: 'RAW',
            resource: { values: [['Nombre', 'Cedula', 'Celular', 'TotalAlquileres', 'UltimoAlquiler']] }
        })
    );
    console.log('✅ Hoja ClientesHabituales creada');
}

// ========================================
// SMOOTH SCROLL
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

// ========================================
// ANIMACIÓN AL SCROLL
// ========================================
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.servicio-card, .disfraz-card, .contacto-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s, transform 0.6s';
    observer.observe(card);
});

// ========================================
// SISTEMA DE MODALES
// ========================================
const modalLogin = document.getElementById('modal-login');
const modalClientes = document.getElementById('modal-clientes');
const modalRecibo = document.getElementById('modal-recibo');
const btnClientes = document.getElementById('btn-clientes');

function cerrarTodosModales() {
    [modalLogin, modalClientes, modalRecibo].forEach(m => {
        if (m) m.classList.remove('active');
    });
}

btnClientes.addEventListener('click', (e) => {
    e.preventDefault();
    if (usuarioLogueado && usuarioGoogle) {
        modalClientes.classList.add('active');
    } else {
        modalLogin.classList.add('active');
    }
});

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', cerrarTodosModales);
});

document.getElementById('btn-cerrar-recibo')?.addEventListener('click', () => {
    modalRecibo.classList.remove('active');
});

window.addEventListener('click', (e) => {
    if (e.target === modalLogin || e.target === modalClientes || e.target === modalRecibo) {
        cerrarTodosModales();
    }
});

// ========================================
// LOGIN CON GOOGLE
// ========================================
document.getElementById('btn-google-login').addEventListener('click', () => {
    if (!gapiInited || !gisInited) {
        alert('Espera un momento, las APIs de Google están cargando...');
        return;
    }
    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        tokenClient.requestAccessToken({ prompt: '' });
    }
});

document.getElementById('btn-logout').addEventListener('click', () => {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
    }
    usuarioLogueado = false;
    usuarioGoogle = false;
    modalClientes.classList.remove('active');
});

// ========================================
// SISTEMA DE TABS
// ========================================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const tabId = 'tab-' + btn.dataset.tab;
        document.getElementById(tabId)?.classList.add('active');
    });
});

// ========================================
// AUTOCOMPLETADO CLIENTES HABITUALES
// ========================================
async function buscarClienteHabitual(cedula) {
    try {
        const [resClientes, resAlquileres] = await Promise.all([
            safeGapiCall(() => gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: spreadsheetId, range: 'ClientesHabituales!A:E'
            })),
            safeGapiCall(() => gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: spreadsheetId, range: 'Alquileres!A:M'
            }))
        ]);

        document.getElementById('cedula-loader').style.display = 'none';

        const rowsClientes = resClientes.result.values || [];
        const rowsAlquileres = resAlquileres.result.values || [];

        // Buscar alquileres pendientes
        const alquileresPendientes = rowsAlquileres
            .slice(1)
            .filter(row => row[1]?.toString() === cedula && row[12] === 'Alquilado')
            .map(row => ({ disfraz: row[3], fechaDevolucion: row[6] }));

        // Buscar cliente habitual
        let clienteEncontrado = false;
        for (let i = 1; i < rowsClientes.length; i++) {
            if (rowsClientes[i][1]?.toString() === cedula) {
                document.getElementById('nombre-cliente').value = rowsClientes[i][0] || '';
                document.getElementById('celular').value = rowsClientes[i][2] || '';
                const totalAlquileres = rowsClientes[i][3] || 0;

                const alertEl = document.getElementById('cliente-habitual-alert');
                alertEl.innerHTML = `<span class="alert-icon">⭐</span>
                    <span class="alert-text">Cliente frecuente - <strong class="alert-alquileres">${totalAlquileres} alquileres</strong></span>`;
                alertEl.style.display = 'flex';
                alertEl.className = 'cliente-habitual-alert';
                clienteEncontrado = true;
                break;
            }
        }

        // Alerta de deudas
        const deudasEl = document.getElementById('alerta-deudas');
        if (alquileresPendientes.length > 0) {
            let deudaHTML = '<div class="alerta-deuda"><span class="deuda-icon">⚠️</span>';
            deudaHTML += `<span class="deuda-titulo">¡ATENCIÓN! Cliente con ${alquileresPendientes.length} disfraz(es) sin devolver:</span>`;
            deudaHTML += '<ul class="deuda-lista">';
            alquileresPendientes.forEach(a => {
                deudaHTML += `<li>🎭 <strong>${a.disfraz}</strong> - Devolver: ${a.fechaDevolucion}</li>`;
            });
            deudaHTML += '</ul></div>';
            deudasEl.innerHTML = deudaHTML;
            deudasEl.style.display = 'block';
        } else {
            deudasEl.style.display = 'none';
            deudasEl.innerHTML = '';
        }

        if (!clienteEncontrado && alquileresPendientes.length === 0) {
            document.getElementById('cliente-habitual-alert').style.display = 'none';
        }

    } catch (error) {
        document.getElementById('cedula-loader').style.display = 'none';
        console.error('Error buscando cliente:', error);
    }
}

// Debounced version
const buscarClienteHabitualDebounced = debounce(buscarClienteHabitual, 800);

document.getElementById('cedula').addEventListener('input', function() {
    const cedula = this.value.trim();
    const loader = document.getElementById('cedula-loader');

    if (cedula.length >= 5) {
        loader.style.display = 'inline';
        buscarClienteHabitualDebounced(cedula);
    } else {
        loader.style.display = 'none';
        document.getElementById('cliente-habitual-alert').style.display = 'none';
        document.getElementById('alerta-deudas').style.display = 'none';
    }
});

// ========================================
// REGISTRO DE CLIENTES
// ========================================
const formRegistro = document.getElementById('form-registro');
const mensajeRegistro = document.getElementById('mensaje-registro');
const btnImprimirRecibo = document.getElementById('btn-imprimir-recibo');

formRegistro.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnRegistrar = formRegistro.querySelector('.btn-registrar');
    const btnText = btnRegistrar.querySelector('.btn-text');
    const btnLoading = btnRegistrar.querySelector('.btn-loading');

    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    btnRegistrar.disabled = true;

    const numRecibo = generarNumeroRecibo();
    const fechaRegistro = new Date().toLocaleString('es-BO');

    const datos = {
        nombre: document.getElementById('nombre-cliente').value,
        cedula: document.getElementById('cedula').value,
        celular: document.getElementById('celular').value,
        disfraz: document.getElementById('disfraz').value,
        precioAlquiler: document.getElementById('precio-alquiler').value || '0',
        fechaAlquiler: document.getElementById('fecha-alquiler').value,
        fechaDevolucion: document.getElementById('fecha-devolucion').value,
        condiciones: document.getElementById('condiciones').value,
        garantiaDinero: document.getElementById('garantia-dinero').value || '0',
        garantiaObjeto: document.getElementById('garantia-objeto').value || '',
        descripcionGarantia: document.getElementById('descripcion-garantia').value || '',
        observaciones: document.getElementById('observaciones').value || '',
        estado: 'Alquilado',
        fechaRegistro,
        numeroRecibo: numRecibo
    };

    try {
        await safeGapiCall(() =>
            gapi.client.sheets.spreadsheets.values.append({
                spreadsheetId: spreadsheetId,
                range: 'Alquileres!A:S',
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                resource: {
                    values: [[
                        datos.nombre, datos.cedula, datos.celular, datos.disfraz,
                        datos.precioAlquiler, datos.fechaAlquiler, datos.fechaDevolucion,
                        datos.condiciones, datos.garantiaDinero, datos.garantiaObjeto,
                        datos.descripcionGarantia, datos.observaciones, datos.estado,
                        datos.fechaRegistro, '', '', '', datos.numeroRecibo, emailUsuario
                    ]]
                }
            })
        );

        await actualizarClienteHabitual(datos);
        ultimoRegistro = datos;
        mostrarMensaje(mensajeRegistro, '✅ ¡Registro guardado exitosamente!', 'exito');
        btnImprimirRecibo.style.display = 'inline-block';

    } catch (error) {
        console.error('Error guardando registro:', error);
        mostrarMensaje(mensajeRegistro, '❌ Error: ' + error.message, 'error');
    }

    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
    btnRegistrar.disabled = false;
});

async function actualizarClienteHabitual(datos) {
    try {
        const response = await safeGapiCall(() =>
            gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: spreadsheetId, range: 'ClientesHabituales!A:E'
            })
        );

        const rows = response.result.values || [];
        let filaEncontrada = -1;

        for (let i = 1; i < rows.length; i++) {
            if (rows[i][1]?.toString() === datos.cedula) {
                filaEncontrada = i + 1;
                break;
            }
        }

        const fechaHoy = datos.fechaAlquiler || new Date().toISOString().split('T')[0];

        if (filaEncontrada > 0) {
            const totalActual = parseInt(rows[filaEncontrada - 1][3]) || 0;
            await safeGapiCall(() =>
                gapi.client.sheets.spreadsheets.values.update({
                    spreadsheetId: spreadsheetId,
                    range: `ClientesHabituales!A${filaEncontrada}:E${filaEncontrada}`,
                    valueInputOption: 'RAW',
                    resource: { values: [[datos.nombre, datos.cedula, datos.celular, totalActual + 1, fechaHoy]] }
                })
            );
        } else {
            await safeGapiCall(() =>
                gapi.client.sheets.spreadsheets.values.append({
                    spreadsheetId: spreadsheetId,
                    range: 'ClientesHabituales!A:E',
                    valueInputOption: 'RAW',
                    insertDataOption: 'INSERT_ROWS',
                    resource: { values: [[datos.nombre, datos.cedula, datos.celular, 1, fechaHoy]] }
                })
            );
        }
    } catch (error) {
        console.error('Error actualizando cliente habitual:', error);
    }
}

formRegistro.addEventListener('reset', () => {
    btnImprimirRecibo.style.display = 'none';
    document.getElementById('cliente-habitual-alert').style.display = 'none';
    document.getElementById('alerta-deudas').style.display = 'none';
    mensajeRegistro.className = 'mensaje-resultado';
    setTimeout(() => {
        const fechaInput = document.getElementById('fecha-alquiler');
        if (fechaInput) fechaInput.value = new Date().toISOString().split('T')[0];
    }, 100);
});

// ========================================
// IMPRIMIR RECIBO
// ========================================
btnImprimirRecibo.addEventListener('click', () => mostrarRecibo(ultimoRegistro));
document.getElementById('btn-print-recibo').addEventListener('click', () => window.print());

function mostrarRecibo(datos) {
    if (!datos) return;

    const contenido = document.getElementById('recibo-contenido');
    const fechaHora = new Date();
    const fechaFormateada = fechaHora.toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric' });
    const horaFormateada = fechaHora.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });

    contenido.innerHTML = `
        <div class="recibo-header">
            <div class="recibo-brand">DISFRACES FANTASÍA</div>
            <div class="recibo-sub">Ayacucho, Oruro • 76133121</div>
        </div>
        <div class="recibo-numero">N° ${datos.numeroRecibo}</div>
        <div class="recibo-cliente">
            <div class="cliente-nombre">${datos.nombre}</div>
            <div class="cliente-dato">CI: ${datos.cedula} • Cel: ${datos.celular}</div>
        </div>
        <div class="recibo-disfraz">
            <div class="disfraz-nombre">${datos.disfraz}</div>
            <div class="disfraz-estado">${datos.condiciones}</div>
        </div>
        <div class="recibo-fechas">
            <div class="fecha-item"><div class="fecha-label">Alquiler</div><div class="fecha-valor">${datos.fechaAlquiler}</div></div>
            <div class="fecha-item"><div class="fecha-label">Devolución</div><div class="fecha-valor">${datos.fechaDevolucion}</div></div>
        </div>
        <div class="recibo-garantia">
            <div class="garantia-label">Garantía</div>
            <div class="garantia-valor">Bs. ${datos.garantiaDinero || '0'}${datos.garantiaObjeto ? ' + ' + datos.garantiaObjeto : ''}</div>
        </div>
        <div class="recibo-total">
            <div class="total-label">ALQUILER</div>
            <div class="total-monto">Bs. ${datos.precioAlquiler || '0'}</div>
        </div>
        <div class="recibo-firma">
            <div class="firma-linea"></div>
            <div class="firma-texto">Firma del Cliente</div>
        </div>
        <div class="recibo-condiciones">
            Me comprometo a devolver el disfraz en la fecha acordada y en buen estado. En caso de daño o pérdida, asumo el costo total de reposición. La garantía será devuelta al entregar el disfraz en buenas condiciones.
        </div>
        <div class="recibo-footer">
            <div class="footer-gracias">¡¡GRACIAS POR SU PREFERENCIA!!</div>
            <div class="footer-fecha">${fechaFormateada} • ${horaFormateada}</div>
        </div>
    `;

    modalRecibo.classList.add('active');
}

// ========================================
// BÚSQUEDA DE CLIENTES
// ========================================
document.getElementById('btn-buscar').addEventListener('click', buscarCliente);
document.getElementById('buscar-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') buscarCliente();
});

async function buscarCliente() {
    const termino = document.getElementById('buscar-input').value.trim().toLowerCase();
    const resultados = document.getElementById('resultados-busqueda');

    if (!termino) {
        resultados.innerHTML = '<p class="placeholder-text">Ingresa un nombre o cédula</p>';
        return;
    }

    resultados.innerHTML = '<div class="loading">Buscando...</div>';

    try {
        const response = await safeGapiCall(() =>
            gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: spreadsheetId, range: 'Alquileres!A:R'
            })
        );

        const rows = response.result.values || [];
        const encontrados = [];

        for (let i = 1; i < rows.length; i++) {
            const nombre = (rows[i][0] || '').toLowerCase();
            const cedula = (rows[i][1] || '').toLowerCase();

            if (nombre.includes(termino) || cedula.includes(termino)) {
                encontrados.push({
                    fila: i + 1,
                    nombre: rows[i][0], cedula: rows[i][1], celular: rows[i][2],
                    disfraz: rows[i][3], precioAlquiler: rows[i][4],
                    fechaAlquiler: rows[i][5], fechaDevolucion: rows[i][6],
                    condiciones: rows[i][7], garantiaDinero: rows[i][8],
                    garantiaObjeto: rows[i][9], descripcionGarantia: rows[i][10],
                    observaciones: rows[i][11], estado: rows[i][12],
                    numeroRecibo: rows[i][17]
                });
            }
        }

        if (encontrados.length > 0) {
            mostrarResultados(encontrados);
        } else {
            resultados.innerHTML = '<p class="placeholder-text">No se encontraron registros</p>';
        }

    } catch (error) {
        console.error('Error buscando cliente:', error);
        resultados.innerHTML = '<p class="placeholder-text">Error de conexión</p>';
    }
}

function mostrarResultados(datos) {
    const html = datos.map(r => {
        const esAlquilado = r.estado === 'Alquilado';
        return `
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
                    ${esAlquilado ? `<button class="btn-devolucion" onclick="iniciarDevolucion(${r.fila}, '${r.nombre.replace(/'/g, "\\'")}', '${r.disfraz.replace(/'/g, "\\'")}', '${r.garantiaDinero}', '${(r.garantiaObjeto || '').replace(/'/g, "\\'")}')">📦 Devolución</button>` : ''}
                    <button class="btn-recibo-busqueda" onclick="mostrarRecibo({nombre:'${r.nombre.replace(/'/g, "\\'")}',cedula:'${r.cedula}',celular:'${r.celular}',disfraz:'${r.disfraz.replace(/'/g, "\\'")}',precioAlquiler:'${r.precioAlquiler}',fechaAlquiler:'${r.fechaAlquiler}',fechaDevolucion:'${r.fechaDevolucion}',condiciones:'${r.condiciones}',garantiaDinero:'${r.garantiaDinero}',garantiaObjeto:'${(r.garantiaObjeto || '').replace(/'/g, "\\'")}',descripcionGarantia:'${(r.descripcionGarantia || '').replace(/'/g, "\\'")}',numeroRecibo:'${r.numeroRecibo || ''}'})">🖨️ Recibo</button>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('resultados-busqueda').innerHTML = html;
}

// ========================================
// DEVOLUCIÓN
// ========================================
function iniciarDevolucion(fila, nombre, disfraz, garantiaDinero, garantiaObjeto) {
    registroSeleccionado = { fila, nombre, disfraz, garantiaDinero, garantiaObjeto };

    document.getElementById('info-devolucion').innerHTML =
        `<strong>Cliente:</strong> ${nombre}<br><strong>Disfraz:</strong> ${disfraz}`;

    let garantiaTexto = '';
    if (garantiaDinero && parseFloat(garantiaDinero) > 0) garantiaTexto += `💵 Dinero: Bs. ${garantiaDinero}<br>`;
    if (garantiaObjeto) garantiaTexto += `📦 Objeto: ${garantiaObjeto}`;

    document.getElementById('garantia-devolver-texto').innerHTML = garantiaTexto || 'Sin garantía';
    document.getElementById('modal-devolucion').style.display = 'block';
}

document.getElementById('btn-cancelar-devolucion').addEventListener('click', () => {
    document.getElementById('modal-devolucion').style.display = 'none';
    registroSeleccionado = null;
});

document.getElementById('btn-confirmar-devolucion').addEventListener('click', async () => {
    if (!registroSeleccionado) return;

    const btn = document.getElementById('btn-confirmar-devolucion');
    btn.disabled = true;
    btn.textContent = '⏳ Procesando...';

    try {
        await safeGapiCall(() =>
            gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: spreadsheetId,
                range: `Alquileres!M${registroSeleccionado.fila}`,
                valueInputOption: 'RAW',
                resource: { values: [['Devuelto']] }
            })
        );

        await safeGapiCall(() =>
            gapi.client.sheets.spreadsheets.values.update({
                spreadsheetId: spreadsheetId,
                range: `Alquileres!O${registroSeleccionado.fila}:Q${registroSeleccionado.fila}`,
                valueInputOption: 'RAW',
                resource: { values: [[
                    document.getElementById('condiciones-devolucion').value,
                    document.getElementById('notas-devolucion').value,
                    new Date().toLocaleString('es-BO')
                ]] }
            })
        );

        alert('✅ Devolución registrada.\n\n⚠️ DEVOLVER GARANTÍA:\n💵 Bs. ' +
            (registroSeleccionado.garantiaDinero || '0') + '\n📦 ' +
            (registroSeleccionado.garantiaObjeto || 'Ninguno'));

        document.getElementById('modal-devolucion').style.display = 'none';
        document.getElementById('notas-devolucion').value = '';
        buscarCliente();

    } catch (error) {
        console.error('Error en devolución:', error);
        alert('❌ Error: ' + error.message);
    }

    btn.disabled = false;
    btn.textContent = '✅ Confirmar';
    registroSeleccionado = null;
});

// ========================================
// HISTORIAL
// ========================================
document.getElementById('btn-cargar-historial').addEventListener('click', cargarHistorial);
document.getElementById('filtro-estado').addEventListener('change', cargarHistorial);

async function cargarHistorial() {
    const tabla = document.getElementById('tabla-historial');
    tabla.innerHTML = '<div class="loading">Cargando...</div>';

    const filtro = document.getElementById('filtro-estado').value;

    try {
        const response = await safeGapiCall(() =>
            gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: spreadsheetId, range: 'Alquileres!A:R'
            })
        );

        const rows = response.result.values || [];
        const datos = [];

        for (let i = 1; i < rows.length; i++) {
            const estado = rows[i][12];
            if (filtro === 'todos' || estado === filtro) {
                datos.push({
                    nombre: rows[i][0], cedula: rows[i][1], disfraz: rows[i][3],
                    precioAlquiler: rows[i][4], garantiaDinero: rows[i][8],
                    garantiaObjeto: rows[i][9], estado
                });
            }
        }

        if (datos.length > 0) {
            datos.reverse();
            mostrarHistorial(datos);
        } else {
            tabla.innerHTML = '<p class="placeholder-text">No hay registros</p>';
        }

    } catch (error) {
        console.error('Error cargando historial:', error);
        tabla.innerHTML = '<p class="placeholder-text">Error de conexión</p>';
    }
}

function mostrarHistorial(datos) {
    let html = `<table class="tabla-registros"><thead><tr>
        <th>Nombre</th><th>CI</th><th>Disfraz</th><th>Precio</th><th>Garantía</th><th>Estado</th>
    </tr></thead><tbody>`;

    datos.forEach(r => {
        const estadoClass = r.estado === 'Alquilado' ? 'estado-alquilado' : 'estado-devuelto';
        const estadoIcon = r.estado === 'Alquilado' ? '🔴' : '🟢';
        html += `<tr>
            <td>${r.nombre}</td><td>${r.cedula}</td><td>${r.disfraz}</td>
            <td>Bs. ${r.precioAlquiler || '0'}</td>
            <td>Bs. ${r.garantiaDinero || '0'} ${r.garantiaObjeto ? '+ ' + r.garantiaObjeto : ''}</td>
            <td><span class="resultado-estado ${estadoClass}">${estadoIcon} ${r.estado}</span></td>
        </tr>`;
    });

    html += '</tbody></table>';
    document.getElementById('tabla-historial').innerHTML = html;
}

// ========================================
// CLIENTES HABITUALES
// ========================================
document.getElementById('btn-cargar-clientes').addEventListener('click', cargarClientesHabituales);

async function cargarClientesHabituales() {
    const tabla = document.getElementById('tabla-clientes-habituales');
    tabla.innerHTML = '<div class="loading">Cargando...</div>';

    try {
        const response = await safeGapiCall(() =>
            gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: spreadsheetId, range: 'ClientesHabituales!A:E'
            })
        );

        const rows = response.result.values || [];

        if (rows.length > 1) {
            let html = `<table class="tabla-registros"><thead><tr>
                <th>Nombre</th><th>CI</th><th>Celular</th><th>Alquileres</th><th>Último</th>
            </tr></thead><tbody>`;

            for (let i = 1; i < rows.length; i++) {
                html += `<tr>
                    <td>⭐ ${rows[i][0]}</td><td>${rows[i][1]}</td><td>${rows[i][2]}</td>
                    <td><strong>${rows[i][3] || 0}</strong></td><td>${rows[i][4] || '-'}</td>
                </tr>`;
            }

            html += '</tbody></table>';
            tabla.innerHTML = html;
        } else {
            tabla.innerHTML = '<p class="placeholder-text">No hay clientes habituales</p>';
        }

    } catch (error) {
        console.error('Error cargando clientes:', error);
        tabla.innerHTML = '<p class="placeholder-text">Error de conexión</p>';
    }
}

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    const fechaInput = document.getElementById('fecha-alquiler');
    if (fechaInput) fechaInput.value = new Date().toISOString().split('T')[0];
    console.log('🎭 Disfraces Fantasía - Cargando APIs de Google...');

    // Registrar Service Worker si está disponible
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            console.log('Service Worker no registrado (modo local)');
        });
    }
});
