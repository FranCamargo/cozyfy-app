import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PanGestureHandler, TapGestureHandler } from 'react-native-gesture-handler';
import StarryBackground from '../components/StarryBackground';

interface HomeScreenProps {
  onOpenLogin: () => void;
}

const SWIPE_THRESHOLD = 20;

export const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenLogin }) => {
  const handlePanEnd = (event: any) => {
    const { translationX, translationY } = event.nativeEvent;

    if (Math.abs(translationX) > SWIPE_THRESHOLD || Math.abs(translationY) > SWIPE_THRESHOLD) {
      onOpenLogin();
    }
  };

  return (
    <PanGestureHandler onEnded={handlePanEnd}>
      <TapGestureHandler onActivated={onOpenLogin}>
        <SafeAreaView style={styles.container}>
          <StarryBackground />
          <View style={styles.contentWrapper}>
            <Text style={styles.title}>CozyFy</Text>
            <Text style={styles.subtitle}>Your cozy place Anywhere!</Text>
            <Text style={styles.description}>Faça login tocando ou deslizando.</Text>
          </View>
        </SafeAreaView>
      </TapGestureHandler>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  contentWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    marginBottom: 450,
    fontSize: 60,
    fontFamily: 'AlmondMilky',
    color: '#d2a0f0',
  },
  subtitle: {
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  description: {
    maxWidth: 320,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: '#94a3b8',
  },
});

export default HomeScreen;
