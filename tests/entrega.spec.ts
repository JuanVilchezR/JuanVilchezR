import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { MODO_REAL } from './support/site.mjs';

test.skip(MODO_REAL, 'solo aplica a la copia de prueba; en modo real los cambios van en el repositorio del sitio');

/**
 * Garantiza que la entrega no toca nada fuera de lo acordado:
 *  · site.css y site.js son idénticos a lo publicado (no se reescriben).
 *  · site/index.html difiere de lo publicado SOLO en la clase "home" del <body>, el enlace a mejoras.css
 *    y el script (opcional) mejoras.js. Es decir: textos, rutas, campos de formularios y atributos
 *    data-evento quedan intactos.
 */
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p: string) => fs.readFileSync(path.join(raiz, p), 'utf8');

test('site.css y site.js entregados son idénticos a los publicados', () => {
  expect(leer('site/assets/site.css')).toBe(leer('tests/fixtures/baseline/site.css'));
  expect(leer('site/assets/site.js')).toBe(leer('tests/fixtures/baseline/site.js'));
});

test('index.html solo añade class="home", el enlace a mejoras.css y el script mejoras.js', () => {
  const base = leer('tests/fixtures/baseline/index.html');
  const nuevo = leer('site/index.html');
  const revertido = nuevo
    .replace('<body class="has-bar home">', '<body class="has-bar">')
    .replace(/<link rel="stylesheet" href="[^"]*assets\/mejoras\.css[^"]*">/, '')
    .replace(/<script src="[^"]*assets\/mejoras\.js[^"]*" defer><\/script>/, '');
  expect(revertido).toBe(base);
});

test('mejoras.js no usa red, cookies ni eval, no lleva raya larga y solo toca el carrusel', () => {
  const js = leer('site/assets/mejoras.js');
  expect(js).not.toMatch(/https?:\/\//);
  expect(js).not.toMatch(/fetch\(|XMLHttpRequest|sendBeacon|document\.cookie|localStorage|eval\(|new Function/);
  expect(js).not.toMatch(/—/);
  expect(js).toMatch(/getElementById\('slider'\)/);
});

test('mejoras.css no usa !important ni raya larga y no pide recursos externos', () => {
  const css = leer('site/assets/mejoras.css');
  expect(css).not.toMatch(/!important/);
  expect(css).not.toMatch(/—/);
  expect(css).not.toMatch(/url\((?!["']?data:)/); // solo data: URI embebidos
  expect(css).not.toMatch(/@import/);
});

test('mejoras.css solo anima transform, opacity, translate, sombra y tamaño de bloque (sin transition: all)', () => {
  const css = leer('site/assets/mejoras.css');
  expect(css).not.toMatch(/transition:\s*all/);
  expect(css).not.toMatch(/animation-timeline:\s*(?!view\(|scroll\()/);
});
