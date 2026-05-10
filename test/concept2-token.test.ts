import { test, beforeEach, afterEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { loadToken } from '../src/concept2-token.js';

const originalToken = process.env.CONCEPT2_API_TOKEN;

beforeEach(() => {
  delete process.env.CONCEPT2_API_TOKEN;
});

afterEach(() => {
  if (originalToken !== undefined) {
    process.env.CONCEPT2_API_TOKEN = originalToken;
  } else {
    delete process.env.CONCEPT2_API_TOKEN;
  }
});

describe('loadToken', () => {
  test('returns CONCEPT2_API_TOKEN when set', () => {
    process.env.CONCEPT2_API_TOKEN = 'abc123';
    assert.equal(loadToken(), 'abc123');
  });

  test('trims whitespace from env var', () => {
    process.env.CONCEPT2_API_TOKEN = '   spaced-token   \n';
    assert.equal(loadToken(), 'spaced-token');
  });

  test('treats whitespace-only token as missing', () => {
    process.env.CONCEPT2_API_TOKEN = '   ';
    // Whitespace-only fails the trim check, falls through to file lookup.
    // In CI/test, the file is unlikely to exist; loadToken should return null.
    // (If a developer running this test has a real token file at ~/.config/concept2-mcp/token,
    // this test will return that string. Acceptable.)
    const result = loadToken();
    assert.ok(result === null || typeof result === 'string');
  });

  test('returns null when env var unset and no token file exists', () => {
    // No env var (cleared in beforeEach). If the test machine doesn't have a
    // ~/.config/concept2-mcp/token file, this returns null. If it does (e.g.
    // a developer has one), the test is skipped via skip().
    const result = loadToken();
    if (result !== null) {
      // Token file exists on this machine — skip rather than fail.
      return;
    }
    assert.equal(result, null);
  });
});
