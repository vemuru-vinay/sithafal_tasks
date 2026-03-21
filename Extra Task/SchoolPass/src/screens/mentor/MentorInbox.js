import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../services/AuthContext';
import { listenToMentorRequests } from '../../services/firestore';
import { StatusChip, EmptyState, LoadingScreen, Card, SectionLabel } from '../../components';
import { Colors, Spacing, Radius } from '../../theme';

export default function MentorInbox({ navigation }) {
  const { profile } = useAuth();
  const [requests, setRequests] = useState(null);

  useEffect(() => {
    if (!profile?.uid) return;
    const unsub = listenToMentorRequests(profile.uid, setRequests);
    return unsub;
  }, [profile?.uid]);

  if (requests === null) return <LoadingScreen color={Colors.mentor} />;

  const needsAction = requests.filter(r => r.status === 'PARENT_APPROVED');
  const others = requests.filter(r => r.status !== 'PARENT_APPROVED');
  const sections = [
    { key: 'needs-action', title: 'Needs Action', data: needsAction },
    { key: 'others', title: 'Others', data: others },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={sections}
        keyExtractor={item => item.key}
        contentContainerStyle={styles.list}
        ListHeaderComponent={(
          <>
            <Card accentTop={Colors.mentor}>
              <Text style={styles.heroEyebrow}>Faculty Dashboard</Text>
              <View style={styles.heroRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroTitle}>{profile?.name || 'Faculty Mentor'}</Text>
                  <Text style={styles.heroSub}>Programme {profile?.class || 'Assigned'} outing approvals and follow-up live here.</Text>
                </View>
                <View style={styles.badgeBubble}>
                  <Text style={styles.badgeValue}>{needsAction.length}</Text>
                  <Text style={styles.badgeLabel}>Need action</Text>
                </View>
              </View>
            </Card>
            {requests.length === 0 && (
              <Card accentTop={Colors.mentor} style={{ paddingVertical: Spacing.xl }}>
                <EmptyState
                  icon="QUEUE"
                  title="No outing requests"
                  sub="Requests for your students will appear here."
                />
              </Card>
            )}
          </>
        )}
        renderItem={({ item: section }) => (
          <View style={styles.sectionWrap}>
            <SectionLabel text={section.title} />
            {section.data.length === 0 ? (
              <Card
                accentTop={section.key === 'needs-action' ? Colors.mentor : Colors.border}
                style={styles.emptySectionCard}
              >
                <Text style={styles.emptySectionText}>
                  {section.key === 'needs-action'
                    ? 'No requests currently waiting on your acknowledgement.'
                    : 'Nothing else to review right now.'}
                </Text>
              </Card>
            ) : (
              section.data.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.cardTouch}
                  onPress={() => navigation.navigate('MentorRequestDetail', { requestId: item.id })}
                  activeOpacity={0.8}
                >
                  <Card
                    style={[
                      styles.card,
                      item.status === 'PARENT_APPROVED' && styles.cardUrgent,
                    ]}
                    accentTop={Colors.mentor}
                  >
                    <View style={styles.cardRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{item.studentName}</Text>
                        <Text style={styles.cardMeta}>{item.reasonCategory} · {item.leaveAt} to {item.returnBy}</Text>
                        {item.status === 'PARENT_APPROVED' && (
                          <Text style={styles.urgentText}>Parent approved. Your faculty acknowledgement is next.</Text>
                        )}
                      </View>
                      <StatusChip status={item.status} />
                    </View>
                  </Card>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  list: { padding: Spacing.lg, paddingBottom: 40 },
  heroEyebrow: { fontSize: 13, color: Colors.mentor, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  heroRow: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 8 },
  heroTitle: { fontSize: 24, fontWeight: '700', color: Colors.ink },
  heroSub: { fontSize: 14, color: Colors.ink2, marginTop: 6, lineHeight: 22 },
  badgeBubble: { backgroundColor: Colors.mentorBg, borderRadius: Radius.lg, paddingVertical: 12, paddingHorizontal: 14, minWidth: 96, alignItems: 'center' },
  badgeValue: { fontSize: 24, fontWeight: '800', color: Colors.mentor },
  badgeLabel: { fontSize: 12, color: Colors.mentor, fontWeight: '700', textTransform: 'uppercase', marginTop: 4 },
  sectionWrap: { marginTop: Spacing.md },
  emptySectionCard: { backgroundColor: Colors.surface },
  emptySectionText: { fontSize: 13, color: Colors.ink2 },
  cardTouch: { marginBottom: Spacing.sm },
  card: { marginBottom: 0 },
  cardUrgent: { borderLeftWidth: 5, borderLeftColor: Colors.success, backgroundColor: Colors.successBg },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  cardMeta: { fontSize: 13, color: Colors.ink2, marginTop: 4 },
  urgentText: { fontSize: 13, color: Colors.success, marginTop: 8, fontWeight: '700' },
});



