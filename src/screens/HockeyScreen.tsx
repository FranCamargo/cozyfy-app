import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import StarryBackground from '../components/StarryBackground';
import HockeyGameScreen from './HockeyGameScreen';

interface HockeyScreenProps {
  onNavigateBack: () => void;
}

type GameMode = 'ai' | 'online';

const HockeyScreen: React.FC<HockeyScreenProps> = ({ onNavigateBack }) => {
  const [mode, setMode] = useState<GameMode>('ai');
  const [isPlaying, setIsPlaying] = useState(false);

  if (isPlaying) {
    return (
      <HockeyGameScreen
        gameMode={mode}
        onNavigateBack={() => setIsPlaying(false)}
      />
    );
  }

  const startGame = () => {
    setIsPlaying(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StarryBackground />
      <View style={styles.content}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#e8d5f5" />
          </TouchableOpacity>
          <Text style={styles.title}>Ice Hockey</Text>
          <View style={styles.backButton} />
        </View>

        {/* MODE SELECTION */}
        <View style={styles.modeSection}>
          <Text style={styles.modeTitle}>Escolha o Modo de Jogo</Text>

          <TouchableOpacity
            style={[styles.modeCard, styles.modeCardDisabled]}
            onPress={() => setMode('online')}
          >
            <LinearGradient
              // Card sempre em tons de cinza para indicar desativado
              colors={["#4b5563", "#111827"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modeCardGradient}
            >
              <View style={styles.ribbonContainer}>
                <Text style={styles.ribbonText}>Em breve</Text>
              </View>
              <Ionicons name="cloud-outline" size={40} color="#9ca3af" />
              <Text style={[styles.modeCardTitle, { color: '#e5e7eb' }]}>Jogo Online</Text>
              <Text style={[styles.modeCardDescription, { color: '#9ca3af' }]}>
                Jogue com amigos pela internet
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeCard, mode === 'ai' && styles.modeCardActive]}
            onPress={() => setMode('ai')}
          >
            <LinearGradient
              colors={mode === 'ai' ? ["#8b3a96", "#4c1d95"] : ["rgba(139, 58, 150, 0.3)", "rgba(76, 29, 149, 0.3)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modeCardGradient}
            >
              <Ionicons name="person" size={40} color={mode === 'ai' ? "#f9e8ff" : "#d1d5db"} />
              <Text style={[styles.modeCardTitle, mode === 'ai' && styles.modeCardTitleActive]}>IA</Text>
              <Text style={[styles.modeCardDescription, mode === 'ai' && styles.modeCardDescriptionActive]}>
                Jogue contra o computador
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* START BUTTON */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.startButton, mode === 'online' && styles.startButtonDisabled]}
            onPress={startGame}
            disabled={mode === 'online'}
          >
            <LinearGradient
              colors={["#8b3a96", "#4c1d95"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.startButtonGradient}
            >
              <Ionicons name="play" size={24} color="#f9e8ff" />
              <Text style={styles.startButtonText}>Começar Jogo</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e8d5f5',
    letterSpacing: 0.3,
  },
  modeSection: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e5e7eb',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  modeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(139, 58, 150, 0.4)',
  },
  modeCardDisabled: {
    borderColor: '#6b7280',
  },
  modeCardActive: {
    borderColor: 'rgba(139, 58, 150, 0.8)',
  },
  modeCardGradient: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  modeCardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#d1d5db',
  },
  modeCardTitleActive: {
    color: '#f9e8ff',
  },
  modeCardDescription: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
  modeCardDescriptionActive: {
    color: '#e5e7eb',
  },
  actions: {
    paddingTop: 16,
    alignItems: 'center',
  },
  startButton: {
    borderRadius: 999,
    overflow: 'hidden',
    width: '100%',
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
    gap: 10,
  },
  startButtonText: {
    color: '#f9e8ff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  ribbonContainer: {
    position: 'absolute',
    top: 8,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(250, 250, 250, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.9)',
  },
  ribbonText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#f9e8ff',
  },
});

export default HockeyScreen;
