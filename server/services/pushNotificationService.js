// services/pushNotificationService.js
const admin = require('firebase-admin');
const User = require('../models/userModel');
require('dotenv').config(); // Load environment variables from .env file

// Construct the service account object from environment variables
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const sendTaskNotification = async (notificationData) => {
  const { topic, userId, taskTitle, taskDescription, dueDate } = notificationData;

  try {
    console.log('push started');
    const user = await User.findById(userId);
    if (!user || !user.fcmDeviceToken) {
      console.warn(`No FCM device token found for user ID: ${userId}`);
      return; // Exit if no FCM token
    }

    const fcmDeviceToken = user.fcmDeviceToken;
    const notificationPayload = {
      notification: { // Basic notification data (optional fallback)
        title: topic,
        body: `${taskTitle}: ${taskDescription} - Due: ${dueDate ? dueDate.toLocaleDateString() : 'No Due Date'}`,
      },
      webpush: { // Web push specific configuration
        notification: {
          title: topic,
          body: `${taskTitle}: ${taskDescription} - Due: ${dueDate ? dueDate.toLocaleDateString() : 'No Due Date'}`,
          icon: '/icons/notification-icon.png', // <-- Icon for web push
        }
      },
      token: fcmDeviceToken,
    };

    const response = await admin.messaging().send(notificationPayload);
    console.log('FCM notification sent:', response);

  } catch (error) {
    console.error('Error sending FCM notification:', error);
  }
};

const sendTaskReminderNotification = async (notificationData) => {
  const { topic, userId, taskTitle, taskDescription, dueDate } = notificationData;

  try {
    console.log('reminder push started');
    const user = await User.findById(userId);
    if (!user || !user.fcmDeviceToken) {
      console.warn(`No FCM device token found for user ID: ${userId}`);
      return; // Exit if no FCM token
    }

    // Save notification to DB for reminder notifications too
    try {
      const savedNotification = await NotificationModel.create({
        userId: userId,
        messageType: 'taskReminder',
        notificationData: notificationData,
      });
      console.log('FCM Reminder Notification saved to MongoDB:', savedNotification);
    } catch (dbError) {
      console.error('Error saving FCM reminder notification to MongoDB:', dbError);
    }

    const fcmDeviceToken = user.fcmDeviceToken;
    const notificationPayload = {
      notification: { // Basic notification data (optional fallback)
        title: topic,
        body: `Reminder: ${taskTitle} due soon! - ${taskDescription} - Due: ${dueDate ? dueDate.toLocaleDateString() : 'No Due Date'}`,
      },
      webpush: { // Web push specific configuration
        notification: {
          title: topic,
          body: `Reminder: ${taskTitle} due soon! - ${taskDescription} - Due: ${dueDate ? dueDate.toLocaleDateString() : 'No Due Date'}`,
          icon: '/icons/notification-icon.png',
        }
      },
      token: fcmDeviceToken,
    };

    const response = await admin.messaging().send(notificationPayload);
    console.log('FCM reminder notification sent:', response);

  } catch (error) {
    console.error('Error sending FCM reminder notification:', error);
  }
};

module.exports = {
  sendTaskNotification,
  sendTaskReminderNotification,
};