import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../services/AuthContext';
import { listenToStudentRequest, withdrawRequest } from '../../services/firestore';
import {
  Card, StatusChip, PrimaryButton, GhostButton,
  SectionLabel, EmptyState, Avatar, ApprovalChain,
} from '../../components';
import { Colors, Spacing, Radius, Shadow } from '../../theme';
import CustomModal from '../../components/CustomModal';
import useModal from '../../hooks/useModal';

const STATUS_LOOKUP = {
  PENDING: { bg: '#FFF7E6', border: '#F59E0B', icon: '1', title: 'Waiting for Parent Approval', sub: 'Your outing request has been submitted and is awaiting review.' },
  PARENT_APPROVED: { bg: '#ECFDF5', border: '#16A34A', icon: '2', title: 'Parent Approved', sub: 'Your faculty mentor will review the request and release the outing pass.' },
  MENTOR_ACKNOWLEDGED: { bg: '#EFF6FF', border: '#1D4ED8', icon: '3', title: 'Outing Pass Ready', sub: 'You are cleared for outing and can present your pass at the campus gate.' },
  MENTOR_FLAGGED: { bg: '#FEF2F2', border: '#DC2626', icon: '!', title: 'Request Flagged for Review', sub: 'Your outing request is currently on hold pending review.' },
  EXITED: { bg: '#F5F3FF', border: '#7C3AED', icon: 'OUT', title: 'Student Left Campus', sub: 'Please return before the approved time.' },
  RETURNED: { bg: '#F0FDF4', border: '#16A34A', icon: 'IN', title: 'Return Logged', sub: 'Your return to campus has been recorded successfully.' },
  REJECTED: { bg: '#FEF2F2', border: '#DC2626', icon: 'X', title: 'Request Rejected', sub: 'Your parent declined this outing request.' },
};

