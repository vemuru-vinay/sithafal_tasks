import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Colors, Spacing, Radius } from '../../theme';
import { Card, InfoRow, StatusChip, Avatar, LoadingScreen, SectionLabel } from '../../components';

export default function AdminRequestDetail({ route, navigation }) {
  const { requestId } = route.params;
  const [request, setRequest] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'exitRequests', requestId), snap => {
      if (snap.exists()) setRequest({ id: snap.id, ...snap.data() });
    });
    return unsub;
  }, [requestId]);

  if (!request) return <LoadingScreen color={Colors.admin} />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Request Details</Text>
        <StatusChip status={request.status} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={{ backgroundColor: Colors.adminBg, borderColor: Colors.adminMid }} accentTop={Colors.admin}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar name={request.studentName} color={Colors.student} size={48} />
            <View>
              <Text style={{ fontSize: 17, fontWeight: '700', color: Colors.ink }}>{request.studentName}</Text>
              <Text style={{ fontSize: 12, color: Colors.ink2 }}>{request.studentClass}</Text>
            </View>
          </View>
        </Card>

        <Card>
          <SectionLabel text="Outing Details" />
          <InfoRow label="Reason" value={request.reasonCategory} />
          <InfoRow label="Details" value={request.reasonDetail || '-'} />
          <InfoRow label="Departure" value={request.leaveAt} />
          <InfoRow label="Return By" value={request.returnBy} />
          <InfoRow label="Urgency" value={request.urgency} />
          <InfoRow label="Request ID" value={request.id?.slice(-8).toUpperCase()} />
          <InfoRow
            label="Submitted"
            value={request.createdAt?.seconds ? new Date(request.createdAt.seconds * 1000).toLocaleString() : '-'}
          />
        </Card>

        <Card>
          <SectionLabel text="Approval Timeline" />
          {(request.statusHistory || []).map((h, i) => (
            <View key={i} style={styles.timelineRow}>
              <View style={[styles.timelineDot, { backgroundColor: Colors.success }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.timelineStatus}>{h.status}</Text>
                <Text style={styles.timelineTime}>{h.at}</Text>
              </View>
            </View>
          ))}
        </Card>

        {request.parentApproval && (
          <Card style={{ backgroundColor: Colors.parentBg, borderColor: Colors.parentMid }} accentTop={Colors.parent}>
            <SectionLabel text="Parent Decision" />
            <InfoRow label="Decision" value={request.parentApproval.approved ? 'Approved' : 'Rejected'} />
            <InfoRow label="Note" value={request.parentApproval.note || '-'} />
            <InfoRow label="Time" value={request.parentApproval.at} />
          </Card>
        )}

        {request.mentorApproval && (
          <Card style={{ backgroundColor: Colors.mentorBg, borderColor: Colors.mentorMid }} accentTop={Colors.mentor}>
            <SectionLabel text="Faculty Decision" />
            <InfoRow label="Decision" value={request.mentorApproval.acknowledged ? 'Acknowledged' : 'Flagged'} />
            <InfoRow label="Note" value={request.mentorApproval.note || '-'} />
            <InfoRow label="Time" value={request.mentorApproval.at} />
          </Card>
        )}

        {request.gate && (
          <Card style={{ backgroundColor: Colors.gateBg, borderColor: Colors.gateMid }} accentTop={Colors.gate}>
            <SectionLabel text="Gate Record" />
            <InfoRow label="Exit Time" value={request.gate.exitConfirmedAt || '-'} />
            <InfoRow label="Return" value={request.gate.returnConfirmedAt || 'Not yet returned'} />
            <InfoRow label="Gate ID" value={request.gate.gateId || '-'} />
          </Card>
        )}

        {request.status === 'EXITED' && (
          <Card style={{ backgroundColor: Colors.adminBg, borderColor: Colors.adminMid }} accentTop={Colors.admin}>
            <SectionLabel text="Location Tracking" />
            <Text style={{ fontSize: 13, color: Colors.ink2, lineHeight: 20 }}>
              Live GPS tracking requires the student to enable location sharing in the app.
              {'\n\n'}
              Last known location: <Text style={{ fontWeight: '600', color: Colors.admin }}>
                Off-campus (departed {request.leaveAt})
              </Text>
              {'\n\n'}
              Expected return: <Text style={{ fontWeight: '600' }}>{request.returnBy}</Text>
            </Text>
            <View style={{ backgroundColor: Colors.primary, borderRadius: Radius.md, padding: 12, marginTop: 10, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
                Live tracking is available in the mobile app version.
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.adminBg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  back: { fontSize: 15, color: Colors.admin, fontWeight: '500', width: 60 },
  title: { fontSize: 16, fontWeight: '700', color: Colors.ink },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.bg2 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  timelineStatus: { fontSize: 12, fontWeight: '600', color: Colors.ink },
  timelineTime: { fontSize: 10, color: Colors.ink3 },
});
