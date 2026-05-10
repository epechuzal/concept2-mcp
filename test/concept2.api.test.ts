import { test, beforeEach, afterEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Concept2Api, Concept2ApiError } from '../src/concept2.api.js';

const originalToken = process.env.CONCEPT2_API_TOKEN;
const originalFetch = globalThis.fetch;

beforeEach(() => {
  process.env.CONCEPT2_API_TOKEN = 'test-token';
});

afterEach(() => {
  if (originalToken !== undefined) {
    process.env.CONCEPT2_API_TOKEN = originalToken;
  } else {
    delete process.env.CONCEPT2_API_TOKEN;
  }
  globalThis.fetch = originalFetch;
});

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const calls: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    calls.push({ url, init });
    return handler(url, init);
  }) as typeof fetch;
  return calls;
}

describe('Concept2Api', () => {
  describe('getCurrentUser', () => {
    test('returns user data on 200', async () => {
      const calls = mockFetch(() =>
        new Response(JSON.stringify({ data: { id: 123, username: 'tester' } }), { status: 200 }),
      );
      const user = await new Concept2Api().getCurrentUser();
      assert.equal(user.id, 123);
      assert.equal(user.username, 'tester');
      assert.equal(calls.length, 1);
      assert.equal(calls[0].url, 'https://log.concept2.com/api/users/me');
    });

    test('sends Bearer token in Authorization header', async () => {
      const calls = mockFetch(() => new Response(JSON.stringify({ data: { id: 1, username: 'x' } })));
      await new Concept2Api().getCurrentUser();
      const auth = (calls[0].init?.headers as Record<string, string>)?.Authorization;
      assert.equal(auth, 'Bearer test-token');
    });

    test('throws Concept2ApiError with 401 status on unauthorized', async () => {
      mockFetch(() => new Response('Unauthorized', { status: 401 }));
      await assert.rejects(
        () => new Concept2Api().getCurrentUser(),
        (err) => err instanceof Concept2ApiError && err.status === 401,
      );
    });

    test('throws helpful error when no token is set', async () => {
      delete process.env.CONCEPT2_API_TOKEN;
      await assert.rejects(
        () => new Concept2Api().getCurrentUser(),
        (err: Concept2ApiError) =>
          err instanceof Concept2ApiError &&
          err.message.includes('No Concept2 API token'),
      );
    });
  });

  describe('listResults', () => {
    test('builds query string with from/to/type/page/per_page', async () => {
      const calls = mockFetch(() => new Response(JSON.stringify({ data: [] })));
      await new Concept2Api().listResults({
        from: '2026-01-01',
        to: '2026-01-31',
        type: 'rower',
        page: 2,
        per_page: 25,
      });
      const url = new URL(calls[0].url);
      assert.equal(url.pathname, '/api/users/me/results');
      assert.equal(url.searchParams.get('from'), '2026-01-01');
      assert.equal(url.searchParams.get('to'), '2026-01-31');
      assert.equal(url.searchParams.get('type'), 'rower');
      assert.equal(url.searchParams.get('page'), '2');
      assert.equal(url.searchParams.get('per_page'), '25');
    });

    test('omits query string when no params are passed', async () => {
      const calls = mockFetch(() => new Response(JSON.stringify({ data: [] })));
      await new Concept2Api().listResults();
      assert.equal(calls[0].url, 'https://log.concept2.com/api/users/me/results');
    });

    test('returns an array of workouts from the data field', async () => {
      mockFetch(
        () =>
          new Response(
            JSON.stringify({
              data: [
                { id: 1, user_id: 99, distance: 2000, time: 8000 },
                { id: 2, user_id: 99, distance: 5000, time: 18000 },
              ],
            }),
          ),
      );
      const results = await new Concept2Api().listResults();
      assert.equal(results.length, 2);
      assert.equal(results[0].id, 1);
      assert.equal(results[1].id, 2);
    });
  });

  describe('getResult', () => {
    test('fetches a single workout by id', async () => {
      const calls = mockFetch(
        () => new Response(JSON.stringify({ data: { id: 42, distance: 10000 } })),
      );
      const w = await new Concept2Api().getResult(42);
      assert.equal(w.id, 42);
      assert.equal(calls[0].url, 'https://log.concept2.com/api/users/me/results/42');
    });

    test('surfaces 404 as a Not Found error', async () => {
      mockFetch(() => new Response('Not Found', { status: 404 }));
      await assert.rejects(
        () => new Concept2Api().getResult(99999999),
        (err: Concept2ApiError) =>
          err instanceof Concept2ApiError &&
          err.status === 404 &&
          /Not found/i.test(err.message),
      );
    });
  });

  describe('getStrokeData', () => {
    test('returns empty array when data is missing', async () => {
      mockFetch(() => new Response(JSON.stringify({})));
      const strokes = await new Concept2Api().getStrokeData(1);
      assert.deepEqual(strokes, []);
    });

    test('passes through stroke array from data field', async () => {
      mockFetch(
        () =>
          new Response(
            JSON.stringify({
              data: [
                { t: 10, d: 50, p: 100, spm: 24, hr: 140 },
                { t: 20, d: 100, p: 98, spm: 25, hr: 145 },
              ],
            }),
          ),
      );
      const strokes = await new Concept2Api().getStrokeData(1);
      assert.equal(strokes.length, 2);
      assert.equal(strokes[0].t, 10);
      assert.equal(strokes[1].spm, 25);
    });
  });

  describe('error handling', () => {
    test('surfaces 403 with permission message', async () => {
      mockFetch(() => new Response('Forbidden', { status: 403 }));
      await assert.rejects(
        () => new Concept2Api().getCurrentUser(),
        (err: Concept2ApiError) =>
          err instanceof Concept2ApiError &&
          err.status === 403 &&
          /Insufficient permissions/i.test(err.message),
      );
    });

    test('surfaces 503 as temporarily unavailable', async () => {
      mockFetch(() => new Response('Down for maintenance', { status: 503 }));
      await assert.rejects(
        () => new Concept2Api().getCurrentUser(),
        (err: Concept2ApiError) =>
          err instanceof Concept2ApiError &&
          err.status === 503 &&
          /temporarily unavailable/i.test(err.message),
      );
    });

    test('wraps network errors as Concept2ApiError', async () => {
      globalThis.fetch = (async () => {
        throw new Error('ENOTFOUND log.concept2.com');
      }) as typeof fetch;
      await assert.rejects(
        () => new Concept2Api().getCurrentUser(),
        (err: Concept2ApiError) =>
          err instanceof Concept2ApiError &&
          /Network error/i.test(err.message),
      );
    });
  });
});