export default function StudentDashboard({ navigation }) {
  const { profile } = useAuth();
  const [activeRequest, setActiveRequest] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const { modal, showAlert, showConfirm } = useModal();

  useEffect(() => {
    if (!profile?.uid) return;
    const unsub = listenToStudentRequest(profile.uid, (req) => {
      setActiveRequest(req);
    });
    return unsub;
  }, [profile?.uid]);

  const handleWithdraw = async () => {
    const confirmed = await showConfirm({
      type: 'warning',
      title: 'Cancel this outing request?',
      message: 'Your current outing request will be cancelled and removed from the approval queue.',
      confirmText: 'Cancel Request',
      cancelText: 'Keep Request',
    });

    if (!confirmed) return;

    setWithdrawing(true);
    try {
      await withdrawRequest(activeRequest.id, profile.uid);
      await showAlert({
        type: 'success',
        title: 'Request cancelled',
        message: 'Your outing request was cancelled successfully.',
      });
    } catch (e) {
      await showAlert({
        type: 'danger',
        title: 'Unable to cancel',
        message: `Error: ${e.message}`,
      });
    } finally {
      setWithdrawing(false);
    }
  };

  const canSubmitNew = !activeRequest ||
    ['REJECTED', 'EXPIRED', 'WITHDRAWN', 'RETURNED', 'EXITED', 'MENTOR_FLAGGED'].includes(activeRequest?.status);

  const banner = STATUS_LOOKUP[activeRequest?.status] || {
    bg: Colors.studentBg,
    border: Colors.student,
    icon: '...',
    title: 'Request In Progress',
    sub: 'Track the current outing approval status below.',
  };

  const welcomeFacts = useMemo(() => ([
    { label: 'Student', value: profile?.name || 'Student' },
    { label: 'Programme', value: profile?.class || 'Not set' },
    { label: 'Student ID', value: profile?.rollNo || 'Not set' },
  ]), [profile?.class, profile?.name, profile?.rollNo]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.welcomeCard} accentTop={Colors.student}>
          <View style={styles.welcomeHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.welcomeEyebrow}>Student Portal</Text>
              <Text style={styles.welcomeTitle}>IISER Tirupati Campus</Text>
              <Text style={styles.welcomeSub}>Manage your outing approvals, pass status, and return records in one place.</Text>
            </View>
            <Avatar name={profile?.name} color={Colors.student} size={52} />
          </View>
          <View style={styles.welcomeFactsRow}>
            {welcomeFacts.map((fact) => (
              <View key={fact.label} style={styles.factPill}>
                <Text style={styles.factLabel}>{fact.label}</Text>
                <Text style={styles.factValue}>{fact.value}</Text>
              </View>
            ))}
          </View>
        </Card>

        {activeRequest && !['REJECTED', 'EXPIRED', 'WITHDRAWN'].includes(activeRequest.status) ? (
          <View style={styles.activeSection}>
            <SectionLabel text="Active Request" />

            <View style={[styles.statusBanner, { backgroundColor: banner.bg, borderColor: banner.border }]}>
              <Text style={styles.statusIcon}>{banner.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>{banner.title}</Text>
                <Text style={styles.statusSub}>{banner.sub}</Text>
              </View>
              <StatusChip status={activeRequest.status} size="lg" />
            </View>

            {activeRequest.status === 'MENTOR_ACKNOWLEDGED' && activeRequest.qrToken && (
              <TouchableOpacity
                style={styles.qrBanner}
                onPress={() => navigation.navigate('StudentOTP', { request: activeRequest })}
                activeOpacity={0.85}
              >
                <Text style={styles.qrBannerIcon}>ID</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.qrBannerTitle}>Outing Pass Ready</Text>
                  <Text style={styles.qrBannerSub}>Open your pass and present it at the campus gate before {activeRequest.returnBy}.</Text>
                </View>
                <Text style={styles.qrArrow}>View</Text>
              </TouchableOpacity>
            )}

            <Card accentTop={Colors.student}>
              <SectionLabel text="Request Summary" />
              <InfoPair label="Reason" value={activeRequest.reasonCategory} />
              {activeRequest.reasonDetail ? <InfoPair label="Details" value={activeRequest.reasonDetail} /> : null}
              <InfoPair label="Departure Time" value={activeRequest.leaveAt} />
              <InfoPair label="Return Time" value={activeRequest.returnBy} />
              <InfoPair label="Request ID" value={activeRequest.id?.slice(-8).toUpperCase()} mono />
            </Card>

            <Card accentTop={Colors.student}>
              <SectionLabel text="Approval Status" style={{ marginBottom: 4 }} />
              <ApprovalChain status={activeRequest.status} />
            </Card>

            {activeRequest.status === 'MENTOR_FLAGGED' && (
              <Card style={{ backgroundColor: Colors.dangerBg, borderColor: Colors.danger, marginBottom: 8 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.danger, marginBottom: 6 }}>
                  Request Flagged for Review
                </Text>
                <Text style={{ fontSize: 13, color: Colors.ink2, lineHeight: 22 }}>
                  Your faculty mentor has raised a concern about this outing request.
                  The request will remain on hold until the review is completed.
                </Text>
                <View style={{ marginTop: 10, padding: 10, backgroundColor: Colors.surface, borderRadius: 8 }}>
                  <Text style={{ fontSize: 11, color: Colors.danger, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                    Review Reason
                  </Text>
                  <Text style={{ fontSize: 13, color: Colors.ink }}>
                    {activeRequest.mentorApproval?.flagReason || 'No reason specified'}
                  </Text>
                </View>
                <View style={{ marginTop: 10, padding: 10, backgroundColor: Colors.warnBg, borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, color: Colors.warn, fontWeight: '600' }}>
                    Next Step
                  </Text>
                  <Text style={{ fontSize: 12, color: Colors.ink2, marginTop: 4, lineHeight: 20 }}>
                    You may cancel this request and submit a revised one with clearer details if needed.
                  </Text>
                </View>
              </Card>
            )}

            {activeRequest.parentApproval?.note ? (
              <Card style={{ backgroundColor: Colors.parentBg, borderColor: Colors.parentMid }} accentTop={Colors.parent}>
                <Text style={styles.noteLabel}>Parent Note</Text>
                <Text style={styles.noteText}>"{activeRequest.parentApproval.note}"</Text>
              </Card>
            ) : null}

            {['PENDING', 'MENTOR_FLAGGED'].includes(activeRequest.status) && (
              <GhostButton
                label="Cancel Outing Request"
                color={Colors.danger}
                onPress={handleWithdraw}
                loading={withdrawing}
                style={{ marginTop: Spacing.xs }}
              />
            )}
          </View>
        ) : (
          <View style={styles.emptySection}>
            {activeRequest?.status === 'REJECTED' && (
              <Card style={{ backgroundColor: Colors.dangerBg, borderColor: Colors.danger }} accentTop={Colors.danger}>
                <Text style={styles.rejectTitle}>Request Rejected</Text>
                <Text style={styles.rejectText}>Your parent declined this outing request.</Text>
                {activeRequest.parentApproval?.note ? (
                  <Text style={styles.rejectNote}>"{activeRequest.parentApproval.note}"</Text>
                ) : null}
              </Card>
            )}

            {activeRequest?.status === 'MENTOR_FLAGGED' && canSubmitNew && (
              <View style={{ marginBottom: 8 }}>
                <PrimaryButton
                  label="Create Outing Request"
                  onPress={() => navigation.navigate('StudentRequest')}
                  color={Colors.student}
                />
              </View>
            )}

            {!activeRequest && (
              <Card accentTop={Colors.student} style={{ paddingVertical: Spacing.xl }}>
                <EmptyState
                  icon="REQUEST"
                  title="No active request"
                  sub="Submit a new outing request for campus departure approval."
                />
              </Card>
            )}
          </View>
        )}

        {canSubmitNew ? (
          <PrimaryButton
            label="Create Outing Request"
            onPress={() => navigation.navigate('StudentRequest')}
            color={Colors.student}
            style={{ marginTop: Spacing.md }}
          />
        ) : (
          <View style={styles.disabledNote}>
            <Text style={styles.disabledTitle}>One active request at a time</Text>
            <Text style={styles.disabledText}>You already have an active outing request. Cancel it before submitting another one.</Text>
          </View>
        )}
      </ScrollView>
      <CustomModal {...modal} />
    </SafeAreaView>
  );
}

const InfoPair = ({ label, value, mono }) => (
  <View style={styles.infoPair}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, mono && { fontFamily: 'monospace' }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.studentBg },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  welcomeCard: { backgroundColor: Colors.surface, marginBottom: Spacing.lg, ...Shadow.sm },
  welcomeHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  welcomeEyebrow: { fontSize: 13, color: Colors.student, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 6 },
  welcomeTitle: { fontSize: 24, fontWeight: '700', color: Colors.ink },
  welcomeSub: { fontSize: 14, color: Colors.ink2, marginTop: 6, lineHeight: 22 },
  welcomeFactsRow: { flexDirection: 'row', gap: 10, marginTop: Spacing.lg, flexWrap: 'wrap' },
  factPill: { flexGrow: 1, minWidth: '30%', backgroundColor: Colors.studentBg, borderRadius: Radius.md, padding: 12 },
  factLabel: { fontSize: 13, color: Colors.student, fontWeight: '600', marginBottom: 4 },
  factValue: { fontSize: 14, color: Colors.ink, fontWeight: '700' },
  activeSection: { marginBottom: Spacing.md },
  emptySection: { marginBottom: Spacing.md },
  statusBanner: { borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1.5, ...Shadow.sm },
  statusIcon: { fontSize: 18, fontWeight: '800', color: Colors.ink, minWidth: 36 },
  statusTitle: { fontSize: 18, fontWeight: '700', color: Colors.ink },
  statusSub: { fontSize: 13, color: Colors.ink2, marginTop: 4, lineHeight: 20 },
  qrBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.studentBg, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1.5, borderColor: Colors.student, marginBottom: Spacing.sm },
  qrBannerIcon: { fontSize: 13, fontWeight: '800', color: Colors.student, minWidth: 28 },
  qrBannerTitle: { fontSize: 15, fontWeight: '700', color: Colors.student },
  qrBannerSub: { fontSize: 13, color: Colors.ink2, marginTop: 4, lineHeight: 20 },
  qrArrow: { fontSize: 13, color: Colors.student, fontWeight: '700' },
  noteLabel: { fontSize: 13, color: Colors.parent, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  noteText: { fontSize: 14, color: Colors.ink, fontStyle: 'italic', lineHeight: 22 },
  rejectTitle: { fontSize: 15, fontWeight: '700', color: Colors.danger, marginBottom: 6 },
  rejectText: { fontSize: 13, color: Colors.ink2 },
  rejectNote: { fontSize: 13, color: Colors.danger, marginTop: 8 },
  disabledNote: { backgroundColor: Colors.warnBg, borderRadius: Radius.md, padding: 14, marginTop: Spacing.sm, borderWidth: 1, borderColor: Colors.parentMid },
  disabledTitle: { fontSize: 14, color: Colors.warn, fontWeight: '700', textAlign: 'center' },
  disabledText: { fontSize: 13, color: Colors.ink2, textAlign: 'center', marginTop: 4 },
  infoPair: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.bg2, gap: 12 },
  infoLabel: { fontSize: 13, color: Colors.ink3, flex: 1 },
  infoValue: { fontSize: 13, color: Colors.ink, fontWeight: '600', flex: 1, textAlign: 'right' },
});


