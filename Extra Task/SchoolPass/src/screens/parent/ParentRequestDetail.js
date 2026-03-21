import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { approveRequest, rejectRequest, getUserProfile } from '../../services/firestore';
import { sendPushNotification, NOTIF } from '../../services/notifications';
import { useAuth } from '../../services/AuthContext';
import {
  Card, InfoRow, StatusChip, PrimaryButton, GhostButton,
  LoadingScreen, Avatar, ApprovalChain, InputField, SectionLabel,
} from '../../components';
import { Colors, Spacing } from '../../theme';
import CustomModal from '../../components/CustomModal';
import useModal from '../../hooks/useModal';

export default function ParentRequestDetail({ route, navigation }) {
  const { requestId } = route.params;
  const { profile } = useAuth();
  const [request, setRequest] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const { modal, showAlert, showConfirm } = useModal();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'exitRequests', requestId), snap => {
      if (snap.exists()) setRequest({ id: snap.id, ...snap.data() });
    });
    return unsub;
  }, [requestId]);

  const submitDecision = async (decision) => {
    const isApprove = decision === 'approve';
    const confirmed = await showConfirm({
      type: isApprove ? 'success' : 'danger',
      title: isApprove ? 'Approve this request?' : 'Reject this request?',
      message: isApprove
        ? `You are approving ${request.studentName}'s outing request.`
        : `You are rejecting ${request.studentName}'s outing request.`,
      confirmText: isApprove ? 'Approve' : 'Reject',
      cancelText: 'Go Back',
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      if (isApprove) {
        await approveRequest(requestId, profile.uid, note);
      } else {
        await rejectRequest(requestId, profile.uid, note);
      }

      try {
        const studentProfile = await getUserProfile(request.studentId);
        if (studentProfile?.fcmToken) {
          const n = isApprove ? NOTIF.studentApproved() : NOTIF.studentRejected();
          await sendPushNotification(studentProfile.fcmToken, n.title, n.body, { requestId, type: isApprove ? 'APPROVED' : 'REJECTED' });
        }
      } catch (_) {}

      if (isApprove) {
        try {
          const mentorProfile = await getUserProfile(request.mentorId);
          if (mentorProfile?.fcmToken) {
            const { title, body } = NOTIF.mentorAlert(request.studentName);
            await sendPushNotification(mentorProfile.fcmToken, title, body, { requestId, type: 'MENTOR_ACTION' });
          }
        } catch (_) {}
      }

      await showAlert({
        type: isApprove ? 'success' : 'info',
        title: isApprove ? 'Request approved' : 'Request rejected',
        message: isApprove
          ? 'The faculty mentor has been notified for the next step.'
          : 'The student can create a new outing request if needed.',
      });

      if (!isApprove) {
        navigation.goBack();
      }
    } catch (err) {
      await showAlert({
        type: 'danger',
        title: 'Action failed',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!request) return <LoadingScreen color={Colors.parent} />;

  const isPending = request.status === 'PENDING';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topRow}>
          <Text style={styles.pageTitle}>Outing Request Review</Text>
          <StatusChip status={request.status} size="lg" />
        </View>

        <Card style={{ backgroundColor: Colors.parentBg, borderColor: Colors.parentMid }} accentTop={Colors.parent}>
          <View style={styles.studentRow}>
            <View style={styles.studentAvatarWrap}>
              <Avatar name={request.studentName} color={Colors.student} size={56} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.studentName}>{request.studentName}</Text>
              <Text style={styles.studentMeta}>Programme {request.studentClass}</Text>
              <Text style={styles.studentMeta}>ID {request.rollNo || 'Not available'}</Text>
            </View>
          </View>
        </Card>

        <Card accentTop={Colors.parent}>
          <SectionLabel text="Request Details" />
          <InfoRow label="Reason" value={request.reasonCategory} />
          {request.reasonDetail ? <InfoRow label="Details" value={request.reasonDetail} /> : null}
          <InfoRow label="Departure Time" value={request.leaveAt} />
          <InfoRow label="Return Time" value={request.returnBy} />
          <InfoRow label="Urgency" value={request.urgency} />
          <InfoRow label="Submitted" value={request.createdAt?.toDate?.()?.toLocaleString?.() || 'Just now'} />
        </Card>

        <Card style={{ backgroundColor: Colors.successBg, borderColor: Colors.success }} accentTop={Colors.success}>
          <SectionLabel text="What Happens Next" />
          <TimelineStep step="1" text="If you approve, the faculty mentor receives the request immediately." />
          <TimelineStep step="2" text="The faculty mentor acknowledges and generates the student's OTP." />
          <TimelineStep step="3" text="The security officer verifies the OTP before the student leaves campus." />
        </Card>

        <Card accentTop={Colors.parent}>
          <SectionLabel text="Approval Chain" />
          <ApprovalChain status={request.status} />
        </Card>

        {isPending && (
          <InputField
            label="Your Note (optional)"
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Return to campus before evening study hours"
            multiline
            numberOfLines={3}
            inputStyle={{ minHeight: 88, textAlignVertical: 'top' }}
          />
        )}

        {isPending && (
          <>
            <PrimaryButton
              label="Approve Request"
              color={Colors.success}
              onPress={() => submitDecision('approve')}
              loading={loading}
              style={{ width: '100%' }}
            />
            <GhostButton
              label="Reject Request"
              color={Colors.danger}
              onPress={() => submitDecision('reject')}
              loading={loading}
              style={styles.rejectBtn}
            />
          </>
        )}

        {request.status === 'PARENT_APPROVED' && (
          <Card style={{ backgroundColor: Colors.successBg, borderColor: Colors.success }} accentTop={Colors.success}>
            <Text style={styles.stateTitle}>You approved this request</Text>
            <Text style={styles.stateText}>The faculty mentor has been notified and the request is waiting for acknowledgement.</Text>
            {request.parentApproval?.note ? <Text style={styles.stateNote}>Your note: "{request.parentApproval.note}"</Text> : null}
          </Card>
        )}

        {request.status === 'EXITED' && (
          <Card style={{ backgroundColor: Colors.gateBg, borderColor: Colors.gateMid }} accentTop={Colors.gate}>
            <Text style={styles.stateTitle}>{request.studentName} has left campus</Text>
            <Text style={styles.stateText}>Left campus at {request.gate?.exitConfirmedAt}</Text>
            <Text style={styles.stateText}>Return expected by {request.returnBy}</Text>
          </Card>
        )}
      </ScrollView>
      <CustomModal {...modal} />
    </SafeAreaView>
  );
}

function TimelineStep({ step, text }) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineDot}>
        <Text style={styles.timelineDotText}>{step}</Text>
      </View>
      <Text style={styles.timelineText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md, gap: 12 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: Colors.ink, flex: 1 },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  studentAvatarWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.parentBg, alignItems: 'center', justifyContent: 'center' },
  studentName: { fontSize: 18, fontWeight: '700', color: Colors.ink },
  studentMeta: { fontSize: 13, color: Colors.ink2, marginTop: 4 },
  timelineRow: { flexDirection: 'row', gap: 12, marginTop: 10, alignItems: 'flex-start' },
  timelineDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  timelineDotText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  timelineText: { flex: 1, fontSize: 13, color: Colors.ink2, lineHeight: 20 },
  rejectBtn: { width: '100%', marginTop: Spacing.sm, backgroundColor: Colors.dangerBg },
  stateTitle: { fontSize: 15, fontWeight: '700', color: Colors.ink },
  stateText: { fontSize: 13, color: Colors.ink2, marginTop: 4, lineHeight: 20 },
  stateNote: { fontSize: 13, color: Colors.ink, marginTop: 8, fontStyle: 'italic' },
});


