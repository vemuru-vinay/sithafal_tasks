import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../services/AuthContext';
import { createExitRequest, getUserProfile } from '../../services/firestore';
import { sendPushNotification, NOTIF } from '../../services/notifications';
import { InputField, PrimaryButton, GhostButton, Card, Avatar, SectionLabel } from '../../components';
import { Colors, Spacing, Radius, Shadow } from '../../theme';
import CustomModal from '../../components/CustomModal';
import useModal from '../../hooks/useModal';

const REASON_CATEGORIES = [
  'Medical Appointment',
  'Family Emergency',
  'Personal Work',
  'Research / Lab Work',
  'Sports / Cultural Event',
  'City Outing',
  'Other',
];

const URGENCY_LEVELS = ['Normal', 'Urgent', 'Emergency'];
const HOURS = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const MINUTES = ['00','05','10','15','20','25','30','35','40','45','50','55'];
const PERIODS = ['AM', 'PM'];

const formatTime = (hour, minute, period) => `${hour}:${minute} ${period}`;

function TimeSelectorField({ label, value, onPress }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.fieldLabel}>{label}<Text style={{ color: Colors.danger }}> *</Text></Text>
      <TouchableOpacity style={styles.timeField} onPress={onPress} activeOpacity={0.85}>
        <Text style={[styles.timeFieldText, !value && styles.timeFieldPlaceholder]}>
          {value || 'Select time'}
        </Text>
        <Text style={styles.timeFieldAction}>Choose</Text>
      </TouchableOpacity>
    </View>
  );
}

