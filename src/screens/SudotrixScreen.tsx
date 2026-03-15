import React, { useRef, useEffect, useState, useCallback } from 'react';
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
import StarryBackground from '../components/StarryBackground';

type SudotrixBlock = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L' | 'P' | 'U' | 'V' | 'W' | 'X' | 'Y';

interface Position {
  x: number;
  y: number;
}

interface Piece {
  blocks: Position[];
  type: SudotrixBlock;
  rotation: number;
}

interface SudotrixScreenProps {
  onNavigateBack: () => void;
}

const { width } = Dimensions.get('window');
const GRID_WIDTH = 12;
const GRID_HEIGHT = 15;
const CELL_SIZE = 20;
const SUDOKU_SIZE = 3;
const INITIAL_SPEED = 800;
const MIN_SPEED = 200;
const LEVEL_DURATION = 60000;

const TETROMINOES: Record<SudotrixBlock, Position[][]> = {
  I: [
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 3, y: 1 },
      { x: 2, y: 0 },
      { x: 2, y: 2 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 1, y: 3 },
      { x: 0, y: 1 },
      { x: 2, y: 1 },
    ],
  ],
  O: [
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
    ],
  ],
  T: [
    [
      { x: 0, y: 0 },
      { x: -1, y: 1 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 0 },
    ],
    [
      { x: 0, y: 0 },
      { x: 0, y: -1 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 0 },
      { x: 0, y: -2 },
    ],
    [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: -1, y: 1 },
      { x: 0, y: -1 },
      { x: -1, y: 0 },
    ],
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 0 },
      { x: 0, y: -1 },
      { x: -1, y: 0 },
      { x: 0, y: 2 },
    ],
  ],
  S: [
    [
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
  ],
  Z: [
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
    ],
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
    ],
  ],
  J: [
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 0 },
      { x: 0, y: 2 },
    ],
    [
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 3 },
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 0 },
      { x: 0, y: 2 },
      { x: 2, y: 0 },
    ],
    [
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 1, y: 3 },
    ],
  ],
  L: [
    [
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 0 },
      { x: 2, y: 2 },
    ],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 1, y: 3 },
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 0, y: 0 },
      { x: 2, y: 2 },
      { x: 0, y: 2 },
    ],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 0, y: 2 },
      { x: 1, y: 3 },
    ],
  ],
  P: [
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
    ],
  ],
  U: [
    [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 0 },
    ],
  ],
  V: [
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: 2 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 1, y: 0 },
    ],
  ],
  W: [
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 2 },
      { x: 2, y: 1 },
    ],
  ],
  X: [
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 0 },
    ],
  ],
  Y: [
    [
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 2 },
      { x: 0, y: 3 },
      { x: 1, y: 2 },
    ],
  ],
};

