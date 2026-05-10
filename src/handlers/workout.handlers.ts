import type { Concept2Api } from '../concept2.api.js';

type ToolResult = {
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

export async function handleGetUserProfile(
  _args: unknown,
  api: Concept2Api,
): Promise<ToolResult> {
  try {
    const user = await api.getCurrentUser();
    return json(user);
  } catch (err) {
    return errorResult((err as Error).message);
  }
}

interface RecentWorkoutsArgs {
  limit?: number;
}

export async function handleGetRecentWorkouts(
  args: unknown,
  api: Concept2Api,
): Promise<ToolResult> {
  const { limit } = (args ?? {}) as RecentWorkoutsArgs;
  try {
    const workouts = await api.listResults({ per_page: limit ?? 20 });
    return json(workouts);
  } catch (err) {
    return errorResult((err as Error).message);
  }
}

interface DateRangeArgs {
  from: string;
  to: string;
  type?: 'rower' | 'skierg' | 'bike' | 'dynamic' | 'slides';
  limit?: number;
}

export async function handleGetWorkoutsByDateRange(
  args: unknown,
  api: Concept2Api,
): Promise<ToolResult> {
  const { from, to, type, limit } = (args ?? {}) as DateRangeArgs;
  if (!from || !to) {
    return errorResult('Both `from` and `to` are required (YYYY-MM-DD).');
  }
  try {
    const workouts = await api.listResults({
      from,
      to,
      type,
      per_page: limit ?? 50,
    });
    return json(workouts);
  } catch (err) {
    return errorResult((err as Error).message);
  }
}

interface WorkoutIdArgs {
  workout_id: number;
}

export async function handleGetWorkoutDetails(
  args: unknown,
  api: Concept2Api,
): Promise<ToolResult> {
  const { workout_id } = (args ?? {}) as WorkoutIdArgs;
  if (typeof workout_id !== 'number') {
    return errorResult('`workout_id` (integer) is required.');
  }
  try {
    const workout = await api.getResult(workout_id);
    return json(workout);
  } catch (err) {
    return errorResult((err as Error).message);
  }
}

export async function handleGetStrokeData(
  args: unknown,
  api: Concept2Api,
): Promise<ToolResult> {
  const { workout_id } = (args ?? {}) as WorkoutIdArgs;
  if (typeof workout_id !== 'number') {
    return errorResult('`workout_id` (integer) is required.');
  }
  try {
    const strokes = await api.getStrokeData(workout_id);
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
