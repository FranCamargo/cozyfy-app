import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Animated,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import StarryBackground from '../components/StarryBackground';

interface DashboardScreenProps {
  username?: string;
  onNavigateToChat: () => void;
  onNavigateToBreath: () => void;
  onNavigateToGames: () => void;
  onLogout: () => void;
}

interface RoomsData {
  rooms?: number;
  users?: number;
}

const { width, height } = Dimensions.get('window');
const SOCKET_URL = 'https://wssocket-production.up.railway.app/wssocket';

const DashboardScreen: React.FC<DashboardScreenProps> = ({
  username = 'Usuário',
  onNavigateToChat,
  onNavigateToBreath,
  onNavigateToGames,
  onLogout,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const socketRef = useRef<Socket | null>(null);
  const [greeting, setGreeting] = useState('Bom dia');
  const [usersOnline, setUsersOnline] = useState(0);
  const [roomsOpen, setRoomsOpen] = useState(0);

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 12 && hour < 18) {
      setGreeting('Boa tarde');
    } else if (hour >= 18) {
      setGreeting('Boa noite');
    } else {
      setGreeting('Bom dia');
    }
  }, []);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      forceNew: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Dashboard conectado ao servidor');
      socket.emit('rooms');
    });

    socket.on('rooms', (data: RoomsData) => {
      console.log('Dados de salas recebidos:', data);
      if (data?.users !== undefined) {
        setUsersOnline(data.users);
      }
      if (data?.rooms !== undefined) {
        setRoomsOpen(data.rooms);
      }
    });

    socket.on('connect_error', (err: any) => {
      console.log('Erro de conexão no Dashboard:', err);
    });

    socket.on('disconnect', () => {
      console.log('Dashboard desconectado do servidor');
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

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
      <View style={styles.scrollWrapper}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* HEADER - Greeting Card with Image Background */}
          <View style={styles.headerCard}>
            <StarryBackground />
            <ImageBackground
              source={require('../../assets/salempurple.jpg')}
              style={styles.headerImageWrapper}
              imageStyle={styles.headerImageStyle}
            >
              <View style={styles.headerContent}>
                <Text style={styles.greetingText}>{greeting},</Text>
                <Text style={styles.usernameText}>{username.charAt(0).toUpperCase() + username.slice(1)}!</Text>
              </View>
            </ImageBackground>
          </View>

          {/* MAIN ACTIONS CARDS */}
          {/* Hub de Jogos Card */}
          <TouchableOpacity onPress={onNavigateToGames} style={styles.actionCard}>
            <StarryBackground />
            <LinearGradient
              colors={['rgba(34, 13, 119, 0.55)', 'rgba(0, 0, 0, 0.3)', 'rgba(109, 39, 139, 0.29)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionCardGradient}
            >
              <View style={styles.cardInnerContent}>
                <View style={styles.cardIconContainer}>
                  <LinearGradient
                        colors={['rgba(90, 46, 109, 0.2)', 'rgba(139, 58, 150, 0.2)']}

                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconBackground}
                  >
                    <Ionicons name="game-controller-outline" size={32} color="white" />
                  </LinearGradient>
                </View>
                <View style={styles.cardTextContent}>
                  <Text style={styles.cardTitle}>Hub de Jogos</Text>
                  <Text style={styles.cardSubtitle}>Jogue sozinho ou com amigos</Text>
                </View>
                <Ionicons name="chevron-forward" size={28} color="#b78fd5" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Respiração Card */}
          <TouchableOpacity onPress={onNavigateToBreath} style={styles.actionCard}>
            <StarryBackground />
            <LinearGradient
              colors={['rgba(34, 13, 119, 0.55)', 'rgba(0, 0, 0, 0.3)', 'rgba(109, 39, 139, 0.29)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionCardGradient}
            >
              <View style={styles.cardInnerContent}>
                <View style={styles.cardIconContainer}>
                  <LinearGradient
                    colors={['rgba(90, 46, 109, 0.2)', 'rgba(139, 58, 150, 0.2)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconBackground}
                  >
                    <Ionicons name="leaf-outline" size={32} color="white" />
                  </LinearGradient>
                </View>
                <View style={styles.cardTextContent}>
                  <Text style={styles.cardTitle}>Respiração</Text>
                  <Text style={styles.cardSubtitle}>Acalme-se e durma melhor</Text>
                </View>
                <Ionicons name="chevron-forward" size={28} color="#b78fd5" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Sala de Chat Card */}
          <TouchableOpacity onPress={onNavigateToChat} style={styles.actionCard}>
            <StarryBackground />
            <LinearGradient
              colors={['rgba(34, 13, 119, 0.55)', 'rgba(0, 0, 0, 0.3)', 'rgba(109, 39, 139, 0.29)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionCardGradient}
            >
              <View style={styles.cardInnerContent}>
                <View style={styles.cardIconContainer}>
                  <LinearGradient
                    colors={['rgba(90, 46, 109, 0.2)', 'rgba(139, 58, 150, 0.2)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconBackground}
                  >
                    <Ionicons name="chatbubbles-outline" size={32} color="white" />
                  </LinearGradient>
                </View>
                <View style={styles.cardTextContent}>
                  <Text style={styles.cardTitle}>Sala de Chat</Text>
                  <Text style={styles.cardSubtitle}>Bate-papo anônimo</Text>
                </View>
                <Ionicons name="chevron-forward" size={28} color="#b78fd5" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* STATS CARDS */}
          <View style={styles.statsRow}>
            {/* Online Card */}
            <View style={[styles.statCard, { marginRight: 8 }]}>
              <StarryBackground />
              <LinearGradient
                colors={['rgba(45, 13, 119, 0.55)', 'rgba(0, 0, 0, 0.3)', 'rgba(109, 39, 139, 0.29)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statCardGradient}
              >
                <View style={styles.statContent}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="people-circle-outline" size={40} color="#b78fd5" />
                  </View>
                  <Text style={styles.statLabel}>ONLINE</Text>
                  <Text style={styles.statNumber}>{usersOnline.toLocaleString('pt-BR')}</Text>
                  <Text style={styles.statSubLabel}>usuários</Text>
                </View>
              </LinearGradient>
            </View>

            {/* Abertas Card */}
            <View style={[styles.statCard, { marginLeft: 8 }]}>
              <StarryBackground />
              <LinearGradient
                colors={['rgba(45, 13, 119, 0.55)', 'rgba(0, 0, 0, 0.3)', 'rgba(109, 39, 139, 0.29)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statCardGradient}
              >
                <View style={styles.statContent}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="chatbubbles-outline" size={40} color="#b78fd5" />
                  </View>
                  <Text style={styles.statLabel}>ABERTAS</Text>
                  <Text style={styles.statNumber}>{roomsOpen}</Text>
                  <Text style={styles.statSubLabel}>salas</Text>
                </View>
              </LinearGradient>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* LOGOUT BUTTON - Fixed at bottom */}
      <View style={styles.logoutButtonWrapper}>
        <StarryBackground />
        <LinearGradient
          colors={['rgba(34, 13, 119, 0.55)', 'rgba(0, 0, 0, 0.3)', 'rgba(109, 39, 139, 0.29)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoutButtonGradient}
        >
          <TouchableOpacity
            onPress={onLogout}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.logoutButtonContent}
            activeOpacity={0.8}
          >
            <Animated.View
              style={{
                transform: [{ scale: scaleAnim }],
              }}
            >
              <View style={styles.logoutButtonInner}>
                <Ionicons name="log-out-outline" size={24} color="#e8d5f5" />
                <Text style={styles.logoutButtonText}>Sair</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </SafeAreaView>
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
    paddingBottom: 16,
    flexGrow: 1,
  },

  // HEADER CARD - With Image Background
  headerCard: {
    height: 200,
    marginBottom: 16,
    overflow: 'hidden',
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerImageWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  headerImageStyle: {
    borderRadius: 28,
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 8,
  },
  headerContent: {
    zIndex: 2,
  },
  greetingSection: {
    gap: 4,
  },
  greetingText: {
    fontSize: 32,
    fontWeight: '400',
    color: '#ffffff',
    letterSpacing: 0.3,
    fontFamily: 'AlmondMilky',
  },
  usernameText: {
    fontSize: 32,
    fontWeight: '400',
    color: '#ffffff',
    letterSpacing: 0.3,
    fontFamily: 'AlmondMilky',
  },
  dateTimeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#a89cc4',
    textTransform: 'capitalize',
    letterSpacing: 0.2,
  },
  timeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#e8d5f5',
    letterSpacing: 0.3,
  },

  // ACTION CARDS
  actionCard: {
    borderRadius: 20,
    marginBottom: 2,
    overflow: 'hidden',
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0)',
  },
  actionCardGradient: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    zIndex: 2,
  },
  cardInnerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  iconBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTextContent: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#e8d5f5',
    letterSpacing: 0.3,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#a89cc4',
    letterSpacing: 0.2,
  },

  // STATS CARDS
  statsRow: {
    flexDirection: 'row',
    gap: 0,
    marginBottom: 0,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statCardGradient: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 2,
  },
  statContent: {
    alignItems: 'center',
    gap: 2,
  },
  statIconContainer: {
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a89cc4',
    letterSpacing: 1.2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#e8d5f5',
    letterSpacing: 0.5,
  },
  statSubLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8876a8',
    letterSpacing: 0.2,
  },

  // LOGOUT BUTTON
  logoutButtonWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 45,
    alignItems: 'center',
    height: 90,
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 24,
  },
  logoutButtonGradient: {
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    minHeight: 55,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 2,
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoutButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e8d5f5',
    letterSpacing: 0.3,
  },
});

export default DashboardScreen;
