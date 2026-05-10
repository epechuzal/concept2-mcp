import * as petePlanTools from './pete-plan.tools';
import * as workoutTools from './workout.tools';

export const allTools = [
  petePlanTools.getPetePlanProgressTool,
  petePlanTools.getPetePlanWeekTool,
  petePlanTools.linkWorkoutToPetePlanTool,
  workoutTools.getRecentWorkoutsTool,
  workoutTools.getWorkoutDetailsTool,
  workoutTools.getWorkoutsByDateRangeTool,
];
