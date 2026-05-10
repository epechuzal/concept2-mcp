import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { workoutTools } from './workout.tools.js';

export const allTools: Tool[] = [...workoutTools];

export { workoutTools };
