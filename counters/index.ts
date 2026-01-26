/**
 * TrueForm Exercise Counters
 * 
 * Export all exercise counter classes and types
 */

// Base types and utilities
export {
  Point,
  ExerciseState,
  ExerciseResult,
  PoseLandmarks,
  RollingWindow,
  calculateAngle,
  isVisible,
  getAverageY,
  clamp,
} from "./ExerciseCounter";

// Exercise counters
export { PushupCounter } from "./PushupCounter";
export { SitupCounter } from "./SitupCounter";
export { PullupCounter } from "./PullupCounter";
export { SquatCounter } from "./SquatCounter";

// Exercise types
export type ExerciseType = "pushups" | "situps" | "pullups" | "squats";

import { PushupCounter } from "./PushupCounter";
import { SitupCounter } from "./SitupCounter";
import { PullupCounter } from "./PullupCounter";
import { SquatCounter } from "./SquatCounter";

// Factory function to create the appropriate counter
export function createExerciseCounter(type: ExerciseType, fps: number = 30) {
  switch (type) {
    case "pushups":
      return new PushupCounter(fps);
    case "situps":
      return new SitupCounter(fps);
    case "pullups":
      return new PullupCounter(fps);
    case "squats":
      return new SquatCounter(fps);
    default:
      throw new Error(`Unknown exercise type: ${type}`);
  }
}
