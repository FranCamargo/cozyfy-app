import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import StarryBackground from '../components/StarryBackground';

type CellValue = 'X' | 'O' | '';
type GameStatus = 'playing' | 'draw' | 'xWins' | 'oWins';
type GameMode = 'local' | 'ai';

interface TicTacToeScreenProps {
  onNavigateBack: () => void;
}

const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const TicTacToeScreen: React.FC<TicTacToeScreenProps> = ({ onNavigateBack }) => {
  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(''));
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [winner, setWinner] = useState<'X' | 'O' | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [moveCount, setMoveCount] = useState(0);
  const [gameMode, setGameMode] = useState<GameMode>('local');
  const [playerSymbol, setPlayerSymbol] = useState<'X' | 'O'>('X');
  const [currentTurn, setCurrentTurn] = useState<'X' | 'O'>('X');
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const aiSymbol = playerSymbol === 'X' ? 'O' : 'X';
  const isGameInProgress = moveCount > 0 && !isGameOver;

  const checkWinner = useCallback((boardState: CellValue[]): 'X' | 'O' | null => {
    for (const [a, b, c] of WINNING_COMBINATIONS) {
      if (
        boardState[a] !== '' &&
        boardState[a] === boardState[b] &&
        boardState[a] === boardState[c]
      ) {
        return boardState[a] as 'X' | 'O';
      }
    }
    return null;
  }, []);

  const checkGameStatus = useCallback(
    (boardState: CellValue[], newMoveCount: number) => {
      const winnerResult = checkWinner(boardState);

      if (winnerResult) {
        setWinner(winnerResult);
        setGameStatus(winnerResult === 'X' ? 'xWins' : 'oWins');
        setIsGameOver(true);
      } else if (newMoveCount === 9) {
        setGameStatus('draw');
        setIsGameOver(true);
      }
    },
    [checkWinner]
  );

  const makeMove = useCallback(
    (index: number) => {
      if (isCellDisabled(index, board, isGameOver, gameMode, currentTurn, playerSymbol)) {
        return;
      }

      const newBoard = [...board];
      newBoard[index] = currentTurn;
      const newMoveCount = moveCount + 1;

      setBoard(newBoard);
      setMoveCount(newMoveCount);
      checkGameStatus(newBoard, newMoveCount);

      if (newMoveCount < 9) {
        const nextTurn = currentTurn === 'X' ? 'O' : 'X';
        setCurrentTurn(nextTurn);

        if (gameMode === 'ai' && nextTurn === aiSymbol) {
          setIsWaitingForAI(true);
          setTimeout(() => {
            performAIMove(newBoard, newMoveCount);
            setIsWaitingForAI(false);
          }, 1500);
        }
      }
    },
    [board, moveCount, gameMode, currentTurn, playerSymbol, aiSymbol, checkGameStatus]
  );

  const findWinningMove = (boardState: CellValue[], symbol: 'X' | 'O'): number | null => {
    for (const [a, b, c] of WINNING_COMBINATIONS) {
      const cells = [boardState[a], boardState[b], boardState[c]];
      const emptyCount = cells.filter(cell => cell === '').length;
      const symbolCount = cells.filter(cell => cell === symbol).length;

      if (emptyCount === 1 && symbolCount === 2) {
        if (boardState[a] === '') return a;
        if (boardState[b] === '') return b;
        if (boardState[c] === '') return c;
      }
    }
    return null;
  };

  const getAIMove = (boardState: CellValue[]): number => {
    // 1. Tentar ganhar
    const winMove = findWinningMove(boardState, aiSymbol);
    if (winMove !== null) return winMove;

    // 2. Bloquear jogador de ganhar
    const blockMove = findWinningMove(boardState, playerSymbol);
    if (blockMove !== null) return blockMove;

    // 3. Tentar ocupar o centro
    if (boardState[4] === '') return 4;

    // 4. Tentar ocupar um canto
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(index => boardState[index] === '');
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    // 5. Ocupar uma borda
    const edges = [1, 3, 5, 7];
    const availableEdges = edges.filter(index => boardState[index] === '');
    if (availableEdges.length > 0) {
      return availableEdges[Math.floor(Math.random() * availableEdges.length)];
    }

    // Fallback: retornar qualquer posição disponível
    const availableIndices = boardState
      .map((value, index) => (value === '' ? index : -1))
      .filter((index) => index !== -1);
    return availableIndices[0] || -1;
  };

  const performAIMove = (boardState: CellValue[], currentMoveCount: number) => {
    const moveIndex = getAIMove(boardState);

    if (moveIndex === -1) return;

    const newBoard = [...boardState];
    newBoard[moveIndex] = aiSymbol;
    const newMoveCount = currentMoveCount + 1;

    setBoard(newBoard);
    setMoveCount(newMoveCount);
    checkGameStatus(newBoard, newMoveCount);

    if (newMoveCount < 9) {
      setCurrentTurn(playerSymbol);
    }
  };

  const isCellDisabled = (
    index: number,
    boardState: CellValue[],
    gameOverState: boolean,
    gameModeState: GameMode,
    currentTurnState: 'X' | 'O',
    playerSymbolState: 'X' | 'O'
  ): boolean => {
    if (gameOverState || boardState[index] !== '') {
      return true;
    }

    if (gameModeState === 'ai' && currentTurnState !== playerSymbolState) {
      return true;
    }

    return false;
  };

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(''));
    setGameStatus('playing');
    setWinner(null);
    setIsGameOver(false);
    setMoveCount(0);
    setCurrentTurn('X');
    setIsWaitingForAI(false);

    if (gameMode === 'ai' && playerSymbol === 'O') {
      setIsWaitingForAI(true);
      setTimeout(() => {
        const newBoard = Array(9).fill('');
        newBoard[4] = aiSymbol;
        setBoard(newBoard);
        setMoveCount(1);
        setCurrentTurn(playerSymbol);
        setIsWaitingForAI(false);
      }, 1500);
    }
  }, [gameMode, playerSymbol, aiSymbol]);

  const changeMode = (mode: GameMode) => {
    if (gameMode !== mode) {
      setGameMode(mode);
      resetGame();
    }
  };

  const changePlayerSymbol = (symbol: 'X' | 'O') => {
    if (playerSymbol !== symbol && !isGameInProgress) {
      setPlayerSymbol(symbol);
      resetGame();
    }
  };

  const getStatusMessage = (): string => {
    if (isGameOver) {
      switch (gameStatus) {
        case 'xWins':
        case 'oWins': {
          if (gameMode === 'ai') {
            return winner === playerSymbol ? 'Você venceu! 🎉' : 'IA venceu!';
          }
          return `Jogador ${winner} venceu! 🎉`;
        }
        case 'draw':
          return 'Empate! 🤝';
        default:
          return '';
      }
    }

    if (gameMode === 'ai') {
      if (currentTurn === playerSymbol) {
        return `Sua vez (${playerSymbol})`;
      }
      return isWaitingForAI ? 'Aguardando IA...' : `Vez da IA (${aiSymbol})`;
    }

    return `Aguardando jogador ${currentTurn}...`;
  };

  const getCellContent = (index: number): string => {
    return board[index];
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <StarryBackground />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HEADER */}
        <View style={styles.headerSection}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={onNavigateBack}
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
            <Text style={styles.headerTitle}>Jogo da Velha</Text>
            <View style={{ width: 44 }} />
          </View>
        </View>

        {/* STATUS */}
        <View style={styles.statusSection}>
          <Text
            style={[
              styles.statusText,
              gameStatus === 'xWins' || gameStatus === 'oWins'
                ? styles.statusTextWin
                : gameStatus === 'draw'
                  ? styles.statusTextDraw
                  : styles.statusTextPlaying,
            ]}
          >
            {getStatusMessage()}
          </Text>
        </View>

        {/* GAME CONTROLS */}
        <View style={styles.controlsSection}>
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[styles.modeBtn, gameMode === 'local' && styles.modeBtnActive]}
              onPress={() => changeMode('local')}
            >
              <Text style={styles.modeBtnText}>Local</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, gameMode === 'ai' && styles.modeBtnActive]}
              onPress={() => changeMode('ai')}
            >
              <Text style={styles.modeBtnText}>IA</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.symbolSelector}>
            <Text style={styles.symbolLabel}>Você joga como:</Text>
            <TouchableOpacity
              style={[
                styles.symbolBtn,
                playerSymbol === 'X' && styles.symbolBtnActive,
                isGameInProgress && styles.symbolBtnDisabled,
              ]}
              onPress={() => changePlayerSymbol('X')}
              disabled={isGameInProgress}
            >
              <Text style={styles.symbolBtnText}>X</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.symbolBtn,
                playerSymbol === 'O' && styles.symbolBtnActive,
                isGameInProgress && styles.symbolBtnDisabled,
              ]}
              onPress={() => changePlayerSymbol('O')}
              disabled={isGameInProgress}
            >
              <Text style={styles.symbolBtnText}>O</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BOARD */}
        <View style={styles.boardWrapper}>
          <View style={styles.board}>
            {Array.from({ length: 9 }).map((_, index) => {
              const cellValue = getCellContent(index);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.cell,
                    cellValue === 'X' && styles.cellX,
                    cellValue === 'O' && styles.cellO,
                    isCellDisabled(
                      index,
                      board,
                      isGameOver,
                      gameMode,
                      currentTurn,
                      playerSymbol
                    ) && cellValue === '' && styles.cellDisabled,
                  ]}
                  onPress={() => makeMove(index)}
                  disabled={isCellDisabled(
                    index,
                    board,
                    isGameOver,
                    gameMode,
                    currentTurn,
                    playerSymbol
                  )}
                >
                  <Text style={styles.cellText}>{cellValue}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ACTION BUTTONS */}
        <View style={styles.actionButtonsSection}>
          <TouchableOpacity
            style={[styles.actionBtn, isGameOver && styles.actionBtnPrimary]}
            onPress={resetGame}
          >
            <Text style={styles.actionBtnText}>
              {isGameOver ? 'Jogar Novamente' : moveCount === 0 ? 'Iniciar' : 'Reiniciar'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    flexGrow: 1,
    alignItems: 'center',
  },

  // HEADER
  headerSection: {
    width: '100%',
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
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
    fontSize: 24,
    fontWeight: '700',
    color: '#e8d5f5',
    letterSpacing: 0.3,
  },

  // STATUS
  statusSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    minHeight: 30,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  statusTextPlaying: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statusTextWin: {
    color: '#4ade80',
    fontWeight: '700',
  },
  statusTextDraw: {
    color: '#fbbf24',
    fontWeight: '700',
  },

  // CONTROLS
  controlsSection: {
    width: '100%',
    marginBottom: 20,
    gap: 12,
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  modeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(197, 107, 240, 0.6)',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  modeBtnActive: {
    backgroundColor: 'linear-gradient(90deg, rgba(94, 58, 238, 1) 0%, rgba(197, 107, 240, 1) 100%)',
    borderColor: 'transparent',
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.2,
  },
  symbolSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  symbolLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(148, 163, 184, 0.9)',
    letterSpacing: 0.2,
  },
  symbolBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(197, 107, 240, 0.6)',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    minWidth: 40,
    alignItems: 'center',
  },
  symbolBtnActive: {
    backgroundColor: 'rgba(94, 58, 238, 0.5)',
    borderColor: 'rgba(197, 107, 240, 0.9)',
  },
  symbolBtnDisabled: {
    opacity: 0.6,
  },
  symbolBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
  },

  // BOARD
  boardWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  board: {
    width: 270,
    height: 270,
    backgroundColor: 'rgba(20, 20, 40, 0.9)',
    borderWidth: 2,
    borderColor: 'rgba(197, 107, 240, 0.6)',
    borderRadius: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  cell: {
    width: '33.333%',
    height: '33.333%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(197, 107, 240, 0.3)',
    backgroundColor: 'transparent',
  },
  cellX: {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
  },
  cellO: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
  },
  cellDisabled: {
    opacity: 0.5,
  },
  cellText: {
    fontSize: 48,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
  },

  // ACTION BUTTONS
  actionButtonsSection: {
    width: '100%',
    alignItems: 'center',
  },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(197, 107, 240, 0.6)',
    backgroundColor: 'rgba(94, 58, 238, 0.2)',
  },
  actionBtnPrimary: {
    backgroundColor: 'rgba(94, 58, 238, 0.4)',
    borderColor: 'rgba(197, 107, 240, 0.8)',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e8d5f5',
    letterSpacing: 0.3,
  },
});

export default TicTacToeScreen;
