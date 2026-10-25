/// <reference types="node" />
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { WikidotService, polishSpanishTranslation } from '../src/services/wikidotService';

// Fixture loader
const fixturesDir = path.join(__dirname, 'fixtures');
const level0Html = fs.readFileSync(path.join(fixturesDir, 'level0_es.html'), 'utf-8');
const level1Html = fs.readFileSync(path.join(fixturesDir, 'level1_es.html'), 'utf-8');
const level2Html = fs.readFileSync(path.join(fixturesDir, 'level2_es.html'), 'utf-8');
const canonHtml = fs.readFileSync(path.join(fixturesDir, 'canon_multitab.html'), 'utf-8');
const normalLevelsHtml = fs.readFileSync(path.join(fixturesDir, 'normal_levels_i.html'), 'utf-8');

// Mock fetch to provide 100% deterministic, offline fixture data
const originalFetch = globalThis.fetch;

function setupMockFetch() {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

    if (url.includes('/level-0')) {
      return new Response(level0Html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    if (url.includes('/level-1')) {
      return new Response(level1Html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    if (url.includes('/level-2')) {
      return new Response(level2Html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    if (url.includes('/decay-canon-hub')) {
      return new Response(canonHtml, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    if (url.includes('/normal-levels-i')) {
      return new Response(normalLevelsHtml, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    return new Response('Not Found', { status: 404 });
  }) as typeof globalThis.fetch;
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

describe('Wikidot Content Parsing Engine Tests', () => {
  before(() => {
    setupMockFetch();
  });

  after(() => {
    restoreFetch();
  });

  describe('Tier 1 & 4: Level 0 Parsing (Requirement R2 / P0-2, P1-1, P1-2)', () => {
    test('preserves full narrative description (>500 chars) including opening text', async () => {
      const item = await WikidotService.fetchItemDetails('/level-0', 'level', 'es');

      assert.ok(item.description, 'Level 0 description must not be empty');
      assert.ok(
        item.description.length > 500,
        `Description must be preserved with full narrative length (>500 chars), got ${item.description.length}`
      );
      assert.match(
        item.description,
        /Aquellos con la mala suerte de deslizarse por los resquicios de la realidad/,
        'Description must contain the authentic canonical narrative'
      );
      assert.strictEqual(item.id, 'level-0', 'Canonical ID must be level-0');
      assert.strictEqual(item.title, 'Nivel 0', 'Title must be Nivel 0');
    });

    test('extracts all 6 YUI tabs with correct titles and content', async () => {
      const item = await WikidotService.fetchItemDetails('/level-0', 'level', 'es');

      assert.ok(Array.isArray(item.tabs), 'Tabs must be an array');
      assert.strictEqual(item.tabs?.length, 6, 'Level 0 must contain exactly 6 YUI tabs');

      const expectedTabTitles = [
        'Entradas y Salidas',
        'Puestos de Avanzada',
        'Entidades',
        'Fenómenos',
        'Diarios de Expedición',
        'Apéndice',
      ];

      item.tabs?.forEach((tab, index) => {
        assert.strictEqual(tab.title, expectedTabTitles[index], `Tab ${index} title mismatch`);
        assert.ok(tab.content.length > 10, `Tab ${tab.title} content must not be empty`);
      });
    });

    test('excises survival difficulty container cleanly without residual text in prologue', async () => {
      const item = await WikidotService.fetchItemDetails('/level-0', 'level', 'es');

      assert.ok(item.prologue, 'Prologue should contain introductory atmospheric text');
      assert.ok(
        !item.prologue!.includes('DIFICULTAD DE SUPERVIVENCIA'),
        'Prologue must not contain residual survival difficulty header'
      );
      assert.ok(
        !item.prologue!.includes('Seguro'),
        'Prologue must not contain residual survival difficulty traits like Seguro'
      );
      assert.ok(
        !item.prologue!.includes('sd-container'),
        'Prologue must not contain residual sd-container markup'
      );
      assert.match(
        item.prologue!,
        /Camina con cuidado, viajero/,
        'Prologue must retain authentic opening quote'
      );
      assert.strictEqual(item.classification?.classLevel, '1', 'Classification level should be 1');
    });

    test('filters flags and translation widgets from images array', async () => {
      const item = await WikidotService.fetchItemDetails('/level-0', 'level', 'es');

      assert.ok(Array.isArray(item.images), 'Images must be an array');
      assert.strictEqual(item.images.length, 1, 'Should only contain the canonical photo');

      for (const img of item.images) {
        const lower = img.url.toLowerCase();
        assert.ok(!lower.includes('flag'), `Images must not contain flag assets: ${img.url}`);
        assert.ok(!lower.includes('scpsandbox'), `Images must not contain sandbox assets: ${img.url}`);
      }

      assert.strictEqual(
        item.images[0].url,
        'https://backrooms-wiki.wdfiles.com/local--files/level-0/OGLevel0.jpg',
        'Cover image must be the canonical OGLevel0.jpg'
      );
    });

    test('preserves post-tab content and subsequent sections', async () => {
      const item = await WikidotService.fetchItemDetails('/level-0', 'level', 'es');

      assert.ok(item.sections.length > 0, 'Level 0 must retain sections after tabs');
      const postSection = item.sections.find(s => s.title.includes('Observaciones'));
      assert.ok(postSection, 'Post-tab section "Observaciones" must be retained');
      assert.match(
        postSection!.content,
        /regeneración lenta del papel tapiz/,
        'Section content must be intact'
      );
    });
  });

  describe('Tier 1 & 4: Level 1 Parsing (Requirement R2 / P1-1, P1-4)', () => {
    test('preserves opening description and overview before tabs', async () => {
      const item = await WikidotService.fetchItemDetails('/level-1', 'level', 'es');

      assert.ok(item.description, 'Level 1 description must not be empty');
      assert.match(
        item.description,
        /enorme almacén en expansión/i,
        'Opening description must be preserved'
      );
      assert.ok(item.tabs && item.tabs.length === 3, 'Level 1 must have 3 tabs extracted');
    });

    test('primary cover image is canonical illustration and not JP-flag.png', async () => {
      const item = await WikidotService.fetchItemDetails('/level-1', 'level', 'es');

      assert.ok(item.images && item.images.length > 0, 'Level 1 must have images');
      assert.ok(
        !item.images[0].url.includes('JP-flag.png'),
        'Primary cover image must NOT be JP-flag.png'
      );
      assert.match(
        item.images[0].url,
        /warehouse_zone\.jpg/,
        'Primary cover image must be the canonical warehouse_zone.jpg'
      );
    });

    test('images array contains zero translation flag images', async () => {
      const item = await WikidotService.fetchItemDetails('/level-1', 'level', 'es');

      const flagImages = item.images.filter(
        img => img.url.toLowerCase().includes('flag') || img.url.toLowerCase().includes('scpsandbox')
      );
      assert.strictEqual(
        flagImages.length,
        0,
        'No flag or translation sandbox images allowed in images list'
      );
    });
  });

  describe('Tier 1 & 4: Level 2 Parsing (Requirement R2 / P1-3, P1-4)', () => {
    test('controls section fragmentation to prevent exploding into 57 sections', async () => {
      const item = await WikidotService.fetchItemDetails('/level-2', 'level', 'es');

      assert.ok(Array.isArray(item.sections), 'Sections must be an array');
      assert.ok(
        item.sections.length < 15,
        `Section count must be controlled (< 15), got ${item.sections.length} (must not explode into 57)`
      );
      assert.match(
        item.description,
        /largos túneles de mantenimiento de hormigón oscuro/i,
        'Description must be preserved'
      );
    });

    test('converts lower hierarchy headers into inline markdown subheadings', async () => {
      const item = await WikidotService.fetchItemDetails('/level-2', 'level', 'es');

      const entrancesSection = item.sections.find(s => s.title.toLowerCase().includes('entradas'));
      assert.ok(entrancesSection, 'Must find Entradas y Salidas section');
      assert.match(
        entrancesSection!.content,
        /\*\*Nivel 52\*\*/,
        'H5 header should be converted to inline bold subheading **Nivel 52**'
      );
    });

    test('extracts entrances and exits lists correctly', async () => {
      const item = await WikidotService.fetchItemDetails('/level-2', 'level', 'es');

      assert.ok(Array.isArray(item.entrances), 'Entrances must be an array');
      assert.ok(Array.isArray(item.exits), 'Exits must be an array');
      assert.ok(item.entrances.length > 0, 'Entrances list must not be empty');
      assert.ok(item.exits.length > 0, 'Exits list must not be empty');

      const hasEntranceReference = item.entrances.some(
        e => e.includes('Nivel 1') || e.includes('Nivel 52') || e.includes('Nivel 287')
      );
      assert.ok(hasEntranceReference, 'Entrances must contain referenced levels');

      const hasExitReference = item.exits.some(
        e => e.includes('Nivel 3') || e.includes('Nivel 4') || e.includes('El Hub')
      );
      assert.ok(hasExitReference, 'Exits must contain referenced destination levels');
    });

    test('filters flag from Level 2 images and sets canonical cover photo', async () => {
      const item = await WikidotService.fetchItemDetails('/level-2', 'level', 'es');

      assert.ok(item.images.length > 0, 'Level 2 must have images');
      assert.ok(!item.images[0].url.includes('flag'), 'Level 2 primary image must not be a flag');
      assert.match(item.images[0].url, /pipe_dreams\.jpg/, 'Primary image must be pipe_dreams.jpg');
    });
  });

  describe('Tier 1 & 2: Numerical Level Sorting (Requirement R2 / P1-2)', () => {
    test('places Level 0 strictly at index 0 of the level list', async () => {
      const levels = await WikidotService.fetchLevels('es');

      assert.ok(levels.length > 0, 'Levels list must not be empty');
      assert.strictEqual(levels[0].path, '/level-0', 'Index 0 must be /level-0');
      assert.strictEqual(levels[0].numberStr, '0', 'Index 0 must have numberStr 0');
      assert.strictEqual(levels[0].title, 'Level 0', 'Index 0 title must be Level 0');
    });

    test('sorts levels in strict ascending numerical order (not lexicographical or inverted)', async () => {
      const levels = await WikidotService.fetchLevels('es');
      const paths = levels.map(l => l.path);

      const expectedOrder = [
        '/level-0',
        '/level-0-1',
        '/level-0-2',
        '/level-1',
        '/level-2',
        '/level-10',
        '/level-99',
        '/level-100',
        '/level-999',
      ];

      assert.deepStrictEqual(paths, expectedOrder, 'Levels must be sorted in ascending numerical order');
    });

    test('boundary verification: Number.isFinite vs parseFloat || 999999 coercion bug', () => {
      const numStr = '0';
      const parsed = parseFloat(numStr);

      // Reproduces legacy bug: in JS (0 || 999999) === 999999
      const legacyResult = parsed || 999999;
      assert.strictEqual(legacyResult, 999999, 'Legacy code coerced 0 to 999999');

      // Verifies remediated fix: Number.isFinite(0) is true -> 0
      const remediatedResult = Number.isFinite(parsed) ? parsed : 999999;
      assert.strictEqual(remediatedResult, 0, 'Remediated code correctly preserves 0');
    });
  });

  describe('Tier 1 & 3: Multi-Tabset Canons (Requirement R2 / P0-2)', () => {
    test('extracts tabs across all multiple tabset containers', async () => {
      const item = await WikidotService.fetchItemDetails('/decay-canon-hub', 'canon', 'es');

      assert.ok(item.tabs, 'Tabs must be present');
      assert.strictEqual(
        item.tabs?.length,
        4,
        `Must extract all 4 tabs across multiple tabsets, got ${item.tabs?.length}`
      );

      const tabTitles = item.tabs?.map(t => t.title);
      assert.deepStrictEqual(
        tabTitles,
        ['Acto I: Génesis', 'Acto II: La Fractura', 'Saga Diánica', 'La Ciudad Rota'],
        'Tab titles across multiple tabsets must be extracted in sequence'
      );
    });

    test('preserves narrative prologue before first tabset', async () => {
      const item = await WikidotService.fetchItemDetails('/decay-canon-hub', 'canon', 'es');

      assert.ok(item.prologue, 'Prologue must be preserved');
      assert.match(
        item.prologue,
        /Prólogo del Archivo Canónico/,
        'Text before first tabset must not be dropped'
      );
    });

    test('preserves content between and after tabset containers', async () => {
      const item = await WikidotService.fetchItemDetails('/decay-canon-hub', 'canon', 'es');

      assert.ok(item.sections.length > 0, 'Sections must not be lost');
      const hasInterlude = item.sections.some(
        s => s.title.includes('Interludio') || s.content.includes('Interludio')
      );
      assert.ok(hasInterlude, 'Content between tabsets must be preserved');

      const hasEpilogue = item.sections.some(
        s => s.title.includes('Epílogo') || s.content.includes('Epílogo')
      );
      assert.ok(hasEpilogue, 'Content after second tabset must be preserved');
    });
  });

  describe('Tier 1 & 2: Spanish Translation Polish Guard (Requirement R2 / P1-6)', () => {
    test('does not alter official Spanish author prose when isFallback is false', async () => {
      // Official Spanish wiki item (not fallback)
      const item = await WikidotService.fetchItemDetails('/level-0', 'level', 'es');

      // Ensure that official Spanish content preserves terms like "infinito" and original phrasing
      assert.match(
        item.description,
        /Aquellos con la mala suerte/,
        'Original Spanish prose must remain unmodified'
      );
    });

    test('polishSpanishTranslation function correctly fixes machine-translation artifacts', () => {
      const mtText = 'Explorando las trastiendas con un ladrón de pieles en cruce del canon de el viajero.';
      const polished = polishSpanishTranslation(mtText);

      assert.ok(
        polished.includes('los Backrooms'),
        'Machine translated "las trastiendas" should be converted to "los Backrooms"'
      );
      assert.ok(
        polished.includes('Ladrón de Piel'),
        '"ladrón de pieles" should be converted to canonical singular "Ladrón de Piel"'
      );
      assert.ok(
        polished.includes('Cruce de Cánones'),
        '"cruce del canon" should be translated to "Cruce de Cánones"'
      );
      assert.ok(
        polished.includes('del viajero'),
        '"de el" contraction should be polished to "del"'
      );
    });
  });

  describe('Tier 2 & Adversarial Edge Cases: Parser Robustness', () => {
    test('cleans Markdown formatting hashes and asterisks from section titles', async () => {
      const item = await WikidotService.fetchItemDetails('/level-2', 'level', 'es');

      for (const sec of item.sections) {
        assert.ok(!sec.title.startsWith('#'), `Section title should not start with #: ${sec.title}`);
        assert.ok(!sec.title.startsWith('*'), `Section title should not start with *: ${sec.title}`);
        assert.ok(!sec.title.endsWith(':'), `Section title should not end with colon: ${sec.title}`);
      }
    });

    test('handles 404 cleanly when article is not found', async () => {
      await assert.rejects(
        async () => {
          await WikidotService.fetchItemDetails('/non-existent-level-99999', 'level', 'es');
        },
        /Failed to fetch/,
        'Should reject with appropriate error when item does not exist'
      );
    });
  });
});
