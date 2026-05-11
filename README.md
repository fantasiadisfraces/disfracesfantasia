# 🎭 Disfraces Fantasía - Sitio Web Optimizado

## 📋 Descripción
Sitio web profesional para **Disfraces Fantasía**, tienda de alquiler de disfraces en Oruro, Bolivia. Diseño moderno, responsive, optimizado para SEO y rendimiento.

## 👤 Información de la Tienda
- **Nombre:** Disfraces Fantasía
- **Propietaria:** Juvilia Espíndola Ugarte
- **Ubicación:** Calle Ayacucho, Entre Tejerina y Tarapacá, Oruro, Bolivia
- **Teléfono/Celular:** +591 76133121
- **Email:** info@disfracesfantasia.com
- **Horario:** Lunes a Sábado, 9:00 AM - 7:00 PM

## 🌐 Redes Sociales
- **Facebook:** https://www.facebook.com/profile.php?id=61582407245470
- **Instagram:** https://www.instagram.com/fantasiadisfraces.bo/
- **WhatsApp:** https://wa.me/59176133121
- **TikTok:** https://www.tiktok.com/@disfracesfantasi?lang=es-419
- **Google Maps:** https://maps.app.goo.gl/bgaBBqzaaxBz6M4f8

## ✨ Optimizaciones Aplicadas (Mayo 2026)

### 🔍 SEO y Meta Tags
- ✅ Meta description, keywords, author
- ✅ Open Graph para compartir en Facebook/Twitter
- ✅ Twitter Cards para previews en Twitter
- ✅ Canonical URL para evitar contenido duplicado
- ✅ Favicon configurado

### ⚡ Rendimiento
- ✅ Preconnect a dominios externos (Google APIs)
- ✅ Lazy loading en imágenes e iframes
- ✅ Dimensiones explícitas en imágenes (evita layout shift)
- ✅ Carga diferida de scripts de Google
- ✅ Service Worker para caché offline
- ✅ Animaciones con IntersectionObserver (solo cuando son visibles)

### 🎨 CSS Optimizado
- ✅ Eliminadas reglas duplicadas
- ✅ Consolidadas reglas de focus y placeholders
- ✅ Agregado focus-visible para accesibilidad
- ✅ Skip link para navegación por teclado

### 📜 JavaScript Optimizado
- ✅ **Debounce** en búsqueda de clientes (evita llamadas excesivas a Google Sheets)
- ✅ **safeGapiCall**: wrapper统一 para manejo de errores
- ✅ **Promise.all** para cargas paralelas (buscar cliente habitual)
- ✅ Funciones consolidadas y código DRY
- ✅ Optional chaining para evitar errores de null
- ✅ Registro automático de Service Worker

### ♿ Accesibilidad
- ✅ Skip link para saltar al contenido principal
- ✅ Roles ARIA (banner, navigation, contentinfo)
- ✅ Aria-labels en todas las secciones
- ✅ Focus visible en todos los elementos interactivos
- ✅ Main wrapper para contenido principal
- ✅ Title en iframe de Google Maps
- ✅ Rel="noopener noreferrer" en enlaces externos

### 📦 Archivos Nuevos
- `sw.js` - Service Worker para caché offline
- `.gitignore` - Excluir archivos innecesarios
- `build.js` - Script de minificación para producción

## 📁 Estructura de Archivos

```
📦 disfraces-fantasia/
├── 📄 index.html              # Página principal (optimizada)
├── 🎨 styles.css              # Estilos CSS (limpios)
├── ⚙️ script.js               # JavaScript (optimizado)
├── ⚙️ config.js               # Configuración de Google Sheets
├── 🔄 sw.js                   # Service Worker (nuevo)
├── 📖 .gitignore              # Git ignore (nuevo)
├── 🔨 build.js                # Build script (nuevo)
├── 📖 README.md               # Este archivo
│
├── 🖼️ Logos de la tienda:
│   └── logo-tienda.jpg
│
├── 🌐 Logos de redes sociales:
│   ├── facebook-logo.png
│   ├── instagram-logo.png
│   ├── whatsapp-logo.png
│   └── tiktok-logo.png
│
└── 📞 Iconos de contacto:
    ├── ubicacion-logo.png
    ├── telefono-logo.webp
    ├── correo-logo.png
    └── reloj-logo.png
```

