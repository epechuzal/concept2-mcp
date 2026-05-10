#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { HttpService } from '@nestjs/axios';
import { createLogger } from 'util/logger';
import { RowingApi } from './rowing.api';
import { allTools } from './tools';
import * as petePlanHandlers from './handlers/pete-plan.handlers';
import * as workoutHandlers from './handlers/workout.handlers';

// Initialize HTTP service and logger (API client will be instantiated after config loads)
const httpService = new HttpService();
const logger = createLogger({ colors: false, context: 'RowingMcp', logDir: '~/.mcp-servers/rowing-mcp/logs' });
let rowingApi: RowingApi;
let baseUrl = '';

// Create tool handler map
const toolHandlerMap: Record<string, (args: unknown, api?: RowingApi) => Promise<{ content: { type: string; text: string }[]; isError?: boolean }>> = {
  get_pete_plan_progress: petePlanHandlers.handleGetPetePlanProgress,
  get_pete_plan_week: petePlanHandlers.handleGetPetePlanWeek,
  link_workout_to_pete_plan: petePlanHandlers.handleLinkWorkoutToPetePlan,
  get_recent_workouts: workoutHandlers.handleGetRecentWorkouts,
  get_workout_details: workoutHandlers.handleGetWorkoutDetails,
  get_workouts_by_date_range: workoutHandlers.handleGetWorkoutsByDateRange,
};

// Create MCP server
const server = new Server(
  {
    name: 'rowing-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: allTools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    const handler = toolHandlerMap[name];
    if (!handler) {
      throw new Error(`Unknown tool: ${name}`);
    }

    return await handler(args, rowingApi);
  } catch (error) {
    // Provide helpful error messages based on error type
    let errorMessage = 'Unknown error occurred';

    if (error && typeof error === 'object' && 'code' in error) {
      const apiUrl = baseUrl || 'the rowing API';

      if (error.code === 'ENOTFOUND') {
        errorMessage = `Cannot connect to rowing API - host not found.\n\n`;

        // Special handling for Tailscale domains
        if (apiUrl.includes('.ts/') || apiUrl.includes('.ts:')) {
          errorMessage += `The API is on a Tailscale domain (${apiUrl}).\n`;
          errorMessage += `Please turn on Tailscale to connect to the rowing API.\n`;
        } else {
          errorMessage += `API URL: ${apiUrl}\n`;
          errorMessage += `Please check the API URL is correct and the server is reachable.`;
        }
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = `Cannot connect to rowing API - connection refused.\n\n`;
        errorMessage += `API URL: ${apiUrl}\n`;
        errorMessage += `The API server may not be running. Please check if sandbox-api is started.`;
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = `Cannot connect to rowing API - connection timeout.\n\n`;
        errorMessage += `API URL: ${apiUrl}\n`;
        errorMessage += `Please check your network connection and firewall settings.`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      content: [
        {
          type: 'text',
          text: errorMessage,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  // Initialize Luxon to use UTC as default timezone
  const { initLuxon } = await import('util/luxon-config');
  initLuxon();

  // Load secrets from ~/.config/scinfax/${SCINFAX_ENV}.env (file-based, no OP at boot)
  const { loadSecretsFile, config } = await import('util/config');
  loadSecretsFile();

  // Get API URL from config or environment
  baseUrl = config.rowing?.apiUrl || 'http://localhost:3001/api/rowing';

  // NOW instantiate the API client after config is loaded
  rowingApi = new RowingApi(httpService, baseUrl, logger);

  // Log startup environment
  console.error('=== Rowing MCP Server Starting ===');
  console.error(`API URL: ${baseUrl}`);
  console.error(`Node version: ${process.version}`);
  console.error(`Process ID: ${process.pid}`);
  console.error('');

  // Health check on startup (non-fatal)
  try {
    console.error('Checking sandbox-api connection...');
    const health = await rowingApi.health();
    console.error(
      `✅ Connected to sandbox-api: ${health.service} (${health.status})`
    );
  } catch (error: unknown) {
    console.error('');
    console.error('⚠️  Warning: Could not connect to sandbox-api');
    console.error(`   API URL: ${baseUrl}`);
    console.error('');

    // Provide specific error messages based on error code
    const apiUrl = baseUrl;
    const err = error as { code?: string; message?: string };

    if (err.code === 'ECONNREFUSED') {
      console.error('   Error: Connection refused');
      console.error('   → The API server is not running or not accepting connections');
      console.error('   → Check if sandbox-api is running on the expected port');
    } else if (err.code === 'ENOTFOUND') {
      console.error('   Error: Host not found');
      console.error('   → DNS resolution failed for the hostname');

      // Special case: .ts domain is almost always a Tailscale issue
      if (apiUrl.includes('.ts/') || apiUrl.includes('.ts:')) {
        console.error('   → Your API URL uses a .ts domain (Tailscale)');
        console.error('   → Turn on Tailscale to connect');
      } else {
        console.error('   → Verify rowing.apiUrl is set correctly in config');
      }
    } else if (err.code === 'ETIMEDOUT') {
      console.error('   Error: Connection timeout');
      console.error('   → The server is not responding within the timeout period');
      console.error('   → Check network connectivity and firewall settings');
    } else {
      console.error(`   Error: ${err.message}`);
      console.error(`   Code: ${err.code || 'UNKNOWN'}`);
    }

    console.error('');
    console.error('   → Server will start anyway, but tool calls will fail until API is reachable');
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('');
  console.error('✅ Rowing MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
