import { z } from 'zod';

export const GetPetePlanProgressSchema = z.object({});

export const GetPetePlanWeekSchema = z.object({
  week: z.number().int().min(1).max(24).describe('Pete Plan week number (1-24)'),
});

export const LinkWorkoutToPetePlanSchema = z.object({
  week: z.number().int().min(1).max(24).describe('Pete Plan week number (1-24)'),
  day: z.number().int().min(1).max(5).describe('Day within the week (1-5)'),
  workoutId: z.number().int().positive().describe('Concept2 workout ID to link'),
});
