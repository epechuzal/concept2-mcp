/**
 * Tool handlers. Each takes a `Concept2Api` instance and pre-validated
 * arguments (from the McpServer's Zod schemas), and returns a tool result.
 *
 * Handlers are pure functions — easy to unit-test with a mocked
 * `Concept2Api`.
 */
import type { Concept2Api } from '../concept2.api.js';

export type ToolResult = {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
};

const json = (data: unknown): ToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
});

const errorResult = (message: string): ToolResult => ({
  content: [{ type: 'text', text: message }],
  isError: true,
});

const tryCall = async <T>(fn: () => Promise<T>): Promise<ToolResult> => {
  try {
    return json(await fn());
  } catch (err) {
    return errorResult((err as Error).message);
  }
};

export async function handleGetUserProfile(
  _args: Record<string, never>,
  api: Concept2Api,
): Promise<ToolResult> {
  return tryCall(() => api.getCurrentUser());
}

export interface RecentWorkoutsArgs {
  limit?: number;
}

export async function handleGetRecentWorkouts(
  args: RecentWorkoutsArgs,
  api: Concept2Api,
): Promise<ToolResult> {
  return tryCall(() => api.listResults({ per_page: args.limit ?? 20 }));
}

export interface DateRangeArgs {
  from: string;
  to: string;
  type?: 'rower' | 'skierg' | 'bike' | 'dynamic' | 'slides';
  limit?: number;
}

export async function handleGetWorkoutsByDateRange(
  args: DateRangeArgs,
  api: Concept2Api,
): Promise<ToolResult> {
  return tryCall(() =>
    api.listResults({
      from: args.from,
      to: args.to,
      type: args.type,
      per_page: args.limit ?? 50,
    }),
  );
}

export interface WorkoutIdArgs {
  workout_id: number;
}

export async function handleGetWorkoutDetails(
  args: WorkoutIdArgs,
  api: Concept2Api,
): Promise<ToolResult> {
  return tryCall(() => api.getResult(args.workout_id));
}

export async function handleGetStrokeData(
  args: WorkoutIdArgs,
  api: Concept2Api,
): Promise<ToolResult> {
  try {
    const strokes = await api.getStrokeData(args.workout_id);
    return json({
      count: strokes.length,
      units: {
        t: 'tenths of seconds',
        d: 'decimeters',
        p: 'seconds per 500m',
        spm: 'strokes per minute',
        hr: 'beats per minute',
      },
      data: strokes,
    });
  } catch (err) {
    return errorResult((err as Error).message);
  }
}
