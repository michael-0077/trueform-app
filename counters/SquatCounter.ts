/**
 * Squat Counter - Relative Movement Detection
 * 
 * Uses rolling window to detect UP/DOWN based on hip position and knee angles.
 * Same approach as pushup counter but for lower body:
 * - Tracks hip Y-position (like shoulder for pushups)
 * - Tracks knee angles (like elbow for pushups)
 * - Adapts continuously to actual movement!
 */

import {
  ExerciseState,
  ExerciseResult,
  PoseLandmarks,
  RollingWindow,
  calculateAngle,
  isVisible,
  getAverageY,
  clamp,
} from "./ExerciseCounter";

export class SquatCounter {
  private count = 0;
  private state: ExerciseState = null;

  // Rolling window for dynamic range
  private positionWindow: RollingWindow;
  
  // Smoothing buffers
  private smoothedPositions: RollingWindow;
  private smoothedAngles: RollingWindow;

  // Configuration
  private readonly fps: number;
  private readonly WINDOW_SECONDS = 3;
  private readonly UP_PERCENTILE = 0.25;    // Upper 25% = standing
  private readonly DOWN_PERCENTILE = 0.60;  // Lower 60% = squatting
  private readonly KNEES_BENT = 100;        // Degrees - deep squat
  private readonly KNEES_EXTENDED = 160;    // Degrees - standing
  private readonly MIN_RANGE = 0.04;

  constructor(fps: number = 30) {
    this.fps = fps;
    this.positionWindow = new RollingWindow(fps * this.WINDOW_SECONDS);
    this.smoothedPositions = new RollingWindow(10);
    this.smoothedAngles = new RollingWindow(8);
  }

  reset(): void {
    this.count = 0;
    this.state = null;
    this.positionWindow.clear();
    this.smoothedPositions.clear();
    this.smoothedAngles.clear();
  }

  update(pose: PoseLandmarks): ExerciseResult {
    // Calculate knee angles
    const angles: number[] = [];

    // Left leg: hip -> knee -> ankle
    if (isVisible(pose.leftHip) && isVisible(pose.leftKnee) && isVisible(pose.leftAnkle)) {
      angles.push(
        calculateAngle(pose.leftHip!, pose.leftKnee!, pose.leftAnkle!)
      );
    }

    // Right leg: hip -> knee -> ankle
    if (isVisible(pose.rightHip) && isVisible(pose.rightKnee) && isVisible(pose.rightAnkle)) {
      angles.push(
        calculateAngle(pose.rightHip!, pose.rightKnee!, pose.rightAnkle!)
      );
    }

    // Smooth knee angle
    let avgKnee: number | null = null;
    if (angles.length > 0) {
      const meanAngle = angles.reduce((a, b) => a + b, 0) / angles.length;
      this.smoothedAngles.push(meanAngle);
      avgKnee = this.smoothedAngles.mean();
    }

    // Get hip Y position
    const hipY = getAverageY([pose.leftHip, pose.rightHip]);

    if (hipY === null || avgKnee === null) {
      return { count: this.count, state: this.state };
    }

    // Smooth position
    this.smoothedPositions.push(hipY);
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
    const kneesExtended = avgKnee > this.KNEES_EXTENDED;
    const kneesBent = avgKnee < this.KNEES_BENT;

    // State machine
    if (bodyUp && kneesExtended) {
      this.state = "UP";
      if (prevState === "DOWN") {
        this.count++;
      }
    } else if (bodyDown && kneesBent) {
      this.state = "DOWN";
    }

    return {
      count: this.count,
      state: this.state,
      debugInfo: {
        normalizedPos,
        angle: avgKnee,
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
