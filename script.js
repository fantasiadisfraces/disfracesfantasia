// ========================================
// COMUNICACIÓN CON GOOGLE SHEETS (CLIENTE) - VERSIÓN ROBUSTA
// ========================================

/**
 * Intento 1: POST con fetch (mode: 'cors') para poder leer respuesta JSON.
 * Si falla por CORS o por cualquier otra razón, hacemos fallback a JSONP.
 */
async function enviarAGoogleSheets(datos) {
    // 1) Intentar POST CORS normal (permite leer respuesta)
    try {
        const resp = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors', // preferible si tu Web App está desplegado "Anyone"
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        // Intentamos parsear JSON (si la respuesta no es JSON o está bloqueada, lanzará)
        const texto = await resp.text();
        try {
            const json = texto ? JSON.parse(texto) : { success: true };
            console.log('Respuesta (POST):', json);
            return json;
        } catch (err) {
            // Si no pudimos parsear, intentar fallback JSONP
            console.warn('POST recibido pero no JSON parseable, fallback a JSONP', err);
            return await enviarPorFormulario(datos);
        }
    } catch (err) {
        console.warn('POST falló (posible CORS). Fallback a JSONP.', err);
        // 2) Fallback JSONP
        return await enviarPorFormulario(datos);
    }
}

/**
 * JSONP fallback: inyecta <script> con callback. Resuelve con la respuesta real o rechaza.
 */
function enviarPorFormulario(datos, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
        const callbackName = 'cb_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
        const script = document.createElement('script');

        // Construir URL con callback y datos
        const url = GOOGLE_SCRIPT_URL +
                    '?callback=' + callbackName +
                    '&datos=' + encodeURIComponent(JSON.stringify(datos));

        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            cleanup();
            reject(new Error('Timeout JSONP'));
        }, timeoutMs);

        window[callbackName] = function(response) {
            if (timedOut) return;
            clearTimeout(timer);
            cleanup();
            resolve(response);
        };

        script.onerror = function(err) {
            if (timedOut) return;
            clearTimeout(timer);
            cleanup();
            reject(new Error('Error loading JSONP script'));
        };

        function cleanup() {
            try { delete window[callbackName]; } catch(e) {}
            if (script.parentNode) script.parentNode.removeChild(script);
        }

        script.src = url;
        script.async = true;
        document.body.appendChild(script);
    });
}
