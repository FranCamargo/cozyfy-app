import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import StarryBackground from '../components/StarryBackground';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Position {
  x: number;
  y: number;
}

interface SnakeScreenProps {
  onNavigateBack: () => void;
}
const { width, height } = Dimensions.get('window');
const GRID_SIZE = 12;
const CELL_SIZE = 30;
const BOARD_SIZE = CELL_SIZE * GRID_SIZE;
const INITIAL_SPEED = 450; // Velocidade inicial em ms (mais lenta)
const MIN_SPEED = 120; // Velocidade mínima (máximo de rapidez)
const SPEED_INCREMENT = 0.25; // Redução de velocidade por comida (aumento gradativo)

const SnakeScreen: React.FC<SnakeScreenProps> = ({ onNavigateBack }) => {
  const [snake, setSnake] = useState<Position[]>([
    { x: 7, y: 7 },
    { x: 6, y: 7 },
    { x: 5, y: 7 },
  ]);
  const [food, setFood] = useState<Position>({ x: 10, y: 10 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [nextDirection, setNextDirection] = useState<Direction>('RIGHT');
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(INITIAL_SPEED);

  const gameLoopInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const directionRef = useRef<Direction>('RIGHT');
  

  // Spawn food with position validation
  const spawnFood = useCallback((snakeSegments: Position[]): Position => {
    let newFood: Position;
    let attempts = 0;
    const maxAttempts = GRID_SIZE * GRID_SIZE;

    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      attempts++;
    } while (
      snakeSegments.some(segment => segment.x === newFood.x && segment.y === newFood.y) &&
      attempts < maxAttempts
    );

    return newFood;
  }, []);

  // Game loop
  const gameLoop = useCallback(() => {
    setSnake(prevSnake => {
      const head = { ...prevSnake[0] };
      const currentDirection = directionRef.current;
      setDirection(currentDirection);

      switch (currentDirection) {
        case 'UP':
          head.y = (head.y - 1 + GRID_SIZE) % GRID_SIZE;
          break;
        case 'DOWN':
          head.y = (head.y + 1) % GRID_SIZE;
          break;
        case 'LEFT':
          head.x = (head.x - 1 + GRID_SIZE) % GRID_SIZE;
          break;
        case 'RIGHT':
          head.x = (head.x + 1) % GRID_SIZE;
          break;
      }

      // Check collision with self
      if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setIsGameOver(true);
        setIsGameStarted(false);
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      // Check if food was eaten
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 10);
        setFood(spawnFood(newSnake));

        // Aumenta a velocidade gradativamente
        setGameSpeed(prev => Math.max(MIN_SPEED, prev - SPEED_INCREMENT));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, spawnFood]);

  // Setup game loop interval
  useEffect(() => {
    if (isGameStarted && !isGameOver) {
      gameLoopInterval.current = setInterval(() => {
        gameLoop();
      }, gameSpeed);

      return () => {
        if (gameLoopInterval.current) {
          clearInterval(gameLoopInterval.current);
        }
      };
    }
  }, [isGameStarted, isGameOver, gameSpeed, gameLoop]);

  // Handle direction changes
  const handleMove = (newDirection: Direction) => {
    // Prevent 180 degree turns
    if (
      (direction === 'UP' && newDirection === 'DOWN') ||
      (direction === 'DOWN' && newDirection === 'UP') ||
      (direction === 'LEFT' && newDirection === 'RIGHT') ||
      (direction === 'RIGHT' && newDirection === 'LEFT')
    ) {
      return;
    }
    directionRef.current = newDirection;
    setNextDirection(newDirection);
  };

  const moveUp = () => handleMove('UP');
  const moveDown = () => handleMove('DOWN');
  const moveLeft = () => handleMove('LEFT');
  const moveRight = () => handleMove('RIGHT');

  const startGame = () => {
    if (!isGameStarted && !isGameOver) {
      setIsGameStarted(true);
    }
  };

  const pauseGame = () => {
    if (isGameStarted && !isGameOver) {
      setIsGameStarted(false);
    }
  };

  const resetGame = () => {
    setSnake([
      { x: 7, y: 7 },
      { x: 6, y: 7 },
      { x: 5, y: 7 },
    ]);
    setScore(0);
    setIsGameOver(false);
    setIsGameStarted(false);
    setGameSpeed(INITIAL_SPEED);
    setDirection('RIGHT');
    setNextDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setFood(spawnFood([{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }]));
  };

  const isCellSnakeHead = (x: number, y: number): boolean =>
    snake[0].x === x && snake[0].y === y;

  const isCellSnakeBody = (x: number, y: number): boolean =>
    snake.some(segment => segment.x === x && segment.y === y);

  const isCellFood = (x: number, y: number): boolean =>
    food.x === x && food.y === y;

  const getStatusMessage = (): string => {
    if (isGameOver) {
      return `Fim de Jogo! Pontuação: ${score}`;
    }
    if (!isGameStarted) {
      return 'Toque em "Iniciar" para começar';
    }
    return `Pontuação: ${score}`;
  };

  const boardSize = BOARD_SIZE;

  return (
    <SafeAreaView style={styles.container}>
      <StarryBackground />
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#c56bf0" />
          </TouchableOpacity>
          <Text style={styles.title}>Snake</Text>
          <View style={styles.backButton} />
        </View>

        {/* Game Board */}
        <View style={styles.boardContainer}>
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={startGame}
              disabled={isGameStarted || isGameOver}
              activeOpacity={0.7}
            >
              <Text style={styles.actionBtnText}>▶</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={pauseGame}
              disabled={!isGameStarted}
              activeOpacity={0.7}
            >
              <Ionicons name="pause" size={28} color="#c56bf0" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={resetGame}
              activeOpacity={0.7}
            >
              <Text style={styles.actionBtnText}>⟳</Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.board,
              {
                width: boardSize,
                height: boardSize,
              },
            ]}
          >
            {/* Grid cells */}
            {Array.from({ length: GRID_SIZE }).map((_, y) =>
              Array.from({ length: GRID_SIZE }).map((_, x) => {
                const isSnakeHead = isCellSnakeHead(x, y);
                const isSnakeBody = isCellSnakeBody(x, y);
                const isFood = isCellFood(x, y);

                return (
                  <View
                    key={`${x}-${y}`}
                    style={[
                      styles.cell,
                      {
                        left: x * CELL_SIZE,
                        top: y * CELL_SIZE,
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                      },
                      isSnakeHead && styles.snakeHead,
                      isSnakeBody && styles.snakeBody,
                      isFood && styles.foodContainer,
                    ]}
                  >
                    {isFood && <Text style={styles.foodEmoji}>🍎</Text>}
                  </View>
                );
              })
            )}
          </View>

          {/* Game Info */}
          <Text
            style={[
              styles.statusText,
              isGameOver && styles.statusTextGameOver,
            ]}
          >
            {getStatusMessage()}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          {/* Direction Controls */}
          <View style={styles.directionControls}>
            <TouchableOpacity
              style={[styles.controlBtn, styles.upBtn]}
              onPress={moveUp}
              activeOpacity={0.65}
            >
              <Text style={styles.controlBtnText}>▲</Text>
            </TouchableOpacity>

            <View style={styles.horizontalControls}>
              <TouchableOpacity
                style={[styles.controlBtn, styles.leftBtn]}
                onPress={moveLeft}
                activeOpacity={0.65}
              >
                <Text style={styles.controlBtnText}>◄</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlBtn, styles.downBtn]}
                onPress={moveDown}
                activeOpacity={0.65}
              >
                <Text style={styles.controlBtnText}>▼</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlBtn, styles.rightBtn]}
                onPress={moveRight}
                activeOpacity={0.65}
              >
                <Text style={styles.controlBtnText}>►</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
    marginTop: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  boardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginBottom: 12,
  },
  board: {
    position: 'relative',
    borderWidth: 3,
    borderColor: 'rgba(197, 107, 240, 0.6)',
    borderRadius: 0,
    backgroundColor: 'rgba(20, 20, 40, 0.9)',
    overflow: 'hidden',
    marginBottom: 12,
  },
  cell: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 0.5,
    borderColor: 'rgba(197, 107, 240, 0.1)',
  },
  snakeHead: {
    backgroundColor: '#10b981',
    borderRadius: 2,
  },
  snakeBody: {
    backgroundColor: 'rgba(16, 185, 129, 0.7)',
    borderWidth: 0.5,
    borderColor: 'rgba(16, 185, 129, 0.5)',
    borderRadius: 2,
  },
  foodContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodEmoji: {
    fontSize: CELL_SIZE - 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.3,
    textAlign: 'center',
    minHeight: 24,
    marginTop: 12,
  },
  statusTextGameOver: {
    color: '#ef4444',
    fontWeight: '600',
  },
  controlsContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
    paddingBottom: 100,
  },
  directionControls: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  upBtn: {
    marginBottom: 0,
  },
  horizontalControls: {
    flexDirection: 'row',
    gap: 12,
  },
  leftBtn: {
    marginRight: 0,
  },
  downBtn: {
    margin: 0,
  },
  rightBtn: {
    marginLeft: 0,
  },
  controlBtn: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: 'rgba(197, 107, 240, 0.6)',
    backgroundColor: 'rgba(94, 58, 238, 0.15)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'rgba(197, 107, 240, 0.95)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionBtn: {
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#c56bf0',
  },
  startBtn: {},
  startBtnText: {
    color: '#c56bf0',
  },
  pauseBtn: {},
  pauseBtnText: {
    color: '#c56bf0',
  },
  resetBtn: {},
  resetBtnText: {
    color: '#c56bf0',
  },
});

export default SnakeScreen;
