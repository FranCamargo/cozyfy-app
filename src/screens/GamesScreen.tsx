import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import StarryBackground from '../components/StarryBackground';

interface GamesScreenProps {
  onBack: () => void;
  onPlaySnake?: () => void;
  onPlaySudotrix?: () => void;
  onPlayTicTacToe?: () => void;
  onPlayHockey?: () => void;
}

interface Game {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  modes: string[];
}

const { width } = Dimensions.get('window');

const GAMES: Game[] = [
  {
    id: 'tictactoe',
    title: 'Jogo da Velha',
    description: 'Clássico jogo de estratégia',
    icon: 'grid-outline',
    color: '#8b3a96',
    modes: ['Local', 'Contra IA'],
  },
  {
    id: 'snake',
    title: 'Snake',
    description: 'Jogue como a cobra voraz',
    icon: 'extension-puzzle-outline',
    color: '#7e2e8f',
    modes: ['Jogador Único'],
  },
  {
    id: 'sudotrix',
    title: 'SudoTrix',
    description: 'Desafie seu raciocínio lógico',
    icon: 'layers-outline',
    color: '#9245a0',
    modes: ['Jogador Único'],
  },
  {
    id: 'hockey',
    title: 'Ice Hockey',
    description: 'Hóquei de mesa com IA e local',
    icon: 'disc-outline',
    color: '#5b21b6',
    modes: ['Local', 'Contra IA'],
  },
];

const GamesScreen: React.FC<GamesScreenProps> = ({ onBack, onPlaySnake, onPlaySudotrix, onPlayTicTacToe, onPlayHockey }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleGamePress = (gameId: string) => {
    console.log('Game pressed:', gameId);
    switch (gameId) {
      case 'snake':
        onPlaySnake?.();
        break;
      case 'sudotrix':
        onPlaySudotrix?.();
        break;
      case 'tictactoe':
        onPlayTicTacToe?.();
        break;
      case 'hockey':
        onPlayHockey?.();
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StarryBackground />
      <View style={styles.scrollWrapper}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* HEADER */}
          <View style={styles.headerSection}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                onPress={onBack}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.7}
              >
                <Animated.View
                  style={{
                    transform: [{ scale: scaleAnim }],
                  }}
                >
                  <View style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#e8d5f5" />
                  </View>
                </Animated.View>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Hub de Jogos</Text>
              <View style={{ width: 44 }} />
            </View>
            <Text style={styles.headerSubtitle}>
              Escolha um jogo e divirta-se!
            </Text>
          </View>

          {/* GAMES LIST */}
          <View style={styles.gamesListContainer}>
            {GAMES.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onPress={() => handleGamePress(game.id)}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

interface GameCardProps {
  game: Game;
  onPress: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 1.05,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.gameCardWrapper}
      activeOpacity={0.9}
    >
      <Animated.View
        style={[
          styles.gameCard,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <StarryBackground />
        <LinearGradient
          colors={['rgba(34, 13, 119, 0.55)', 'rgba(0, 0, 0, 0.3)', 'rgba(109, 39, 139, 0.29)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardIconSection}>
              <LinearGradient
                colors={['rgba(90, 46, 109, 0.3)', 'rgba(139, 58, 150, 0.3)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconContainer}
              >
                <Ionicons name={game.icon as any} size={40} color="#e8d5f5" />
              </LinearGradient>
            </View>
            <View style={styles.cardTextSection}>
              <Text style={styles.cardTitle}>{game.title}</Text>
              <Text style={styles.cardDescription}>{game.description}</Text>
              <View style={styles.modesContainer}>
                {game.modes.map((mode, index) => (
                  <View key={index} style={styles.modeTag}>
                    <Text style={styles.modeText}>{mode}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.cardArrowSection}>
              <Ionicons name="chevron-forward" size={24} color="#b78fd5" />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollWrapper: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },

  // HEADER
  headerSection: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(90, 46, 109, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(183, 143, 213, 0.3)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e8d5f5',
    letterSpacing: 0.3,
    fontFamily: 'AlmondMilky',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#a89cc4',
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  // GAMES LIST
  gamesListContainer: {
    gap: 12,
  },
  gameCardWrapper: {
    marginBottom: 4,
  },
  gameCard: {
    borderRadius: 20,
    overflow: 'hidden',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardGradient: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardIconSection: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTextSection: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e8d5f5',
    letterSpacing: 0.3,
  },
  cardDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: '#a89cc4',
    letterSpacing: 0.2,
  },
  modesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  modeTag: {
    backgroundColor: 'rgba(139, 58, 150, 0.4)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(183, 143, 213, 0.3)',
  },
  modeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#e8d5f5',
    letterSpacing: 0.1,
  },
  cardArrowSection: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GamesScreen;
