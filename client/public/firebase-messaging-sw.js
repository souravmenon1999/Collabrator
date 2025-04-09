

// Import Firebase CDN Scripts
importScripts("https://www.gstatic.com/firebasejs/9.1.3/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.1.3/firebase-messaging-compat.js");



const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Messaging Instance
const messaging = firebase.messaging();

// Background Notification Handler
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    // **Extract actual notification data if available**
    const notificationTitle = payload.notification?.title || "HARDCODED TEST NOTIFICATION";
    const notificationOptions = {
        body: payload.notification?.body || "This is a hardcoded test notification body.",
        icon: payload.notification?.icon || "/icons/notification-icon.png"
    };

    console.log('[firebase-messaging-sw.js] TEST showNotification options:', notificationOptions);

    // Show Notification
    return self.registration.showNotification(notificationTitle, notificationOptions)
        .then(() => {
            console.log('[firebase-messaging-sw.js] TEST Notification displayed successfully.');
        })
        .catch(error => {
            console.error('[firebase-messaging-sw.js] TEST Error showing notification:', error);
        });
});

// Handle Notification Click
self.addEventListener("notificationclick", (event) => {
    console.log("[Service Worker] Notification click event:", event);
    event.notification.close();

    // Open link if specified
    if (event.notification.data?.click_action) {
        event.waitUntil(clients.openWindow(event.notification.data.click_action));
    }
});
