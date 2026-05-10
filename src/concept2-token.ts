/**
 * Token loader for the Concept2 logbook personal access token.
 *
 * Concept2 personal access tokens are generated at
 * https://log.concept2.com/developers and don't expire, so we just store
 * the raw string.
 *
 * Loading priority:
 *   1. CONCEPT2_API_TOKEN environment variable (preferred for CI/Claude config)
 *   2. ~/.config/concept2-mcp/token (fallback for one-time setup)
 */
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const TOKEN_FILE = join(homedir(), '.config', 'concept2-mcp', 'token');

export function loadToken(): string | null {
  const envToken = process.env.CONCEPT2_API_TOKEN;
  if (envToken && envToken.trim()) {
    return envToken.trim();
  }

  if (!existsSync(TOKEN_FILE)) {
    return null;
  }

  try {
    return readFileSync(TOKEN_FILE, 'utf-8').trim() || null;
  } catch {
    return null;
  }
}

export function getTokenFilePath(): string {
  return TOKEN_FILE;
}
