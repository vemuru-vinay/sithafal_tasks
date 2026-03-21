import {
  collection, doc, addDoc, updateDoc, getDoc, getDocs,
  query, where, onSnapshot, serverTimestamp, limit,
} from 'firebase/firestore';
import { db } from './firebase';

const USERS = 'users';
const REQUESTS = 'exitRequests';

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, USERS, uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateUserFCMToken = async (uid, token) => {
  await updateDoc(doc(db, USERS, uid), { fcmToken: token });
};

export const createExitRequest = async (data) => {
  const ref = await addDoc(collection(db, REQUESTS), {
    ...data,
    status: 'PENDING',
    statusHistory: [{ status: 'PENDING', at: new Date().toISOString(), by: data.studentId }],
    parentApproval: null,
    mentorApproval: null,
    gate: null,
    otp: null,
    otpExpiry: null,
    otpUsed: false,
    qrToken: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const approveRequest = async (requestId, parentId, note = '') => {
  const ref = doc(db, REQUESTS, requestId);
  const snap = await getDoc(ref);
  const data = snap.data();
  await updateDoc(ref, {
    status: 'PARENT_APPROVED',
    parentApproval: { approved: true, by: parentId, note, at: new Date().toISOString() },
    statusHistory: [...(data.statusHistory || []), { status: 'PARENT_APPROVED', at: new Date().toISOString(), by: parentId }],
    updatedAt: serverTimestamp(),
  });
};

export const rejectRequest = async (requestId, parentId, note = '') => {
  const ref = doc(db, REQUESTS, requestId);
  const snap = await getDoc(ref);
  const data = snap.data();
  await updateDoc(ref, {
    status: 'REJECTED',
    parentApproval: { approved: false, by: parentId, note, at: new Date().toISOString() },
    statusHistory: [...(data.statusHistory || []), { status: 'REJECTED', at: new Date().toISOString(), by: parentId }],
    updatedAt: serverTimestamp(),
  });
};

export const acknowledgeRequest = async (requestId, mentorId, note = '') => {
  const ref = doc(db, REQUESTS, requestId);
  const snap = await getDoc(ref);
  const data = snap.data();
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
  await updateDoc(ref, {
    status: 'MENTOR_ACKNOWLEDGED',
    mentorApproval: {
      acknowledged: true,
      flagged: false,
      by: mentorId,
      note,
      at: new Date().toISOString(),
    },
    otp,
    otpExpiry,
    otpUsed: false,
    qrToken: otp,
    statusHistory: [
      ...(data.statusHistory || []),
      { status: 'MENTOR_ACKNOWLEDGED', at: new Date().toISOString(), by: mentorId },
    ],
    updatedAt: serverTimestamp(),
  });
};

export const flagRequest = async (requestId, mentorId, reason, detail) => {
  const ref = doc(db, REQUESTS, requestId);
  const snap = await getDoc(ref);
  const data = snap.data();
  await updateDoc(ref, {
    status: 'MENTOR_FLAGGED',
    mentorApproval: { acknowledged: false, flagged: true, flagReason: reason, flagDetail: detail, by: mentorId, at: new Date().toISOString() },
    statusHistory: [...(data.statusHistory || []), { status: 'MENTOR_FLAGGED', at: new Date().toISOString(), by: mentorId }],
    updatedAt: serverTimestamp(),
  });
};

export const confirmExit = async (requestId, watchmanId, gateId) => {
  const ref = doc(db, REQUESTS, requestId);
  const snap = await getDoc(ref);
  const data = snap.data();
  await updateDoc(ref, {
    status: 'EXITED',
    gate: { exitConfirmedAt: new Date().toISOString(), watchmanId, gateId, qrUsed: true },
    statusHistory: [...(data.statusHistory || []), { status: 'EXITED', at: new Date().toISOString(), by: watchmanId }],
    updatedAt: serverTimestamp(),
  });
};

export const verifyOTP = async (requestId, enteredOtp, watchmanId, gateId) => {
  const ref = doc(db, REQUESTS, requestId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Request not found');
  const data = snap.data();

  if (data.otpUsed) throw new Error('OTP already used');
  if (data.otp !== enteredOtp) throw new Error('Incorrect OTP');
  const expiry = new Date(data.otpExpiry);
  if (new Date() > expiry) throw new Error('OTP has expired');

  await updateDoc(ref, {
    status: 'EXITED',
    otpUsed: true,
    gate: {
      exitConfirmedAt: new Date().toISOString(),
      watchmanId,
      gateId,
      otpVerified: true,
    },
    statusHistory: [
      ...(data.statusHistory || []),
      { status: 'EXITED', at: new Date().toISOString(), by: watchmanId },
    ],
    updatedAt: serverTimestamp(),
  });
};

export const confirmReturn = async (requestId, watchmanId) => {
  const ref = doc(db, REQUESTS, requestId);
  const snap = await getDoc(ref);
  const data = snap.data();
  await updateDoc(ref, {
    status: 'RETURNED',
    'gate.returnConfirmedAt': new Date().toISOString(),
    statusHistory: [...(data.statusHistory || []), { status: 'RETURNED', at: new Date().toISOString(), by: watchmanId }],
    updatedAt: serverTimestamp(),
  });
};

export const getRequestByQRToken = async (qrToken) => {
  const q = query(collection(db, REQUESTS), where('qrToken', '==', qrToken), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
};

export const withdrawRequest = async (requestId, studentId) => {
  const ref = doc(db, REQUESTS, requestId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Request not found');
  const data = snap.data();
  await updateDoc(ref, {
    status: 'WITHDRAWN',
    statusHistory: [...(data.statusHistory || []), { status: 'WITHDRAWN', at: new Date().toISOString(), by: studentId }],
    updatedAt: serverTimestamp(),
  });
};

export const listenToStudentRequest = (studentId, callback) => {
  const q = query(collection(db, REQUESTS), where('studentId', '==', studentId), limit(10));
  return onSnapshot(q, (snap) => {
    if (snap.empty) { callback(null); return; }
    const active = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(r => !['EXITED', 'RETURNED', 'REJECTED', 'EXPIRED', 'WITHDRAWN'].includes(r.status))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(active[0] || null);
  });
};

export const listenToParentRequests = (parentId, callback) => {
  const q = query(collection(db, REQUESTS), where('parentId', '==', parentId), limit(20));
  return onSnapshot(q, (snap) => {
    const results = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(results);
  });
};

export const listenToMentorRequests = (mentorId, callback) => {
  const q = query(collection(db, REQUESTS), where('mentorId', '==', mentorId), limit(30));
  return onSnapshot(q, (snap) => {
    const results = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(results);
  });
};

export const listenToGateRequests = (callback) => {
  const q = query(collection(db, REQUESTS), limit(50));
  return onSnapshot(q, (snap) => {
    const results = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(r => ['MENTOR_ACKNOWLEDGED', 'EXITED', 'RETURNED'].includes(r.status))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(results);
  });
};
