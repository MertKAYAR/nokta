import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useVoiceVisualizer } from '../hooks/useVoiceVisualizer';
import { VoiceVisualizer } from '../components/VoiceVisualizer';
import { AvatarScene } from '../components/AvatarScene';

export default function AvatarScreen() {
  const { analysis, isRecording, startRecording, stopRecording } = useVoiceVisualizer();
  const [latency, setLatency] = useState<number>(0);
  const [lastToggle, setLastToggle] = useState<number>(0);

  const handleToggle = async () => {
    const now = Date.now();
    if (isRecording) {
      await stopRecording();
      setLatency(Date.now() - now);
    } else {
      setLastToggle(now);
      await startRecording();
      setLatency(Date.now() - now);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🪞 Avatar · Lipsync</Text>
          <View style={styles.badge}>
            <View style={[styles.dot, analysis.isSpeaking && styles.dotActive]} />
            <Text style={styles.badgeText}>
              {analysis.isSpeaking ? 'Konuşuyor' : 'Sessiz'}
            </Text>
          </View>
        </View>

        {/* Avatar scene - main area */}
        <View style={styles.avatarContainer}>
          <AvatarScene rms={analysis.rms} isSpeaking={analysis.isSpeaking} />

          {/* Latency overlay */}
          <View style={styles.latencyBadge}>
            <Text style={styles.latencyText}>
              {latency > 0 ? `⚡ ${latency}ms` : '—'}
            </Text>
          </View>
        </View>

        {/* Voice visualizer */}
        <View style={styles.vizContainer}>
          <VoiceVisualizer
            bars={analysis.bars}
            isSpeaking={analysis.isSpeaking}
            rms={analysis.rms}
            color="#00ff88"
            height={90}
          />
        </View>

        {/* RMS meter */}
        <View style={styles.meter}>
          <Text style={styles.meterLabel}>RMS</Text>
          <View style={styles.meterTrack}>
            <View style={[styles.meterFill, { width: `${analysis.rms * 100}%` }]} />
          </View>
          <Text style={styles.meterValue}>{(analysis.rms * 100).toFixed(0)}%</Text>
        </View>

        {/* Record button */}
        <TouchableOpacity
          style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
          onPress={handleToggle}
          activeOpacity={0.8}
        >
          <View style={[styles.recordInner, isRecording && styles.recordInnerActive]}>
            {isRecording ? (
              <Text style={styles.recordIcon}>⏹</Text>
            ) : (
              <Text style={styles.recordIcon}>🎙</Text>
            )}
          </View>
          <Text style={styles.recordLabel}>
            {isRecording ? 'Kaydı Durdur' : 'Mikrofonu Başlat'}
          </Text>
        </TouchableOpacity>

        {/* Info */}
        <Text style={styles.info}>
          Mikrofona konuş → barlar zıplar → avatar dudakları senkron oynar{'\n'}
          Hedef gecikme: {'<'} 200ms
        </Text>

        {/* Avatar setup hint */}
        <View style={styles.hint}>
          <Text style={styles.hintTitle}>🪪 Avatar Kurulumu</Text>
          <Text style={styles.hintText}>
            1. avaturn.me → kendi yüzünü tara{'\n'}
            2. Export → .glb{'\n'}
            3. assets/models/avatar.glb olarak kaydet{'\n'}
            4. Uygulamayı yeniden başlat
          </Text>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#111',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#333',
  },
  dotActive: {
    backgroundColor: '#00ff88',
  },
  badgeText: {
    color: '#888',
    fontFamily: 'monospace',
    fontSize: 11,
  },
  avatarContainer: {
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#1a1a2e',
  },
  latencyBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#00000088',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  latencyText: {
    color: '#00ff88',
    fontFamily: 'monospace',
    fontSize: 10,
  },
  vizContainer: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1a2a1a',
  },
  meter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  meterLabel: {
    color: '#555',
    fontFamily: 'monospace',
    fontSize: 10,
    width: 30,
  },
  meterTrack: {
    flex: 1,
    height: 4,
    backgroundColor: '#1a1a1a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    backgroundColor: '#00ff88',
    borderRadius: 2,
  },
  meterValue: {
    color: '#555',
    fontFamily: 'monospace',
    fontSize: 10,
    width: 35,
    textAlign: 'right',
  },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#0d2d0d',
    borderRadius: 40,
    padding: 16,
    borderWidth: 2,
    borderColor: '#00ff8844',
  },
  recordBtnActive: {
    backgroundColor: '#2d0d0d',
    borderColor: '#ff444444',
  },
  recordInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00ff88',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordInnerActive: {
    backgroundColor: '#ff4444',
  },
  recordIcon: {
    fontSize: 20,
  },
  recordLabel: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: 'bold',
  },
  info: {
    color: '#444',
    fontFamily: 'monospace',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
  },
  hint: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a00',
    gap: 8,
  },
  hintTitle: {
    color: '#888',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
  },
  hintText: {
    color: '#555',
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 18,
  },
});
