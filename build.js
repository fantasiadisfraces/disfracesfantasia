#!/usr/bin/env node
// ========================================
// BUILD SCRIPT - Minificación para producción
// Requiere: npm install -g html-minifier-terser cssnano terser
// ========================================

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.join(__dirname, 'dist');
const SRC_DIR = __dirname;

// Crear directorio dist
if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR, { recursive: true });
}

console.log('🔨 Iniciando build de producción...\n');

// Función para ejecutar comandos
function run(cmd, desc) {
    console.log(`⚙️  ${desc}...`);
    try {
        execSync(cmd, { stdio: 'inherit' });
        console.log(`✅ ${desc} completado\n`);
    } catch (err) {
        console.warn(`⚠️  ${desc} falló (continuando):`, err.message);
    }
}

// 1. Copiar assets (imágenes, favicon)
console.log('📦 Copiando assets...');
const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'];
fs.readdirSync(SRC_DIR).forEach(file => {
    const ext = path.extname(file).toLowerCase();
    if (imageExtensions.includes(ext)) {
        fs.copyFileSync(path.join(SRC_DIR, file), path.join(BUILD_DIR, file));
        console.log(`  ✓ ${file}`);
    }
});
console.log('');

// 2. Minificar HTML
run(
    `npx html-minifier-terser index.html -o dist/index.html --collapse-whitespace --remove-comments --minify-css true --minify-js true --remove-optional-tags`,
    'Minificando HTML'
);

// 3. Minificar CSS
run(
    `npx cssno styles.css | npx csso --output dist/styles.css --source-map dist/styles.css.map`,
    'Minificando CSS'
);

// 4. Minificar JS
run(
    `npx terser script.js -o dist/script.js --compress --mangle --source-map "url='script.js.map'"`,
    'Minificando JavaScript'
);

// 5. Copiar config.js y sw.js sin modificar
fs.copyFileSync(path.join(SRC_DIR, 'config.js'), path.join(BUILD_DIR, 'config.js'));
fs.copyFileSync(path.join(SRC_DIR, 'sw.js'), path.join(BUILD_DIR, 'sw.js'));
console.log('📄 Copiando config.js y sw.js');

// 6. Calcular tamaños
console.log('\n📊 Resultados:');
const files = ['index.html', 'styles.css', 'script.js', 'config.js', 'sw.js'];
files.forEach(file => {
    const srcPath = path.join(SRC_DIR, file);
    const distPath = path.join(BUILD_DIR, file);
    if (fs.existsSync(srcPath) && fs.existsSync(distPath)) {
        const srcSize = fs.statSync(srcPath).size;
        const distSize = fs.statSync(distPath).size;
        const reduction = ((1 - distSize / srcSize) * 100).toFixed(1);
        console.log(`  ${file}: ${srcSize} → ${distSize} bytes (${reduction}% reducción)`);
    }
});

console.log('\n✅ Build completado en dist/');
console.log('💡 Desplegar contenido de dist/ a GitHub Pages');
