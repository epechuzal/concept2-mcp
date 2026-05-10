import { z } from 'zod';
import { GetPetePlanProgressSchema, GetPetePlanWeekSchema, LinkWorkoutToPetePlanSchema } from '../schemas';
import { RowingApi } from '../rowing.api';

export async function handleGetPetePlanProgress(args: any, rowingApi: RowingApi) {
  try {
    GetPetePlanProgressSchema.parse(args);

    // Get current stats
    const stats = await rowingApi.getStats();

    // Get current week details
    const weekDetails = await rowingApi.getWeek(stats.currentWeek);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              currentWeek: stats.currentWeek,
              completionPercentage: stats.completionPercentage,
              weekDetails,
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

export async function handleGetPetePlanWeek(args: any, rowingApi: RowingApi) {
  try {
    const { week } = GetPetePlanWeekSchema.parse(args);

    const weekData = await rowingApi.getWeek(week);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(weekData, null, 2),
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

export async function handleLinkWorkoutToPetePlan(args: any, rowingApi: RowingApi) {
  try {
    const { week, day, workoutId } = LinkWorkoutToPetePlanSchema.parse(args);

    const completion = await rowingApi.completeDay(week, day, workoutId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              message: `Linked workout ${workoutId} to Week ${week} Day ${day}`,
              completion,
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
