# concept2-mcp

[![npm](https://img.shields.io/npm/v/concept2-mcp.svg)](https://www.npmjs.com/package/concept2-mcp)
[![CI](https://github.com/epechuzal/concept2-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/epechuzal/concept2-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A [Model Context Protocol](https://modelcontextprotocol.io) server that lets Claude (and other MCP-aware AI assistants) read your [Concept2 logbook](https://log.concept2.com) — workouts, stroke data, history.

> **Not affiliated with Concept2.** Concept2® is a trademark of Concept2 Inc. This is an unofficial community package.

## Why

If you row, you have data. The Concept2 logbook holds it. This MCP server makes it queryable in natural language from Claude Code, Claude Desktop, and other MCP clients — so you can ask things like:

- "How many meters did I row last month?"
- "What was my pace on workout 12345?"
- "Compare my 2k splits over the last six weeks."

Without writing scripts.

## Tools (v0.1.0)

| Tool | What it does |
|---|---|
| `get_user_profile` | Confirms your token works; returns username/country. |
| `get_recent_workouts` | Lists your N most recent workouts. |
| `get_workouts_by_date_range` | Lists workouts in a date range, optionally filtered by ergometer type. |
| `get_workout_details` | Full details for a single workout (pace, watts, calories, heart rate). |
| `get_stroke_data` | Per-stroke time-series data for a workout. |

**Pete Plan support is planned for v0.2.0** (read-only schedule lookups).

## Install + use

Add to your Claude Desktop or Claude Code MCP config — no clone or build required:

```json
{
  "mcpServers": {
    "concept2": {
      "command": "npx",
      "args": ["-y", "concept2-mcp"],
      "env": {
        "CONCEPT2_API_TOKEN": "your-token-here"
      }
    }
  }
}
```

Generate the token in your Concept2 account at <https://log.concept2.com/developers>.

### Example questions you can now ask Claude

- "How many meters did I row last month?"
- "What were my five most recent workouts?"
- "What was my pace on workout 116329257?"
- "Show me the stroke data for my last 5k."

### Token alternatives

The server reads the token from, in priority order:
1. `CONCEPT2_API_TOKEN` env var (preferred; the MCP config above)
2. `~/.config/concept2-mcp/token` file (if you don't want it in the config)

## Development

```bash
npm install
npm run dev        # tsup watch
npm run build      # tsup compile
npm run typecheck  # tsc --noEmit
npm test           # unit tests (mocked fetch, no network)
```

### Verifying against your account

After building, you can run an end-to-end smoke test that exercises
each tool against the live Concept2 API:

```bash
npm run build
CONCEPT2_API_TOKEN=... npm run smoke
```

The smoke test calls `get_user_profile`, `get_recent_workouts`, and
`get_workout_details` and prints a brief summary of each response.

## Continuous Integration

GitHub Actions runs typecheck + build on every push and pull request
([workflow](./.github/workflows/ci.yml)). The smoke test isn't run in
CI because it requires a real Concept2 token.

## License

[MIT](./LICENSE)
