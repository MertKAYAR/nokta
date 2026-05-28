import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useForgeStore } from '../utils/forgeStore';

interface BridgeSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  expert: string;
  summary: string;
  transcription: string;
}

export default function BridgeScreen() {
  const { cycles, isStuck, resetStuck } = useForgeStore();
  const [isInCall, setIsInCall] = useState(false);
  const [expertName, setExpertName] = useState('');
  const [sessionSummary, setSessionSummary] = useState('');
  const [sessions, setSessions] = useState<BridgeSession[]>([]);
  const [roomName, setRoomName] = useState('');
  const currentSession = useRef<BridgeSession | null>(null);

  const stuckCycle = cycles.filter(c => c.status === 'fail' || c.status === 'rollback').slice(-2);

  const generateRoomName = () => {
    const id = Math.random().toString(36).substring(2, 10);
    return `specgen-expert-${id}`;
  };

  const handleStartCall = () => {
    if (!expertName.trim()) {
      Alert.alert('Hata', 'Uzman adını girin.');
      return;
    }

    const room = generateRoomName();
    setRoomName(room);

    const session: BridgeSession = {
      id: `bridge-${Date.now()}`,
      startTime: new Date(),
      expert: expertName.trim(),
      summary: '',
      transcription: '',
    };
    currentSession.current = session;
    setIsInCall(true);
    resetStuck();
  };

  const handleEndCall = () => {
    if (!sessionSummary.trim()) {
      Alert.alert(
        'Özet Gerekli',
        'Görüşme özetini girmeden bitemezsin.',
        [
          { text: 'Devam Et', style: 'cancel' },
          { text: 'Özetsiz Bitir', onPress: () => endCallInternal() },
        ]
      );
      return;
    }
    endCallInternal();
  };

  const endCallInternal = () => {
    if (currentSession.current) {
      const completed: BridgeSession = {
        ...currentSession.current,
        endTime: new Date(),
        summary: sessionSummary,
        transcription: `[Otomatik transkripsiyon — ${new Date().toLocaleString('tr-TR')}]\nUzman: ${currentSession.current.expert}\n${sessionSummary}`,
      };
      setSessions(prev => [completed, ...prev]);
    }
    setIsInCall(false);
    setSessionSummary('');
    currentSession.current = null;
  };

  // Jitsi embedded URL
  const jitsiUrl = roomName
    ? `https://meet.jit.si/${roomName}#config.startWithVideoMuted=false&config.startWithAudioMuted=false&config.enableScreensharing=true&userInfo.displayName=Mert-231118052`
    : '';

  if (isInCall) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.callHeader}>
          <View style={styles.callHeaderLeft}>
            <View style={styles.liveDot} />
            <Text style={styles.callHeaderText}>Canlı Görüşme</Text>
          </View>
          <Text style={styles.callRoom}>{roomName}</Text>
        </View>

        {/* Jitsi WebView */}
        <View style={styles.webviewContainer}>
          <WebView
            source={{ uri: jitsiUrl }}
            style={styles.webview}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webviewLoader}>
                <Text style={styles.webviewLoaderText}>Görüşme başlatılıyor...</Text>
              </View>
            )}
          />
        </View>

        {/* In-call summary input */}
        <View style={styles.summaryPanel}>
          <Text style={styles.summaryLabel}>Görüşme Notu (BRIDGE.md'ye işlenecek)</Text>
          <TextInput
            style={styles.summaryInput}
            value={sessionSummary}
            onChangeText={setSessionSummary}
            placeholder="Görüşme sırasında not al..."
            placeholderTextColor="#444"
            multiline
          />
          <TouchableOpacity style={styles.endCallBtn} onPress={handleEndCall}>
            <Text style={styles.endCallBtnText}>📵 Görüşmeyi Bitir & Kaydet</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        <Text style={styles.title}>📞 Uzman Köprüsü</Text>

        {/* Stuck context */}
        {stuckCycle.length >= 2 && (
          <View style={styles.contextCard}>
            <Text style={styles.contextTitle}>🆘 STUCK Bağlamı</Text>
            {stuckCycle.map((c, i) => (
              <View key={c.id} style={styles.contextItem}>
                <Text style={styles.contextCycleNum}>Cycle #{cycles.indexOf(c) + 1}</Text>
                <Text style={styles.contextIssue}>{c.issue}</Text>
                <Text style={[styles.contextStatus, { color: '#ff4444' }]}>
                  {c.status.toUpperCase()}
                </Text>
              </View>
            ))}
            <Text style={styles.contextNote}>
              Bu bağlam uzmanla paylaşılmak üzere hazırlandı.
            </Text>
          </View>
        )}

        {/* Call setup */}
        <View style={styles.setupCard}>
          <Text style={styles.setupTitle}>Görüşme Başlat</Text>

          <TextInput
            style={styles.input}
            value={expertName}
            onChangeText={setExpertName}
            placeholder="Uzman / sınıf arkadaşı adı..."
            placeholderTextColor="#444"
          />

          <View style={styles.featureList}>
            <Text style={styles.featureItem}>✅ Ekran paylaşımı</Text>
            <Text style={styles.featureItem}>✅ Ses + Video</Text>
            <Text style={styles.featureItem}>✅ Jitsi Meet (ücretsiz)</Text>
          </View>

          <TouchableOpacity style={styles.callBtn} onPress={handleStartCall}>
            <Text style={styles.callBtnText}>📹 Görüntülü Görüşme Başlat</Text>
          </TouchableOpacity>
        </View>

        {/* Past sessions */}
        {sessions.length > 0 && (
          <View style={styles.sessionsSection}>
            <Text style={styles.sectionTitle}>Geçmiş Görüşmeler (BRIDGE.md)</Text>
            {sessions.map(s => (
              <View key={s.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionExpert}>👤 {s.expert}</Text>
                  <Text style={styles.sessionTime}>
                    {s.startTime.toLocaleTimeString('tr-TR')}
                    {s.endTime && ` → ${s.endTime.toLocaleTimeString('tr-TR')}`}
                  </Text>
                </View>
                <Text style={styles.sessionSummary}>{s.summary}</Text>
              </View>
            ))}
          </View>
        )}

        {/* BRIDGE.md preview */}
        {sessions.length > 0 && (
          <View style={styles.mdPreview}>
            <Text style={styles.mdPreviewTitle}>📄 BRIDGE.md Önizleme</Text>
            <Text style={styles.mdPreviewContent}>
              {sessions.map(s => (
                `## Görüşme — ${s.startTime.toLocaleDateString('tr-TR')}\n` +
                `**Uzman:** ${s.expert}\n` +
                `**Süre:** ${s.endTime ? Math.round((s.endTime.getTime() - s.startTime.getTime()) / 60000) : '?'} dk\n\n` +
                `### Özet\n${s.summary}\n\n` +
                `### Transkripsiyon\n${s.transcription}\n\n---\n`
              )).join('\n')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  contextCard: {
    backgroundColor: '#1a0020',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#ff00ff44',
  },
  contextTitle: {
    color: '#ff44ff',
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: 'bold',
  },
  contextItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#0a000f',
    borderRadius: 6,
    padding: 8,
  },
  contextCycleNum: {
    color: '#888',
    fontFamily: 'monospace',
    fontSize: 10,
    width: 55,
  },
  contextIssue: {
    color: '#ccc',
    fontFamily: 'monospace',
    fontSize: 11,
    flex: 1,
  },
  contextStatus: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
  },
  contextNote: {
    color: '#555',
    fontFamily: 'monospace',
    fontSize: 10,
  },
  setupCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  setupTitle: {
    color: '#888',
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#0a0a0a',
    color: '#eee',
    fontFamily: 'monospace',
    fontSize: 13,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  featureList: {
    gap: 4,
  },
  featureItem: {
    color: '#555',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  callBtn: {
    backgroundColor: '#0d001a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8800ff',
  },
  callBtnText: {
    color: '#cc44ff',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 15,
  },
  sessionsSection: {
    gap: 8,
  },
  sectionTitle: {
    color: '#888',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sessionCard: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#8800ff33',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionExpert: {
    color: '#cc44ff',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sessionTime: {
    color: '#555',
    fontFamily: 'monospace',
    fontSize: 10,
  },
  sessionSummary: {
    color: '#bbb',
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  mdPreview: {
    backgroundColor: '#0a0a14',
    borderRadius: 10,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#1a1a33',
  },
  mdPreviewTitle: {
    color: '#666',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
  },
  mdPreviewContent: {
    color: '#444',
    fontFamily: 'monospace',
    fontSize: 10,
    lineHeight: 16,
  },
  // In-call styles
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0d001a',
    borderBottomWidth: 1,
    borderBottomColor: '#8800ff44',
  },
  callHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
  },
  callHeaderText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  callRoom: {
    color: '#555',
    fontFamily: 'monospace',
    fontSize: 10,
  },
  webviewContainer: {
    flex: 1,
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  webviewLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
  },
  webviewLoaderText: {
    color: '#555',
    fontFamily: 'monospace',
  },
  summaryPanel: {
    padding: 12,
    gap: 10,
    backgroundColor: '#0d001a',
    borderTopWidth: 1,
    borderTopColor: '#8800ff44',
  },
  summaryLabel: {
    color: '#888',
    fontFamily: 'monospace',
    fontSize: 11,
  },
  summaryInput: {
    backgroundColor: '#0a0a0a',
    color: '#eee',
    fontFamily: 'monospace',
    fontSize: 12,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  endCallBtn: {
    backgroundColor: '#ff000022',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  endCallBtnText: {
    color: '#ff4444',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
