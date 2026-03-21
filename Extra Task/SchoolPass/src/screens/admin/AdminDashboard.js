import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../services/AuthContext';
import { StatusChip, Avatar, LoadingScreen } from '../../components';
import { Colors, Spacing, Radius, Shadow } from '../../theme';
import CustomModal from '../../components/CustomModal';
import useModal from '../../hooks/useModal';

export default function AdminDashboard({ navigation }) {
  const { profile, logout } = useAuth();
  const [requests, setRequests] = useState(null);
  const [tab, setTab] = useState('live');
  const { modal, showConfirm } = useModal();

  useEffect(() => {
    const q = query(collection(db, 'exitRequests'), orderBy('createdAt', 'desc'), limit(100));
    const unsub = onSnapshot(q, snap => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const handleLogout = async () => {
    const confirmed = await showConfirm({
      type: 'logout',
      title: 'Logout from the admin dashboard?',
      message: 'You can sign back in any time with your administration account.',
      confirmText: 'Logout',
      cancelText: 'Stay',
    });

    if (confirmed) {
      await logout();
    }
  };

  if (!requests) return <LoadingScreen color={Colors.admin} />;

  const outside = requests.filter(r => r.status === 'EXITED');
  const pending = requests.filter(r => ['PENDING', 'PARENT_APPROVED', 'MENTOR_ACKNOWLEDGED'].includes(r.status));
  const today = requests.filter(r => {
    if (!r.createdAt?.seconds) return false;
    const d = new Date(r.createdAt.seconds * 1000);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const overdue = requests.filter(r => r.status === 'OVERDUE');

  const tabData = {
    live: outside,
    pending,
    today,
    all: requests,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image source={require('../../../assets/iiser-logo.png')} style={styles.logo} />
            <View>
              <Text style={styles.headerTitle}>Admin Dashboard</Text>
              <Text style={styles.headerSub}>IISER Tirupati Outing System</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderTopColor: Colors.danger }]}>
            <Text style={[styles.statNum, { color: Colors.danger }]}>{outside.length}</Text>
            <Text style={styles.statLabel}>Currently Outside</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: Colors.warn }]}>
            <Text style={[styles.statNum, { color: Colors.warn }]}>{pending.length}</Text>
            <Text style={styles.statLabel}>Pending Approval</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: Colors.success }]}>
            <Text style={[styles.statNum, { color: Colors.success }]}>{today.length}</Text>
            <Text style={styles.statLabel}>Today's Requests</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: Colors.admin }]}>
            <Text style={[styles.statNum, { color: Colors.admin }]}>{overdue.length}</Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
        </View>

        {overdue.length > 0 && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertText}>
              {overdue.length} student{overdue.length > 1 ? 's are' : ' is'} overdue and has not returned to campus.
            </Text>
          </View>
        )}

        <View style={styles.tabRow}>
          {[
            { key: 'live', label: `Outside (${outside.length})` },
            { key: 'pending', label: `Pending (${pending.length})` },
            { key: 'today', label: `Today (${today.length})` },
            { key: 'all', label: 'All' },
          ].map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tabData[tab].length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>LIST</Text>
            <Text style={styles.emptyText}>No records found</Text>
          </View>
        ) : (
          tabData[tab].map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.requestCard}
              onPress={() => navigation.navigate('AdminRequestDetail', { requestId: item.id })}
              activeOpacity={0.75}
            >
              <View style={styles.cardRow}>
                <Avatar name={item.studentName} color={Colors.student} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{item.studentName}</Text>
                  <Text style={styles.cardMeta}>{item.reasonCategory} · {item.leaveAt} - {item.returnBy}</Text>
                  <Text style={styles.cardTime}>
                    {item.createdAt?.seconds
                      ? new Date(item.createdAt.seconds * 1000).toLocaleString()
                      : 'Just now'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <StatusChip status={item.status} />
                  {item.status === 'EXITED' && (
                    <View style={styles.locationBtn}>
                      <Text style={styles.locationBtnText}>Track</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      <CustomModal {...modal} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.adminBg },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, ...Shadow.sm },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 36, height: 36, resizeMode: 'contain' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  headerSub: { fontSize: 11, color: Colors.ink3 },
  logoutBtn: { backgroundColor: Colors.dangerBg, borderRadius: Radius.sm, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.danger },
  logoutText: { color: Colors.danger, fontSize: 12, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: Spacing.md },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, borderTopWidth: 3, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  statNum: { fontSize: 32, fontWeight: '800' },
  statLabel: { fontSize: 11, color: Colors.ink3, marginTop: 2 },
  alertBanner: { backgroundColor: Colors.dangerBg, borderRadius: Radius.md, padding: 12, borderWidth: 1, borderColor: '#FCA5A5', marginBottom: Spacing.md },
  alertText: { fontSize: 13, color: Colors.danger, fontWeight: '600' },
  tabRow: { flexDirection: 'row', backgroundColor: Colors.bg2, borderRadius: Radius.md, padding: 4, marginBottom: Spacing.md, gap: 4 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radius.sm },
  tabBtnActive: { backgroundColor: Colors.surface, ...Shadow.sm },
  tabText: { fontSize: 11, color: Colors.ink3, fontWeight: '500' },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  requestCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardName: { fontSize: 14, fontWeight: '600', color: Colors.ink },
  cardMeta: { fontSize: 12, color: Colors.ink2, marginTop: 2 },
  cardTime: { fontSize: 10, color: Colors.ink3, marginTop: 2 },
  locationBtn: { backgroundColor: Colors.adminBg, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: Colors.adminMid },
  locationBtnText: { fontSize: 10, color: Colors.admin, fontWeight: '600' },
  emptyWrap: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 12, marginBottom: 10, color: Colors.ink3, fontWeight: '800', letterSpacing: 1 },
  emptyText: { fontSize: 15, color: Colors.ink2 },
});
