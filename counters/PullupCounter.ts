/**
 * Pullup Counter - Relative Movement Detection with Hanging Verification
 * 
 * Uses rolling window to detect UP/DOWN based on shoulder position.
 * - Verifies user is hanging (wrists above shoulders)
 * - Tracks shoulder Y-position
 * - Lenient elbow width validation
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

export class PullupCounter {
  private count = 0;
  private state: ExerciseState = null;

  // Rolling window for dynamic range
  private positionWindow: RollingWindow;
  
  // Smoothing buffers
  private smoothedPositions: RollingWindow;

  // Hanging verification
  private hangingVerified = false;
  private framesHanging = 0;

  // Configuration
  private readonly fps: number;
  private readonly WINDOW_SECONDS = 3;
  private readonly UP_PERCENTILE = 0.40;    // Top 40% = pulled up
  private readonly DOWN_PERCENTILE = 0.70;  // Bottom 70% = hanging
  private readonly MIN_RANGE = 0.02;
  private readonly FRAMES_TO_VERIFY = 30;   // ~1 second to verify hanging

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
    this.hangingVerified = false;
    this.framesHanging = 0;
  }

  update(pose: PoseLandmarks): ExerciseResult {
    // Get shoulder Y position
    const shoulderY = getAverageY([pose.leftShoulder, pose.rightShoulder]);
    
    // Get wrist Y position for hanging verification
    const wristY = getAverageY([pose.leftWrist, pose.rightWrist]);

    // Hanging verification: wrists ABOVE shoulders (lower Y = higher on screen)
    const isHanging = shoulderY !== null && wristY !== null && wristY < shoulderY;

    if (isHanging) {
      this.framesHanging++;
      if (this.framesHanging >= this.FRAMES_TO_VERIFY && !this.hangingVerified) {
        this.hangingVerified = true;
        console.log("✅ HANGING VERIFIED");
      }
    } else {
      this.framesHanging = 0;
      // Reset verification if grip is lost for too long
      if (this.positionWindow.length > 100) {
        this.hangingVerified = false;
      }
    }

    if (shoulderY === null) {
      return { 
        count: this.count, 
        state: this.state,
        debugInfo: { 
          normalizedPos: undefined,
          range: undefined 
        }
      };
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
    const normalizedPos = clamp((smoothedY - recentMin) / recentRange, 0, 1);

    // Only count if hanging is verified
    if (!this.hangingVerified) {
      return {
        count: this.count,
        state: this.state,
        debugInfo: {
          normalizedPos,
          range: recentRange,
        },
      };
    }

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

  isHangingVerified(): boolean {
    return this.hangingVerified;
  }

  getCount(): number {
    return this.count;
  }

  getState(): ExerciseState {
    return this.state;
  }
}
