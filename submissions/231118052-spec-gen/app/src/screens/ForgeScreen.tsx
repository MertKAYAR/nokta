import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForgeStore, ForgeCycle, CycleStatus } from '../utils/forgeStore';
import { AuditWidget } from '../components/AuditWidget';

const STATUS_COLORS: Record<CycleStatus, string> = {
  running: '#00ccff',
  success: '#00ff88',
  fail: '#ff4444',
  rollback: '#ff8800',
  stuck: '#ff00ff',
};

const STATUS_EMOJI: Record<CycleStatus, string> = {
  running: '⚙️',
  success: '✅',
  fail: '❌',
  rollback: '↩️',
  stuck: '🆘',
};

function CycleCard({ cycle, onUpdateStatus }: {
  cycle: ForgeCycle;
  onUpdateStatus: (id: string, status: CycleStatus) => void;
}) {
  const dur = cycle.endTime
    ? Math.round((cycle.endTime.getTime() - cycle.startTime.getTime()) / 60000)
    : null;

  return (
    <View style={[cardStyles.container, { borderColor: STATUS_COLORS[cycle.status] + '44' }]}>
      <View style={cardStyles.header}>
        <Text style={cardStyles.emoji}>{STATUS_EMOJI[cycle.status]}</Text>
        <View style={cardStyles.headerInfo}>
          <Text style={cardStyles.issueText} numberOfLines={1}>{cycle.issue}</Text>
          <Text style={cardStyles.meta}>
            {cycle.startTime.toLocaleTimeString('tr-TR')}
            {dur !== null ? ` · ${dur}dk` : ' · devam ediyor'}
          </Text>
        </View>
        <View style={[cardStyles.badge, { backgroundColor: STATUS_COLORS[cycle.status] + '22' }]}>
          <Text style={[cardStyles.badgeText, { color: STATUS_COLORS[cycle.status] }]}>
            {cycle.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Log */}
      {cycle.agentLog.length > 0 && (
        <View style={cardStyles.logContainer}>
          {cycle.agentLog.map((line, i) => (
            <Text key={i} style={cardStyles.logLine}>{line}</Text>
          ))}
        </View>
      )}

      {/* Actions (only for running cycles) */}
      {cycle.status === 'running' && (
        <View style={cardStyles.actions}>
          <TouchableOpacity
            style={[cardStyles.actionBtn, { borderColor: '#00ff88' }]}
            onPress={() => onUpdateStatus(cycle.id, 'success')}
          >
            <Text style={[cardStyles.actionText, { color: '#00ff88' }]}>✅ Başarılı</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[cardStyles.actionBtn, { borderColor: '#ff4444' }]}
            onPress={() => onUpdateStatus(cycle.id, 'fail')}
          >
            <Text style={[cardStyles.actionText, { color: '#ff4444' }]}>❌ Fail</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[cardStyles.actionBtn, { borderColor: '#ff8800' }]}
            onPress={() => onUpdateStatus(cycle.id, 'rollback')}
          >
            <Text style={[cardStyles.actionText, { color: '#ff8800' }]}>↩️ Rollback</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function ForgeScreen() {
  const router = useRouter();
  const { cycles, addCycle, updateCycle, isStuck, reports } = useForgeStore();
  const [newIssue, setNewIssue] = useState('');
  const [showAudit, setShowAudit] = useState(false);

  // Watch for stuck state
  useEffect(() => {
    if (isStuck) {
      Alert.alert(
        '🆘 STUCK Tespit Edildi',
        'Ardışık 2 başarısız cycle. Uzmana bağlan?',
        [
          { text: 'Hayır', style: 'cancel' },
          {
            text: '📞 Uzman Çağır',
            onPress: () => router.push('/bridge'),
          },
        ]
      );
    }
  }, [isStuck, router]);

  const handleStartCycle = () => {
    if (!newIssue.trim()) {
      Alert.alert('Hata', 'Issue açıklaması girin.');
      return;
    }

    const cycle: ForgeCycle = {
      id: `cycle-${Date.now()}`,
      startTime: new Date(),
      status: 'running',
      issue: newIssue.trim(),
      agentLog: [
        `[${new Date().toLocaleTimeString('tr-TR')}] Agent başlatıldı`,
        `[${new Date().toLocaleTimeString('tr-TR')}] Issue analiz ediliyor: "${newIssue.trim()}"`,
        `[${new Date().toLocaleTimeString('tr-TR')}] Kod tabanı taranıyor...`,
      ],
    };

    addCycle(cycle);
    setNewIssue('');

    // Simulate agent adding more logs
    setTimeout(() => {
      updateCycle(cycle.id, {
        agentLog: [
          ...cycle.agentLog,
          `[${new Date().toLocaleTimeString('tr-TR')}] Değişiklik önerisi hazırlandı`,
        ],
      });
    }, 2000);
  };

  const handleUpdateStatus = (id: string, status: CycleStatus) => {
    updateCycle(id, { status, endTime: new Date() });
  };

  const successCount = cycles.filter(c => c.status === 'success').length;
  const failCount = cycles.filter(c => c.status === 'fail').length;
  const rollbackCount = cycles.filter(c => c.status === 'rollback').length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        <Text style={styles.title}>🛠️ Forge Döngüsü</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: '#00ff88' }]}>{successCount}</Text>
            <Text style={styles.statLabel}>Başarılı</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: '#ff4444' }]}>{failCount}</Text>
            <Text style={styles.statLabel}>Fail</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: '#ff8800' }]}>{rollbackCount}</Text>
            <Text style={styles.statLabel}>Rollback</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: '#aaa' }]}>{reports.length}</Text>
            <Text style={styles.statLabel}>Rapor</Text>
          </View>
        </View>

        {/* Stuck warning */}
        {isStuck && (
          <TouchableOpacity
            style={styles.stuckBanner}
            onPress={() => router.push('/bridge')}
          >
            <Text style={styles.stuckText}>
              🆘 STUCK — Uzmanla görüşmeye geç →
            </Text>
          </TouchableOpacity>
        )}

        {/* New cycle */}
        <View style={styles.newCycleCard}>
          <Text style={styles.cardTitle}>Yeni Cycle</Text>
          <TextInput
            style={styles.input}
            value={newIssue}
            onChangeText={setNewIssue}
            placeholder="Issue açıklaması..."
            placeholderTextColor="#444"
          />
          <TouchableOpacity style={styles.startBtn} onPress={handleStartCycle}>
            <Text style={styles.startBtnText}>⚙️ Cycle Başlat</Text>
          </TouchableOpacity>
        </View>

        {/* Audit Widget toggle */}
        <TouchableOpacity
          style={styles.auditToggle}
          onPress={() => setShowAudit(v => !v)}
        >
          <Text style={styles.auditToggleText}>
            {showAudit ? '▼' : '▶'} Audit Widget ({reports.length} rapor)
          </Text>
        </TouchableOpacity>

        {showAudit && <AuditWidget />}

        {/* Cycles */}
        {cycles.length > 0 && (
          <View style={styles.cyclesSection}>
            <Text style={styles.sectionTitle}>Cycle Geçmişi</Text>
            {[...cycles].reverse().map(c => (
              <CycleCard
                key={c.id}
                cycle={c}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </View>
        )}

        {/* Expert bridge shortcut */}
        <TouchableOpacity
          style={styles.bridgeBtn}
          onPress={() => router.push('/bridge')}
        >
          <Text style={styles.bridgeBtnText}>📞 Uzmana Bağlan</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 20,
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  issueText: {
    color: '#ddd',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
  },
  meta: {
    color: '#555',
    fontFamily: 'monospace',
    fontSize: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 'bold',
  },
  logContainer: {
    backgroundColor: '#0a0a0a',
    borderRadius: 6,
    padding: 8,
    gap: 2,
  },
  logLine: {
    color: '#555',
    fontFamily: 'monospace',
    fontSize: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
  actionText: {
    fontFamily: 'monospace',
    fontSize: 11,
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
    gap: 14,
    paddingBottom: 32,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stat: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  statNum: {
    fontFamily: 'monospace',
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#555',
    fontFamily: 'monospace',
    fontSize: 10,
    marginTop: 2,
  },
  stuckBanner: {
    backgroundColor: '#ff00ff22',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ff00ff',
    alignItems: 'center',
  },
  stuckText: {
    color: '#ff00ff',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 14,
  },
  newCycleCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardTitle: {
    color: '#888',
    fontFamily: 'monospace',
    fontSize: 12,
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
  startBtn: {
    backgroundColor: '#001a1a',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00ccff33',
  },
  startBtnText: {
    color: '#00ccff',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  auditToggle: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  auditToggleText: {
    color: '#888',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  cyclesSection: {
    gap: 8,
  },
  sectionTitle: {
    color: '#888',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bridgeBtn: {
    backgroundColor: '#1a001a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8800ff44',
    marginTop: 8,
  },
  bridgeBtnText: {
    color: '#cc44ff',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
