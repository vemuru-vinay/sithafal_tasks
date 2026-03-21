import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../services/AuthContext';
import { listenToParentRequests } from '../../services/firestore';
import { StatusChip, EmptyState, LoadingScreen, Card, SectionLabel } from '../../components';
import { Colors, Spacing, Radius, Shadow } from '../../theme';

const getRelativeTime = (createdAt) => {
  const value = createdAt?.toDate?.() || createdAt;
  if (!value) return 'Just now';

  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

export default function ParentInbox({ navigation }) {
  const { profile } = useAuth();
  const [requests, setRequests] = useState(null);
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    if (!profile?.uid) return;
    const unsub = listenToParentRequests(profile.uid, setRequests);
    return unsub;
  }, [profile?.uid]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0.45, duration: 900, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  if (requests === null) return <LoadingScreen color={Colors.parent} />;

  const pending = requests.filter(r => r.status === 'PENDING');
  const approved = requests.filter(r => ['PARENT_APPROVED', 'MENTOR_ACKNOWLEDGED', 'EXITED', 'RETURNED'].includes(r.status));
  const rejected = requests.filter(r => r.status === 'REJECTED');
  const sorted = [...pending, ...requests.filter(r => r.status !== 'PENDING')];

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        contentContainerStyle={styles.list}
        data={sorted}
        keyExtractor={item => item.id}
        ListHeaderComponent={(
          <>
            <Card style={styles.heroCard} accentTop={Colors.parent}>
              <Text style={styles.heroEyebrow}>Parent Dashboard</Text>
              <Text style={styles.heroTitle}>{profile?.name || 'Parent'}</Text>
              <Text style={styles.heroSub}>Review new outing requests and keep track of decisions in real time.</Text>
            </Card>

            <View style={styles.summaryRow}>
              <SummaryTile label="Pending" value={pending.length} color={Colors.warn} bg={Colors.warnBg} />
              <SummaryTile label="Approved" value={approved.length} color={Colors.success} bg={Colors.successBg} />
              <SummaryTile label="Rejected" value={rejected.length} color={Colors.danger} bg={Colors.dangerBg} />
            </View>

            {pending.length > 0 ? (
              <Card style={styles.alertBanner} accentTop={Colors.parent}>
                <Text style={styles.alertText}>{pending.length} request{pending.length > 1 ? 's' : ''} waiting for your decision right now.</Text>
              </Card>
            ) : (
              <Card accentTop={Colors.parent} style={styles.calmBanner}>
                <Text style={styles.calmTitle}>All caught up</Text>
                <Text style={styles.calmText}>New student outing requests will appear here as soon as they are submitted.</Text>
              </Card>
            )}

            {sorted.length > 0 && <SectionLabel text="Requests" />}
          </>
        )}
        ListEmptyComponent={(
          <Card accentTop={Colors.parent} style={{ paddingVertical: Spacing.xl }}>
            <EmptyState
              icon="REQUEST"
              title="No requests yet"
              sub="Your child has not submitted any outing requests yet."
            />
          </Card>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.cardTouch}
            onPress={() => navigation.navigate('ParentRequestDetail', { requestId: item.id })}
            activeOpacity={0.8}
          >
            <Card
              style={[
                styles.card,
                item.status === 'PENDING' && { borderLeftWidth: 5, borderLeftColor: `rgba(217,119,6,${pulse})` },
              ]}
              accentTop={Colors.parent}
            >
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.reasonCategory}</Text>
                  <Text style={styles.cardMeta}>{item.studentName} · {item.leaveAt} to {item.returnBy}</Text>
                  <Text style={styles.cardTime}>{getRelativeTime(item.createdAt)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 8 }}>
                  <StatusChip status={item.status} />
                  {item.status === 'PENDING' && (
                    <Text style={styles.actionNeeded}>Tap to approve or reject</Text>
                  )}
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

function SummaryTile({ label, value, color, bg }) {
  return (
    <View style={[styles.summaryTile, { backgroundColor: bg }]}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  list: { padding: Spacing.lg, paddingBottom: 40 },
  heroCard: { marginBottom: Spacing.md, ...Shadow.sm },
  heroEyebrow: { fontSize: 13, color: Colors.parent, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: Colors.ink, marginTop: 6 },
  heroSub: { fontSize: 14, color: Colors.ink2, marginTop: 6, lineHeight: 22 },
  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: Spacing.md },
  summaryTile: { flex: 1, borderRadius: Radius.md, paddingVertical: 14, paddingHorizontal: 12, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 13, fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  alertBanner: { backgroundColor: Colors.warnBg, borderColor: Colors.parentMid },
  alertText: { fontSize: 14, color: Colors.parent, fontWeight: '700' },
  calmBanner: { backgroundColor: Colors.parentBg, borderColor: Colors.parentMid },
  calmTitle: { fontSize: 14, fontWeight: '700', color: Colors.parent },
  calmText: { fontSize: 13, color: Colors.ink2, marginTop: 4 },
  cardTouch: { marginBottom: Spacing.sm },
  card: { marginBottom: 0 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  cardMeta: { fontSize: 13, color: Colors.ink2, marginTop: 4 },
  cardTime: { fontSize: 13, color: Colors.ink3, marginTop: 8 },
  actionNeeded: { fontSize: 13, color: Colors.parent, fontWeight: '700', textAlign: 'right' },
});

