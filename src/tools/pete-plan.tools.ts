export const getPetePlanProgressTool = {
  name: 'get_pete_plan_progress',
  description: `Get current Pete Plan progress and status.

Returns:
- Current week in the 24-week program
- Completion percentage
- Details for the current week (prescribed workouts, completion status, linked actual workouts)

Use this when the user asks:
- "where am I in Pete Plan"
- "what's my training progress"
- "how far along am I"
- "what's my current week"`,
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export const getPetePlanWeekTool = {
  name: 'get_pete_plan_week',
  description: `Get details for a specific Pete Plan week.

Returns:
- All prescribed workouts for the week (required and optional)
- Completion status for each day
- Linked actual workouts with summary stats

Use this when the user asks:
- "show me week 5"
- "what's prescribed for week 12"
- "what are the workouts in week 8"`,
  inputSchema: {
    type: 'object',
    properties: {
      week: {
        type: 'number',
        description: 'Pete Plan week number (1-24)',
      },
    },
    required: ['week'],
  },
};

export const linkWorkoutToPetePlanTool = {
  name: 'link_workout_to_pete_plan',
  description: `Link an existing Concept2 workout to a Pete Plan week/day to mark it as completed.

Creates a completion record associating the workout with the specified schedule slot.
Each week/day slot can only have one linked workout (unique constraint).

Use this when the user asks:
- "link workout 132 to week 3 day 2"
- "mark week 3 day 2 as done with workout 132"
- "connect my last workout to the pete plan"`,
  inputSchema: {
    type: 'object',
    properties: {
      week: {
        type: 'number',
        description: 'Pete Plan week number (1-24)',
      },
      day: {
        type: 'number',
        description: 'Day within the week (1-5)',
      },
      workoutId: {
        type: 'number',
        description: 'Concept2 workout ID to link',
      },
    },
    required: ['week', 'day', 'workoutId'],
  },
};
