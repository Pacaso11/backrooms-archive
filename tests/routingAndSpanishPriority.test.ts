/// <reference types="node" />
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import {
  inferItemCategory,
  LIBRARY_CATEGORIES,
  WikidotService,
} from '../src/services/wikidotService';

describe('Requirement R1: Strict Routing by Category & Spanish Wiki Priority', () => {
  describe('Centralized Category Inference (inferItemCategory)', () => {
    test('accurately classifies numbered levels', () => {
      assert.strictEqual(inferItemCategory('level-0'), 'level');
      assert.strictEqual(inferItemCategory('level-1'), 'level');
      assert.strictEqual(inferItemCategory('level-999'), 'level');
      assert.strictEqual(inferItemCategory('nivel-0'), 'level');
      assert.strictEqual(inferItemCategory('/level-0'), 'level');
      assert.strictEqual(inferItemCategory('/nivel-100'), 'level');
      assert.strictEqual(inferItemCategory('level_2'), 'level');
      assert.strictEqual(inferItemCategory('normal-levels-i'), 'level');
    });

    test('accurately classifies known unnumbered and enigmatic levels', () => {
      assert.strictEqual(inferItemCategory('the-hub'), 'level');
      assert.strictEqual(inferItemCategory('the-end'), 'level');
      assert.strictEqual(inferItemCategory('snackrooms'), 'level');
      assert.strictEqual(inferItemCategory('run-for-your-life'), 'level');
      assert.strictEqual(inferItemCategory('level-fun'), 'level');
      assert.strictEqual(inferItemCategory('blue-channel'), 'level');
      assert.strictEqual(inferItemCategory('/unnumbered-levels'), 'level');
      assert.strictEqual(inferItemCategory('/niveles-enigmaticos'), 'level');
    });

    test('accurately classifies entities', () => {
      assert.strictEqual(inferItemCategory('entity-1'), 'entity');
      assert.strictEqual(inferItemCategory('entity-67'), 'entity');
      assert.strictEqual(inferItemCategory('entidad-1'), 'entity');
      assert.strictEqual(inferItemCategory('/entity-3'), 'entity');
      assert.strictEqual(inferItemCategory('/entidad-3'), 'entity');
      assert.strictEqual(inferItemCategory('/unnumbered-entities'), 'entity');
      assert.strictEqual(inferItemCategory('/enigmatic-entities'), 'entity');
    });

    test('accurately classifies objects (standard and Hispanic community)', () => {
      assert.strictEqual(inferItemCategory('object-1'), 'object');
      assert.strictEqual(inferItemCategory('objeto-1'), 'object');
      assert.strictEqual(inferItemCategory('objeto-es-1'), 'object');
      assert.strictEqual(inferItemCategory('/object-2'), 'object');
      assert.strictEqual(inferItemCategory('/objeto-es-5'), 'object');
      assert.strictEqual(inferItemCategory('objects'), 'object');
      assert.strictEqual(inferItemCategory('objetos'), 'object');
    });

    test('accurately classifies phenomena', () => {
      assert.strictEqual(inferItemCategory('phenomenon-1'), 'phenomenon');
      assert.strictEqual(inferItemCategory('fenomeno-1'), 'phenomenon');
      assert.strictEqual(inferItemCategory('/phenomenon-10'), 'phenomenon');
      assert.strictEqual(inferItemCategory('/fenomeno-10'), 'phenomenon');
      assert.strictEqual(inferItemCategory('phenomena'), 'phenomenon');
    });

    test('accurately classifies tales, groups, POIs, jokes, and subclusters', () => {
      assert.strictEqual(inferItemCategory('tale-1'), 'tale');
      assert.strictEqual(inferItemCategory('relato-1'), 'tale');
      assert.strictEqual(inferItemCategory('group-1'), 'group');
      assert.strictEqual(inferItemCategory('grupo-1'), 'group');
      assert.strictEqual(inferItemCategory('groups-list'), 'group');
      assert.strictEqual(inferItemCategory('lista-de-grupos'), 'group');
      assert.strictEqual(inferItemCategory('poi-1'), 'poi');
      assert.strictEqual(inferItemCategory('pdi-1'), 'poi');
      assert.strictEqual(inferItemCategory('joke-1'), 'joke');
      assert.strictEqual(inferItemCategory('broma-1'), 'joke');
      assert.strictEqual(inferItemCategory('joke-entries'), 'joke');
      assert.strictEqual(inferItemCategory('series-and-subclusters-hub'), 'subcluster');
      assert.strictEqual(inferItemCategory('subcluster-1'), 'subcluster');
    });

    test('accurately classifies true canons', () => {
      assert.strictEqual(inferItemCategory('decay-canon-hub'), 'canon');
      assert.strictEqual(inferItemCategory('black-knights'), 'canon');
      assert.strictEqual(inferItemCategory('multiverse-canon'), 'canon');
      assert.strictEqual(inferItemCategory('the-broken-city-canon'), 'canon');
    });

    test('under no circumstances defaults to canon', () => {
      assert.strictEqual(inferItemCategory('unknown-item-123'), 'archive');
      assert.notStrictEqual(inferItemCategory('unknown-item-123'), 'canon');
      assert.strictEqual(inferItemCategory('arbitrary-slug'), 'archive');
      assert.notStrictEqual(inferItemCategory('arbitrary-slug'), 'canon');
      assert.strictEqual(inferItemCategory('123'), 'level');
      assert.notStrictEqual(inferItemCategory('123'), 'canon');
    });

    test('rejects accidental canon wildcard when explicitCat is falsely passed for non-canons', () => {
      // Level 0 with explicitCat 'canon' must NOT evaluate to canon
      assert.strictEqual(inferItemCategory('level-0', undefined, 'canon'), 'level');
      assert.strictEqual(inferItemCategory('entity-1', undefined, 'canon'), 'entity');
      assert.strictEqual(inferItemCategory('object-1', undefined, 'canon'), 'object');
      assert.strictEqual(inferItemCategory('phenomenon-1', undefined, 'canon'), 'phenomenon');
      // But genuine canons with explicitCat 'canon' remain canon
      assert.strictEqual(inferItemCategory('decay-canon-hub', undefined, 'canon'), 'canon');
      assert.strictEqual(inferItemCategory('black-knights', undefined, 'canon'), 'canon');
    });

    test('honors valid explicit categories', () => {
      assert.strictEqual(inferItemCategory('custom-slug', undefined, 'tale'), 'tale');
      assert.strictEqual(inferItemCategory('custom-slug', undefined, 'group'), 'group');
      assert.strictEqual(inferItemCategory('custom-slug', undefined, 'poi'), 'poi');
      assert.strictEqual(inferItemCategory('custom-slug', undefined, 'object'), 'object');
    });
  });

  describe('Repaired Library Orphan Routes in LIBRARY_CATEGORIES', () => {
    test('enigmatic_levels routes are repaired', () => {
      const cat = LIBRARY_CATEGORIES.find(c => c.key === 'enigmatic_levels');
      assert.ok(cat, 'enigmatic_levels category must exist');
      assert.strictEqual(cat?.pathEn, '/unnumbered-levels');
      assert.strictEqual(cat?.pathEs, '/niveles-enigmaticos');
    });

    test('enigmatic_entities routes are repaired', () => {
      const cat = LIBRARY_CATEGORIES.find(c => c.key === 'enigmatic_entities');
      assert.ok(cat, 'enigmatic_entities category must exist');
      assert.strictEqual(cat?.pathEn, '/unnumbered-entities');
      assert.strictEqual(cat?.pathEs, '/enigmatic-entities');
    });

    test('phenomena routes are repaired', () => {
      const cat = LIBRARY_CATEGORIES.find(c => c.key === 'phenomena');
      assert.ok(cat, 'phenomena category must exist');
      assert.strictEqual(cat?.pathEn, '/phenomena');
      assert.strictEqual(cat?.pathEs, '/phenomena');
    });

    test('groups routes are repaired', () => {
      const cat = LIBRARY_CATEGORIES.find(c => c.key === 'groups');
      assert.ok(cat, 'groups category must exist');
      assert.strictEqual(cat?.pathEn, '/groups-list');
      assert.strictEqual(cat?.pathEs, '/groups-list');
    });

    test('objects routes are repaired', () => {
      const cat = LIBRARY_CATEGORIES.find(c => c.key === 'objects');
      assert.ok(cat, 'objects category must exist');
      assert.strictEqual(cat?.pathEn, '/objects');
      assert.strictEqual(cat?.pathEs, '/objects');
    });
  });

  describe('Slug Reconciliation & Spanish Wiki Priority in fetchItemDetails', () => {
    const originalFetch = globalThis.fetch;
    const fetchCalls: { url: string; lang?: string }[] = [];

    before(() => {
      globalThis.fetch = (async (input: RequestInfo | URL): Promise<Response> => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        fetchCalls.push({ url });

        if (url.includes('es-backrooms-wiki.wikidot.com/level-0')) {
          return new Response(
            `<div id="page-title">Level 0 - Umbral</div>
             <div id="page-content">
               <p>El Nivel 0 es el primer nivel de los Backrooms.</p>
             </div>
             <div id="page-info-break"></div>`,
            { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }

        if (url.includes('es-backrooms-wiki.wikidot.com/object-1')) {
          return new Response(
            `<div id="page-title">Object 1 - Agua de Almendras</div>
             <div id="page-content">
               <p>El Agua de Almendras es un recurso vital.</p>
             </div>
             <div id="page-info-break"></div>`,
            { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }

        if (url.includes('es-backrooms-wiki.wikidot.com/objeto-es-1')) {
          return new Response(
            `<div id="page-title">Objeto ES-1 - Limonada</div>
             <div id="page-content">
               <p>La Limonada es un objeto hispanohablante.</p>
             </div>
             <div id="page-info-break"></div>`,
            { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }

        if (url.includes('es-backrooms-wiki.wikidot.com/phenomenon-1')) {
          return new Response(
            `<div id="page-title">Phenomenon 1 - Eclipses</div>
             <div id="page-content">
               <p>Los eclipses ocurren periódicamente.</p>
             </div>
             <div id="page-info-break"></div>`,
            { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }

        if (url.includes('es-backrooms-wiki.wikidot.com/entity-1')) {
          return new Response(
            `<div id="page-title">Entity 1 - Sabuesos</div>
             <div id="page-content">
               <p>Los Sabuesos son entidades humanoides.</p>
             </div>
             <div id="page-info-break"></div>`,
            { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }

        return new Response('Not Found', { status: 404 });
      }) as typeof globalThis.fetch;
    });

    after(() => {
      globalThis.fetch = originalFetch;
    });

    test('reconciles /objeto-1 to /object-1 and queries BASE_ES without Google Translate', async () => {
      fetchCalls.length = 0;
      const item = await WikidotService.fetchItemDetails('/objeto-1', undefined, 'es');

      assert.strictEqual(item.path, '/object-1');
      assert.strictEqual(item.id, 'object-1');
      assert.strictEqual(item.category, 'object');
      assert.strictEqual(item.isFallback, false);
      assert.strictEqual(item.isAutoTranslated, false);

      // Verify that the request went to BASE_ES
      const queriedUrl = fetchCalls[0]?.url;
      assert.ok(queriedUrl?.includes('es-backrooms-wiki.wikidot.com/object-1'), `Expected BASE_ES query, got ${queriedUrl}`);
      // Zero calls to Google Translate
      const googleTranslateCalls = fetchCalls.filter(c => c.url.includes('translate.googleapis.com'));
      assert.strictEqual(googleTranslateCalls.length, 0);
    });

    test('preserves /objeto-es-1 as-is and queries BASE_ES without Google Translate', async () => {
      fetchCalls.length = 0;
      const item = await WikidotService.fetchItemDetails('/objeto-es-1', undefined, 'es');

      assert.strictEqual(item.path, '/objeto-es-1');
      assert.strictEqual(item.id, 'objeto-es-1');
      assert.strictEqual(item.category, 'object');
      assert.strictEqual(item.isFallback, false);
      assert.strictEqual(item.isAutoTranslated, false);

      const queriedUrl = fetchCalls[0]?.url;
      assert.ok(queriedUrl?.includes('es-backrooms-wiki.wikidot.com/objeto-es-1'), `Expected BASE_ES query, got ${queriedUrl}`);
    });

    test('reconciles /fenomeno-1 to /phenomenon-1', async () => {
      fetchCalls.length = 0;
      const item = await WikidotService.fetchItemDetails('/fenomeno-1', undefined, 'es');

      assert.strictEqual(item.path, '/phenomenon-1');
      assert.strictEqual(item.id, 'phenomenon-1');
      assert.strictEqual(item.category, 'phenomenon');
    });

    test('reconciles /nivel-0 to /level-0 and prioritizes BASE_ES directly', async () => {
      fetchCalls.length = 0;
      const item = await WikidotService.fetchItemDetails('/nivel-0', undefined, 'es');

      assert.strictEqual(item.path, '/level-0');
      assert.strictEqual(item.id, 'level-0');
      assert.strictEqual(item.category, 'level');
      assert.strictEqual(item.isFallback, false);
      assert.strictEqual(item.isAutoTranslated, false);

      const queriedUrl = fetchCalls[0]?.url;
      assert.ok(queriedUrl?.includes('es-backrooms-wiki.wikidot.com/level-0'), `Expected BASE_ES query, got ${queriedUrl}`);
      const googleTranslateCalls = fetchCalls.filter(c => c.url.includes('translate.googleapis.com'));
      assert.strictEqual(googleTranslateCalls.length, 0);
    });

    test('reconciles /entidad-1 to /entity-1 and prioritizes BASE_ES directly', async () => {
      fetchCalls.length = 0;
      const item = await WikidotService.fetchItemDetails('/entidad-1', undefined, 'es');

      assert.strictEqual(item.path, '/entity-1');
      assert.strictEqual(item.id, 'entity-1');
      assert.strictEqual(item.category, 'entity');
      assert.strictEqual(item.isFallback, false);
      assert.strictEqual(item.isAutoTranslated, false);

      const queriedUrl = fetchCalls[0]?.url;
      assert.ok(queriedUrl?.includes('es-backrooms-wiki.wikidot.com/entity-1'), `Expected BASE_ES query, got ${queriedUrl}`);
    });

    test('when category is level, queries BASE_ES directly and avoids translation engine', async () => {
      fetchCalls.length = 0;
      const item = await WikidotService.fetchItemDetails('/level-0', 'level', 'es');

      assert.strictEqual(item.category, 'level');
      assert.strictEqual(item.isFallback, false);
      assert.strictEqual(item.isAutoTranslated, false);

      const queriedUrl = fetchCalls[0]?.url;
      assert.ok(queriedUrl?.includes('es-backrooms-wiki.wikidot.com/level-0'));
      const googleTranslateCalls = fetchCalls.filter(c => c.url.includes('translate.googleapis.com'));
      assert.strictEqual(googleTranslateCalls.length, 0);
    });
  });
});
