import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getRequestByQRToken, verifyOTP, getUserProfile } from '../../services/firestore';
import { sendPushNotification } from '../../services/notifications';
import { useAuth } from '../../services/AuthContext';
import {
  Card, InfoRow, StatusChip, PrimaryButton, GhostButton,
  LoadingScreen, Avatar, SectionLabel,
} from '../../components';
import { Colors, Spacing, Radius, Shadow, statusLabel } from '../../theme';
import CustomModal from '../../components/CustomModal';
import useModal from '../../hooks/useModal';

export default function GateVerifyScreen({ route, navigation }) {
  const { qrToken } = route.params;
  const { profile } = useAuth();
  const [request, setRequest] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const { modal, showAlert } = useModal();

  useEffect(() => {
    lookupToken();
  }, [qrToken]);

  const lookupToken = async () => {
    try {
      const req = await getRequestByQRToken(qrToken);
      if (!req) {
        setRequest(false);
        Vibration.vibrate([0, 100, 100, 100]);
        return;
      }

      setRequest(req);
      if (req.status === 'MENTOR_ACKNOWLEDGED') {
        Vibration.vibrate(200);
      } else {
        Vibration.vibrate([0, 100, 100, 100]);
      }
    } catch (_) {
      setRequest(false);
    }
  };

  const handleConfirmExit = async () => {
    setConfirming(true);
    try {
      await verifyOTP(request.id, request.otp, profile.uid, profile.gateId || 'GATE-01');
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      try {
        const [parentProfile, mentorProfile] = await Promise.all([
          getUserProfile(request.parentId),
          getUserProfile(request.mentorId),
        ]);
        const title = `${request.studentName} has left campus`;
        const body = `Left campus at ${now}. Return expected by ${request.returnBy}.`;
        if (parentProfile?.fcmToken) await sendPushNotification(parentProfile.fcmToken, title, body);
        if (mentorProfile?.fcmToken) await sendPushNotification(mentorProfile.fcmToken, title, body);
      } catch (_) {}
      setDone(true);
    } catch (err) {
      await showAlert({
        type: 'danger',
        title: 'Verification failed',
        message: `Error: ${err.message}`,
      });
    } finally {
      setConfirming(false);
    }
  };

  if (request === null) {
    return (
      <SafeAreaView style={styles.safe}>
        <LoadingScreen color={Colors.gate} />
        <Text style={styles.loadingText}>Verifying student OTP...</Text>
        <CustomModal {...modal} />
      </SafeAreaView>
    );
  }

  if (done) {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.doneScreen}>
          <View style={styles.doneIcon}>
            <Text style={styles.doneIconText}>OK</Text>
          </View>
          <Text style={styles.doneTitle}>Outing Confirmed</Text>
          <Text style={styles.doneSub}>{request.studentName} left campus at {now}</Text>

          <Card style={{ marginTop: Spacing.xl, width: '100%' }} accentTop={Colors.success}>
            <InfoRow label="Student" value={request.studentName} />
            <InfoRow label="Departure Time" value={now} valueStyle={{ color: Colors.success }} />
            <InfoRow label="Return Time" value={request.returnBy} />
            <InfoRow label="Log ID" value={request.id?.slice(-8).toUpperCase()} />
          </Card>

          <Text style={styles.notifiedText}>Parent and faculty mentor have been notified.</Text>

          <PrimaryButton
            label="Verify Next Student"
            onPress={() => navigation.popToTop()}
            style={{ marginTop: Spacing.xl, width: '100%' }}
          />
        </View>
        <CustomModal {...modal} />
      </SafeAreaView>
    );
  }

  if (request === false) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: Colors.dangerBg }]}>
        <View style={[styles.stateHeader, { backgroundColor: Colors.danger }]}>
          <Text style={styles.stateHeaderLabel}>Invalid OTP</Text>
          <Text style={styles.stateHeaderSub}>No matching outing request was found.</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={{ backgroundColor: Colors.dangerBg, borderColor: Colors.danger }} accentTop={Colors.danger}>
            <SectionLabel text="Why this failed" />
            <Text style={styles.reasonText}>The OTP was not found in the system, may already be used, or the student does not have an approved outing request.</Text>
          </Card>
          <Card accentTop={Colors.danger}>
            <SectionLabel text="Required Action" />
            <Text style={styles.reasonText}>Do not allow departure. Direct the student to the administration office for assistance.</Text>
          </Card>
          <GhostButton
            label="Back to Scanner"
            onPress={() => navigation.popToTop()}
            style={{ marginTop: Spacing.sm }}
          />
        </ScrollView>
        <CustomModal {...modal} />
      </SafeAreaView>
    );
  }

  if (request.status === 'EXITED' || request.otpUsed) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: Colors.gateBg }]}>
        <View style={[styles.stateHeader, { backgroundColor: Colors.gate }]}>
          <Text style={styles.stateHeaderLabel}>OTP Already Used</Text>
          <Text style={styles.stateHeaderSub}>This OTP cannot be used again.</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Card accentTop={Colors.gate}>
            <InfoRow label="Student" value={request.studentName} />
            <InfoRow label="First Used" value={request.gate?.exitConfirmedAt || 'Earlier today'} />
            <InfoRow label="Status" value={statusLabel[request.status] || request.status} valueStyle={{ color: Colors.gate }} />
          </Card>
          <Card style={{ backgroundColor: Colors.gateBg, borderColor: Colors.gateMid }} accentTop={Colors.gate}>
            <SectionLabel text="Next Step" />
            <Text style={styles.reasonText}>If the student is returning, use manual search to log the return. If this OTP is being reused by someone else, report it immediately.</Text>
          </Card>
          <PrimaryButton
            label="Open Student Search"
            onPress={() => navigation.navigate('GateManualSearch')}
            style={{ marginTop: Spacing.sm }}
          />
          <GhostButton
            label="Back to Scanner"
            onPress={() => navigation.popToTop()}
            style={{ marginTop: Spacing.sm }}
          />
        </ScrollView>
        <CustomModal {...modal} />
      </SafeAreaView>
    );
  }

  if (request.status !== 'MENTOR_ACKNOWLEDGED') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: Colors.dangerBg }]}>
        <View style={[styles.stateHeader, { backgroundColor: Colors.danger }]}>
          <Text style={styles.stateHeaderLabel}>Outing Not Cleared</Text>
          <Text style={styles.stateHeaderSub}>The approval chain is incomplete.</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }} accentTop={Colors.danger}>
            <Avatar name={request.studentName} color={Colors.student} size={44} />
            <View>
              <Text style={styles.studentName}>{request.studentName}</Text>
              <Text style={styles.studentMeta}>Programme {request.studentClass}</Text>
            </View>
          </Card>
          <Card style={{ backgroundColor: Colors.dangerBg, borderColor: Colors.danger }} accentTop={Colors.danger}>
            <InfoRow label="Current Status" value={statusLabel[request.status] || request.status} valueStyle={{ color: Colors.danger }} />
            {request.status === 'PENDING' && <InfoRow label="Blocked by" value="Awaiting parent approval" />}
            {request.status === 'PARENT_APPROVED' && <InfoRow label="Blocked by" value="Awaiting faculty mentor acknowledgement" />}
            {request.status === 'MENTOR_FLAGGED' && <InfoRow label="Blocked by" value="Faculty review hold" />}
            {request.status === 'REJECTED' && <InfoRow label="Blocked by" value="Parent rejected this outing request" />}
          </Card>
          <Card accentTop={Colors.danger}>
            <SectionLabel text="Required Action" />
            <Text style={styles.reasonText}>Do not allow departure. Direct the student to the office for resolution.</Text>
          </Card>
          <GhostButton label="Back to Scanner" onPress={() => navigation.popToTop()} style={{ marginTop: Spacing.sm }} />
        </ScrollView>
        <CustomModal {...modal} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.clearedHeader}>
        <Text style={styles.clearedHeaderLabel}>Cleared for Outing</Text>
        <Text style={styles.clearedHeaderSub}>All approvals have been verified and the OTP is valid.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={{ borderColor: Colors.success, borderWidth: 1.5 }} accentTop={Colors.success}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar name={request.studentName} color={Colors.student} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={styles.studentName}>{request.studentName}</Text>
              <Text style={styles.studentMeta}>Programme {request.studentClass}</Text>
            </View>
            <StatusChip status="MENTOR_ACKNOWLEDGED" />
          </View>
        </Card>

        <Card accentTop={Colors.gate}>
          <SectionLabel text="Outing Details" />
          <InfoRow label="Reason" value={request.reasonCategory} />
          <InfoRow label="Departure Time" value={request.leaveAt} />
          <InfoRow label="Return Time" value={request.returnBy} />
          <InfoRow label="OTP" value={request.otp || qrToken} valueStyle={{ color: Colors.primary, fontWeight: '700' }} />
        </Card>

        {request.parentApproval?.note ? (
          <Card style={{ backgroundColor: Colors.parentBg, borderColor: Colors.parentMid }} accentTop={Colors.parent}>
            <SectionLabel text="Parent Note" />
            <Text style={styles.noteText}>{request.parentApproval.note}</Text>
          </Card>
        ) : null}

        {request.mentorApproval?.note ? (
          <Card style={{ backgroundColor: Colors.mentorBg, borderColor: Colors.mentorMid }} accentTop={Colors.mentor}>
            <SectionLabel text="Faculty Note" />
            <Text style={styles.noteText}>{request.mentorApproval.note}</Text>
          </Card>
        ) : null}

        <PrimaryButton
          label="Confirm Departure and Log"
          loading={confirming}
          onPress={handleConfirmExit}
          style={{ marginTop: Spacing.md }}
        />
        <GhostButton
          label="Back to Scanner"
          onPress={() => navigation.popToTop()}
          style={{ marginTop: Spacing.sm }}
        />
      </ScrollView>
      <CustomModal {...modal} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.gateBg },
  loadingText: { textAlign: 'center', color: Colors.ink3, marginTop: -100, fontSize: 13 },
  content: { padding: Spacing.lg, paddingBottom: 40 },
  doneScreen: { flex: 1, alignItems: 'center', padding: Spacing.xl, backgroundColor: Colors.bg },
  doneIcon: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xxl, backgroundColor: Colors.success, ...Shadow.md },
  doneIconText: { fontSize: 30, fontWeight: '800', color: '#fff' },
  doneTitle: { fontSize: 24, fontWeight: '700', color: Colors.success, marginTop: 16 },
  doneSub: { fontSize: 14, color: Colors.ink2, marginTop: 6 },
  notifiedText: { fontSize: 13, color: Colors.success, marginTop: Spacing.lg, fontWeight: '600' },
  stateHeader: { padding: Spacing.xl, alignItems: 'center', paddingTop: 56 },
  stateHeaderLabel: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 8, letterSpacing: 0.5 },
  stateHeaderSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4, textAlign: 'center' },
  clearedHeader: { backgroundColor: Colors.success, padding: Spacing.xl, alignItems: 'center', paddingTop: 56 },
  clearedHeaderLabel: { fontSize: 22, fontWeight: '800', color: '#fff', marginTop: 8, letterSpacing: 0.5 },
  clearedHeaderSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4, textAlign: 'center' },
  reasonText: { fontSize: 13, color: Colors.ink2, lineHeight: 20 },
  studentName: { fontSize: 18, fontWeight: '700', color: Colors.ink },
  studentMeta: { fontSize: 13, color: Colors.ink2, marginTop: 4 },
  noteText: { fontSize: 13, color: Colors.ink, lineHeight: 20, fontStyle: 'italic' },
});