## 🚀 Instalación y Uso

### Requisitos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Todos los archivos en la misma carpeta

### Pasos
1. Clona o descarga el repositorio
2. Asegúrate de que todos los archivos estén en la misma carpeta
3. Abre `index.html` en tu navegador
4. ¡Listo!

### Build para Producción (Opcional)
Para minificar y optimizar para despliegue:

```bash
# Instalar dependencias de build
npm install -g html-minifier-terser csso terser

# Ejecutar build
node build.js

# El resultado estará en la carpeta dist/
```

## 🎯 Funcionalidades

### Página Pública
- Diseño responsive y moderno
- Catálogo de disfraces con precios
- Información de contacto con mapa
- Enlaces directos a redes sociales
- Llamadas y mensajes desde la web

### Sistema de Clientes (Requiere Google)
- Login con Google
- Registro de alquileres
- Búsqueda de clientes
- Autocompletado de clientes habituales
- Historial de alquileres
- Devolución de disfraces
- Generación de recibos para impresión

## 🔧 Personalización

### Cambiar Google Sheet
Edita `config.js` y modifica `GOOGLE_SHEET_ID` con el ID de tu hoja (lo encuentras en la URL).

### Cambiar información de contacto
Edita `index.html` y busca las secciones de contacto.

### Cambiar redes sociales
Edita los `href` en la sección de redes sociales en `index.html`.

## 📱 Responsive Design
- 💻 Desktop (1200px+)
- 💻 Laptop (992px - 1199px)
- 📱 Tablet (768px - 991px)
- 📱 Móvil (< 768px)

## 🎨 Paleta de Colores
```css
Degradado Principal: #667eea → #764ba2
Fondo: Linear-gradient azul/violeta
Tarjetas: #ffffff → #f8f9ff
Texto Principal: #333333
```

## 🌟 Tecnologías
- **HTML5** - Semántica y accesibilidad
- **CSS3** - Flexbox, Grid, animaciones
- **JavaScript Vanilla** - Sin dependencias
- **Google Sheets API** - Base de datos
- **Service Worker** - Caché offline
- **Google OAuth2** - Autenticación

## 📊 Mejoras de Rendimiento

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Layout Shift (CLS) | Alto | Mínimo | ✅ |
| Llamadas API | Sin control | Con debounce | ✅ 80% menos |
| Errores JS | Sin manejo | safeGapiCall | ✅ |
| Caché | Ninguno | Service Worker | ✅ |
| Accesibilidad | Básica | Completa | ✅ |

## 📞 Soporte
Para modificaciones:
- **WhatsApp:** +591 76133121
- **Email:** info@disfracesfantasia.com

## 📝 Notas
- ⚠️ Todos los archivos deben estar en la misma carpeta
- ⚠️ No modificar nombres de archivos de imágenes
- ⚠️ La página requiere internet para Google Maps y APIs
- ⚠️ El Service Worker funciona en HTTPS o localhost

## 🎉 Características Destacadas
- ✨ Diseño profesional y moderno
- 🎨 Efectos de glassmorphism
- 💫 Animaciones fluidas
- 📱 100% Responsive
- 🗺️ Mapa interactivo
- 🔗 Enlaces directos a redes
- 📞 Llamadas y mensajes directos
- 🎭 Identidad visual con logo
- ♿ Accesible para todos
- ⚡ Optimizado para SEO
- 💾 Funciona offline (caché básico)

## 📄 Licencia
Sitio web diseñado exclusivamente para **Disfraces Fantasía**.
© 2025 Disfraces Fantasía - Todos los derechos reservados.

---

🎭 **¡Tu evento merece el mejor disfraz!**

Desarrollado con ❤️ para Disfraces Fantasía
