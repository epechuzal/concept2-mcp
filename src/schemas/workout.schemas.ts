import { z } from 'zod';

export const GetRecentWorkoutsSchema = z.object({
  limit: z.number().int().positive().optional().default(10).describe('Number of recent workouts to return (default: 10)'),
});

export const GetWorkoutDetailsSchema = z.object({
  workoutId: z.number().int().positive().describe('The ID of the workout to retrieve'),
});

export const GetWorkoutsByDateRangeSchema = z.object({
  startDate: z.string().describe('Start date (YYYY-MM-DD)'),
  endDate: z.string().describe('End date (YYYY-MM-DD)'),
  type: z.string().optional().describe('Optional filter by workout type'),
});
