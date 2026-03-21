import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { updateUserFCMToken } from './firestore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotifications = async (uid) => {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('iiser-outing-system', {
      name: 'IISER Outing Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1D4ED8',
      sound: 'default',
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  if (uid && token) {
    await updateUserFCMToken(uid, token);
  }

  return token;
};

export const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
  };

  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (err) {
    console.error('Push send error:', err);
  }
};

export const NOTIF = {
  parentRequest: (studentName) => ({
    title: `Outing Request - ${studentName}`,
    body: 'Your child has submitted an outing request. Tap to approve or reject.',
  }),
  studentApproved: () => ({
    title: 'Outing Approved',
    body: 'Your outing request was approved. Your OTP is ready for gate verification.',
  }),
  studentRejected: () => ({
    title: 'Request Rejected',
    body: 'Your parent has declined the outing request.',
  }),
  mentorAlert: (studentName) => ({
    title: `Student Outing - ${studentName}`,
    body: 'A new outing request is ready for faculty review.',
  }),
  exitConfirmed: (studentName, time) => ({
    title: `${studentName} has left campus`,
    body: `Left campus at ${time}. Please ensure they return on time.`,
  }),
  returnOverdue: (studentName) => ({
    title: `Overdue - ${studentName}`,
    body: 'Expected return time has passed. Please follow up immediately.',
  }),
  studentReturned: (studentName, time) => ({
    title: `${studentName} returned`,
    body: `Returned to campus at ${time}.`,
  }),
};
