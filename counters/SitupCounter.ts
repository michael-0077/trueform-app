/**
 * Situp Counter - Relative Movement Detection
 * 
 * Uses rolling window to detect UP/DOWN based on shoulder position.
 * - Tracks shoulder Y-position (goes UP when sitting up)
 * - Simple position-focused approach
 * - Adapts continuously to actual movement!
 */

import {
  ExerciseState,
  ExerciseResult,
  PoseLandmarks,
  RollingWindow,
  getAverageY,
  clamp,
} from "./ExerciseCounter";

export class SitupCounter {
  private count = 0;
  private state: ExerciseState = null;

  // Rolling window for dynamic range
  private positionWindow: RollingWindow;
  
  // Smoothing buffers
  private smoothedPositions: RollingWindow;

  // Configuration
  private readonly fps: number;
  private readonly WINDOW_SECONDS = 3;
  private readonly UP_PERCENTILE = 0.40;    // Upper 40% = sitting up
  private readonly DOWN_PERCENTILE = 0.70;  // Lower 70% = lying down
  private readonly MIN_RANGE = 0.03;

  constructor(fps: number = 30) {
    this.fps = fps;
    this.positionWindow = new RollingWindow(fps * this.WINDOW_SECONDS);
    this.smoothedPositions = new RollingWindow(10);
  }

  reset(): void {
    this.count = 0;
    this.state = null;
    this.positionWindow.clear();
    this.smoothedPositions.clear();
  }

  update(pose: PoseLandmarks): ExerciseResult {
    // Get shoulder Y position
    const shoulderY = getAverageY([pose.leftShoulder, pose.rightShoulder]);

    if (shoulderY === null) {
      return { count: this.count, state: this.state };
    }

    // Smooth position
    this.smoothedPositions.push(shoulderY);
    const smoothedY = this.smoothedPositions.mean();

    // Add to rolling window
    this.positionWindow.push(smoothedY);

    // Need at least 1 second of data
    if (this.positionWindow.length < this.fps) {
      return { count: this.count, state: this.state };
    }

    // Dynamic range calculation
    const recentMin = this.positionWindow.min();
    const recentMax = this.positionWindow.max();
    const recentRange = recentMax - recentMin;

    if (recentRange < this.MIN_RANGE) {
      return { 
        count: this.count, 
        state: this.state,
        debugInfo: { range: recentRange }
      };
    }

    // Normalize based on recent range
    // For situps: lower Y = higher on screen = sitting UP
    const normalizedPos = clamp((smoothedY - recentMin) / recentRange, 0, 1);

    // State detection
    const prevState = this.state;

    // Check conditions
    const bodyUp = normalizedPos < this.UP_PERCENTILE;
    const bodyDown = normalizedPos > this.DOWN_PERCENTILE;

    // State machine
    if (bodyUp) {
      this.state = "UP";
      if (prevState === "DOWN") {
        this.count++;
      }
    } else if (bodyDown) {
      this.state = "DOWN";
    }

    return {
      count: this.count,
      state: this.state,
      debugInfo: {
        normalizedPos,
        range: recentRange,
      },
    };
  }

  getCount(): number {
    return this.count;
  }

  getState(): ExerciseState {
    return this.state;
  }
}
