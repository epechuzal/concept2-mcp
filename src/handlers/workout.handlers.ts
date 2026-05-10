import { z } from 'zod';
import {
  GetRecentWorkoutsSchema,
  GetWorkoutDetailsSchema,
  GetWorkoutsByDateRangeSchema,
} from '../schemas';
import { RowingApi } from '../rowing.api';

export async function handleGetRecentWorkouts(args: any, rowingApi: RowingApi) {
  try {
    const { limit } = GetRecentWorkoutsSchema.parse(args);

    // Workouts include all entity fields (analytics, petePlan, etc.)
    const workouts = await rowingApi.getWorkouts({ limit });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              count: workouts.length,
              workouts,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: 'Invalid input',
                details: error.issues,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
    throw error;
  }
}

export async function handleGetWorkoutDetails(args: any, rowingApi: RowingApi) {
  let workoutId: number | undefined;
  try {
    const parsed = GetWorkoutDetailsSchema.parse(args);
    workoutId = parsed.workoutId;

    // Workout includes all entity fields (analytics, petePlan, etc.)
    const workout = await rowingApi.getWorkout(workoutId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(workout, null, 2),
        },
      ],
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: 'Invalid input',
                details: error.issues,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }

    // Handle 404 gracefully
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any;
      if (axiosError.response?.status === 404) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: 'Workout not found',
                  workoutId: workoutId,
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    }

    throw error;
  }
}

export async function handleGetWorkoutsByDateRange(args: any, rowingApi: RowingApi) {
  try {
    const { startDate, endDate, type } = GetWorkoutsByDateRangeSchema.parse(args);

    // Workouts include all entity fields (analytics, petePlan, etc.)
    let workouts = await rowingApi.getWorkouts({
      from: startDate,
      to: endDate,
    });

    // Client-side type filtering if provided (API may not support it yet)
    if (type) {
      workouts = workouts.filter((w: any) => w.type && w.type.toLowerCase() === type.toLowerCase());
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              dateRange: { startDate, endDate },
              count: workouts.length,
              workouts,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: 'Invalid input',
                details: error.issues,
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
    throw error;
  }
}
