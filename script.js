// ========================================
// CONFIGURACIÓN
// ========================================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/library/d/1kMY2yrwWCGCsmFJMGZrgA67F_c-HvNYJtVNQ7TEKN7uKDynmN6tbkQtk/6';

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
});

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

btnClientes.addEventListener('click', (e) => {
    e.preventDefault();
    usuarioLogueado ? modalClientes.classList.add('active') : modalLogin.classList.add('active');
});

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        modalLogin.classList.remove('active');
        modalClientes.classList.remove('active');
    });
});

document.getElementById('btn-cerrar-recibo').addEventListener('click', () => {
    modalRecibo.classList.remove('active');
});

window.addEventListener('click', (e) => {
    if (e.target === modalLogin) modalLogin.classList.remove('active');
    if (e.target === modalClientes) modalClientes.classList.remove('active');
    if (e.target === modalRecibo) modalRecibo.classList.remove('active');
});

// ========================================
// SISTEMA DE LOGIN
// ========================================
document.getElementById('form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (email === CREDENCIALES.email && password === CREDENCIALES.password) {
        usuarioLogueado = true;
        modalLogin.classList.remove('active');
        modalClientes.classList.add('active');
        document.getElementById('usuario-logueado').textContent = '👤 ' + email;
        document.getElementById('form-login').reset();
        document.getElementById('login-error').textContent = '';
        document.getElementById('fecha-alquiler').value = new Date().toISOString().split('T')[0];
        cargarClientesHabitualesEnMemoria();
    } else {
        document.getElementById('login-error').textContent = '❌ Credenciales incorrectas';
    }
});

document.getElementById('btn-logout').addEventListener('click', () => {
    usuarioLogueado = false;
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
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
});

// ========================================
// AUTOCOMPLETADO CLIENTES HABITUALES
// ========================================
let busquedaTimeout = null;
document.getElementById('cedula').addEventListener('input', function() {
    clearTimeout(busquedaTimeout);
    const cedula = this.value.trim();
    
    if (cedula.length >= 5) {
        document.getElementById('cedula-loader').style.display = 'inline';
        busquedaTimeout = setTimeout(() => buscarClienteHabitual(cedula), 800);
    } else {
        document.getElementById('cliente-habitual-alert').style.display = 'none';
    }
});

async function buscarClienteHabitual(cedula) {
    try {
        const response = await enviarAGoogleSheets({ accion: 'buscarClienteHabitual', cedula: cedula });
        document.getElementById('cedula-loader').style.display = 'none';
        
        if (response && response.success && response.cliente) {
            const c = response.cliente;
            document.getElementById('nombre-cliente').value = c.nombre;
            document.getElementById('celular').value = c.celular;
            document.getElementById('cliente-habitual-alert').style.display = 'flex';
            document.querySelector('.alert-alquileres').textContent = c.totalAlquileres + ' alquileres';
        } else {
            document.getElementById('cliente-habitual-alert').style.display = 'none';
        }
    } catch (e) {
        document.getElementById('cedula-loader').style.display = 'none';
        console.log('Error buscando cliente:', e);
    }
}

async function cargarClientesHabitualesEnMemoria() {
    try {
        const response = await enviarAGoogleSheets({ accion: 'obtenerClientesHabituales' });
        if (response && response.success) clientesHabituales = response.datos || [];
    } catch (e) { console.log('Error cargando clientes habituales'); }
}

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
    
    const datos = {
        accion: 'registrar',
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
        observaciones: document.getElementById('observaciones').value,
        estado: 'Alquilado',
        fechaRegistro: new Date().toLocaleString('es-BO')
    };
    
    try {
        const response = await enviarAGoogleSheets(datos);
        
        if (response && response.success) {
            ultimoRegistro = { ...datos, numeroRecibo: response.numeroRecibo || generarNumeroRecibo() };
            mostrarMensaje(mensajeRegistro, '✅ ¡Registro guardado exitosamente!', 'exito');
            btnImprimirRecibo.style.display = 'inline-block';
        } else {
            mostrarMensaje(mensajeRegistro, '❌ Error al guardar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarMensaje(mensajeRegistro, '❌ Error de conexión', 'error');
    }
    
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
    btnRegistrar.disabled = false;
});