function SelectionGroup({ title, options, value, onSelect }) {
  return (
    <View style={styles.selectionGroup}>
      <Text style={styles.selectionTitle}>{title}</Text>
      <View style={styles.optionWrap}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.optionChip, value === option && styles.optionChipActive]}
            onPress={() => onSelect(option)}
            activeOpacity={0.85}
          >
            <Text style={[styles.optionText, value === option && styles.optionTextActive]}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function StudentRequestScreen({ navigation }) {
  const { profile } = useAuth();
  const { modal, showAlert } = useModal();

  const [reasonCategory, setReasonCategory] = useState('Medical Appointment');
  const [reasonDetail, setReasonDetail] = useState('');
  const [leaveAt, setLeaveAt] = useState('');
  const [returnBy, setReturnBy] = useState('');
  const [urgency, setUrgency] = useState('Normal');
  const [submitting, setSubmitting] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState('leaveAt');
  const [pickerHour, setPickerHour] = useState('09');
  const [pickerMinute, setPickerMinute] = useState('00');
  const [pickerPeriod, setPickerPeriod] = useState('AM');

  const pickerPreview = useMemo(
    () => formatTime(pickerHour, pickerMinute, pickerPeriod),
    [pickerHour, pickerMinute, pickerPeriod],
  );

  const openTimePicker = (field) => {
    const currentValue = field === 'leaveAt' ? leaveAt : returnBy;
    const match = currentValue.match(/^(\d{2}):(\d{2})\s(AM|PM)$/);

    setActiveTimeField(field);
    if (match) {
      setPickerHour(match[1]);
      setPickerMinute(match[2]);
      setPickerPeriod(match[3]);
    } else {
      setPickerHour(field === 'leaveAt' ? '09' : '06');
      setPickerMinute('00');
      setPickerPeriod(field === 'leaveAt' ? 'AM' : 'PM');
    }
    setPickerVisible(true);
  };

  const applySelectedTime = () => {
    const nextValue = formatTime(pickerHour, pickerMinute, pickerPeriod);
    if (activeTimeField === 'leaveAt') setLeaveAt(nextValue);
    if (activeTimeField === 'returnBy') setReturnBy(nextValue);
    setPickerVisible(false);
  };

  const validate = async () => {
    if (!leaveAt.trim()) {
      await showAlert({
        type: 'warning',
        title: 'Departure time required',
        message: 'Please select the departure time.',
      });
      return false;
    }

    if (!returnBy.trim()) {
      await showAlert({
        type: 'warning',
        title: 'Return time required',
        message: 'Please select the return time.',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    const isValid = await validate();
    if (!isValid) return;

    setSubmitting(true);
    try {
      const requestId = await createExitRequest({
        studentId: profile.uid,
        studentName: profile.name,
        studentClass: profile.class,
        rollNo: profile.rollNo,
        parentId: profile.parentId,
        mentorId: profile.mentorId,
        reasonCategory,
        reasonDetail: reasonDetail.trim(),
        urgency,
        leaveAt,
        returnBy,
      });

      try {
        const [parentProfile, mentorProfile] = await Promise.all([
          getUserProfile(profile.parentId),
          getUserProfile(profile.mentorId),
        ]);

        if (parentProfile?.fcmToken) {
          const { title, body } = NOTIF.parentRequest(profile.name);
          await sendPushNotification(parentProfile.fcmToken, title, body, { requestId, type: 'PARENT_ACTION' });
        }

        if (mentorProfile?.fcmToken) {
          const { title, body } = NOTIF.mentorAlert(profile.name);
          await sendPushNotification(mentorProfile.fcmToken, title, body, { requestId, type: 'MENTOR_ACTION' });
        }
      } catch (notifErr) {
        console.log('Notification failed (non-fatal):', notifErr.message);
      }

      await showAlert({
        type: 'success',
        title: 'Request sent',
        message: 'Your parent and faculty mentor have been notified instantly.',
      });
      navigation.replace('StudentDashboard');
    } catch (err) {
      await showAlert({
        type: 'danger',
        title: 'Submission failed',
        message: err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Card style={styles.progressCard} accentTop={Colors.student}>
          <Text style={styles.progressLabel}>Step 1 of 3</Text>
          <Text style={styles.progressTitle}>Create Your Outing Request</Text>
          <Text style={styles.progressSub}>Enter the outing details below. Parent approval and faculty review are the next steps.</Text>
          <View style={styles.progressBarTrack}>
            <View style={styles.progressBarFill} />
          </View>
        </Card>

        <Card style={{ backgroundColor: Colors.studentBg, borderColor: Colors.studentMid }} accentTop={Colors.student}>
          <View style={styles.identityRow}>
            <Avatar name={profile?.name} color={Colors.student} size={44} />
            <View>
              <Text style={styles.identityName}>{profile?.name}</Text>
              <Text style={styles.identityMeta}>{profile?.class} | Student ID {profile?.rollNo}</Text>
            </View>
          </View>
        </Card>

        <Card accentTop={Colors.student}>
          <SectionLabel text="Outing Details" />
          <Text style={styles.sectionIntro}>Choose the category that best describes the purpose of your outing.</Text>
          <View style={styles.pillRow}>
            {REASON_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.pill, reasonCategory === cat && styles.pillActive]}
                onPress={() => setReasonCategory(cat)}
              >
                <Text style={[styles.pillText, reasonCategory === cat && styles.pillTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <InputField
            label="Additional Details"
            value={reasonDetail}
            onChangeText={setReasonDetail}
            placeholder="For example: medical appointment in Tirupati city"
            multiline
            numberOfLines={3}
            inputStyle={{ minHeight: 88, textAlignVertical: 'top' }}
          />
        </Card>

        <Card accentTop={Colors.student}>
          <SectionLabel text="Schedule" />
          <Text style={styles.sectionIntro}>Select your planned departure time and expected return time.</Text>
          <View style={styles.timeRow}>
            <TimeSelectorField
              label="Departure Time"
              value={leaveAt}
              onPress={() => openTimePicker('leaveAt')}
            />
            <TimeSelectorField
              label="Return Time"
              value={returnBy}
              onPress={() => openTimePicker('returnBy')}
            />
          </View>
        </Card>

        <Card accentTop={Colors.student}>
          <SectionLabel text="Priority" />
          <Text style={styles.sectionIntro}>Select the urgency level so your parent and faculty mentor can respond appropriately.</Text>
          <View style={styles.pillRow}>
            {URGENCY_LEVELS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.pill,
                  urgency === item && styles.pillActive,
                  item === 'Emergency' && urgency === item && { backgroundColor: Colors.danger, borderColor: Colors.danger },
                  item === 'Urgent' && urgency === item && { backgroundColor: Colors.warn, borderColor: Colors.warn },
                ]}
                onPress={() => setUrgency(item)}
              >
                <Text style={[styles.pillText, urgency === item && styles.pillTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <PrimaryButton
          label="Submit Outing Request"
          onPress={handleSubmit}
          loading={submitting}
          color={Colors.student}
          style={styles.submitBtn}
        />
        <Text style={styles.submitNote}>Your parent and faculty mentor will be notified instantly.</Text>
        <GhostButton
          label="Cancel"
          onPress={() => navigation.goBack()}
          style={{ marginTop: Spacing.sm }}
        />
      </ScrollView>

      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{activeTimeField === 'leaveAt' ? 'Select Departure Time' : 'Select Return Time'}</Text>
            <Text style={styles.modalPreview}>{pickerPreview}</Text>

            <SelectionGroup title="Hour" options={HOURS} value={pickerHour} onSelect={setPickerHour} />
            <SelectionGroup title="Minute" options={MINUTES} value={pickerMinute} onSelect={setPickerMinute} />
            <SelectionGroup title="Period" options={PERIODS} value={pickerPeriod} onSelect={setPickerPeriod} />

            <View style={styles.modalActions}>
              <GhostButton label="Cancel" onPress={() => setPickerVisible(false)} style={{ flex: 1 }} />
              <PrimaryButton label="Apply Time" onPress={applySelectedTime} color={Colors.student} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      <CustomModal {...modal} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.studentBg },
  scroll: { padding: Spacing.lg, paddingBottom: 40 },
  progressCard: { ...Shadow.sm },
  progressLabel: { fontSize: 13, color: Colors.student, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  progressTitle: { fontSize: 22, fontWeight: '700', color: Colors.ink, marginTop: 6 },
  progressSub: { fontSize: 14, color: Colors.ink2, marginTop: 6, lineHeight: 22 },
  progressBarTrack: { height: 8, backgroundColor: Colors.studentMid, borderRadius: Radius.full, marginTop: Spacing.lg, overflow: 'hidden' },
  progressBarFill: { width: '34%', height: '100%', backgroundColor: Colors.student, borderRadius: Radius.full },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  identityName: { fontSize: 16, fontWeight: '700', color: Colors.ink },
  identityMeta: { fontSize: 13, color: Colors.ink2, marginTop: 4 },
  sectionIntro: { fontSize: 13, color: Colors.ink2, marginBottom: Spacing.md, lineHeight: 21 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface, minHeight: 40, justifyContent: 'center' },
  pillActive: { backgroundColor: Colors.student, borderColor: Colors.student },
  pillText: { fontSize: 13, color: Colors.ink2, fontWeight: '500' },
  pillTextActive: { color: '#fff', fontWeight: '700' },
  timeRow: { flexDirection: 'row', gap: 10 },
  fieldLabel: { fontSize: 13, color: Colors.ink2, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  timeField: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  timeFieldText: { fontSize: 14, color: Colors.ink, fontWeight: '600' },
  timeFieldPlaceholder: { color: Colors.ink3, fontWeight: '500' },
  timeFieldAction: { fontSize: 11, color: Colors.student, fontWeight: '700', textTransform: 'uppercase', marginTop: 6 },
  submitBtn: { marginTop: Spacing.md, minHeight: 56 },
  submitNote: { fontSize: 13, color: Colors.student, textAlign: 'center', marginTop: 10, marginBottom: 4, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 23, 20, 0.45)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.ink },
  modalPreview: { fontSize: 15, color: Colors.student, fontWeight: '700', marginTop: 6, marginBottom: Spacing.md },
  selectionGroup: { marginTop: Spacing.sm },
  selectionTitle: { fontSize: 12, color: Colors.ink3, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  optionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    minWidth: 56,
    alignItems: 'center',
  },
  optionChipActive: { backgroundColor: Colors.student, borderColor: Colors.student },
  optionText: { fontSize: 13, color: Colors.ink2, fontWeight: '600' },
  optionTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: Spacing.lg },
});

