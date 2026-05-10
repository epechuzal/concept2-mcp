# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Direct Concept2 logbook API client (`src/concept2.api.ts`) using personal
  access tokens. No OAuth flow required.
- Token loader (`src/concept2-token.ts`) — reads `CONCEPT2_API_TOKEN` env var
  with file fallback at `~/.config/concept2-mcp/token`.
- 5 MCP tools: `get_user_profile`, `get_recent_workouts`,
  `get_workouts_by_date_range`, `get_workout_details`, `get_stroke_data`.
- `tsup` build pipeline producing a single executable `dist/main.js`.

### Removed

- Internal Nx-monorepo couplings from the original copy: `util/logger`,
  `util/config`, `util/luxon-config`, NestJS `HttpService`, RxJS retry/backoff
  pipeline. Replaced with native `fetch` and `console.error` logging.
- Pete Plan tools/schemas — deferred to a follow-up (will return with the
  static schedule ported in cleaned form, completion-tracking dropped per
  v0.1.0 scope decision).

### Verified

- `npm install` succeeds (138 packages, no audit warnings).
- `npm run typecheck` clean.
- `npm run build` produces a single `dist/main.js` (~10 KB) with shebang.
- Smoke-tested with a fake token: server starts, hits Concept2 `/users/me`,
  receives a real 401 (auth path verified), and continues to listen on stdio.

### Known

- The `Server` class from `@modelcontextprotocol/sdk` shows a deprecation
  warning; migration to `McpServer` is a follow-up.
