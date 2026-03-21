import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { acknowledgeRequest, flagRequest, getUserProfile } from '../../services/firestore';
import { sendPushNotification, NOTIF } from '../../services/notifications';
import { useAuth } from '../../services/AuthContext';
import {
  Card, InfoRow, StatusChip, PrimaryButton, GhostButton,
  LoadingScreen, Avatar, ApprovalChain, InputField, SectionLabel,
} from '../../components';
import { Colors, Spacing, Radius } from '../../theme';
import CustomModal from '../../components/CustomModal';
import useModal from '../../hooks/useModal';

const FLAG_REASONS = ['Suspicious reason', 'Behavioral concern', 'Previous violations', 'Other'];

export default function MentorRequestDetail({ route, navigation }) {
  const { requestId } = route.params;
  const { profile } = useAuth();
  const [request, setRequest] = useState(null);
  const [note, setNote] = useState('');
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [flagReason, setFlagReason] = useState(FLAG_REASONS[0]);
  const [flagDetail, setFlagDetail] = useState('');
  const [loading, setLoading] = useState(false);
  const { modal, showAlert, showConfirm } = useModal();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'exitRequests', requestId), snap => {
      if (snap.exists()) setRequest({ id: snap.id, ...snap.data() });
    });
    return unsub;
  }, [requestId]);

  const handleAcknowledge = async () => {
    const confirmed = await showConfirm({
      type: 'success',
      title: 'Acknowledge and release OTP?',
      message: 'The student will receive a one-time password after this step.',
      confirmText: 'Release OTP',
      cancelText: 'Go Back',
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      await acknowledgeRequest(requestId, profile.uid, note);

      try {
        const studentProfile = await getUserProfile(request.studentId);
        if (studentProfile?.fcmToken) {
          const { title, body } = NOTIF.studentApproved();
          await sendPushNotification(studentProfile.fcmToken, title, body, { requestId, type: 'OTP_READY' });
        }
      } catch (_) {}

      await showAlert({
        type: 'success',
        title: 'OTP released',
        message: 'The student can now show the outing OTP at the campus gate.',
      });
      navigation.goBack();
    } catch (err) {
      await showAlert({
        type: 'danger',
        title: 'Unable to acknowledge',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFlag = async () => {
    if (!flagDetail.trim()) {
      await showAlert({
        type: 'warning',
        title: 'Concern details required',
        message: 'Please describe your concern before flagging this request.',
      });
      return;
    }

    const confirmed = await showConfirm({
      type: 'danger',
      title: 'Flag this request?',
      message: 'This will hold the outing request and notify campus admin for review.',
      confirmText: 'Flag Request',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      await flagRequest(requestId, profile.uid, flagReason, flagDetail);
      setShowFlagForm(false);
      await showAlert({
        type: 'info',
        title: 'Request flagged',
        message: 'The outing has been put on hold for review.',
      });
      navigation.goBack();
    } catch (err) {
      await showAlert({
        type: 'danger',
        title: 'Unable to flag request',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCallParent = async () => {
    await showAlert({
      type: 'info',
      title: 'Call Parent',
      message: `Calling parent for ${request.studentName}. In the mobile version this opens the phone dialer directly. Parent: ${request.parentApproval?.by || 'Parent'}`,
      confirmText: 'Close',
    });
  };

  const handleMessageParent = async () => {
    await showAlert({
      type: 'info',
      title: 'Verification Message',
      message: `This is a verification message from IISER Tirupati. Did you approve the outing request for ${request.studentName} at ${request.leaveAt} today?\n\nSMS sending is available in the mobile app version.`,
      confirmText: 'Close',
    });
  };

  if (!request) return <LoadingScreen color={Colors.mentor} />;

  const needsAction = request.status === 'PARENT_APPROVED';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topRow}>
          <Text style={styles.pageTitle}>Faculty Review</Text>
          <StatusChip status={request.status} size="lg" />
        </View>

        <Card style={{ backgroundColor: Colors.mentorBg, borderColor: Colors.mentorMid }} accentTop={Colors.mentor}>
          <View style={styles.studentRow}>
            <Avatar name={request.studentName} color={Colors.student} size={50} />
            <View style={{ flex: 1 }}>
              <Text style={styles.studentName}>{request.studentName}</Text>
              <Text style={styles.studentMeta}>Programme {request.studentClass}</Text>
            </View>
            {request.status === 'PARENT_APPROVED' && (
              <View style={styles.parentApprovedBadge}>
                <Text style={styles.parentApprovedText}>Parent Approved</Text>
              </View>
            )}
          </View>
        </Card>

        <Card accentTop={Colors.mentor}>
          <SectionLabel text="Request Details" />
          <InfoRow label="Reason" value={request.reasonCategory} />
          {request.reasonDetail ? <InfoRow label="Details" value={request.reasonDetail} /> : null}
          <InfoRow label="Departure Time" value={request.leaveAt} />
          <InfoRow label="Return Time" value={request.returnBy} />
          <InfoRow label="Urgency" value={request.urgency} />
        </Card>

        {request.parentApproval && (
          <Card style={{ backgroundColor: Colors.parentBg, borderColor: Colors.parentMid }} accentTop={Colors.parent}>
            <SectionLabel text="Parent Approval Details" />
            <InfoRow
              label="Decision"
              value={request.parentApproval.approved ? 'Approved' : 'Rejected'}
              valueStyle={{ color: request.parentApproval.approved ? Colors.success : Colors.danger }}
            />
            {request.parentApproval.note ? (
              <InfoRow label="Note" value={`"${request.parentApproval.note}"`} valueStyle={{ fontStyle: 'italic' }} />
            ) : null}
            <InfoRow label="At" value={request.parentApproval.at || 'Recorded'} />
          </Card>
        )}

        {request.parentApproval?.approved && (
          <Card style={{ backgroundColor: Colors.primaryLight, borderColor: Colors.primaryMid }} accentTop={Colors.primary}>
            <SectionLabel text="Contact Parent" />
            <Text style={{ fontSize: 13, color: Colors.ink2, marginBottom: 12, lineHeight: 20 }}>
              Need to verify this approval directly with the parent?
            </Text>
            <TouchableOpacity
              style={contactStyles.callBtn}
              onPress={handleCallParent}
              activeOpacity={0.8}
            >
              <Text style={contactStyles.callIcon}>CALL</Text>
              <View>
                <Text style={contactStyles.callTitle}>Call Parent</Text>
                <Text style={contactStyles.callSub}>Opens phone dialer in the mobile app</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={contactStyles.msgBtn}
              onPress={handleMessageParent}
              activeOpacity={0.8}
            >
              <Text style={contactStyles.msgIcon}>SMS</Text>
              <View>
                <Text style={contactStyles.msgTitle}>Send Verification SMS</Text>
                <Text style={contactStyles.msgSub}>Send a confirmation message to the parent</Text>
              </View>
            </TouchableOpacity>
          </Card>
        )}

        <Card accentTop={Colors.mentor}>
          <SectionLabel text="Approval Chain" />
          <ApprovalChain status={request.status} />
        </Card>

        {needsAction && (
          <>
            <InputField
              label="Your Note (optional)"
              value={note}
              onChangeText={setNote}
              placeholder="e.g. Student to return before evening lab session"
              multiline
              numberOfLines={3}
              inputStyle={{ minHeight: 88, textAlignVertical: 'top' }}
            />

            <PrimaryButton
              label="Faculty Acknowledged"
              color={Colors.success}
              onPress={handleAcknowledge}
              loading={loading}
              style={styles.ackBtn}
            />

            <GhostButton
              label="Flag Concern"
              color={Colors.danger}
              onPress={() => setShowFlagForm(prev => !prev)}
              style={styles.flagBtn}
            />

            {showFlagForm && (
              <Card style={{ backgroundColor: Colors.dangerBg, borderColor: Colors.danger }} accentTop={Colors.danger}>
                <SectionLabel text="Flag Reason" />
                <View style={styles.flagOptionsWrap}>
                  {FLAG_REASONS.map((reason) => (
                    <TouchableOpacity
                      key={reason}
                      style={[styles.flagOption, flagReason === reason && styles.flagOptionActive]}
                      onPress={() => setFlagReason(reason)}
                    >
                      <Text style={[styles.flagOptionText, flagReason === reason && styles.flagOptionTextActive]}>{reason}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <InputField
                  label="Describe Your Concern"
                  value={flagDetail}
                  onChangeText={setFlagDetail}
                  placeholder="Explain why the request should be held"
                  multiline
                  numberOfLines={4}
                  required
                  inputStyle={{ minHeight: 100, textAlignVertical: 'top' }}
                />

                <Text style={styles.flagWarning}>Outing will be held and campus admin will be notified for review.</Text>

                <PrimaryButton
                  label="Submit Flag"
                  color={Colors.danger}
                  onPress={handleFlag}
                  loading={loading}
                  style={{ marginTop: Spacing.sm }}
                />
              </Card>
            )}
          </>
        )}

        {request.status === 'MENTOR_FLAGGED' && (
          <Card style={{ backgroundColor: Colors.dangerBg, borderColor: Colors.danger }} accentTop={Colors.danger}>
            <Text style={styles.stateTitle}>Request flagged by faculty</Text>
            <Text style={styles.stateText}>Reason: {request.mentorApproval?.flagReason}</Text>
            <Text style={styles.stateText}>{request.mentorApproval?.flagDetail}</Text>
            <Text style={styles.stateNote}>Admin has been notified and the outing remains on hold.</Text>
          </Card>
        )}
      </ScrollView>
      <CustomModal {...modal} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.mentorBg },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md, gap: 12 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: Colors.ink, flex: 1 },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  studentName: { fontSize: 18, fontWeight: '700', color: Colors.ink },
  studentMeta: { fontSize: 13, color: Colors.ink2, marginTop: 4 },
  parentApprovedBadge: { backgroundColor: Colors.successBg, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 7 },
  parentApprovedText: { fontSize: 12, color: Colors.success, fontWeight: '700' },
  ackBtn: { minHeight: 56 },
  flagBtn: { marginTop: Spacing.sm, borderStyle: 'solid', backgroundColor: Colors.dangerBg },
  flagOptionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.md },
  flagOption: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  flagOptionActive: { borderColor: Colors.danger, backgroundColor: Colors.dangerBg },
  flagOptionText: { fontSize: 13, color: Colors.ink2 },
  flagOptionTextActive: { color: Colors.danger, fontWeight: '700' },
  flagWarning: { fontSize: 13, color: Colors.danger, lineHeight: 20 },
  stateTitle: { fontSize: 15, fontWeight: '700', color: Colors.danger },
  stateText: { fontSize: 13, color: Colors.ink2, marginTop: 4, lineHeight: 20 },
  stateNote: { fontSize: 13, color: Colors.ink3, marginTop: 8 },
});

const contactStyles = StyleSheet.create({
  callBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.success, borderRadius: Radius.md, padding: 12, marginBottom: 8 },
  callIcon: { fontSize: 12, fontWeight: '800', color: '#fff', minWidth: 32 },
  callTitle: { fontSize: 13, fontWeight: '700', color: '#fff' },
  callSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  msgBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 12, borderWidth: 1, borderColor: Colors.border },
  msgIcon: { fontSize: 12, fontWeight: '800', color: Colors.ink, minWidth: 32 },
  msgTitle: { fontSize: 13, fontWeight: '600', color: Colors.ink },
  msgSub: { fontSize: 11, color: Colors.ink3 },
});
