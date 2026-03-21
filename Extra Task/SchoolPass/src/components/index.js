import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, TextInput,
} from 'react-native';
import { Colors, Spacing, Radius, Shadow, statusColors, statusLabel } from '../theme';

export const StatusChip = ({ status, size = 'sm' }) => {
  const s = statusColors[status] || { bg: Colors.bg, text: Colors.ink3, dot: Colors.ink3 };
  const label = statusLabel[status] || status;
  const isLarge = size === 'lg';

  return (
    <View style={[styles.chipWrap, { backgroundColor: s.bg }, isLarge && styles.chipWrapLarge]}>
      <View style={[styles.chipDot, { backgroundColor: s.dot }, isLarge && styles.chipDotLarge]} />
      <Text style={[styles.chipText, { color: s.text }, isLarge && styles.chipTextLarge]}>{label}</Text>
    </View>
  );
};

export const PrimaryButton = ({ onPress, label, color, loading, disabled, style }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.86}
    style={[
      styles.primaryBtn,
      { backgroundColor: disabled ? Colors.ink3 : (color || Colors.primary) },
      style,
    ]}
  >
    {loading
      ? <ActivityIndicator color="#fff" size="small" />
      : <Text style={styles.primaryBtnLabel}>{label}</Text>}
  </TouchableOpacity>
);

export const GhostButton = ({ onPress, label, color, style, loading, disabled }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    disabled={disabled || loading}
    style={[
      styles.ghostBtn,
      { borderColor: color || Colors.border, opacity: disabled ? 0.6 : 1 },
      style,
    ]}
  >
    {loading
      ? <ActivityIndicator color={color || Colors.ink2} size="small" />
      : <Text style={[styles.ghostBtnLabel, { color: color || Colors.ink2 }]}>{label}</Text>}
  </TouchableOpacity>
);

export const Card = ({ children, style, accent, accentTop }) => (
  <View
    style={[
      styles.card,
      accent && { borderLeftWidth: 4, borderLeftColor: accent },
      accentTop && { borderTopWidth: 3, borderTopColor: accentTop },
      style,
    ]}
  >
    {children}
  </View>
);

export const InfoRow = ({ label, value, valueStyle }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoKey}>{label}</Text>
    <Text style={[styles.infoVal, valueStyle]} numberOfLines={3}>{value}</Text>
  </View>
);

export const InputField = ({ label, required, inputStyle, ...props }) => (
  <View style={styles.inputWrap}>
    <Text style={styles.inputLabel}>
      {label}
      {required && <Text style={{ color: Colors.danger }}> *</Text>}
    </Text>
    <TextInput
      style={[styles.input, inputStyle]}
      placeholderTextColor={Colors.ink3}
      {...props}
    />
  </View>
);

export const Avatar = ({ name = '', color = Colors.student, size = 40 }) => {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color + '18',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color, fontSize: size * 0.36, fontWeight: '700' }}>{initials}</Text>
    </View>
  );
};

export const SectionLabel = ({ text, style }) => (
  <Text style={[styles.sectionLabel, style]}>{text}</Text>
);

export const LoadingScreen = ({ color }) => (
  <View style={styles.loadingScreen}>
    <ActivityIndicator size="large" color={color || Colors.primary} />
  </View>
);

export const EmptyState = ({ icon, title, sub }) => (
  <View style={styles.emptyWrap}>
    {icon ? <Text style={styles.emptyIcon}>{icon}</Text> : null}
    <Text style={styles.emptyTitle}>{title || 'Nothing here yet'}</Text>
    {sub && <Text style={styles.emptySub}>{sub}</Text>}
  </View>
);

export const ApprovalChain = ({ status }) => {
  const steps = [
    {
      key: 'parent',
      label: 'Parent Approval',
      done: ['PARENT_APPROVED', 'MENTOR_ACKNOWLEDGED', 'EXITED', 'RETURNED'].includes(status),
      active: status === 'PENDING',
    },
    {
      key: 'mentor',
      label: 'Faculty Mentor Approval',
      done: ['MENTOR_ACKNOWLEDGED', 'EXITED', 'RETURNED'].includes(status),
      active: status === 'PARENT_APPROVED',
    },
    {
      key: 'gate',
      label: 'Security Verification',
      done: ['EXITED', 'RETURNED'].includes(status),
      active: status === 'MENTOR_ACKNOWLEDGED',
    },
  ];

  return (
    <View>
      {steps.map((step, index) => (
        <View key={step.key} style={styles.chainRow}>
          <View
            style={[
              styles.chainDot,
              step.done && { backgroundColor: Colors.success },
              step.active && { backgroundColor: Colors.primary },
              !step.done && !step.active && { backgroundColor: Colors.bg2 },
            ]}
          >
            <Text style={{ fontSize: 10, color: step.done || step.active ? '#fff' : Colors.ink3, fontWeight: '700' }}>
              {step.done ? 'OK' : index + 1}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.chainLabel,
                step.done && { color: Colors.success },
                step.active && { color: Colors.primary },
              ]}
            >
              {step.label}
            </Text>
          </View>
          {step.done && <Text style={styles.chainDone}>Done</Text>}
          {step.active && <Text style={styles.chainActive}>Active</Text>}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  chipWrap: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.full },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3 },
  chipWrapLarge: { paddingHorizontal: 12, paddingVertical: 6 },
  chipDotLarge: { width: 8, height: 8, borderRadius: 4 },
  chipTextLarge: { fontSize: 13 },

  primaryBtn: { borderRadius: 12, minHeight: 54, paddingVertical: 16, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  primaryBtnLabel: { color: '#fff', fontSize: 15, fontWeight: '700' },

  ghostBtn: { borderRadius: 12, minHeight: 52, paddingVertical: 13, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, backgroundColor: Colors.surface },
  ghostBtnLabel: { fontSize: 15, fontWeight: '600' },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.bg2, gap: 12 },
  infoKey: { fontSize: 13, color: Colors.ink3, flex: 1 },
  infoVal: { fontSize: 13, color: Colors.ink, fontWeight: '500', flex: 2, textAlign: 'right' },

  inputWrap: { marginBottom: Spacing.md },
  inputLabel: { fontSize: 13, color: Colors.ink2, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.sm, minHeight: 52, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, color: Colors.ink },

  sectionLabel: { fontSize: 11, color: Colors.ink3, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },

  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },

  emptyWrap: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 18, marginBottom: 10, color: Colors.ink3, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.ink2 },
  emptySub: { fontSize: 13, color: Colors.ink3, marginTop: 4, textAlign: 'center' },

  chainRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  chainDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chainLabel: { fontSize: 13, color: Colors.ink2, fontWeight: '500' },
  chainDone: { fontSize: 11, color: Colors.success, fontWeight: '700' },
  chainActive: { fontSize: 11, color: Colors.primary, fontWeight: '700' },
});
