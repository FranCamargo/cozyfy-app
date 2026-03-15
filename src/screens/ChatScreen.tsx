import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  SafeAreaView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import StarryBackground from '../components/StarryBackground';

interface ChatScreenProps {
  onBack: () => void;
}

interface ServerJoinRoom {
  message: string;
  roomId?: number;
  user?: string;
}

interface ServerMessage {
  user: string;
  message: string;
}

interface ChatMessage {
  id: string;
  user: string | null;
  text: string;
  color: string;
  isSystem?: boolean;
  isOwn?: boolean;
}

const SOCKET_URL = 'https://wssocket-production.up.railway.app/wssocket';

const USER_COLORS = [
  '#8092e4',
  '#e48080',
  '#80e4a0',
  '#e4e380',
  '#e480e4',
  '#80e4e4',
  '#e4a080',
  '#a080e4',
  '#80e480',
  '#e48080',
];

const ChatScreen: React.FC<ChatScreenProps> = ({ onBack }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const flatListRef = useRef<FlatList<ChatMessage> | null>(null);

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

  const { username, userColor } = useMemo(() => {
    const randomName = `user${Math.floor(1000 + Math.random() * 9000)}`;
    const randomColor = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
    return { username: randomName, userColor: randomColor };
  }, []);

  useEffect(() => { 
    const socket = io(SOCKET_URL, {
        timeout: 5000,
        reconnection: true,
        reconnectionAttempts: 1,
        reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('error', (err: any) => {
      console.log('error:', err);
    });

    socket.on('connection', (data: { message?: string } | string) => {
      const message = typeof data === 'string' ? data : data?.message;
      if (message) addSystemMessage(message);
    });

    socket.on('connect_error', (err: any) => {
      console.log('connect_error:', JSON.stringify(err,null, 2));
      setIsConnected(false);
      addSystemMessage('Tentando reconectar ao servidor...');
    });

    socket.on('connect', () => {
        console.log('conectado')
      setIsConnected(true);
      socket.emit('joinRoom', { username });
      console.log("depois connect")
    });

    socket.on('joinRoom', (data: ServerJoinRoom) => {
        console.log(data)
      if (data?.message) {
        addSystemMessage(data.message);
      }
    });

    socket.on('message', (data: ServerMessage) => {
      if (!data) return;
      const isOwn = data.user === username;
      addChatMessage(data.user, data.message, isOwn ? userColor : '#e5e7eb', isOwn);
    });

    socket.on('disconnected', (data: { user: string }) => {
      if (data?.user) {
        addSystemMessage(`${data.user} desconectou.`);
      }
    });

    socket.on('nextRoom', () => {
      addSystemMessage('Conectado a uma nova sala.');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const addSystemMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        user: null,
        text,
        color: '#9ca3af',
        isSystem: true,
      },
    ]);
    scrollToEnd();
  };

  const addChatMessage = (user: string, text: string, color: string, isOwn?: boolean) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        user,
        text,
        color,
        isOwn,
      },
    ]);
    scrollToEnd();
  };

  const scrollToEnd = () => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });
  };

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !socketRef.current || !isConnected) {
      return;
    }

    socketRef.current.emit('message', trimmed);
    addChatMessage(username, trimmed, userColor, true);
    setInputValue('');
    setShowEmojis(false);
  };

  const handleNextRoom = () => {
    if (!socketRef.current || !isConnected) return;
    socketRef.current.emit('nextRoom');
    setMessages([]);
  };

  const toggleEmojis = () => {
    setShowEmojis((prev) => !prev);
  };

  const handleSelectEmoji = (emoji: string) => {
    setInputValue((prev) => prev + emoji);
    setShowEmojis(false);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    if (item.isSystem) {
      return (
        <View style={styles.systemMessageContainer}>
          <View style={styles.systemMessagePill}>
            <Text style={styles.systemMessageText}>{item.text}</Text>
          </View>
        </View>
      );
    }

    const isOwn = item.isOwn;

    return (
      <View style={isOwn ? styles.rowOwn : styles.rowOther}>
        <LinearGradient
          colors={['rgba(34, 13, 119, 0.55)', 'rgba(0, 0, 0, 0.3)', 'rgba(109, 39, 139, 0.29)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}
        >
          <Text style={styles.bubbleUser}>{item.user}</Text>
          <Text style={[styles.bubbleText, { color: '#e8d5f5' }]}>
            {item.text}
          </Text>
        </LinearGradient>
      </View>
    );
  };

  const EMOJIS = ['😀', '😂', '😍', '✨', '👍', '🤔', '😎', '🥲'];

  return (
    <SafeAreaView style={styles.container}>
      <StarryBackground />

      <View style={styles.content}>
        {/* Header */}
        <LinearGradient
          colors={['rgba(34, 13, 119, 0.55)', 'rgba(0, 0, 0, 0.3)', 'rgba(109, 39, 139, 0.29)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={onBack}
              style={styles.headerBackButton}
            >
              <Ionicons name="chevron-back" size={24} color="#b78fd5" />
            </TouchableOpacity>

            <View style={styles.headerCenterContent}>
              <Text style={styles.headerTitle}>CozyFy Chat</Text>
              <View style={styles.headerStatusContainer}>
                <Text style={[styles.headerStatusDot, { color: isConnected ? '#10b981' : '#ef4444' }]}>●</Text>
                <Text style={styles.headerStatusText}>
                  {isConnected ? 'Online' : 'Conectando...'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.headerMenuButton}
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#b78fd5" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Chat Messages */}
        <View style={styles.chatFrame}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesContent}
            scrollEnabled={true}
          />
        </View>

        {/* Next Room Button */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={handleNextRoom}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.nextButtonWrapper}
          >
            <Animated.View
              style={[
                styles.nextButtonContainer,
                { transform: [{ scale: scaleAnim }] },
              ]}
            >
              <LinearGradient
                colors={['rgba(34, 13, 119, 0.55)', 'rgba(0, 0, 0, 0.3)', 'rgba(109, 39, 139, 0.29)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.nextButton}
              >
                <Ionicons name="refresh" size={16} color="#b78fd5" />
                <Text style={styles.nextButtonText}>Próxima Sala</Text>
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Emoji Picker */}
        {showEmojis && (
          <LinearGradient
            colors={['rgba(34, 13, 119, 0.55)', 'rgba(0, 0, 0, 0.3)', 'rgba(109, 39, 139, 0.29)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.emojiPicker}
          >
            {EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                onPress={() => handleSelectEmoji(emoji)}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </LinearGradient>
        )}

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={8}
        >
          <LinearGradient
            colors={['rgba(34, 13, 119, 0.55)', 'rgba(0, 0, 0, 0.3)', 'rgba(109, 39, 139, 0.29)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.inputRow}
          >
            <TouchableOpacity
              onPress={toggleEmojis}
              style={styles.emojiButton}
            >
              <Text style={styles.emojiBtnText}>😊</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Escreva uma mensagem..."
              placeholderTextColor="#a89cc4"
              value={inputValue}
              onChangeText={setInputValue}
              multiline
            />

            <TouchableOpacity
              onPress={handleSend}
              style={styles.sendButtonWrapper}
            >
              <LinearGradient
                colors={['rgba(34, 13, 119, 0.55)', 'rgba(0, 0, 0, 0.3)', 'rgba(109, 39, 139, 0.29)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendButton}
              >
                <Ionicons name="send" size={18} color="#b78fd5" />
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0624',
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 30,
    paddingBottom: 12,
  },
  header: {
    borderRadius: 20,
    marginBottom: 12,
    overflow: 'hidden',
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(90, 46, 109, 0.3)',
  },
  headerCenterContent: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '200',
    color: '#e8d5f5',
    fontFamily: 'AlmondMilky',
  },
  headerStatus: {
    fontSize: 12,
    color: '#b78fd5',
    fontWeight: '500',
  },
  headerStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerStatusDot: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerStatusText: {
    fontSize: 12,
    color: '#e8d5f5',
    fontWeight: '500',
    fontFamily: 'AlmondMilky',
  },
  headerPlaceholder: {
    width: 40,
  },
  headerMenuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: 'rgba(90, 46, 109, 0.3)',
  },
  chatFrame: {
    flex: 0.95,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  messagesContent: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  rowOwn: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  rowOther: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bubbleOwn: {
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    fontSize: 11,
    color: '#a89cc4',
    marginBottom: 2,
    fontWeight: '600',
    fontFamily: 'AlmondMilky',
  },
  bubbleText: {
    fontSize: 14,
    color: '#e8d5f5',
    fontFamily: 'AlmondMilky',
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 6,
  },
  systemMessagePill: {
    backgroundColor: 'rgba(90, 46, 109, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  systemMessageText: {
    fontSize: 12,
    color: '#a89cc4',
    fontWeight: '500',
    fontFamily: 'AlmondMilky',
  },
  actionsRow: {
    marginBottom: 8,
    alignItems: 'center',
  },
  nextButtonWrapper: {
    width: '100%',
  },
  nextButtonContainer: {
    width: '100%',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  nextButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e8d5f5',
    fontFamily: 'AlmondMilky',
  },
  emojiPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emoji: {
    fontSize: 24,
    margin: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emojiButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  emojiBtnText: {
    fontSize: 22,
  },
  input: {
    flex: 1,
    maxHeight: 80,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#e8d5f5',
    fontSize: 14,
    fontFamily: 'AlmondMilky',
  },
  sendButtonWrapper: {
    marginBottom: 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    overflow: 'hidden',
  },
});

export default ChatScreen;
