import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listenToGateRequests, confirmReturn, getUserProfile } from '../../services/firestore';
import { sendPushNotification, NOTIF } from '../../services/notifications';
import { useAuth } from '../../services/AuthContext';
import { Card, Avatar, LoadingScreen, EmptyState, PrimaryButton, StatusChip } from '../../components';
import { Colors, Spacing, Radius } from '../../theme';
import CustomModal from '../../components/CustomModal';
import useModal from '../../hooks/useModal';

export default function GateManualSearch({ navigation }) {
  const { profile } = useAuth();
  const [requests, setRequests] = useState(null);
  const [query, setQuery] = useState('');
  const [logging, setLogging] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const { modal, showAlert, showConfirm } = useModal();

  useEffect(() => {
    const unsub = listenToGateRequests(setRequests);
    return unsub;
  }, [refreshTick]);

  const filtered = (requests || []).filter(r => {
    const q = query.toLowerCase();
    return (
      r.studentName?.toLowerCase().includes(q) ||
      r.studentId?.toLowerCase().includes(q) ||
      r.rollNo?.toString().includes(q)
    );
  });

  const handleLogReturn = async (req) => {
    const confirmed = await showConfirm({
      type: 'success',
      title: 'Confirm student return?',
      message: `Confirm ${req.studentName} has returned to campus.`,
      confirmText: 'Confirm Return',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    setLogging(req.id);
    try {
      await confirmReturn(req.id, profile.uid);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      try {
        const [p, m] = await Promise.all([
          getUserProfile(req.parentId),
          getUserProfile(req.mentorId),
        ]);
        const { title, body } = NOTIF.studentReturned(req.studentName, now);
        if (p?.fcmToken) await sendPushNotification(p.fcmToken, title, body);
        if (m?.fcmToken) await sendPushNotification(m.fcmToken, title, body);
      } catch (_) {}

      await showAlert({
        type: 'success',
        title: 'Return logged',
        message: `${req.studentName} was marked as returned successfully.`,
      });
    } catch (err) {
      await showAlert({
        type: 'danger',
        title: 'Unable to log return',
        message: err.message,
      });
    } finally {
      setLogging(null);
    }
  };

  if (requests === null) return <LoadingScreen color={Colors.gate} />;

  const readyCount = requests.filter(r => r.status === 'MENTOR_ACKNOWLEDGED').length;
  const exitedCount = requests.filter(r => r.status === 'EXITED').length;
  const returnedCount = requests.filter(r => r.status === 'RETURNED').length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Student Search</Text>
          <Text style={styles.pageSub}>{profile?.gateId || 'Main Gate'} live outing lookup</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => {
            setQuery('');
            setRefreshTick(t => t + 1);
          }}
        >
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsStrip}>
        <StatBlock label="Ready" value={readyCount} color={Colors.gate} bg="#EDE9FE" />
        <StatBlock label="Left" value={exitedCount} color={Colors.warn} bg="#FFF7E6" />
        <StatBlock label="Returned" value={returnedCount} color={Colors.success} bg="#ECFDF5" />
      </View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>ID</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by student name or ID number"
          placeholderTextColor={Colors.ink3}
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clearBtn}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={(
          <Card accentTop={Colors.gate} style={{ paddingVertical: Spacing.xl }}>
            <EmptyState
              icon="SEARCH"
              title={query ? 'No matching students' : 'No requests today'}
              sub={query ? 'Try a different student name or ID number.' : 'Approved and completed outing records will appear here.'}
            />
          </Card>
        )}
        renderItem={({ item }) => (
          <Card
            style={[
              styles.card,
              item.status === 'MENTOR_ACKNOWLEDGED' && styles.readyCard,
            ]}
            accentTop={Colors.gate}
          >
            <View style={styles.cardRow}>
              <Avatar name={item.studentName} color={Colors.student} size={42} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{item.studentName}</Text>
                <Text style={styles.cardMeta}>{item.studentClass} · {item.reasonCategory}</Text>
                <Text style={styles.cardTime}>{item.leaveAt} to {item.returnBy}</Text>
              </View>
              <StatusChip status={item.status} />
            </View>

            {item.status === 'MENTOR_ACKNOWLEDGED' && (
              <PrimaryButton
                label="Verify OTP"
                color={Colors.success}
                onPress={() => navigation.navigate('GateVerify', { qrToken: item.qrToken })}
                style={{ marginTop: Spacing.sm }}
              />
            )}

            {item.status === 'EXITED' && (
              <PrimaryButton
                label="Log Return"
                color={Colors.gate}
                onPress={() => handleLogReturn(item)}
                loading={logging === item.id}
                style={{ marginTop: Spacing.sm }}
              />
            )}
          </Card>
        )}
      />
      <CustomModal {...modal} />
    </SafeAreaView>
  );
}

function StatBlock({ label, value, color, bg }) {
  return (
    <View style={[styles.statItem, { backgroundColor: bg }]}>
      <Text style={[styles.statNum, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.gateBg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, gap: 12 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: Colors.ink },
  pageSub: { fontSize: 13, color: Colors.ink2, marginTop: 4 },
  refreshBtn: { minHeight: 42, paddingHorizontal: 14, borderRadius: Radius.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.gateMid, alignItems: 'center', justifyContent: 'center' },
  refreshText: { fontSize: 13, color: Colors.gate, fontWeight: '700' },
  statsStrip: { flexDirection: 'row', gap: 10, margin: Spacing.lg },
  statItem: { flex: 1, borderRadius: Radius.md, alignItems: 'center', paddingVertical: 14 },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.md, paddingHorizontal: 14, borderWidth: 1.5, borderColor: Colors.gateMid, minHeight: 56 },
  searchIcon: { fontSize: 11, marginRight: 10, color: Colors.gate, fontWeight: '800', letterSpacing: 0.8 },
  searchInput: { flex: 1, fontSize: 15, color: Colors.ink },
  clearBtn: { fontSize: 13, color: Colors.ink3, padding: 4, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  card: { marginBottom: Spacing.sm },
  readyCard: { backgroundColor: Colors.successBg, borderColor: Colors.success },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardName: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  cardMeta: { fontSize: 13, color: Colors.ink2, marginTop: 4 },
  cardTime: { fontSize: 13, color: Colors.ink3, marginTop: 6 },
});
