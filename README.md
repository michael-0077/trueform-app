# TrueForm - AI Fitness Coach

A React Native (Expo) app that uses MediaPipe Pose Detection to count exercise repetitions in real-time using your phone's camera.

## Supported Exercises

1. **Push-ups** - Tracks shoulder position and elbow angles
2. **Sit-ups** - Tracks shoulder position changes
3. **Pull-ups** - Includes hanging verification, tracks shoulder position
4. **Squats** - Tracks hip position and knee angles

## How It Works

The app uses a **relative movement detection** algorithm that:
- Uses a rolling 3-second window to detect UP/DOWN positions
- Adapts continuously to your actual movement - no calibration needed!
- Combines position tracking with joint angle verification for accuracy

### Algorithm Details

For each exercise, the counter tracks:
- **Body Position**: Normalized Y-coordinate of key landmarks (shoulders for upper body, hips for lower body)
- **Joint Angles**: Elbow angles for push-ups, knee angles for squats

The state machine:
1. **UP state**: Body in upper portion of recent range + joints extended
2. **DOWN state**: Body in lower portion of recent range + joints bent
3. **Rep counted**: Transition from DOWN → UP

## Project Structure

```
trueform-app/
├── App.tsx                    # Main app with navigation
├── ExerciseWebView.tsx        # Exercise tracking screen
├── pose.html                  # MediaPipe pose detection (WebView)
├── counters/
│   ├── index.ts               # Exports all counters
│   ├── ExerciseCounter.ts     # Base types and utilities
│   ├── PushupCounter.ts       # Push-up counting logic
│   ├── SitupCounter.ts        # Sit-up counting logic
│   ├── PullupCounter.ts       # Pull-up counting logic
│   └── SquatCounter.ts        # Squat counting logic
├── package.json
├── app.json
├── tsconfig.json
├── babel.config.js
└── index.ts
```

## Installation

1. Make sure you have Node.js and npm installed
2. Install Expo CLI if you haven't:
   ```bash
   npm install -g expo-cli
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npx expo start
   ```

## Usage

1. Login with any name/password (currently mock authentication)
2. Select an exercise from the main screen
3. Position yourself so the camera can see your full body
4. Start exercising! The app will count your reps and announce them

## Tips for Best Results

- **Good lighting**: Make sure you're well-lit for accurate pose detection
- **Full body visible**: Position the camera to see your entire body
- **Side view**: For push-ups and squats, a side angle works best
- **Front view**: For sit-ups and pull-ups, face the camera
- **Stable camera**: Mount your phone on a tripod or stable surface

## Configuration

Each counter has configurable thresholds in its respective file:

```typescript
// Example from PushupCounter.ts
private readonly UP_PERCENTILE = 0.30;     // Upper 30% = arms extended
private readonly DOWN_PERCENTILE = 0.55;   // Lower 55% = arms bent
private readonly ELBOWS_BENT = 115;        // Degrees
private readonly ELBOWS_EXTENDED = 140;    // Degrees
```

## Dependencies

- `expo` - React Native framework
- `expo-camera` - Camera permissions
- `expo-speech` - Text-to-speech for rep announcements
- `react-native-webview` - WebView for MediaPipe integration
- `@expo/vector-icons` - UI icons
- `@mediapipe/pose` - Pose detection (loaded via CDN in WebView)

## Troubleshooting

### Camera not working
- Check camera permissions in device settings
- Ensure no other app is using the camera

### Pose not detected
- Improve lighting
- Make sure full body is visible
- Move to a position with less background clutter

### Reps not counting
- Make sure you're completing the full range of motion
- Check the debug info (tap bug icon) to see if position/angles are being tracked

## License

MIT License
