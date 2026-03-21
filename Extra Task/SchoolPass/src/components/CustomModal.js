import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Shadow } from '../theme';

export default function CustomModal({
  visible,
  type = 'info',
  title,
  message,
  confirmText = 'OK',
  cancelText,
  onConfirm,
  onCancel,
}) {
  if (!visible) return null;

  const accent = {
    success: Colors.success,
    danger: Colors.danger,
    warning: Colors.warn,
    logout: Colors.danger,
    info: Colors.student,
  }[type] || Colors.student;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel || onConfirm}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <View style={[styles.topBar, { backgroundColor: accent }]} />
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            {message ? <Text style={styles.message}>{message}</Text> : null}
          </View>
          <View style={styles.footer}>
            {cancelText ? (
              <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onCancel} activeOpacity={0.85}>
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={[styles.btn, { backgroundColor: accent }]} onPress={onConfirm} activeOpacity={0.85}>
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(23, 50, 77, 0.36)', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  box: { backgroundColor: Colors.surface, borderRadius: 20, overflow: 'hidden', width: '100%', maxWidth: 340, borderWidth: 1, borderColor: Colors.border, ...Shadow.md },
  topBar: { height: 6, width: '100%' },
  content: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 18 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.ink, textAlign: 'center', marginBottom: 8 },
  message: { fontSize: 14, color: Colors.ink2, textAlign: 'center', lineHeight: 22 },
  footer: { flexDirection: 'row', gap: 10, paddingHorizontal: 18, paddingBottom: 18, paddingTop: 2 },
  btn: { flex: 1, minHeight: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.border },
  cancelText: { fontSize: 14, fontWeight: '600', color: Colors.ink2 },
  confirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
