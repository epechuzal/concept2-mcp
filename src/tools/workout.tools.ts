import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const workoutTools: Tool[] = [
  {
    name: 'get_user_profile',
    description:
      'Get the current Concept2 logbook user profile (username, country, etc.). Use this to confirm the API token is working before other calls.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'get_recent_workouts',
    description:
      'List recent workouts from the Concept2 logbook. Returns most recent first. Use this when the user asks about recent activity.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
          description: 'How many workouts to return (default 20, max 50).',
          minimum: 1,
          maximum: 50,
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_workouts_by_date_range',
    description:
      'List workouts within a date range. Both bounds are inclusive. Optionally filter by ergometer type.',
    inputSchema: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format (inclusive).',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        },
        to: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (inclusive).',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
        },
        type: {
          type: 'string',
          enum: ['rower', 'skierg', 'bike', 'dynamic', 'slides'],
          description: 'Filter by ergometer type.',
        },
        limit: {
          type: 'integer',
          description: 'How many workouts to return (default 50, max 50).',
          minimum: 1,
          maximum: 50,
        },
      },
      required: ['from', 'to'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_workout_details',
    description:
      'Get full details for a specific workout by ID. Returns more complete data than the list endpoints (pace, watts, calories, heart rate).',
    inputSchema: {
      type: 'object',
      properties: {
        workout_id: {
          type: 'integer',
          description: 'Concept2 workout/result ID.',
          minimum: 1,
        },
      },
      required: ['workout_id'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_stroke_data',
    description:
      'Get per-stroke time-series data for a workout (time, distance, pace, stroke rate, heart rate per stroke). Only available if the workout was synced with stroke data enabled. Returns potentially hundreds of data points; use sparingly.',
    inputSchema: {
      type: 'object',
      properties: {
        workout_id: {
          type: 'integer',
          description: 'Concept2 workout/result ID.',
          minimum: 1,
        },
      },
      required: ['workout_id'],
      additionalProperties: false,
    },
  },
];
