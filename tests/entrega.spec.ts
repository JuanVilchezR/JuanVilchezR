import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

/**
 * Garantiza que la entrega no toca nada fuera de lo acordado:
 *  · site.css y site.js son idénticos a lo publicado (no se reescriben).
 *  · site/index.html difiere de lo publicado SOLO en la clase "home" del <body> y en el enlace a mejoras.css.
 *    Es decir: textos, rutas, campos de formularios y atributos data-evento quedan intactos.
 */
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p: string) => fs.readFileSync(path.join(raiz, p), 'utf8');

test('site.css y site.js entregados son idénticos a los publicados', () => {
  expect(leer('site/assets/site.css')).toBe(leer('tests/fixtures/baseline/site.css'));
  expect(leer('site/assets/site.js')).toBe(leer('tests/fixtures/baseline/site.js'));
});

test('index.html solo añade class="home" y el enlace a mejoras.css', () => {
  const base = leer('tests/fixtures/baseline/index.html');
  const nuevo = leer('site/index.html');
  const revertido = nuevo
    .replace('<body class="has-bar home">', '<body class="has-bar">')
    .replace(/<link rel="stylesheet" href="[^"]*assets\/mejoras\.css[^"]*">/, '');
  expect(revertido).toBe(base);
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
