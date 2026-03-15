import React, { useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Animated, Dimensions, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import ChatScreen from './src/screens/ChatScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import BreathScreen from './src/screens/BreathScreen';
import GamesScreen from './src/screens/GamesScreen';
import SnakeScreen from './src/screens/SnakeScreen';
import SudotrixScreen from './src/screens/SudotrixScreen';
import TicTacToeScreen from './src/screens/TicTacToeScreen';
import HockeyScreen from './src/screens/HockeyScreen';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const App: React.FC = () => {
  const [fontsLoaded] = useFonts({
    AlmondMilky: require('./assets/Almond Milky.otf'),
  });

  const [loginVisible, setLoginVisible] = useState(false);
  const [username, setUsername] = useState('');
  const [currentScreen, setCurrentScreen] = useState<'home' | 'dashboard' | 'chat' | 'breath' | 'games' | 'snake' | 'sudotrix' | 'tictactoe' | 'hockey'>('home');
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  if (!fontsLoaded) {
    return null;
  }

  const openLogin = () => {
    if (loginVisible) return;

    setLoginVisible(true);
    slideAnim.setValue(SCREEN_HEIGHT);

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  const handleLoginSuccess = (user: string) => {
    setUsername(user);
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      setLoginVisible(false);
      setCurrentScreen('dashboard');
    });
  };

  const handleNavigateToChat = () => {
    setCurrentScreen('chat');
  };

  const handleBackFromChat = () => {
    setCurrentScreen('dashboard');
  };

  const handleNavigateToBreath = () => {
    setCurrentScreen('breath');
  };

  const handleBackFromBreath = () => {
    setCurrentScreen('dashboard');
  };

  const handleNavigateToGames = () => {
    setCurrentScreen('games');
  };

  const handleBackFromGames = () => {
    setCurrentScreen('dashboard');
  };

  const handleNavigateToSnake = () => {
    setCurrentScreen('snake');
  };

  const handleBackFromSnake = () => {
    setCurrentScreen('games');
  };

  const handleNavigateToSudotrix = () => {
    setCurrentScreen('sudotrix');
  };

  const handleBackFromSudotrix = () => {
    setCurrentScreen('games');
  };

  const handleNavigateToTicTacToe = () => {
    setCurrentScreen('tictactoe');
  };

  const handleBackFromTicTacToe = () => {
    setCurrentScreen('games');
  };

  const handleNavigateToHockey = () => {
    setCurrentScreen('hockey');
  };

  const handleBackFromHockey = () => {
    setCurrentScreen('games');
  };

  const handleLogout = () => {
    setUsername('');
    setCurrentScreen('home');
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="light" />
      {currentScreen === 'home' && <HomeScreen onOpenLogin={openLogin} />}
      {currentScreen === 'dashboard' && (
        <DashboardScreen
          username={username}
          onNavigateToChat={handleNavigateToChat}
          onNavigateToBreath={handleNavigateToBreath}
          onNavigateToGames={handleNavigateToGames}
          onLogout={handleLogout}
        />
      )}
      {currentScreen === 'chat' && <ChatScreen onBack={handleBackFromChat} />}
      {currentScreen === 'breath' && <BreathScreen onBack={handleBackFromBreath} />}
      {currentScreen === 'games' && (
        <GamesScreen
          onBack={handleBackFromGames}
          onPlaySnake={handleNavigateToSnake}
          onPlaySudotrix={handleNavigateToSudotrix}
          onPlayTicTacToe={handleNavigateToTicTacToe}
          onPlayHockey={handleNavigateToHockey}
        />
      )}
      {currentScreen === 'snake' && <SnakeScreen onNavigateBack={handleBackFromSnake} />}
      {currentScreen === 'sudotrix' && <SudotrixScreen onNavigateBack={handleBackFromSudotrix} />}
      {currentScreen === 'tictactoe' && <TicTacToeScreen onNavigateBack={handleBackFromTicTacToe} />}
      {currentScreen === 'hockey' && <HockeyScreen onNavigateBack={handleBackFromHockey} />}
      {loginVisible && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LoginScreen onSuccess={handleLoginSuccess} />
        </Animated.View>
      )}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#270258',
  },
});

export default App;
