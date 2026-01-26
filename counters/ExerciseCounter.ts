/**
 * Base Exercise Counter - Common utilities and types for all exercise counters
 * 
 * Uses relative movement detection with rolling windows for adaptive thresholds.
 * No calibration needed - adapts continuously to actual movement!
 */

// Types for pose landmarks
export type Point = {
  x: number;
  y: number;
  visibility?: number;
};

export type ExerciseState = "UP" | "DOWN" | null;

export interface ExerciseResult {
  count: number;
  state: ExerciseState;
  debugInfo?: {
    normalizedPos?: number;
    angle?: number;
    range?: number;
  };
}

export interface PoseLandmarks {
  // Upper body
  leftShoulder?: Point;
  rightShoulder?: Point;
  leftElbow?: Point;
  rightElbow?: Point;
  leftWrist?: Point;
  rightWrist?: Point;
  // Lower body
  leftHip?: Point;
  rightHip?: Point;
  leftKnee?: Point;
  rightKnee?: Point;
  leftAnkle?: Point;
  rightAnkle?: Point;
}

/**
 * Rolling window buffer for tracking position history
 */
export class RollingWindow {
  private data: number[] = [];
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  push(value: number): void {
    this.data.push(value);
    if (this.data.length > this.maxSize) {
      this.data.shift();
    }
  }

  get length(): number {
    return this.data.length;
  }

  min(): number {
    return Math.min(...this.data);
  }

  max(): number {
    return Math.max(...this.data);
  }

  mean(): number {
    if (this.data.length === 0) return 0;
    return this.data.reduce((a, b) => a + b, 0) / this.data.length;
  }

  clear(): void {
    this.data = [];
  }
}

/**
 * Calculate angle at point B given three points A, B, C
 */
export function calculateAngle(a: Point, b: Point, c: Point): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) -
    Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) {
    angle = 360 - angle;
  }
  return angle;
}

/**
 * Check if a point has good visibility
 */
export function isVisible(point?: Point, threshold: number = 0.5): boolean {
  return point !== undefined && (point.visibility ?? 0) > threshold;
}

/**
 * Get average of visible points' Y coordinates
 */
export function getAverageY(points: (Point | undefined)[]): number | null {
  const visiblePoints = points.filter((p) => isVisible(p)) as Point[];
  if (visiblePoints.length === 0) return null;
  return visiblePoints.reduce((sum, p) => sum + p.y, 0) / visiblePoints.length;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