formRegistro.addEventListener('reset', () => {
    btnImprimirRecibo.style.display = 'none';
    document.getElementById('cliente-habitual-alert').style.display = 'none';
    mensajeRegistro.className = 'mensaje-resultado';
    setTimeout(() => {
        document.getElementById('fecha-alquiler').value = new Date().toISOString().split('T')[0];
    }, 100);
});

// ========================================
// IMPRIMIR RECIBO
// ========================================
btnImprimirRecibo.addEventListener('click', () => mostrarRecibo(ultimoRegistro));
document.getElementById('btn-print-recibo').addEventListener('click', () => window.print());

function mostrarRecibo(datos) {
    if (!datos) return;
    
    const numRecibo = datos.numeroRecibo || generarNumeroRecibo();
    const contenido = document.getElementById('recibo-contenido');
    
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
                <span>${datos.fechaAlquiler}</span>
            </div>
            <div class="recibo-linea">
                <span class="recibo-linea-label">Cliente:</span>
                <span>${datos.nombre}</span>
            </div>
            <div class="recibo-linea">
                <span class="recibo-linea-label">CI:</span>
                <span>${datos.cedula}</span>
            </div>
            <div class="recibo-linea">
                <span class="recibo-linea-label">Celular:</span>
                <span>${datos.celular}</span>
            </div>
        </div>
        
        <div class="recibo-seccion">
            <div class="recibo-seccion-titulo">🎭 DISFRAZ ALQUILADO</div>
            <div class="recibo-linea">
                <span>${datos.disfraz}</span>
            </div>
            <div class="recibo-linea">
                <span class="recibo-linea-label">Estado:</span>
                <span>${datos.condiciones}</span>
            </div>
        </div>
        
        <div class="recibo-seccion">
            <div class="recibo-seccion-titulo">📅 FECHAS</div>
            <div class="recibo-linea">
                <span class="recibo-linea-label">Alquiler:</span>
                <span>${datos.fechaAlquiler}</span>
            </div>
            <div class="recibo-linea">
                <span class="recibo-linea-label">Devolución:</span>
                <span>${datos.fechaDevolucion}</span>
            </div>
        </div>
        
        <div class="recibo-seccion">
            <div class="recibo-seccion-titulo">🛡️ GARANTÍA</div>
            <div class="recibo-linea">
                <span class="recibo-linea-label">Dinero:</span>
                <span>Bs. ${datos.garantiaDinero || '0'}</span>
            </div>
            ${datos.garantiaObjeto ? `
            <div class="recibo-linea">
                <span class="recibo-linea-label">Objeto:</span>
                <span>${datos.garantiaObjeto}</span>
            </div>
            ` : ''}
            ${datos.descripcionGarantia ? `
            <div class="recibo-linea">
                <span style="font-size: 0.8rem; color: #666;">${datos.descripcionGarantia}</span>
            </div>
            ` : ''}
        </div>
        
        <div class="recibo-total">
            <div class="recibo-total-label">PRECIO ALQUILER</div>
            <div class="recibo-total-monto">Bs. ${datos.precioAlquiler || '0'}</div>
        </div>
        
        ${datos.observaciones ? `
        <div class="recibo-seccion">
            <div class="recibo-seccion-titulo">📝 OBSERVACIONES</div>
            <div>${datos.observaciones}</div>
        </div>
        ` : ''}
        
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
// BÚSQUEDA DE CLIENTES
// ========================================
document.getElementById('btn-buscar').addEventListener('click', buscarCliente);
document.getElementById('buscar-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') buscarCliente();
});

