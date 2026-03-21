export const Colors = {
  primary:      '#003366',
  primaryLight: '#E8EEF7',
  primaryMid:   '#4A7AB5',
  accent:       '#C9A84C',
  accentLight:  '#FBF5E6',

  bg:       '#F4F6FA',
  bg2:      '#EAECF0',
  surface:  '#FFFFFF',
  ink:      '#1A1D23',
  ink2:     '#4A4F5A',
  ink3:     '#8A909C',
  border:   '#DDE1E9',

  student:    '#1A56DB',
  studentBg:  '#EBF2FF',
  studentMid: '#76A9FA',
  parent:     '#9F580A',
  parentBg:   '#FFF8EE',
  parentMid:  '#FACA15',
  mentor:     '#046C4E',
  mentorBg:   '#ECFDF5',
  mentorMid:  '#31C48D',
  gate:       '#6B21A8',
  gateBg:     '#F5F3FF',
  gateMid:    '#A78BFA',
  admin:      '#B91C1C',
  adminBg:    '#FFF5F5',
  adminMid:   '#FC8181',

  danger:    '#DC2626',
  dangerBg:  '#FEF2F2',
  success:   '#16A34A',
  successBg: '#F0FDF4',
  warn:      '#D97706',
  warnBg:    '#FFFBEB',

  shadow: 'rgba(0,51,102,0.08)',
};

export const Shadow = {
  sm: {
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const Spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
};

export const Radius = {
  sm: 8, md: 12, lg: 16, xl: 24, full: 999,
};

export const statusColors = {
  PENDING:             { bg: '#FFFBEB', text: '#D97706', dot: '#D97706' },
  PARENT_APPROVED:     { bg: '#F0FDF4', text: '#16A34A', dot: '#16A34A' },
  REJECTED:            { bg: '#FEF2F2', text: '#DC2626', dot: '#DC2626' },
  MENTOR_ACKNOWLEDGED: { bg: '#EBF2FF', text: '#1A56DB', dot: '#1A56DB' },
  MENTOR_FLAGGED:      { bg: '#FEF3C7', text: '#92400E', dot: '#D97706' },
  GATE_VERIFIED:       { bg: '#F5F3FF', text: '#6B21A8', dot: '#6B21A8' },
  EXITED:              { bg: '#F5F3FF', text: '#6B21A8', dot: '#6B21A8' },
  RETURNED:            { bg: '#F0FDF4', text: '#16A34A', dot: '#16A34A' },
  OVERDUE:             { bg: '#FEF2F2', text: '#DC2626', dot: '#DC2626' },
  EXPIRED:             { bg: '#F4F6FA', text: '#8A909C', dot: '#8A909C' },
  WITHDRAWN:           { bg: '#F4F6FA', text: '#8A909C', dot: '#8A909C' },
  OTP_SENT:            { bg: '#EBF2FF', text: '#1A56DB', dot: '#1A56DB' },
  OTP_VERIFIED:        { bg: '#F0FDF4', text: '#16A34A', dot: '#16A34A' },
};

export const statusLabel = {
  PENDING:             'Pending',
  PARENT_APPROVED:     'Parent Approved',
  REJECTED:            'Rejected',
  MENTOR_ACKNOWLEDGED: 'OTP Issued',
  MENTOR_FLAGGED:      'Flagged',
  GATE_VERIFIED:       'At Gate',
  EXITED:              'Left Campus',
  RETURNED:            'Returned',
  OVERDUE:             'Overdue',
  EXPIRED:             'Expired',
  WITHDRAWN:           'Withdrawn',
  OTP_SENT:            'OTP Sent',
  OTP_VERIFIED:        'OTP Verified',
};
