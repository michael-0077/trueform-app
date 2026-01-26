/**
 * Pushup Counter - Relative Movement Detection
 * 
 * Uses rolling window to detect UP/DOWN based on RELATIVE position changes.
 * - Tracks shoulder Y-position
 * - Tracks elbow angles
 * - Adapts continuously to actual movement - no calibration needed!
 */

import {
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

export class PushupCounter {
  private count = 0;
  private state: ExerciseState = null;

  // Rolling window for dynamic range (3 seconds of history)
  private positionWindow: RollingWindow;
  
  // Smoothing buffers
  private smoothedPositions: RollingWindow;
  private smoothedAngles: RollingWindow;

  // Configuration
  private readonly fps: number;
  private readonly WINDOW_SECONDS = 3;
  private readonly UP_PERCENTILE = 0.30;     // In upper 30% of recent movement
  private readonly DOWN_PERCENTILE = 0.55;   // In lower 55% of recent movement
  private readonly ELBOWS_BENT = 115;        // Degrees - arms bent
  private readonly ELBOWS_EXTENDED = 140;    // Degrees - arms straight
  private readonly MIN_RANGE = 0.03;         // Minimum range to start counting

  constructor(fps: number = 30) {
    this.fps = fps;
    this.positionWindow = new RollingWindow(fps * this.WINDOW_SECONDS);
    this.smoothedPositions = new RollingWindow(8);
    this.smoothedAngles = new RollingWindow(6);
  }

  reset(): void {
    this.count = 0;
    this.state = null;
    this.positionWindow.clear();
    this.smoothedPositions.clear();
    this.smoothedAngles.clear();
  }

  update(pose: PoseLandmarks): ExerciseResult {
    // Calculate elbow angles
    const angles: number[] = [];

    if (isVisible(pose.leftShoulder) && isVisible(pose.leftElbow) && isVisible(pose.leftWrist)) {
      angles.push(
        calculateAngle(pose.leftShoulder!, pose.leftElbow!, pose.leftWrist!)
      );
    }

    if (isVisible(pose.rightShoulder) && isVisible(pose.rightElbow) && isVisible(pose.rightWrist)) {
      angles.push(
        calculateAngle(pose.rightShoulder!, pose.rightElbow!, pose.rightWrist!)
      );
    }

    // Smooth elbow angle
    let avgElbow: number | null = null;
    if (angles.length > 0) {
      const meanAngle = angles.reduce((a, b) => a + b, 0) / angles.length;
      this.smoothedAngles.push(meanAngle);
      avgElbow = this.smoothedAngles.mean();
    }

    // Get body Y position (shoulder average)
    const bodyY = getAverageY([pose.leftShoulder, pose.rightShoulder]);

    if (bodyY === null || avgElbow === null) {
      return { count: this.count, state: this.state };
    }

    // Smooth position
    this.smoothedPositions.push(bodyY);
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
    const normalizedPos = clamp((smoothedY - recentMin) / recentRange, 0, 1);

    // State detection
    const prevState = this.state;

    // Check conditions
    const bodyUp = normalizedPos < this.UP_PERCENTILE;
    const bodyDown = normalizedPos > this.DOWN_PERCENTILE;
    const elbowsExtended = avgElbow > this.ELBOWS_EXTENDED;
    const elbowsBent = avgElbow < this.ELBOWS_BENT;

    // State machine
    if (bodyUp && elbowsExtended) {
      this.state = "UP";
      if (prevState === "DOWN") {
        this.count++;
      }
    } else if (bodyDown && elbowsBent) {
      this.state = "DOWN";
    }

    return {
      count: this.count,
      state: this.state,
      debugInfo: {
        normalizedPos,
        angle: avgElbow,
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
