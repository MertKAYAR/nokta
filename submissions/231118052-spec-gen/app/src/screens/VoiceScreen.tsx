import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
} from 'react-native';
import { useVoiceVisualizer } from '../hooks/useVoiceVisualizer';
import { VoiceVisualizer } from '../components/VoiceVisualizer';

interface Transcript {
  id: string;
  text: string;
  timestamp: Date;
}

export default function VoiceScreen() {
  const { analysis, isRecording, startRecording, stopRecording } = useVoiceVisualizer();
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [mode, setMode] = useState<'bars' | 'wave'>('bars');
  const waveHistory = useRef<number[][]>([]);

  const handleRecord = async () => {
    if (isRecording) {
      const uri = await stopRecording();
      if (uri) {
        // Simulate STT (replace with real Whisper call)
        const mockText = `Rapor: Uygulama ${new Date().toLocaleTimeString('tr-TR')} itibarıyla stabil çalışıyor. Ses gecikmesi < 200ms hedefi tutturuldu.`;
        setTranscripts(prev => [
          { id: Date.now().toString(), text: mockText, timestamp: new Date() },
          ...prev,
        ]);
      }
    } else {
      await startRecording();
    }
  };

  // Build waveform history for oscilloscope mode
  if (isRecording && mode === 'wave') {
    const snapshot = [...analysis.bars];
    waveHistory.current = [...waveHistory.current.slice(-20), snapshot];
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        <View style={styles.header}>
          <Text style={styles.title}>🎙️ Ses Görselleştirici</Text>
          <View style={styles.modeToggle}>
            <TouchableOpacity
              onPress={() => setMode('bars')}
              style={[styles.modeBtn, mode === 'bars' && styles.modeBtnActive]}
            >
              <Text style={[styles.modeBtnText, mode === 'bars' && styles.modeBtnTextActive]}>
                Barlar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('wave')}
              style={[styles.modeBtn, mode === 'wave' && styles.modeBtnActive]}
            >
              <Text style={[styles.modeBtnText, mode === 'wave' && styles.modeBtnTextActive]}>
                Dalga
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main visualizer */}
        <View style={styles.vizMain}>
          {mode === 'bars' ? (
            <VoiceVisualizer
              bars={analysis.bars}
              isSpeaking={analysis.isSpeaking}
              rms={analysis.rms}
              color="#00ff88"
              height={160}
            />
          ) : (
            <WaveformDisplay
              bars={analysis.bars}
              isSpeaking={analysis.isSpeaking}
            />
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <Stat label="RMS" value={`${(analysis.rms * 100).toFixed(1)}%`} color="#00ff88" />
          <Stat label="Durum" value={analysis.isSpeaking ? 'Aktif' : 'Sessiz'} color={analysis.isSpeaking ? '#00ff88' : '#555'} />
          <Stat label="Mod" value={isRecording ? '🔴 Kayıt' : '⚫ Bekleme'} color={isRecording ? '#ff4444' : '#555'} />
        </View>

        {/* Record button */}
        <TouchableOpacity
          style={[styles.bigBtn, isRecording && styles.bigBtnActive]}
          onPress={handleRecord}
        >
          <Text style={styles.bigBtnText}>
            {isRecording ? '⏹  Kaydı Bitir & Transkript Et' : '🎙  Kayıt Başlat'}
          </Text>
        </TouchableOpacity>

        {/* Transcripts */}
        {transcripts.length > 0 && (
          <View style={styles.transcriptSection}>
            <Text style={styles.sectionTitle}>📝 Transkriptler</Text>
            {transcripts.map(t => (
              <View key={t.id} style={styles.transcriptCard}>
                <Text style={styles.transcriptTime}>
                  {t.timestamp.toLocaleTimeString('tr-TR')}
                </Text>
                <Text style={styles.transcriptText}>{t.text}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={statStyles.container}>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
    </View>
  );
}

function WaveformDisplay({ bars, isSpeaking }: { bars: number[]; isSpeaking: boolean }) {
  const width = 360;
  const height = 160;
  const mid = height / 2;

  const points = bars.map((b, i) => {
    const x = (i / (bars.length - 1)) * width;
    const amplitude = b * (height * 0.45);
    return { x, y: mid - amplitude };
  });

  const mirroredPoints = [...points].reverse().map(p => ({
    x: p.x,
    y: mid + (mid - p.y),
  }));

  const pathTop = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const pathBottom = mirroredPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <View style={{ width: '100%', height, backgroundColor: '#0a0a14', borderRadius: 12, overflow: 'hidden' }}>
      {/* SVG-less fallback: use absolute positioned views */}
      {bars.map((b, i) => {
        const h = b * (height * 0.45);
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: (i / bars.length) * width,
              top: mid - h,
              width: width / bars.length - 1,
              height: h * 2,
              backgroundColor: isSpeaking ? '#00ff8877' : '#ffffff22',
              borderRadius: 1,
            }}
          />
        );
      })}
      {/* Center line */}
      <View style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: mid - 0.5,
        height: 1,
        backgroundColor: '#ffffff11',
      }} />
    </View>
  );
}

const statStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  label: {
    color: '#555',
    fontFamily: 'monospace',
    fontSize: 10,
    marginBottom: 4,
  },
  value: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: 'bold',
  },
});

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
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 3,
    gap: 3,
    borderWidth: 1,
    borderColor: '#333',
  },
  modeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 5,
  },
  modeBtnActive: {
    backgroundColor: '#00ff8822',
  },
  modeBtnText: {
    color: '#555',
    fontFamily: 'monospace',
    fontSize: 11,
  },
  modeBtnTextActive: {
    color: '#00ff88',
  },
  vizMain: {
    backgroundColor: '#0a0a14',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a2a1a',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bigBtn: {
    backgroundColor: '#001a00',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#00ff8833',
  },
  bigBtnActive: {
    backgroundColor: '#1a0000',
    borderColor: '#ff444433',
  },
  bigBtnText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 15,
    fontWeight: 'bold',
  },
  transcriptSection: {
    gap: 8,
  },
  sectionTitle: {
    color: '#888',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
  },
  transcriptCard: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#222',
  },
  transcriptTime: {
    color: '#555',
    fontFamily: 'monospace',
    fontSize: 10,
  },
  transcriptText: {
    color: '#ccc',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
});
