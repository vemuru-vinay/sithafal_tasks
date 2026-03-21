import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadow } from '../../theme';
import { Card, InfoRow, ApprovalChain } from '../../components';

export default function StudentOTPScreen({ route, navigation }) {
  const { request } = route.params;

  if (!request?.otp) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorIcon}>OTP</Text>
          <Text style={styles.errorText}>OTP not generated yet</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const otpDigits = request.otp.toString().split('');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Outing Pass</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.approvedBanner}>
          <View style={styles.approvedIconCircle}>
            <Text style={styles.approvedIconText}>OK</Text>
          </View>
          <Text style={styles.approvedTitle}>Outing Approved</Text>
          <Text style={styles.approvedSub}>
            Show this OTP to the Security Officer at the campus gate
          </Text>
        </View>

        <View style={styles.otpCard}>
          <Text style={styles.otpLabel}>Your One-Time Password</Text>
          <View style={styles.otpRow}>
            {otpDigits.map((digit, i) => (
              <View key={i} style={styles.otpDigitBox}>
                <Text style={styles.otpDigit}>{digit}</Text>
              </View>
            ))}
          </View>
          <View style={styles.otpFooterRow}>
            <Text style={styles.otpValidText}>Valid until {request.returnBy}</Text>
            <View style={styles.singleUseBadge}>
              <Text style={styles.singleUseText}>Single Use</Text>
            </View>
          </View>
          <Text style={styles.otpInstruction}>
            The security officer will enter this OTP into their device.
            It will be invalidated immediately after verification.
          </Text>
        </View>

        <Card style={{ marginTop: Spacing.md }}>
          <Text style={styles.sectionTitle}>Approval Chain</Text>
          <ApprovalChain status={request.status} />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Outing Details</Text>
          <InfoRow label="Reason" value={request.reasonCategory} />
          <InfoRow label="Departure" value={request.leaveAt} />
          <InfoRow label="Return By" value={request.returnBy} />
          <InfoRow label="Request ID" value={request.id?.slice(-8).toUpperCase()} />
        </Card>

        {request.parentApproval?.note ? (
          <Card style={{ backgroundColor: Colors.parentBg, borderColor: Colors.parentMid }}>
            <Text style={styles.noteLabel}>Parent Note</Text>
            <Text style={styles.noteText}>"{request.parentApproval.note}"</Text>
          </Card>
        ) : null}

        {request.mentorApproval?.note ? (
          <Card style={{ backgroundColor: Colors.mentorBg, borderColor: Colors.mentorMid }}>
            <Text style={styles.noteLabel}>Faculty Note</Text>
            <Text style={styles.noteText}>"{request.mentorApproval.note}"</Text>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorIcon: { fontSize: 32, fontWeight: '800', color: Colors.warn, marginBottom: 12 },
  errorText: { fontSize: 16, color: Colors.ink2, textAlign: 'center' },
  backBtn: { marginTop: 20, backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 24, paddingVertical: 10 },
  backBtnText: { color: '#fff', fontWeight: '600' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface },
  backLink: { fontSize: 15, color: Colors.primary, fontWeight: '500', width: 60 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.ink },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  approvedBanner: { alignItems: 'center', marginBottom: Spacing.xl, paddingVertical: Spacing.lg },
  approvedIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.success, alignItems: 'center', justifyContent: 'center', marginBottom: 14, ...Shadow.md },
  approvedIconText: { fontSize: 24, color: '#fff', fontWeight: '700' },
  approvedTitle: { fontSize: 24, fontWeight: '800', color: Colors.success, marginBottom: 6 },
  approvedSub: { fontSize: 13, color: Colors.ink2, textAlign: 'center', lineHeight: 20 },
  otpCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', borderWidth: 2, borderColor: Colors.primary, marginBottom: Spacing.sm, ...Shadow.lg },
  otpLabel: { fontSize: 10, fontWeight: '700', color: Colors.ink3, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 },
  otpRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  otpDigitBox: { width: 44, height: 56, borderRadius: 12, backgroundColor: Colors.primaryLight, borderWidth: 2, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  otpDigit: { fontSize: 28, fontWeight: '800', color: Colors.primary },
  otpFooterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  otpValidText: { fontSize: 12, color: Colors.ink2, fontWeight: '500' },
  singleUseBadge: { backgroundColor: Colors.accentLight, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.accent },
  singleUseText: { fontSize: 10, color: Colors.accent, fontWeight: '700' },
  otpInstruction: { fontSize: 11, color: Colors.ink3, textAlign: 'center', lineHeight: 18 },
  sectionTitle: { fontSize: 11, color: Colors.ink3, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  noteLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, color: Colors.parent },
  noteText: { fontSize: 13, color: Colors.ink, fontStyle: 'italic', lineHeight: 20 },
});
