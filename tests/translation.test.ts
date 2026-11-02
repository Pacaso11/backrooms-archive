/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert';
import { translateText } from '../src/services/wikidotService';

test('translation splits large paragraphs and caps concurrent requests at three', async () => {
  const originalFetch = globalThis.fetch;
  const requestLengths: number[] = [];
  let activeRequests = 0;
  let peakRequests = 0;
  globalThis.fetch = (async (input: RequestInfo | URL): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    requestLengths.push(new URL(url).searchParams.get('q')?.length ?? 0);
    activeRequests += 1;
    peakRequests = Math.max(peakRequests, activeRequests);
    await new Promise(resolve => setTimeout(resolve, 5));
    activeRequests -= 1;
    return new Response(JSON.stringify([[['translated text', 'source']]]), { status: 200 });
  }) as typeof globalThis.fetch;

  try {
    await translateText('word '.repeat(900), 'es', 'en');
    assert.ok(requestLengths.length > 1);
    assert.ok(requestLengths.every(length => length <= 1000));
    assert.ok(peakRequests <= 3);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('translation does not start network requests after cancellation', async () => {
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = (async (): Promise<Response> => {
    requests += 1;
    return new Response(JSON.stringify([[['translated', 'source']]]), { status: 200 });
  }) as typeof globalThis.fetch;
  const controller = new AbortController();
  controller.abort();

  try {
    await assert.rejects(translateText('A sufficiently long paragraph.', 'es', 'en', controller.signal), /aborted/i);
    assert.strictEqual(requests, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