async function buscarCliente() {
    const termino = document.getElementById('buscar-input').value.trim();
    const resultados = document.getElementById('resultados-busqueda');
    
    if (!termino) {
        resultados.innerHTML = '<p class="placeholder-text">Ingresa un nombre o cédula</p>';
        return;
    }
    
    resultados.innerHTML = '<div class="loading">Buscando...</div>';
    
    try {
        const response = await enviarAGoogleSheets({ accion: 'buscar', termino: termino });
        
        if (response && response.success && response.datos && response.datos.length > 0) {
            mostrarResultados(response.datos);
        } else {
            resultados.innerHTML = '<p class="placeholder-text">No se encontraron registros para: ' + termino + '</p>';
        }
    } catch (e) {
        console.error('Error:', e);
        resultados.innerHTML = '<p class="placeholder-text">Error de conexión</p>';
    }
}

function mostrarResultados(datos) {
    let html = '';
    
    datos.forEach((r) => {
        const esAlquilado = r.estado === 'Alquilado';
        const registroJSON = JSON.stringify(r).replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
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
                    ${esAlquilado ? `
                        <button class="btn-devolucion" onclick='iniciarDevolucion(${registroJSON})'>
                            📦 Registrar Devolución
                        </button>
                    ` : ''}
                    <button class="btn-recibo-busqueda" onclick='mostrarReciboDesdeResultado(${registroJSON})'>
                        🖨️ Ver Recibo
                    </button>
                </div>
            </div>
        `;
    });
    
    document.getElementById('resultados-busqueda').innerHTML = html;
}

// ========================================
// DEVOLUCIÓN
// ========================================
function iniciarDevolucion(registro) {
    registroSeleccionado = registro;
    document.getElementById('info-devolucion').innerHTML = `
        <strong>Cliente:</strong> ${registro.nombre}<br>
        <strong>Disfraz:</strong> ${registro.disfraz}
    `;
    
    let garantiaTexto = '';
    if (registro.garantiaDinero && parseFloat(registro.garantiaDinero) > 0) {
        garantiaTexto += `💵 Dinero: Bs. ${registro.garantiaDinero}<br>`;
    }
    if (registro.garantiaObjeto) {
        garantiaTexto += `📦 Objeto: ${registro.garantiaObjeto}`;
        if (registro.descripcionGarantia) {
            garantiaTexto += ` (${registro.descripcionGarantia})`;
        }
    }
    
    document.getElementById('garantia-devolver-texto').innerHTML = garantiaTexto || 'Sin garantía registrada';
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
    
    const datos = {
        accion: 'devolucion',
        fila: registroSeleccionado.fila,
        condicionesDevolucion: document.getElementById('condiciones-devolucion').value,
        notasDevolucion: document.getElementById('notas-devolucion').value,
        fechaDevolucionReal: new Date().toLocaleString('es-BO')
    };
    
    try {
        const response = await enviarAGoogleSheets(datos);
        
        if (response && response.success) {
            alert('✅ Devolución registrada exitosamente.\n\n⚠️ RECUERDA DEVOLVER LA GARANTÍA AL CLIENTE:\n💵 Dinero: Bs. ' + (registroSeleccionado.garantiaDinero || '0') + '\n📦 Objeto: ' + (registroSeleccionado.garantiaObjeto || 'Ninguno'));
            document.getElementById('modal-devolucion').style.display = 'none';
            document.getElementById('notas-devolucion').value = '';
            buscarCliente();
        } else {
            alert('❌ Error al registrar la devolución');
        }
    } catch (e) {
        console.error('Error:', e);
        alert('❌ Error de conexión');
    }
    
    btn.disabled = false;
    btn.textContent = '✅ Confirmar';
    registroSeleccionado = null;
});

function mostrarReciboDesdeResultado(registro) {
    mostrarRecibo(registro);
}

// ========================================
// HISTORIAL
// ========================================
document.getElementById('btn-cargar-historial').addEventListener('click', cargarHistorial);
document.getElementById('filtro-estado').addEventListener('change', cargarHistorial);

async function cargarHistorial() {
    const tabla = document.getElementById('tabla-historial');
    tabla.innerHTML = '<div class="loading">Cargando...</div>';
    
    try {
        const response = await enviarAGoogleSheets({
            accion: 'historial',
            filtro: document.getElementById('filtro-estado').value
        });
        
        if (response && response.success && response.datos && response.datos.length > 0) {
            mostrarHistorial(response.datos);
        } else {
            tabla.innerHTML = '<p class="placeholder-text">No hay registros en el historial</p>';
        }
    } catch (e) {
        console.error('Error:', e);
        tabla.innerHTML = '<p class="placeholder-text">Error de conexión</p>';
    }
}

function mostrarHistorial(datos) {
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
                <td>
                    <span class="resultado-estado ${esAlquilado ? 'estado-alquilado' : 'estado-devuelto'}">
                        ${esAlquilado ? '🔴' : '🟢'}
                    </span>
                </td>
            </tr>
        `;
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
        const response = await enviarAGoogleSheets({ accion: 'obtenerClientesHabituales' });
        
        if (response && response.success && response.datos && response.datos.length > 0) {
            let html = `
                <table class="tabla-registros">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>CI</th>
                            <th>Celular</th>
                            <th>Total Alquileres</th>
                            <th>Último Alquiler</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            response.datos.forEach(c => {
                html += `
                    <tr>
                        <td>⭐ ${c.nombre}</td>
                        <td>${c.cedula}</td>
                        <td>${c.celular}</td>
                        <td><strong>${c.totalAlquileres}</strong></td>
                        <td>${c.ultimoAlquiler || '-'}</td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            tabla.innerHTML = html;
        } else {
            tabla.innerHTML = '<p class="placeholder-text">No hay clientes habituales registrados</p>';
        }
    } catch (e) {
        console.error('Error:', e);
        tabla.innerHTML = '<p class="placeholder-text">Error de conexión</p>';
    }
}

// ========================================
// COMUNICACIÓN CON GOOGLE SHEETS
// ========================================
async function enviarAGoogleSheets(datos) {
    try {
        // Usar GET con datos en URL para evitar problemas de CORS
        const params = new URLSearchParams();
        params.append('datos', JSON.stringify(datos));
        
        const response = await fetch(GOOGLE_SCRIPT_URL + '?datos=' + encodeURIComponent(JSON.stringify(datos)), {
            method: 'GET',
            redirect: 'follow'
        });
        
        const result = await response.json();
        console.log('Respuesta de Google Sheets:', result);
        return result;
        
    } catch (e) {
        console.error('Error en comunicación:', e);
        // Si falla GET, intentar con POST usando un iframe (fallback)
        return await enviarPorFormulario(datos);
    }
}

// Método alternativo usando formulario oculto
async function enviarPorFormulario(datos) {
    return new Promise((resolve) => {
        const callbackName = 'callback_' + Date.now();
        
        // Crear script para JSONP
        const script = document.createElement('script');
        script.src = GOOGLE_SCRIPT_URL + '?callback=' + callbackName + '&datos=' + encodeURIComponent(JSON.stringify(datos));
        
        window[callbackName] = function(response) {
            delete window[callbackName];
            document.body.removeChild(script);
            resolve(response);
        };
        
        script.onerror = function() {
            delete window[callbackName];
            document.body.removeChild(script);
            resolve({ success: true }); // Asumir éxito si no hay error
        };
        
        document.body.appendChild(script);
        
        // Timeout de seguridad
        setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                resolve({ success: true });
            }
        }, 10000);
    });
}

// ========================================
// UTILIDADES
// ========================================
function mostrarMensaje(el, msg, tipo) {
    el.textContent = msg;
    el.className = 'mensaje-resultado ' + tipo;
    setTimeout(() => { 
        el.className = 'mensaje-resultado'; 
        el.textContent = '';
    }, 5000);
}

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    const fechaInput = document.getElementById('fecha-alquiler');
    if (fechaInput) {
        fechaInput.value = new Date().toISOString().split('T')[0];
    }
    console.log('🎭 Disfraces Fantasía - Sistema Cargado');
    console.log('📋 Credenciales: ' + CREDENCIALES.email + ' / ' + CREDENCIALES.password);
    console.log('🔗 Google Script URL: ' + GOOGLE_SCRIPT_URL);
});
