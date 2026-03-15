import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import StarryBackground from '../components/StarryBackground';

interface HockeyGameScreenProps {
  onNavigateBack: () => void;
  gameMode: 'ai';
}

interface Vector2 {
  x: number;
  y: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// A mesa ocupa 100% da tela na vertical e horizontal,
// aproveitando todo o espaço disponível para o jogo.
const RINK_VERTICAL_RATIO = 1;
const RINK_HORIZONTAL_RATIO = 1;
const RINK_PADDING = 4; // deve bater com o padding de rinkOuter
const PUCK_RADIUS = 14;
const PADDLE_RADIUS = 26;
// Fricção suave: perde um pouco de velocidade a cada frame
const FRICTION = 0.995;
// Física rápida mas mais controlável
const MAX_SPEED = 1800; // px/s
const PUCK_START_SPEED = 900;
const AI_SPEED = 750; // px/s
// Aumenta a "pegada" do paddle na bolinha
const BOUNCE_MULTIPLIER = 1.4;
// Velocidade mínima garantida após bater no paddle
const MIN_BOUNCE_SPEED = 650;
const GOAL_MARGIN = 6;

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max);
};

const length = (v: Vector2) => Math.sqrt(v.x * v.x + v.y * v.y);

const normalize = (v: Vector2): Vector2 => {
  const len = length(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
};

const HockeyGameScreen: React.FC<HockeyGameScreenProps> = ({ onNavigateBack, gameMode }) => {
  // Dimensões externas (gradiente) e internas (área de jogo)
  const rinkOuterHeight = SCREEN_HEIGHT * RINK_VERTICAL_RATIO;
  const rinkOuterWidth = SCREEN_WIDTH * RINK_HORIZONTAL_RATIO;
  const rinkHeight = rinkOuterHeight - RINK_PADDING * 2;
  const rinkWidth = rinkOuterWidth - RINK_PADDING * 2;

  const [bottomScore, setBottomScore] = useState(0);
  const [topScore, setTopScore] = useState(0);
  const [isPuckActive, setIsPuckActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [scoreMessage, setScoreMessage] = useState<string | null>(null);
  const [winner, setWinner] = useState<'top' | 'bottom' | null>(null);

  const [puck, setPuck] = useState<Vector2>({
    x: rinkWidth / 2,
    y: rinkHeight / 2,
  });
  const [velocity, setVelocity] = useState<Vector2>({ x: 0, y: 0 });

  const [bottomPaddle, setBottomPaddle] = useState<Vector2>({
    x: rinkWidth / 2,
    y: rinkHeight - rinkHeight * 0.12,
  });
  const [topPaddle, setTopPaddle] = useState<Vector2>({
    x: rinkWidth / 2,
    y: rinkHeight * 0.12,
  });

  const puckRef = useRef(puck);
  const velRef = useRef(velocity);
  const bottomRef = useRef(bottomPaddle);
  const topRef = useRef(topPaddle);
  const modeRef = useRef<'ai'>(gameMode);
  const messageTimeoutRef = useRef<number | null>(null);

  const animationFrame = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    puckRef.current = puck;
  }, [puck]);

  useEffect(() => {
    velRef.current = velocity;
  }, [velocity]);

  useEffect(() => {
    bottomRef.current = bottomPaddle;
  }, [bottomPaddle]);

  useEffect(() => {
    topRef.current = topPaddle;
  }, [topPaddle]);

  useEffect(() => {
    modeRef.current = gameMode;
  }, [gameMode]);

  const resetPositions = useCallback(() => {
      const center: Vector2 = { x: rinkWidth / 2, y: rinkHeight / 2 };

      setPuck(center);
      setVelocity({ x: 0, y: 0 });
      setBottomPaddle({
        x: rinkWidth / 2,
        y: rinkHeight - rinkHeight * 0.12,
      });
      setTopPaddle({
        x: rinkWidth / 2,
        y: rinkHeight * 0.12,
      });
    }, [rinkHeight, rinkWidth]);

  useEffect(() => {
    resetPositions();
  }, [resetPositions]);

  const handleGoal = useCallback(
    (scorer: 'top' | 'bottom') => {
      const nextBottom = bottomScore + (scorer === 'bottom' ? 1 : 0);
      const nextTop = topScore + (scorer === 'top' ? 1 : 0);

      setBottomScore(nextBottom);
      setTopScore(nextTop);

      // Verifica vitória (5 pontos)
      if (nextBottom >= 5 || nextTop >= 5) {
        const winnerSide: 'top' | 'bottom' = nextBottom >= 5 ? 'bottom' : 'top';
        setWinner(winnerSide);
        setIsPuckActive(false);
        setIsPaused(true);
        setScoreMessage(null);
        return;
      }

      // Apenas mostra overlay de pontuação temporário
      setIsPuckActive(false);
      resetPositions();

      if (messageTimeoutRef.current != null) {
        clearTimeout(messageTimeoutRef.current);
      }

      setScoreMessage('score');
      messageTimeoutRef.current = setTimeout(() => {
        setScoreMessage(null);
      }, 1500);
    },
    [resetPositions, bottomScore, topScore]
  );

  const updatePhysics = useCallback(
    (dt: number) => {
      let p = { ...puckRef.current };
      let v = { ...velRef.current };
      const bottom = bottomRef.current;
      const top = topRef.current;

      // Atualiza posição do disco apenas se estiver ativo
      if (isPuckActive) {
        p.x += v.x * dt;
        p.y += v.y * dt;

        // Atrito
        v.x *= FRICTION;
        v.y *= FRICTION;
      }

      const speed = length(v);
      if (speed > MAX_SPEED) {
        const n = normalize(v);
        v = { x: n.x * MAX_SPEED, y: n.y * MAX_SPEED };
      }

      // Colisão com paredes laterais
      if (p.x - PUCK_RADIUS < 0) {
        p.x = PUCK_RADIUS;
        v.x = -v.x;
      } else if (p.x + PUCK_RADIUS > rinkWidth) {
        p.x = rinkWidth - PUCK_RADIUS;
        v.x = -v.x;
      }

      // Gols (topo e base)
      if (p.y - PUCK_RADIUS <= GOAL_MARGIN) {
        handleGoal('bottom');
        return;
      }
      if (p.y + PUCK_RADIUS >= rinkHeight - GOAL_MARGIN) {
        handleGoal('top');
        return;
      }

      // Colisão com paredes horizontais (fora da área de gol)
      if (p.y - PUCK_RADIUS < 0) {
        p.y = PUCK_RADIUS;
        v.y = -v.y;
      } else if (p.y + PUCK_RADIUS > rinkHeight) {
        p.y = rinkHeight - PUCK_RADIUS;
        v.y = -v.y;
      }

      // Colisão com paddles
      const collideWithPaddle = (paddle: Vector2) => {
        const dx = p.x - paddle.x;
        const dy = p.y - paddle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = PUCK_RADIUS + PADDLE_RADIUS;

        if (dist < minDist && dist > 0) {
          const n = { x: dx / dist, y: dy / dist };
          const penetration = minDist - dist;
          p.x += n.x * penetration;
          p.y += n.y * penetration;

          const dot = v.x * n.x + v.y * n.y;
          v.x = v.x - 2 * dot * n.x;
          v.y = v.y - 2 * dot * n.y;

          // Impulso extra para a bolinha "grudar" mais no paddle
          v.x *= BOUNCE_MULTIPLIER;
          v.y *= BOUNCE_MULTIPLIER;

          // Garante uma velocidade mínima após o toque
          const bounceSpeed = length(v);
          if (bounceSpeed < MIN_BOUNCE_SPEED) {
            v.x = n.x * MIN_BOUNCE_SPEED;
            v.y = n.y * MIN_BOUNCE_SPEED;
          }

          // Após o primeiro toque, a bolinha passa a ficar ativa
          if (!isPuckActive) {
            setIsPuckActive(true);
          }
        }
      };

      collideWithPaddle(bottom);
      collideWithPaddle(top);

      // Movimento da IA (paddle de cima)
      if (modeRef.current === 'ai') {
        const targetX = clamp(p.x, PADDLE_RADIUS, rinkWidth - PADDLE_RADIUS);
        const targetY = rinkHeight * 0.18;
        const currentTop = topRef.current;
        const dir: Vector2 = { x: targetX - currentTop.x, y: targetY - currentTop.y };
        const dist = length(dir);
        if (dist > 1) {
          const n = normalize(dir);
          const maxStep = AI_SPEED * dt;
          const step = Math.min(maxStep, dist);
          const newTop: Vector2 = {
            x: currentTop.x + n.x * step,
            y: currentTop.y + n.y * step,
          };
          setTopPaddle(newTop);
        }
      }

      puckRef.current = p;
      velRef.current = v;

      // Garante que a velocidade final não passe do máximo
      const finalSpeed = length(v);
      if (finalSpeed > MAX_SPEED) {
        const nFinal = normalize(v);
        v = { x: nFinal.x * MAX_SPEED, y: nFinal.y * MAX_SPEED };
      }

      setPuck(p);
      setVelocity(v);
    },
    [handleGoal, rinkHeight, rinkWidth, isPuckActive]
  );

  const step = useCallback(
    (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
        animationFrame.current = requestAnimationFrame(step);
        return;
      }

      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      if (!isPaused) {
        updatePhysics(dt);
      }
      animationFrame.current = requestAnimationFrame(step);
    },
    [updatePhysics, isPaused]
  );

  useEffect(() => {
    animationFrame.current = requestAnimationFrame(step);
    return () => {
      if (animationFrame.current != null) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [step]);

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current != null) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  const handleRestart = () => {
    setTopScore(0);
    setBottomScore(0);
    setIsPuckActive(false);
    setScoreMessage(null);
    setWinner(null);

    if (messageTimeoutRef.current != null) {
      clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = null;
    }

    setIsPaused(false);
    resetPositions();
  };

  const movePaddle = (isBottom: boolean, x: number, y: number) => {
    const clampedX = clamp(x, PADDLE_RADIUS, rinkWidth - PADDLE_RADIUS);
    const half = rinkHeight / 2;

    if (isBottom) {
      const minY = half + PADDLE_RADIUS;
      const maxY = rinkHeight - PADDLE_RADIUS * 0.7;
      const clampedY = clamp(y, minY, maxY);
      const newPos: Vector2 = { x: clampedX, y: clampedY };
      setBottomPaddle(newPos);
      bottomRef.current = newPos;
    } else {
      const minY = PADDLE_RADIUS * 0.7;
      const maxY = half - PADDLE_RADIUS;
      const clampedY = clamp(y, minY, maxY);
      const newPos: Vector2 = { x: clampedX, y: clampedY };
      setTopPaddle(newPos);
      topRef.current = newPos;
    }
  };

  const handleTopGesture = useCallback(
    (event: PanGestureHandlerGestureEvent) => {
      const { x, y } = event.nativeEvent;
      // Coordenadas já relativas à metade superior da pista
      movePaddle(false, x, y);
    },
    [movePaddle]
  );

  const handleBottomGesture = useCallback(
    (event: PanGestureHandlerGestureEvent) => {
      const { x, y } = event.nativeEvent;
      // Converte da metade inferior (view local) para coordenadas da pista inteira
      const yInRink = y + rinkHeight / 2;
      movePaddle(true, x, yInRink);
    },
    [movePaddle, rinkHeight]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StarryBackground />

      {/* Botão voltar */}
      <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
        <Ionicons name="chevron-back" size={28} color="#e8d5f5" />
      </TouchableOpacity>

      {/* Rink ocupando a maior parte da tela */}
      <View style={styles.rinkWrapper}>
        <LinearGradient
          // Fundo mais suave em tons de azul profundo
          colors={["#020617", "#020b3a"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.rinkOuter, { width: rinkOuterWidth, height: rinkOuterHeight }]}
        >
          <View
            style={[styles.rink, { width: rinkWidth, height: rinkHeight }]}
          >
            {/* Bordas neon externas */}
            <View style={[styles.edgeHorizontal, styles.edgeTop]} />
            <View style={[styles.edgeHorizontal, styles.edgeBottom]} />
            <View style={[styles.edgeVertical, styles.edgeLeft]} />
            <View style={[styles.edgeVertical, styles.edgeRight]} />

            {/* Meio da quadra */}
            <View style={styles.centerLine} />
            <View style={styles.centerCircle} />

            {/* Áreas de gol */}
            <View style={[styles.goalArea, styles.goalTop]} />
            <View style={[styles.goalArea, styles.goalBottom]} />

            {/* Disco */}
            <View
              style={[
                styles.puck,
                {
                  transform: [
                    { translateX: puck.x - PUCK_RADIUS },
                    { translateY: puck.y - PUCK_RADIUS },
                  ],
                },
              ]}
            />

            {/* Paddle topo (IA ou jogador 1) */}
            <View
              style={[
                styles.paddle,
                styles.paddleTop,
                {
                  transform: [
                    { translateX: topPaddle.x - PADDLE_RADIUS },
                    { translateY: topPaddle.y - PADDLE_RADIUS },
                  ],
                },
              ]}
            />

            {/* Paddle base (jogador local) */}
            <View
              style={[
                styles.paddle,
                styles.paddleBottom,
                {
                  transform: [
                    { translateX: bottomPaddle.x - PADDLE_RADIUS },
                    { translateY: bottomPaddle.y - PADDLE_RADIUS },
                  ],
                },
              ]}
            />

            {/* Áreas de toque para controle (multi-touch com PanGestureHandler) */}
            <PanGestureHandler
              enabled={false}
              onGestureEvent={handleTopGesture}
            >
              <View style={[styles.touchZone, styles.touchTop]} />
            </PanGestureHandler>
            <PanGestureHandler onGestureEvent={handleBottomGesture}>
              <View style={[styles.touchZone, styles.touchBottom]} />
            </PanGestureHandler>
          </View>
        </LinearGradient>
      </View>

      {/* Mensagem de pontuação / fim de jogo */}
      {winner ? (
        <View style={styles.gameOverOverlay}>
          <View style={styles.gameOverBox}>
            <Text style={styles.scoreLine}>
              <Text style={styles.scoreNumberBottom}>{bottomScore}</Text>
              <Text style={styles.scoreSeparator}> - </Text>
              <Text style={styles.scoreNumberTop}>{topScore}</Text>
            </Text>
            <Text style={styles.gameOverText}>
              {gameMode === 'ai' && winner === 'top'
                ? 'A IA venceu'
                : winner === 'bottom'
                ? 'Jogador Rosa venceu!'
                : 'Jogador Roxo venceu!'}
            </Text>
            <TouchableOpacity style={styles.gameOverButton} onPress={handleRestart}>
              <Text style={styles.gameOverButtonText}>Reiniciar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        scoreMessage && (
          <View style={styles.scoreMessageContainer}>
            <View style={styles.scoreMessageBox}>
              <Text style={styles.scoreLine}>
                <Text style={styles.scoreNumberBottom}>{bottomScore}</Text>
                <Text style={styles.scoreSeparator}> - </Text>
                <Text style={styles.scoreNumberTop}>{topScore}</Text>
              </Text>
              {(bottomScore === 4 || topScore === 4) && (
                <Text style={styles.matchPointText}>Match Point</Text>
              )}
            </View>
          </View>
        )
      )}

      {/* Controles laterais (pause + marcadores) */}
      <View style={styles.sideControls}>
        <View style={styles.sideDot} />
        <TouchableOpacity style={styles.pauseButtonOverlay} onPress={togglePause}>
          <Ionicons name={isPaused ? 'play' : 'pause'} size={16} color="#e0f2fe" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.pauseButtonOverlay} onPress={handleRestart}>
          <Ionicons name="refresh" size={16} color="#e0f2fe" />
        </TouchableOpacity>
        <View style={styles.sideDot} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 22,
  },
  rinkWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rinkOuter: {
    borderRadius: 28,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
  },
  rink: {
    borderRadius: 28,
    backgroundColor: '#020617',
    overflow: 'hidden',
  },
  edgeHorizontal: {
    position: 'absolute',
    height: 14,
    borderRadius: 16,
  },
  edgeTop: {
    top: 4,
    left: 16,
    right: 16,
    backgroundColor: '#38bdf8',
  },
  edgeBottom: {
    bottom: 4,
    left: 16,
    right: 16,
    backgroundColor: '#0ea5e9',
  },
  edgeVertical: {
    position: 'absolute',
    width: 14,
    borderRadius: 16,
  },
  edgeLeft: {
    top: 16,
    bottom: 16,
    left: 4,
    backgroundColor: '#e0f2fe',
  },
  edgeRight: {
    top: 16,
    bottom: 16,
    right: 4,
    backgroundColor: '#7dd3fc',
  },
  centerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.6)',
  },
  centerCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: 'rgba(148, 163, 184, 0.9)',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -40,
  },
  goalArea: {
    position: 'absolute',
    left: '20%',
    right: '20%',
    height: 22,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.8)',
  },
  goalTop: {
    top: 4,
  },
  goalBottom: {
    bottom: 4,
  },
  puck: {
    position: 'absolute',
    width: PUCK_RADIUS * 2,
    height: PUCK_RADIUS * 2,
    borderRadius: PUCK_RADIUS,
    // Disco em tom neutro claro para destacar sobre a mesa
    backgroundColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  paddle: {
    position: 'absolute',
    width: PADDLE_RADIUS * 2,
    height: PADDLE_RADIUS * 2,
    borderRadius: PADDLE_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  paddleTop: {
    // Jogador de cima em azul suave
    backgroundColor: '#60a5fa',
    borderWidth: 2,
    borderColor: '#93c5fd',
  },
  paddleBottom: {
    // Jogador de baixo em coral suave, diferente do topo e da mesa
    backgroundColor: '#fb7185',
    borderWidth: 2,
    borderColor: '#fecaca',
  },
  touchZone: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  touchTop: {
    top: 0,
    height: '50%',
  },
  touchBottom: {
    bottom: 0,
    height: '50%',
  },
  sideControls: {
    position: 'absolute',
    right: 24,
    top: '50%',
    // Aproximadamente metade da altura total do grupo (2 dots + 2 botões + gaps)
    transform: [{ translateY: -73 }],
    alignItems: 'center',
    gap: 10,
  },
  sideDot: {
    width: 22,
    height: 12,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#7dd3fc',
    backgroundColor: 'transparent',
  },
  pauseButtonOverlay: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 3,
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreMessageContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scoreMessageBox: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 2,
    borderColor: '#f9a8ff',
  },
  scoreLine: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  scoreNumberBottom: {
    color: '#ec4899',
  },
  scoreNumberTop: {
    color: '#a855f7',
  },
  scoreSeparator: {
    color: '#fdf2ff',
  },
  matchPointText: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#f9a8ff',
    textAlign: 'center',
  },
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  gameOverBox: {
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderWidth: 2,
    borderColor: '#f9a8ff',
    alignItems: 'center',
  },
  gameOverText: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '700',
    color: '#fdf2ff',
    textAlign: 'center',
  },
  gameOverButton: {
    marginTop: 14,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#a855f7',
  },
  gameOverButtonText: {
    color: '#fdf2ff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default HockeyGameScreen;
