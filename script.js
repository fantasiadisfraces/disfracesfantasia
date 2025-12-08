// ========================================
// CONFIGURACIÓN - ¡IMPORTANTE!
// ========================================
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyFJW31hlszZrF09LTN9M9c763ftsa5fLLP-_NUnFk66lZ_oySGurza1u94Z00awr7N/exec";

const CREDENCIALES = {
    email: "admin@disfracesfantasia.com",
    password: "fantasia2025"
};

// ========================================
// VARIABLES GLOBALES
// ========================================
let usuarioLogueado = false;
let registroSeleccionado = null;
let ultimoRegistro = null;
let clientesHabituales = [];

// ========================================
// ENVIAR DATOS A GOOGLE SHEETS (CORREGIDO)
// ========================================
async function enviarAGoogleSheets(datos) {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("Respuesta no JSON:", text);
            return { success: false, error: "Respuesta no válida del servidor" };
        }

    } catch (e) {
        console.error("fetch error:", e);
        return { success: false, error: "fail to fetch" };
    }
}

// ========================================
// SMOOTH SCROLL
// ========================================
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", e => {
        const href = a.getAttribute("href");
        if (href !== "#") {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) target.scrollIntoView({ behavior: "smooth" });
        }
    });
});

// ========================================
// LOGIN
// ========================================
document.getElementById("form-login").addEventListener("submit", e => {
    e.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    if (email === CREDENCIALES.email && password === CREDENCIALES.password) {
        usuarioLogueado = true;
        modalLogin.classList.remove("active");
        modalClientes.classList.add("active");
        document.getElementById("usuario-logueado").textContent = "👤 " + email;
    } else {
        document.getElementById("login-error").textContent = "❌ Credenciales incorrectas";
    }
});

// ========================================
// REGISTRO DE ALQUILER
// ========================================
document.getElementById("form-registro").addEventListener("submit", async e => {
    e.preventDefault();

    const datos = {
        accion: "registrar",
        nombre: document.getElementById("nombre-cliente").value,
        cedula: document.getElementById("cedula").value,
        celular: document.getElementById("celular").value,
        disfraz: document.getElementById("disfraz").value,
        precioAlquiler: document.getElementById("precio-alquiler").value,
        fechaAlquiler: document.getElementById("fecha-alquiler").value,
        fechaDevolucion: document.getElementById("fecha-devolucion").value,
        condiciones: document.getElementById("condiciones").value,
        garantiaDinero: document.getElementById("garantia-dinero").value,
        garantiaObjeto: document.getElementById("garantia-objeto").value,
        descripcionGarantia: document.getElementById("descripcion-garantia").value,
        observaciones: document.getElementById("observaciones").value
    };

    const r = await enviarAGoogleSheets(datos);

    if (r.success) {
        alert("✅ Registrado correctamente");
    } else {
        alert("❌ Error: " + r.error);
    }
});

// ========================================
// BUSCAR CLIENTE
// ========================================
document.getElementById("btn-buscar").addEventListener("click", buscarCliente);

async function buscarCliente() {
    const termino = document.getElementById("buscar-input").value.trim();

    if (!termino) {
        alert("Ingresa CI o nombre");
        return;
    }

    const r = await enviarAGoogleSheets({
        accion: "buscar",
        termino
    });

    if (!r.success || !r.datos.length) {
        document.getElementById("resultados-busqueda").innerHTML =
            "<p>No se encontraron registros</p>";
        return;
    }

    mostrarResultados(r.datos);
}

function mostrarResultados(datos) {
    let html = "";
    datos.forEach(r => {
        html += `
        <div class="resultado-card">
            <strong>${r.nombre}</strong> - ${r.disfraz}<br>
            CI: ${r.cedula}<br>
            Estado: ${r.estado}<br>
            <button onclick='mostrarReciboDesdeResultado(${JSON.stringify(r)})'>
                🖨️ Ver Recibo
            </button>
        </div>`;
    });
    document.getElementById("resultados-busqueda").innerHTML = html;
}

// ========================================
// DEVOLUCIÓN
// ========================================
function iniciarDevolucion(registro) {
    registroSeleccionado = registro;
    document.getElementById("modal-devolucion").style.display = "block";
}

document.getElementById("btn-confirmar-devolucion").addEventListener("click", async () => {
    if (!registroSeleccionado) return;

    const r = await enviarAGoogleSheets({
        accion: "devolucion",
        fila: registroSeleccionado.fila,
        condicionesDevolucion: document.getElementById("condiciones-devolucion").value,
        notasDevolucion: document.getElementById("notas-devolucion").value,
        fechaDevolucionReal: new Date().toLocaleString("es-BO")
    });

    if (r.success) {
        alert("Devolución registrada");
        document.getElementById("modal-devolucion").style.display = "none";
    } else {
        alert("Error al registrar devolución");
    }
});

// ========================================
// RECIBO
// ========================================
function mostrarReciboDesdeResultado(r) {
    mostrarRecibo(r);
}

function mostrarRecibo(datos) {
    document.getElementById("recibo-contenido").innerHTML = `
        <h2>Disfraces Fantasía</h2>
        <p><strong>Cliente:</strong> ${datos.nombre}</p>
        <p><strong>CI:</strong> ${datos.cedula}</p>
        <p><strong>Disfraz:</strong> ${datos.disfraz}</p>
        <p><strong>Precio:</strong> Bs ${datos.precioAlquiler}</p>
        <p><strong>Garantía:</strong> Bs ${datos.garantiaDinero}</p>
        <p><strong>Fecha Alquiler:</strong> ${datos.fechaAlquiler}</p>
        <p><strong>Fecha Devolución:</strong> ${datos.fechaDevolucion}</p>
    `;
    document.getElementById("modal-recibo").classList.add("active");
}
