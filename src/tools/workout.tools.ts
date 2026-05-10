export const getRecentWorkoutsTool = {
  name: 'get_recent_workouts',
  description: `Get recent workout history with summary statistics.

Returns:
- List of recent workouts with key metrics:
  - Date and time
  - Distance (meters)
  - Duration (seconds)
  - Pace (split per 500m)
  - Average power (watts)
  - Average stroke rate (SPM)
  - Average heart rate (BPM)

Use this when the user asks:
- "what were my recent workouts"
- "show me my last 5 workouts"
- "recent rowing sessions"`,
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Number of recent workouts to return (default: 10)',
      },
    },
  },
};

export const getWorkoutDetailsTool = {
  name: 'get_workout_details',
  description: `Get full details for a specific workout.

Returns complete workout information including:
- All summary metrics (distance, time, pace, power, heart rate, stroke rate)
- Workout type and date
- Split data (if available)
- Heart rate zones
- Any additional metrics from Concept2

Use this when the user asks:
- "show me workout details for ID 123"
- "tell me more about workout 456"
- "full breakdown of workout X"`,
  inputSchema: {
    type: 'object',
    properties: {
      workoutId: {
        type: 'number',
        description: 'The ID of the workout to retrieve',
      },
    },
    required: ['workoutId'],
  },
};

export const getWorkoutsByDateRangeTool = {
  name: 'get_workouts_by_date_range',
  description: `Get workouts within a date range with optional type filter.

Returns:
- List of workouts in the specified date range
- Each workout includes summary stats (distance, pace, power, heart rate)
- Can filter by workout type (e.g., "interval", "steady state")

Use this when the user asks:
- "workouts from last month"
- "show me January workouts"
- "all interval workouts in December"
- "distance rows from last week"`,
  inputSchema: {
    type: 'object',
    properties: {
      startDate: {
        type: 'string',
        description: 'Start date (YYYY-MM-DD)',
      },
      endDate: {
        type: 'string',
        description: 'End date (YYYY-MM-DD)',
      },
      type: {
        type: 'string',
        description: 'Optional filter by workout type',
      },
    },
    required: ['startDate', 'endDate'],
  },
};