const SudotrixScreen: React.FC<SudotrixScreenProps> = ({ onNavigateBack }) => {
  const [board, setBoard] = useState<(SudotrixBlock | null)[]>(
    Array(GRID_WIDTH * GRID_HEIGHT).fill(null)
  );
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [linesCleared, setLinesCleared] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [clearedCells, setClearedCells] = useState<Set<number>>(new Set());
  const [highlightedCells, setHighlightedCells] = useState<Set<number>>(new Set());
  const [gameSpeed, setGameSpeed] = useState(INITIAL_SPEED);

  const gameLoopInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelTimerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelStartTime = useRef(0);
  const boardRef = useRef(board);
  const currentPieceRef = useRef(currentPiece);

  // Update refs when state changes
  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    currentPieceRef.current = currentPiece;
  }, [currentPiece]);

  const canPlace = useCallback((piece: Piece, testBoard?: (SudotrixBlock | null)[]): boolean => {
    const boardToTest = testBoard || boardRef.current;
    return piece.blocks.every(block => {
      const index = block.y * GRID_WIDTH + block.x;
      return (
        block.x >= 0 &&
        block.x < GRID_WIDTH &&
        block.y >= 0 &&
        block.y < GRID_HEIGHT &&
        boardToTest[index] === null
      );
    });
  }, []);

  const canPlaceSpawn = useCallback((piece: Piece, testBoard?: (SudotrixBlock | null)[]): boolean => {
    const boardToTest = testBoard || boardRef.current;
    // Para spawn, permite y < 0 (acima da tela), mas verifica colisão apenas para blocos dentro do board
    return piece.blocks.every(block => {
      // Blocos acima da tela (y < 0) são sempre válidos
      if (block.y < 0) {
        return true;
      }
      // Blocos dentro do board precisam estar nos limites e sem colisão
      const index = block.y * GRID_WIDTH + block.x;
      return (
        block.x >= 0 &&
        block.x < GRID_WIDTH &&
        block.y < GRID_HEIGHT &&
        boardToTest[index] === null
      );
    });
  }, []);

  const spawnNewPiece = useCallback(() => {
    const pieces: SudotrixBlock[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L', 'P', 'U', 'V', 'W', 'X', 'Y'];
    const type = pieces[Math.floor(Math.random() * pieces.length)];
    const rotations = TETROMINOES[type];

    const newPiece: Piece = {
      blocks: rotations[0].map(b => ({ x: b.x + 3, y: b.y })),
      type,
      rotation: 0,
    };

    if (!canPlaceSpawn(newPiece)) {
      setIsGameOver(true);
      if (gameLoopInterval.current) clearInterval(gameLoopInterval.current);
      if (levelTimerInterval.current) clearInterval(levelTimerInterval.current);
    } else {
      setCurrentPiece(newPiece);
    }
  }, [canPlaceSpawn]);

  const placePiece = useCallback(
    (piece: Piece | null) => {
      if (!piece) return;

      const newBoard = [...boardRef.current];

      piece.blocks.forEach(block => {
        const index = block.y * GRID_WIDTH + block.x;
        if (block.y >= 0) {
          newBoard[index] = piece.type;
        }
      });

      setBoard(newBoard);
      boardRef.current = newBoard;

      // Check for completed lines
      clearCompletedLines(newBoard);
    },
    []
  );

  const clearCompletedLines = useCallback((testBoard: (SudotrixBlock | null)[]) => {
    const toClear = new Set<number>();
    const numBlocksX = Math.floor(GRID_WIDTH / SUDOKU_SIZE);
    const numBlocksY = Math.floor(GRID_HEIGHT / SUDOKU_SIZE);

    for (let blockY = 0; blockY < numBlocksY; blockY++) {
      for (let blockX = 0; blockX < numBlocksX; blockX++) {
        const startX = blockX * SUDOKU_SIZE;
        const startY = blockY * SUDOKU_SIZE;

        // Check horizontal lines
        for (let y = startY; y < startY + SUDOKU_SIZE; y++) {
          let isFilled = true;
          for (let x = startX; x < startX + SUDOKU_SIZE; x++) {
            const index = y * GRID_WIDTH + x;
            if (testBoard[index] === null) {
              isFilled = false;
              break;
            }
          }
          if (isFilled) {
            for (let x = startX; x < startX + SUDOKU_SIZE; x++) {
              const index = y * GRID_WIDTH + x;
              toClear.add(index);
            }
          }
        }

        // Check vertical lines
        for (let x = startX; x < startX + SUDOKU_SIZE; x++) {
          let isFilled = true;
          for (let y = startY; y < startY + SUDOKU_SIZE; y++) {
            const index = y * GRID_WIDTH + x;
            if (testBoard[index] === null) {
              isFilled = false;
              break;
            }
          }
          if (isFilled) {
            for (let y = startY; y < startY + SUDOKU_SIZE; y++) {
              const index = y * GRID_WIDTH + x;
              toClear.add(index);
            }
          }
        }

        // Check diagonals
        const diag1: number[] = [];
        const diag2: number[] = [];
        for (let i = 0; i < SUDOKU_SIZE; i++) {
          diag1.push((startY + i) * GRID_WIDTH + (startX + i));
          diag2.push((startY + i) * GRID_WIDTH + (startX + (SUDOKU_SIZE - 1 - i)));
        }

        if (diag1.every(idx => testBoard[idx] !== null)) {
          diag1.forEach(idx => toClear.add(idx));
        }
        if (diag2.every(idx => testBoard[idx] !== null)) {
          diag2.forEach(idx => toClear.add(idx));
        }
      }
    }

    if (toClear.size > 0) {
      setHighlightedCells(toClear);

      setTimeout(() => {
        const clearedBoard = [...boardRef.current];
        toClear.forEach(idx => {
          clearedBoard[idx] = null;
        });
        setBoard(clearedBoard);
        boardRef.current = clearedBoard;
        setHighlightedCells(new Set());
        setScore(prev => prev + 150);
        setLinesCleared(prev => prev + Math.floor(toClear.size / SUDOKU_SIZE));
      }, 300);
    }
  }, []);

  const gameLoop = useCallback(() => {
    if (!currentPieceRef.current || isGameOver || isPaused) return;

    const moved: Piece = {
      ...currentPieceRef.current,
      blocks: currentPieceRef.current.blocks.map(b => ({ x: b.x, y: b.y + 1 })),
    };

    if (canPlace(moved)) {
      setCurrentPiece(moved);
    } else {
      placePiece(currentPieceRef.current);
      spawnNewPiece();
    }
  }, [isGameOver, isPaused, canPlace, placePiece, spawnNewPiece]);

  useEffect(() => {
    if (isGameStarted && !isGameOver && !isPaused) {
      gameLoopInterval.current = setInterval(() => {
        gameLoop();
      }, gameSpeed);

      return () => {
        if (gameLoopInterval.current) clearInterval(gameLoopInterval.current);
      };
    }
  }, [isGameStarted, isGameOver, isPaused, gameSpeed, gameLoop]);

  const moveLeft = useCallback(() => {
    if (!currentPieceRef.current || isGameOver || !isGameStarted || isPaused) return;
    const moved: Piece = {
      ...currentPieceRef.current,
      blocks: currentPieceRef.current.blocks.map(b => ({ x: b.x - 1, y: b.y })),
    };
    if (canPlace(moved)) {
      setCurrentPiece(moved);
    }
  }, [isGameOver, isGameStarted, isPaused, canPlace]);

  const moveRight = useCallback(() => {
    if (!currentPieceRef.current || isGameOver || !isGameStarted || isPaused) return;
    const moved: Piece = {
      ...currentPieceRef.current,
      blocks: currentPieceRef.current.blocks.map(b => ({ x: b.x + 1, y: b.y })),
    };
    if (canPlace(moved)) {
      setCurrentPiece(moved);
    }
  }, [isGameOver, isGameStarted, isPaused, canPlace]);

  const moveDown = useCallback(() => {
    if (!currentPieceRef.current || isGameOver || !isGameStarted || isPaused) return;
    const moved: Piece = {
      ...currentPieceRef.current,
      blocks: currentPieceRef.current.blocks.map(b => ({ x: b.x, y: b.y + 1 })),
    };
    if (canPlace(moved)) {
      setCurrentPiece(moved);
    } else {
      placePiece(currentPieceRef.current);
      spawnNewPiece();
    }
  }, [isGameOver, isGameStarted, isPaused, canPlace, placePiece, spawnNewPiece]);

  const hardDrop = useCallback(() => {
    if (!currentPieceRef.current || isGameOver || !isGameStarted || isPaused) return;
    let canContinue = true;
    while (canContinue && currentPieceRef.current) {
      const moved: Piece = {
        ...currentPieceRef.current,
        blocks: currentPieceRef.current.blocks.map(b => ({ x: b.x, y: b.y + 1 })),
      };
      if (canPlace(moved)) {
        setCurrentPiece(moved);
        currentPieceRef.current = moved;
      } else {
        canContinue = false;
        placePiece(currentPieceRef.current);
        spawnNewPiece();
      }
    }
  }, [isGameOver, isGameStarted, isPaused, canPlace, placePiece, spawnNewPiece]);

  const startGame = useCallback(() => {
    if (!isGameStarted && !isGameOver) {
      setIsGameStarted(true);
      setIsPaused(false);
      levelStartTime.current = Date.now();

      if (levelTimerInterval.current) clearInterval(levelTimerInterval.current);
      levelTimerInterval.current = setInterval(() => {
        const elapsed = Date.now() - levelStartTime.current;
        if (elapsed >= LEVEL_DURATION) {
          setLevel(prev => prev + 1);
          setGameSpeed(prev => Math.max(MIN_SPEED, prev - 100));
          levelStartTime.current = Date.now();
        }
      }, 100);
    }
  }, [isGameStarted, isGameOver]);

  const pauseGame = useCallback(() => {
    if (isGameStarted && !isGameOver) {
      setIsPaused(prev => !prev);
    }
  }, [isGameStarted, isGameOver]);

  const resetGame = useCallback(() => {
    if (gameLoopInterval.current) clearInterval(gameLoopInterval.current);
    if (levelTimerInterval.current) clearInterval(levelTimerInterval.current);

    setBoard(Array(GRID_WIDTH * GRID_HEIGHT).fill(null));
    boardRef.current = Array(GRID_WIDTH * GRID_HEIGHT).fill(null);
    setScore(0);
    setLevel(1);
    setLinesCleared(0);
    setIsGameOver(false);
    setIsGameStarted(false);
    setIsPaused(false);
    setHighlightedCells(new Set());
    setGameSpeed(INITIAL_SPEED);

    const pieces: SudotrixBlock[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L', 'P', 'U', 'V', 'W', 'X', 'Y'];
    const type = pieces[Math.floor(Math.random() * pieces.length)];
    const rotations = TETROMINOES[type];
    const newPiece: Piece = {
      blocks: rotations[0].map(b => ({ x: b.x + 3, y: b.y })),
      type,
      rotation: 0,
    };
    setCurrentPiece(newPiece);
    currentPieceRef.current = newPiece;
  }, []);

  // Initialize game
  useEffect(() => {
    const pieces: SudotrixBlock[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L', 'P', 'U', 'V', 'W', 'X', 'Y'];
    const type = pieces[Math.floor(Math.random() * pieces.length)];
    const rotations = TETROMINOES[type];
    const newPiece: Piece = {
      blocks: rotations[0].map(b => ({ x: b.x + 3, y: b.y })),
      type,
      rotation: 0,
    };
    setCurrentPiece(newPiece);
    currentPieceRef.current = newPiece;

    return () => {
      if (gameLoopInterval.current) clearInterval(gameLoopInterval.current);
      if (levelTimerInterval.current) clearInterval(levelTimerInterval.current);
    };
  }, []);

  const getCellColor = (cellType: SudotrixBlock | null): string => {
    const colors: Record<SudotrixBlock, string> = {
      I: '#06b6d4',
      O: '#eab308',
      T: '#a855f7',
      S: '#10b981',
      Z: '#ef4444',
      J: '#3b82f6',
      L: '#f97316',
      P: '#ec4899',
      U: '#8b5cf6',
      V: '#06b6d4',
      W: '#d946ef',
      X: '#f59e0b',
      Y: '#14b8a6',
    };
    return cellType ? colors[cellType] : 'transparent';
  };

  const isCellHighlighted = (index: number): boolean => highlightedCells.has(index);

  const isCellCurrentPiece = (x: number, y: number): boolean => {
    if (!currentPiece) return false;
    return currentPiece.blocks.some(b => b.x === x && b.y === y);
  };

  const boardSize = GRID_WIDTH * CELL_SIZE;
  const boardHeight = GRID_HEIGHT * CELL_SIZE;

  return (
    <SafeAreaView style={styles.container}>
      <StarryBackground />
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onNavigateBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#c56bf0" />
          </TouchableOpacity>
          <Text style={styles.title}>SudoTrix</Text>
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
              <Ionicons
                name={isPaused ? 'play' : 'pause'}
                size={24}
                color="#c56bf0"
              />
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
                height: boardHeight,
              },
            ]}
          >
            {/* Sudoku Grid Lines - Vertical */}
            {[1, 2, 3].map(i => (
              <View
                key={`v-line-${i}`}
                style={{
                  position: 'absolute',
                  left: i * 3 * CELL_SIZE - 1,
                  top: 0,
                  width: 2,
                  height: boardHeight,
                  backgroundColor: '#d946ef',
                  zIndex: 2,
                }}
              />
            ))}
            {/* Sudoku Grid Lines - Horizontal */}
            {[1, 2, 3, 4].map(i => (
              <View
                key={`h-line-${i}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: i * 3 * CELL_SIZE - 1,
                  width: boardSize,
                  height: 2,
                  backgroundColor: '#d946ef',
                  zIndex: 2,
                }}
              />
            ))}

            {board.map((cellType, index) => {
              const x = index % GRID_WIDTH;
              const y = Math.floor(index / GRID_WIDTH);
              const isCurrentPiece = isCellCurrentPiece(x, y);
              const isHighlighted = isCellHighlighted(index);
              const cellColor = getCellColor(cellType);

              return (
                <View
                  key={index}
                  style={[
                    styles.cell,
                    {
                      left: x * CELL_SIZE,
                      top: y * CELL_SIZE,
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      backgroundColor: isCurrentPiece ? '#c56bf0' : cellColor,
                      borderColor: isHighlighted ? '#ffffff' : 'rgba(197, 107, 240, 0.15)',
                      opacity: isHighlighted ? 0.7 : 1,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Status Overlay */}
          {(isPaused || isGameOver) && (
            <View style={styles.statusOverlay}>
              <Text style={styles.statusText}>
                {isGameOver ? 'Fim de Jogo!' : 'Pausado'}
              </Text>
            </View>
          )}

          {/* Game Info */}
          <View style={styles.gameInfo}>
            <Text style={styles.infoText}>
              Pontuação: {score}  •  Nível: {level}
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          {/* Direction Controls */}
          <View style={styles.directionControls}>
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

            <TouchableOpacity
              style={[styles.controlBtn, styles.dropBtn]}
              onPress={hardDrop}
              activeOpacity={0.65}
            >
              <Text style={styles.controlBtnText}>⬇</Text>
            </TouchableOpacity>
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
    paddingVertical: 4,
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
    marginTop: 0,
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
    width: '100%',
    marginVertical: 0,
  },
  board: {
    position: 'relative',
    borderWidth: 3,
    borderColor: 'rgba(167, 139, 250, 0.8)',
    borderRadius: 8,
    backgroundColor: 'rgba(20, 20, 40, 0.9)',
    overflow: 'hidden',
    marginBottom: 10,
  },
  cell: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(197, 107, 240, 0.15)',
  },
  statusOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(20, 20, 40, 0.85)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(196, 130, 255, 0.6)',
    top: '50%',
    alignSelf: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 1,
    textAlign: 'center',
  },
  gameInfo: {
    width: '100%',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.2,
  },
  controlsContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
    paddingBottom: 20,
    gap: 12,
    marginTop: 60,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 4,
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
  directionControls: {
    alignItems: 'center',
    gap: 12,
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
  dropBtn: {
    marginTop: 0,
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
});

export default SudotrixScreen;
