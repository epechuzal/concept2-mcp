/**
 * Tool definitions: name, description, Zod input schema, handler reference.
 *
 * Each entry is registered against the McpServer in `main.ts`.
 */
import { z } from 'zod';
import type { Concept2Api } from '../concept2.api.js';
import {
  handleGetUserProfile,
  handleGetRecentWorkouts,
  handleGetWorkoutsByDateRange,
  handleGetWorkoutDetails,
  handleGetStrokeData,
} from '../handlers/workout.handlers.js';

const ergType = z
  .enum(['rower', 'skierg', 'bike', 'dynamic', 'slides'])
  .describe('Ergometer type.');

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
  .describe('ISO date in YYYY-MM-DD format (inclusive).');

const workoutId = z
  .number()
  .int()
  .positive()
  .describe('Concept2 workout/result ID.');

type ToolResult = {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
};

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, z.ZodType>;
  handler: (args: any, api: Concept2Api) => Promise<ToolResult>;
}

export const workoutTools: ToolDefinition[] = [
  {
    name: 'get_user_profile',
    description:
      'Get the current Concept2 logbook user profile (username, country, etc.). Use this to confirm the API token is working before other calls.',
    inputSchema: {},
    handler: handleGetUserProfile,
  },
  {
    name: 'get_recent_workouts',
    description:
      'List recent workouts from the Concept2 logbook. Returns most recent first. Use this when the user asks about recent activity.',
    inputSchema: {
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe('How many workouts to return (default 20, max 50).'),
    },
    handler: handleGetRecentWorkouts,
  },
  {
    name: 'get_workouts_by_date_range',
    description:
      'List workouts within a date range. Both bounds are inclusive. Optionally filter by ergometer type.',
    inputSchema: {
      from: dateString,
      to: dateString,
      type: ergType.optional().describe('Filter by ergometer type.'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe('How many workouts to return (default 50, max 50).'),
    },
    handler: handleGetWorkoutsByDateRange,
  },
  {
    name: 'get_workout_details',
    description:
      'Get full details for a specific workout by ID. Returns more complete data than the list endpoints (pace, watts, calories, heart rate).',
    inputSchema: {
      workout_id: workoutId,
    },
    handler: handleGetWorkoutDetails,
  },
  {
    name: 'get_stroke_data',
    description:
      'Get per-stroke time-series data for a workout (time, distance, pace, stroke rate, heart rate per stroke). Only available if the workout was synced with stroke data enabled. Returns potentially hundreds of data points; use sparingly.',
    inputSchema: {
      workout_id: workoutId,
    },
    handler: handleGetStrokeData,
  },
];
