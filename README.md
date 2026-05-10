# concept2-mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server that lets Claude (and other MCP-aware AI assistants) read your [Concept2 logbook](https://log.concept2.com) — workouts, history, and Pete Plan progress.

> **Status:** pre-release scaffold. Working toward `0.1.0`.

> **Not affiliated with Concept2.** Concept2® is a trademark of Concept2 Inc. This is an unofficial community package.

## Why

If you row, you have data. The Concept2 logbook holds it. This MCP server makes it queryable in natural language from Claude Code, Claude Desktop, and other MCP clients — so you can ask things like:

- "How many meters did I row last month?"
- "What's my current Pete Plan week?"
- "Compare my 2k splits over the last six weeks."

Without writing scripts.

## Features (planned for 0.1.0)

- `get_recent_workouts` — list your recent workouts
- `get_workout_details` — full data for a single workout
- `get_workouts_by_date_range` — filtered query
- `get_pete_plan_progress` — current week + completion %
- `get_pete_plan_week` — schedule for a specific week (1-24)
- `link_workout_to_pete_plan` — mark a workout as completing a Pete Plan day

## Setup (planned)

```bash
npx concept2-mcp
```

You'll need a Concept2 personal API token. Generate one at [log.concept2.com](https://log.concept2.com) under your account settings, then set:

```bash
export CONCEPT2_API_TOKEN="..."
```

## Status

This README is a placeholder. Real setup, usage, and API documentation will land with `0.1.0`.

## License

[MIT](./LICENSE)
