import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useVoiceVisualizer } from '../hooks/useVoiceVisualizer';
import { VoiceVisualizer } from './VoiceVisualizer';
import { useForgeStore } from '../utils/forgeStore';

interface AuditWidgetProps {
  onReportCreated?: (reportId: string) => void;
}

export function AuditWidget({ onReportCreated }: AuditWidgetProps) {
  const { analysis, isRecording, startRecording, stopRecording } = useVoiceVisualizer();
  const addReport = useForgeStore(s => s.addReport);
  const reports = useForgeStore(s => s.reports);

  const [reportText, setReportText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [burnCount, setBurnCount] = useState(0);

  const handleVoiceRecord = async () => {
    if (isRecording) {
      const uri = await stopRecording();
      if (uri) {
        setIsTranscribing(true);
        // In production: send to Whisper API
        // For demo: simulate STT with placeholder
        setTimeout(() => {
          const simulated = `[Ses kaydı ${new Date().toLocaleTimeString('tr-TR')}] — Sistem performans raporu: ${burnCount + 1}. burn-in testi tamamlandı. Kullanıcı arayüzü stabil, render süresi < 16ms, bellek kullanımı normal sınırlar içinde.`;
          setReportText(prev => prev ? prev + '\n' + simulated : simulated);
          setIsTranscribing(false);
        }, 1200);
      }
    } else {
      await startRecording();
    }
  };

  const handleBurnIn = () => {
    if (!reportText.trim()) {
      Alert.alert('Hata', 'Önce rapor içeriği oluşturun.');
      return;
    }

    const newBurn = burnCount + 1;
    setBurnCount(newBurn);

    const report = {
      id: `rpt-${Date.now()}`,
      createdAt: new Date(),
      content: reportText,
      voiceDictated: true,
      burnInCount: newBurn,
    };

    addReport(report);
    onReportCreated?.(report.id);
    setReportText('');
    Alert.alert('✅ Burn-in Tamamlandı', `Rapor #${newBurn} kaydedildi.\nToplam: ${reports.length + 1} rapor`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📋 Audit Widget</Text>

      {/* Voice input area */}
      <View style={styles.voiceSection}>
        <VoiceVisualizer
          bars={analysis.bars}
          isSpeaking={analysis.isSpeaking}
          rms={analysis.rms}
          color="#00ccff"
          height={60}
        />

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.btn, isRecording && styles.btnActive]}
            onPress={handleVoiceRecord}
          >
            <Text style={styles.btnText}>
              {isRecording ? '⏹ Durdur' : '🎙 Dikte Et'}
            </Text>
          </TouchableOpacity>

          {isTranscribing && (
            <Text style={styles.transcribing}>STT işleniyor...</Text>
          )}
        </View>
      </View>

      {/* Text area */}
      <TextInput
        style={styles.textArea}
        value={reportText}
        onChangeText={setReportText}
        multiline
        placeholder="Rapor içeriği buraya gelecek (sesle veya elle yazabilirsiniz)..."
        placeholderTextColor="#444"
      />

      {/* Burn-in button */}
      <TouchableOpacity
        style={[styles.burnBtn, !reportText && styles.burnBtnDisabled]}
        onPress={handleBurnIn}
        disabled={!reportText.trim()}
      >
        <Text style={styles.burnBtnText}>
          🔥 Burn-in #{burnCount + 1}
        </Text>
      </TouchableOpacity>

      {/* Report count */}
      <Text style={styles.count}>
        Toplam rapor: {reports.length} / 3 minimum
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  title: {
    color: '#aaa',
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: 'bold',
  },
  voiceSection: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  btn: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00ccff44',
  },
  btnActive: {
    backgroundColor: '#ff000033',
    borderColor: '#ff4444',
  },
  btnText: {
    color: '#00ccff',
    fontFamily: 'monospace',
    fontSize: 13,
  },
  transcribing: {
    color: '#ff8800',
    fontFamily: 'monospace',
    fontSize: 11,
  },
  textArea: {
    backgroundColor: '#0a0a0a',
    color: '#eee',
    fontFamily: 'monospace',
    fontSize: 12,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#333',
    textAlignVertical: 'top',
  },
  burnBtn: {
    backgroundColor: '#ff4400',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  burnBtnDisabled: {
    backgroundColor: '#333',
  },
  burnBtnText: {
    color: '#fff',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 14,
  },
  count: {
    color: '#555',
    fontFamily: 'monospace',
    fontSize: 11,
    textAlign: 'center',
  },
});
