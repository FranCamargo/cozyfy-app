import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  StyleSheet,
  Dimensions,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import StarryBackground from '../components/StarryBackground';

interface BreathScreenProps {
  onBack: () => void;
}

interface BreathMode {
  name: 'calm' | 'sleep';
  label: string;
  description: string;
  inhale: number; // segundos
  hold: number;
  exhale: number;
}

const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = 300;

const BREATH_MODES: Record<string, BreathMode> = {
  calm: {
    name: 'calm',
    label: 'Acalmar',
    description: '4-4-4',
    inhale: 4,
    hold: 4,
    exhale: 4,
  },
  sleep: {
    name: 'sleep',
    label: 'Dormir',
    description: '4-7-8',
    inhale: 4,
    hold: 7,
    exhale: 8,
  },
};

const BreathScreen: React.FC<BreathScreenProps> = ({ onBack }) => {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const breatheTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Array de animated values para os múltiplos círculos
  const circleAnims = useRef(
    Array.from({ length: 8 }, () => new Animated.Value(0.6))
  ).current;

  const [currentMode, setCurrentMode] = useState<BreathMode>(
    BREATH_MODES.calm
  );
  const [isBreathing, setIsBreathing] = useState(false);
  const [instruction, setInstruction] = useState('Toque para começar');
  const [cycleCount, setCycleCount] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  const totalCycleTime =
    currentMode.inhale + currentMode.hold + currentMode.exhale;
  const animationDuration = totalCycleTime * 1000;

  // Timer da sessão
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isBreathing) {
      interval = setInterval(() => {
        setTotalTime((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isBreathing]);

  // Animação de respiração
  useEffect(() => {
    if (!isBreathing) {
      // Limpar todos os timers
      breatheTimersRef.current.forEach(timer => clearTimeout(timer));
      breatheTimersRef.current = [];
      // Reset para posição inicial
      circleAnims.forEach(anim => {
        Animated.timing(anim, {
          toValue: 0.6,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
      return;
    }

    const breatheSequence = () => {
      // Inspirar (inhale) - expandir todos os círculos
      circleAnims.forEach((anim, index) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: currentMode.inhale * 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start();
      });

      setInstruction('Inspire');

      // Prender a respiração (hold)
      const holdTimer = setTimeout(() => {
        setInstruction('Segure');
      }, currentMode.inhale * 1000);
      breatheTimersRef.current.push(holdTimer);

      // Expirar (exhale) - contrair todos os círculos
      const exhaleTimer = setTimeout(() => {
        circleAnims.forEach(anim => {
          Animated.timing(anim, {
            toValue: 0.6,
            duration: currentMode.exhale * 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }).start();
        });
        setInstruction('Expire');
      }, (currentMode.inhale + currentMode.hold) * 1000);
      breatheTimersRef.current.push(exhaleTimer);

      // Iniciar novo ciclo
      const cycleTimer = setTimeout(() => {
        setCycleCount((prev) => prev + 1);
        breatheSequence();
      }, animationDuration);
      breatheTimersRef.current.push(cycleTimer);
    };

    breatheSequence();

    return () => {
      breatheTimersRef.current.forEach(timer => clearTimeout(timer));
      breatheTimersRef.current = [];
    };
  }, [isBreathing, currentMode, animationDuration, circleAnims]);

  const handleStartStop = () => {
    Animated.spring(pressAnim, {
      toValue: 0.8,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(pressAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    });

    if (isBreathing) {
      // Parar a respiração
      setIsBreathing(false);
      breatheTimersRef.current.forEach(timer => clearTimeout(timer));
      breatheTimersRef.current = [];
      setInstruction('Toque para começar');
    } else {
      // Iniciar a respiração
      setIsBreathing(true);
      setCycleCount(0);
      setTotalTime(0);
    }
  };

  const handleModeChange = (mode: BreathMode) => {
    if (!isBreathing) {
      setCurrentMode(mode);
      // Resetar ciclo, tempo e instrução quando mudar de modo
      breatheTimersRef.current.forEach(timer => clearTimeout(timer));
      breatheTimersRef.current = [];
      setCycleCount(0);
      setTotalTime(0);
      setInstruction('Toque para começar');
      // Resetar animação para posição inicial
      Animated.timing(scaleAnim, {
        toValue: 0.6,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StarryBackground />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="chevron-back" size={32} color="#e8d5f5" />
        </TouchableOpacity>
        <Text style={styles.title}>Respire</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Mode Selector */}
        <View style={styles.modeSelector}>
          {Object.values(BREATH_MODES).map((mode) => (
            <TouchableOpacity
              key={mode.name}
              onPress={() => handleModeChange(mode)}
              disabled={isBreathing}
              style={[
                styles.modeButton,
                currentMode.name === mode.name && styles.modeButtonActive,
                isBreathing && styles.modeButtonDisabled,
              ]}
            >
              <LinearGradient
                colors={
                  currentMode.name === mode.name
                    ? ['rgba(139, 58, 150, 0.8)', 'rgba(109, 39, 139, 0.8)']
                    : ['rgba(90, 46, 109, 0.4)', 'rgba(109, 39, 139, 0.2)']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modeGradient}
              >
                <Text style={styles.modeLabel}>{mode.label}</Text>
                <Text style={styles.modeDescription}>{mode.description}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Breathing Circle - Multiple Ripple Circles */}
        <View style={styles.circleContainer}>
          <TouchableOpacity onPress={handleStartStop} activeOpacity={0.8} 
            style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE, position: 'relative' }}>
            {/* Render multiple concentric circles */}
            {circleAnims.map((anim, index) => {
              const insetPercentage = 44 - (index * 4);
              const size = CIRCLE_SIZE * (1 - (insetPercentage / 100) * 2);
              const inset = (CIRCLE_SIZE - size) / 2;
              const opacity = 1 - (index * 0.1);

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.breathingCircle,
                    {
                      position: 'absolute',
                      width: size,
                      height: size,
                      top: inset,
                      left: inset,
                      transform: [{ scale: anim }],
                      opacity: index === 7 ? 0.3 : opacity,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[
                      `rgba(139, 58, 150, ${0.6 - index * 0.05})`,
                      `rgba(109, 39, 139, ${0.5 - index * 0.05})`,
                      `rgba(90, 46, 109, ${0.4 - index * 0.05})`,
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientCircle}
                  />
                </Animated.View>
              );
            })}
            
            {/* Instruction Text - Above circles with z-index */}
            <View style={styles.instructionOverlay}>
              <Text style={styles.instructionText}>{instruction}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Ciclos</Text>
            <Text style={styles.statValue}>{cycleCount}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Tempo</Text>
            <Text style={styles.statValue}>{formatTime(totalTime)}</Text>
          </View>
        </View>

        {/* Start/Stop Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={handleStartStop}
            style={styles.buttonWrapper}
            activeOpacity={0.8}
          >
            <Animated.View
              style={{
                transform: [{ scale: pressAnim }],
              }}
            >
              <LinearGradient
                colors={[
                  'rgba(139, 58, 150, 0.9)',
                  'rgba(109, 39, 139, 0.8)',
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.startButton}
              >
                <Ionicons
                  name={isBreathing ? 'pause-circle' : 'play-circle'}
                  size={32}
                  color="#ffffff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.buttonText}>
                  {isBreathing ? 'Pausar' : 'Iniciar'}
                </Text>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <Text style={styles.tips}>
          💡 Respire conscientemente e deixe seu corpo relaxar
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#270258',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'AlmondMilky',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(139, 58, 150, 0.3)',
  },
  modeButtonActive: {
    borderWidth: 2,
    borderColor: 'rgba(139, 58, 150, 0.8)',
  },
  modeButtonDisabled: {
    opacity: 0.5,
  },
  modeGradient: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  modeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  modeDescription: {
    fontSize: 12,
    color: '#b78fd5',
    marginTop: 4,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    height: CIRCLE_SIZE + 40,
  },
  breathingCircle: {
    borderRadius: 50000,
    overflow: 'hidden',
    shadowColor: '#8b3a96',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  gradientCircle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  instructionText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    minHeight: 35,
  },
  instruction: {
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: 'rgba(90, 46, 109, 0.2)',
    borderRadius: 16,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(139, 58, 150, 0.3)',
  },
  statLabel: {
    fontSize: 12,
    color: '#a89cc4',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#e8d5f5',
  },
  buttonContainer: {
    marginBottom: 16,
  },
  buttonWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  startButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  tips: {
    fontSize: 13,
    color: '#b78fd5',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
});

export default BreathScreen;
