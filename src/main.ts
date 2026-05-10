/**
 * concept2-mcp — MCP server for the Concept2 logbook.
 *
 * Speaks directly to https://log.concept2.com/api using a personal access token.
 * Set CONCEPT2_API_TOKEN in the environment, or save a token to
 * ~/.config/concept2-mcp/token.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Concept2Api } from './concept2.api.js';
import { loadToken } from './concept2-token.js';
import { workoutTools } from './tools/index.js';

const api = new Concept2Api();

const server = new McpServer({
  name: 'concept2-mcp',
  version: '0.1.0',
});

for (const tool of workoutTools) {
  server.registerTool(
    tool.name,
    {
      description: tool.description,
      inputSchema: tool.inputSchema,
    },
    async (args: unknown) => tool.handler(args ?? {}, api),
  );
}

async function main(): Promise<void> {
  console.error('=== Concept2 MCP Server starting ===');
  console.error(`Node ${process.version}, PID ${process.pid}`);

  const token = loadToken();
  if (!token) {
    console.error('');
    console.error('⚠️  No Concept2 API token found.');
    console.error('   Set CONCEPT2_API_TOKEN env var, or save a token to');
    console.error('   ~/.config/concept2-mcp/token');
    console.error('   Get one at https://log.concept2.com/developers');
    console.error('');
    console.error('   Server will start anyway; tool calls will fail until a token is provided.');
  } else {
    try {
      const user = await api.getCurrentUser();
      console.error(`✅ Connected as: ${user.username} (id ${user.id})`);
    } catch (err) {
      console.error(`⚠️  Could not verify token: ${(err as Error).message}`);
      console.error('   Server will start anyway.');
    }
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('✅ MCP server running on stdio');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
