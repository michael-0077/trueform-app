import { StatusBar } from 'expo-status-bar';
import ExerciseWebView, { ExerciseType } from './ExerciseWebView';
import { StyleSheet, Text, View, TouchableOpacity, Animated, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';


function WelcomeScreen({ slideAnim, onLogin }: { slideAnim: Animated.Value; onLogin: (name: string, password: string) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(true);
  const [showSignUpForm, setShowSignUpForm] = useState(false);
  const formOpacity = useRef(new Animated.Value(1)).current;

  const handleSignUpPress = () => {
    setShowLoginForm(false);
    setShowSignUpForm(true);
  };

  const handleBackToLogin = () => {
    setShowSignUpForm(false);
    setShowLoginForm(true);
  };

  const handleSignUp = (name: string, email: string, password: string) => {
    console.log('Sign up:', { name, email, password });
    // For now, just log the user in after sign up
    onLogin(name, password);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.welcomeContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View style={[styles.welcomeContent, { transform: [{ translateY: slideAnim }] }]}>
        <Text style={styles.welcomeTitle}>Welcome to TrueForm!</Text>

        {showLoginForm && (
          <Animated.View style={[styles.loginForm, { opacity: formOpacity }]}>
            <TextInput
              style={[styles.input, { width: '100%' }]}
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, { width: '100%', marginBottom: 0 }]}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showLoginPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowLoginPassword(!showLoginPassword)}
              >
                <MaterialCommunityIcons 
                  name={showLoginPassword ? "eye-off" : "eye"} 
                  size={24} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => onLogin(name, password)}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
            
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                <Text style={styles.signUpText}>Is this your first time? </Text>
                <TouchableOpacity onPress={handleSignUpPress}>
                  <Text style={[styles.signUpText, { textDecorationLine: 'underline' }]}>Sign up</Text>
                </TouchableOpacity>
              </View>
          </Animated.View>
        )}

        {showSignUpForm && (
          <Animated.View style={[styles.loginForm, { opacity: formOpacity }]}>
            <TextInput
              style={[styles.input, { width: '100%' }]}
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            
            <TextInput
              style={[styles.input, { width: '100%' }]}
              placeholder="Enter your email"
              onChangeText={(text) => setEmail(text)}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, { width: '100%', marginBottom: 0 }]}
                placeholder="Enter your password"
                onChangeText={(text) => setPassword(text)}
                secureTextEntry={!showSignUpPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowSignUpPassword(!showSignUpPassword)}
              >
                <MaterialCommunityIcons 
                  name={showSignUpPassword ? "eye-off" : "eye"} 
                  size={24} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, { width: '100%', marginBottom: 0 }]}
                placeholder="Confirm your password"
                onChangeText={(text) => setConfirmPassword(text)}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <MaterialCommunityIcons 
                  name={showConfirmPassword ? "eye-off" : "eye"} 
                  size={24} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => handleSignUp(name, email, password)}
            >
              <Text style={styles.loginButtonText}>Sign Up</Text>
            </TouchableOpacity>
            
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                <Text style={styles.signUpText}>Already have an account? </Text>
                <TouchableOpacity onPress={handleBackToLogin}>
                  <Text style={[styles.signUpText, { textDecorationLine: 'underline' }]}>Login</Text>
                </TouchableOpacity>
              </View>
          </Animated.View>
        )}
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'loading' | 'welcome' | 'main' | 'exercise'>('loading');
  const [userName, setUserName] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType>('pushups');
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideDownAnim = useRef(new Animated.Value(-500)).current;
  const slideLeftAnim = useRef(new Animated.Value(0)).current;
  const mainSlideAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    const timer = setTimeout(() => {
      // Fade out loading screen
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setCurrentScreen('welcome');
        // Slide down welcome screen
        Animated.timing(slideDownAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }).start();
      });
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (name: string, password: string) => {
    if (name && password) {
      setUserName(name);
      // Slide out welcome screen to the left
      Animated.timing(slideLeftAnim, {
        toValue: -500,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setCurrentScreen('main');
        // Slide in main screen from right
        mainSlideAnim.setValue(500);
        Animated.timing(mainSlideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }
  };
  
  const exercises: { id: ExerciseType; name: string; icon: string; color: string }[] = [
    { id: 'pushups', name: 'Push-ups', icon: 'dumbbell', color: '#4CAF50' },
    { id: 'situps', name: 'Sit-ups', icon: 'yoga', color: '#FF9800' },
    { id: 'pullups', name: 'Pull-ups', icon: 'weight-lifter', color: '#9C27B0' },
    { id: 'squats', name: 'Squats', icon: 'human-male-height', color: '#2196F3' }
  ];

  const handleExercisePress = (exerciseId: ExerciseType) => {
    console.log(`Selected exercise: ${exerciseId}`);
    setSelectedExercise(exerciseId);
    setCurrentScreen('exercise');
  };

  // Render different screens based on current state
  if (currentScreen === 'loading') {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
          <View style={styles.loadingContent}>
            <Text style={styles.loadingTitle}>TrueForm</Text>
            <Text style={styles.loadingSubtitle}>Your AI Fitness Coach</Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  if (currentScreen === 'welcome') {
    return (
      <View style={styles.container}>
        <WelcomeScreen slideAnim={slideDownAnim} onLogin={handleLogin} />
      </View>
    );
  }

  if (currentScreen === 'exercise') {
    return (
      <ExerciseWebView 
        exerciseType={selectedExercise}
        onBack={() => setCurrentScreen('main')} 
      />
    );
  }

  if (currentScreen === 'main') {
    return (
      <Animated.View style={[styles.container, { transform: [{ translateX: mainSlideAnim }] }]}>
        <Text style={styles.welcomeText}>Welcome,</Text>
        <Text style={styles.userName}>{userName}!</Text>
        <Text style={styles.trainingText}>What are we training today?</Text>
        
        <View style={styles.exercisesContainer}>
          {exercises.map((exercise) => (
            <TouchableOpacity 
              key={exercise.id}
              style={styles.exerciseButton}
              onPress={() => handleExercisePress(exercise.id)}
            >
              <View style={[styles.iconContainer, { borderColor: exercise.color }]}>
                <MaterialCommunityIcons 
                  name={exercise.icon as any} 
                  size={60}  
                  color={exercise.color} 
                />
              </View>
              <Text style={styles.exerciseText}>{exercise.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <StatusBar style="auto" />
      </Animated.View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 100
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#343434',
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  welcomeContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#343434',
    textAlign: 'center',
    marginBottom: 20,
  },
  loginForm: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 150,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  loginButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signUpText: {
    color: '#4CAF50',
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 28,
    color: '#333',
    textAlign: 'center',
    padding: 10,
    marginBottom: -10
  },
  userName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    padding: 10,
    marginBottom: 10
  },
  trainingText: {
    fontSize: 20,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  exercisesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 20,
  },
  exerciseButton: {
    alignItems: 'center',
    width: '45%',
    marginBottom: 25,
    padding: 10,
  },
  iconContainer: {
    backgroundColor: '#f5f5f5',
    width: 130, 
    height: 130, 
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
  },
  exerciseText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    padding: 5,
  },
});
