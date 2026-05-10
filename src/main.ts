/**
 * concept2-mcp — MCP server for the Concept2 logbook.
 *
 * Speaks directly to https://log.concept2.com/api using a personal access token.
 * Set CONCEPT2_API_TOKEN in the environment, or save a token to
 * ~/.config/concept2-mcp/token.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Concept2Api } from './concept2.api.js';
import { loadToken } from './concept2-token.js';
import { allTools } from './tools/index.js';
import {
  handleGetUserProfile,
  handleGetRecentWorkouts,
  handleGetWorkoutsByDateRange,
  handleGetWorkoutDetails,
  handleGetStrokeData,
} from './handlers/index.js';

const api = new Concept2Api();

type ToolResult = {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
};

const handlers: Record<string, (args: unknown, api: Concept2Api) => Promise<ToolResult>> = {
  get_user_profile: handleGetUserProfile,
  get_recent_workouts: handleGetRecentWorkouts,
  get_workouts_by_date_range: handleGetWorkoutsByDateRange,
  get_workout_details: handleGetWorkoutDetails,
  get_stroke_data: handleGetStrokeData,
};

const server = new Server(
  { name: 'concept2-mcp', version: '0.0.1' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: allTools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const handler = handlers[name];
  if (!handler) {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true,
    };
  }
  return handler(args, api);
});

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
