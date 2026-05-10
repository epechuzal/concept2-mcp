# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-05-10

First public release.

### Added

- Direct Concept2 logbook API client (`src/concept2.api.ts`) using personal
  access tokens. No OAuth flow required.
- Token loader (`src/concept2-token.ts`) — reads `CONCEPT2_API_TOKEN` env var
  with file fallback at `~/.config/concept2-mcp/token`.
- 5 MCP tools: `get_user_profile`, `get_recent_workouts`,
  `get_workouts_by_date_range`, `get_workout_details`, `get_stroke_data`.
- Server registered through the high-level `McpServer` class with Zod input
  schemas (arguments are validated before reaching handlers).
- `tsup` build pipeline producing a single executable `dist/main.js`
  (~8.4 KB).
- 18 unit tests run with `node --test` via `tsx`. Covers `Concept2Api`
  (auth header, query string construction, response parsing, 401/403/404/503
  error paths, network errors) and `loadToken` (env var precedence,
  whitespace handling).
- End-to-end smoke test (`scripts/smoke.mjs`) that exercises every tool
  against the live Concept2 API. Run via `npm run smoke` after `npm run
  build`.
- GitHub Actions CI: typecheck + tests + build on every push and pull
  request.

### Note

- Pete Plan tools are intentionally deferred to a future release. The
  static schedule in the original source includes verbatim prose from the
  Pete Plan blog; it will return in a cleaned form (structure only) in a
  follow-up version.
