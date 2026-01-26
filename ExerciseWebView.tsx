import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { WebView } from "react-native-webview";
import { useEffect, useRef, useState, useMemo } from "react";
import { Camera } from "expo-camera";
import * as Speech from "expo-speech";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Import counters
import { PushupCounter } from "./counters/PushupCounter";
import { SitupCounter } from "./counters/SitupCounter";
import { PullupCounter } from "./counters/PullupCounter";
import { SquatCounter } from "./counters/SquatCounter";
import { PoseLandmarks, ExerciseState } from "./counters/ExerciseCounter";

// Exercise type
export type ExerciseType = "pushups" | "situps" | "pullups" | "squats";

interface ExerciseWebViewProps {
  exerciseType: ExerciseType;
  onBack?: () => void;
}

// Exercise display info
const EXERCISE_INFO: Record<ExerciseType, { 
  name: string; 
  icon: string; 
  color: string;
  instructions: string;
}> = {
  pushups: {
    name: "Push-ups",
    icon: "dumbbell",
    color: "#4CAF50",
    instructions: "Get in plank position. Lower your body, then push back up.",
  },
  situps: {
    name: "Sit-ups",
    icon: "yoga",
    color: "#FF9800",
    instructions: "Lie on your back with knees bent. Sit up, then lie back down.",
  },
  pullups: {
    name: "Pull-ups",
    icon: "weight-lifter",
    color: "#9C27B0",
    instructions: "Hang from a bar. Pull yourself up until chin clears the bar.",
  },
  squats: {
    name: "Squats",
    icon: "human-male-height",
    color: "#2196F3",
    instructions: "Stand with feet shoulder-width apart. Lower your hips, then stand up.",
  },
};

export default function ExerciseWebView({ exerciseType, onBack }: ExerciseWebViewProps) {
  const [count, setCount] = useState(0);
  const [state, setState] = useState<ExerciseState>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [showDebug, setShowDebug] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const lastFrame = useRef(0);
  const fps = useRef(30);

  // Create the appropriate counter based on exercise type
  const counter = useMemo(() => {
    switch (exerciseType) {
      case "pushups":
        return new PushupCounter(30);
      case "situps":
        return new SitupCounter(30);
      case "pullups":
        return new PullupCounter(30);
      case "squats":
        return new SquatCounter(30);
      default:
        return new PushupCounter(30);
    }
  }, [exerciseType]);

  useEffect(() => {
    Camera.requestCameraPermissionsAsync();
  }, []);

  const handleReset = () => {
    counter.reset();
    setCount(0);
    setState(null);
    Speech.speak("Counter reset");
  };

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    const now = Date.now();
    // Throttle to ~30fps
    if (now - lastFrame.current < 33) return;
    lastFrame.current = now;

    try {
      const pose: PoseLandmarks & { fps?: number } = JSON.parse(event.nativeEvent.data);
      
      // Update fps if provided
      if (pose.fps) {
        fps.current = pose.fps;
      }

      // Check if we have the required landmarks
      if (!pose.leftShoulder && !pose.rightShoulder) {
        setDebugInfo("No pose detected");
        return;
      }

      setIsReady(true);

      // Update the counter
      const result = counter.update(pose);

      // Update state
      setState(result.state);

      // Update debug info
      if (result.debugInfo) {
        const { normalizedPos, angle, range } = result.debugInfo;
        setDebugInfo(
          `Pos: ${normalizedPos?.toFixed(2) ?? "N/A"} | ` +
          `Angle: ${angle?.toFixed(0) ?? "N/A"}° | ` +
          `Range: ${range?.toFixed(3) ?? "N/A"}`
        );
      }

      // Speak rep count when it changes
      if (result.count !== count) {
        setCount(result.count);
        Speech.speak(`${result.count}`);
      }
    } catch (error) {
      console.error("Error parsing pose data:", error);
    }
  };

  const exerciseInfo = EXERCISE_INFO[exerciseType];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: exerciseInfo.color }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <MaterialCommunityIcons 
            name={exerciseInfo.icon as any} 
            size={24} 
            color="#fff" 
          />
          <Text style={styles.headerText}>{exerciseInfo.name}</Text>
        </View>
        <TouchableOpacity 
          style={styles.debugButton} 
          onPress={() => setShowDebug(!showDebug)}
        >
          <MaterialCommunityIcons 
            name={showDebug ? "bug" : "bug-outline"} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>

      {/* Count Display */}
      <View style={styles.countContainer}>
        <Text style={styles.countLabel}>REPS</Text>
        <Text style={[styles.count, { color: exerciseInfo.color }]}>{count}</Text>
        <View style={[
          styles.stateIndicator, 
          { 
            backgroundColor: state === "UP" ? "#4CAF50" : 
                           state === "DOWN" ? "#F44336" : "#9E9E9E" 
          }
        ]}>
          <Text style={styles.stateText}>
            {state ?? "READY"}
          </Text>
        </View>
      </View>

      {/* Instructions */}
      {!isReady && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructions}>{exerciseInfo.instructions}</Text>
          <Text style={styles.waitingText}>Position yourself in front of the camera...</Text>
        </View>
      )}

      {/* Debug Info */}
      {showDebug && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>{debugInfo}</Text>
          <Text style={styles.debugText}>FPS: {fps.current}</Text>
        </View>
      )}

      {/* WebView for pose detection */}
      <View style={styles.webViewContainer}>
        <WebView
          style={styles.webView}
          originWhitelist={["*"]}
          source={require("./pose.html")}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          // iOS camera permissions
          allowsFullscreenVideo={true}
          mediaCapturePermissionGrantType="grant"
          // Android camera permissions
          androidLayerType="hardware"
          geolocationEnabled={false}
          // Allow camera/microphone
          allowFileAccess={true}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          onMessage={handleMessage}
          onError={(e) => console.error("WebView error:", e.nativeEvent)}
          onPermissionRequest={(request) => {
            // Auto-grant camera permission
            request.grant(request.resources);
          }}
        />
      </View>

      {/* Reset Button */}
      <TouchableOpacity 
        style={[styles.resetButton, { backgroundColor: exerciseInfo.color }]}
        onPress={handleReset}
      >
        <MaterialCommunityIcons name="refresh" size={24} color="#fff" />
        <Text style={styles.resetText}>Reset</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  debugButton: {
    padding: 5,
  },
  countContainer: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "#2a2a2a",
  },
  countLabel: {
    fontSize: 14,
    color: "#888",
    letterSpacing: 2,
  },
  count: {
    fontSize: 80,
    fontWeight: "bold",
  },
  stateIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  stateText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  instructionsContainer: {
    position: "absolute",
    top: "40%",
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 20,
    borderRadius: 15,
    zIndex: 10,
  },
  instructions: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  waitingText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },
  debugContainer: {
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 10,
    marginHorizontal: 10,
    borderRadius: 8,
  },
  debugText: {
    color: "#0f0",
    fontFamily: "monospace",
    fontSize: 12,
  },
  webViewContainer: {
    flex: 1,
    margin: 10,
    borderRadius: 15,
    overflow: "hidden",
  },
  webView: {
    flex: 1,
    backgroundColor: "black",
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 15,
    borderRadius: 30,
  },
  resetText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
