/// <reference types="node" />
import { test, describe } from 'node:test';
import assert from 'node:assert';
import { formatErrorMessage } from '../src/utils/errorFormatting';

describe('M.E.G. Terminal ErrorBoundary Resilience', () => {
  test('handles standard Error instances with name and message', () => {
    const error = new TypeError('Failed to load dossier');
    assert.strictEqual(formatErrorMessage(error), 'TypeError: Failed to load dossier');
  });

  test('handles Error without name or default name', () => {
    const error = new Error('Network timeout');
    assert.strictEqual(formatErrorMessage(error), 'Error: Network timeout');
  });

  test('handles raw string errors thrown in JS', () => {
    const error = 'Critical sector breach: Level-0 corrupted';
    assert.strictEqual(formatErrorMessage(error), 'Critical sector breach: Level-0 corrupted');
  });

  test('handles object with message property', () => {
    const error = { message: 'Wikidot API 500' };
    assert.strictEqual(formatErrorMessage(error), 'Wikidot API 500');
  });

  test('handles arbitrary object without message', () => {
    const error = { code: 500, detail: 'Server fault' };
    assert.strictEqual(formatErrorMessage(error), JSON.stringify({ code: 500, detail: 'Server fault' }));
  });

  test('handles null, undefined, and empty errors safely', () => {
    assert.strictEqual(formatErrorMessage(null), 'Error desconocido en tiempo de ejecución.');
    assert.strictEqual(formatErrorMessage(undefined), 'Error desconocido en tiempo de ejecución.');
    assert.strictEqual(formatErrorMessage(''), 'Error desconocido en tiempo de ejecución.');
  });
});
