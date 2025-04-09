// public/service-worker.js (Module Version - Bundled with npm 'firebase' package)

// **Remove importScripts - not used in module service workers**
// importScripts("https://www.gstatic.com/firebasejs/9.1.3/firebase-app-compat.js");
// importScripts("https://www.gstatic.com/firebasejs/9.1.3/firebase-messaging-compat.js");

// **Use standard import statements from 'firebase' npm package:**
// CORRECT imports
import { initializeApp } from '/firebase/app';
import { getMessaging, onBackgroundMessage } from '/firebase/messaging';
import { getMessaging, onBackgroundMessage } from '/firebase/messaging-compat';
// Define firebaseConfig directly here (replace with your actual config)
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBALWL6ma2njgmybo_u_01ZkhSnhEgpz-Q",
    authDomain: "todo-2c56d.firebaseapp.com",
    projectId: "todo-2c56d",
    storageBucket: "todo-2c56d.firebasestorage.app",
    messagingSenderId: "22678348777",
    appId: "1:22678348777:web:7265362c247890ea242178",
    measurementId: "G-D3FF3KT9VD"
  };

// Initialize Firebase App (using imported initializeApp function)
const firebaseApp = initializeApp(firebaseConfig);

// Get Messaging instance (using imported getMessaging function)
const messaging = getMessaging(firebaseApp);

// Set up background message handler (using imported onBackgroundMessage function)
onBackgroundMessage(messaging, (payload) => { // **Pass 'messaging' instance as first argument**
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = 'New Task Assigned!';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new task!',
        icon: payload.notification?.icon || '/icons/notification-icon.png',
    };
    return self.registration.showNotification(notificationTitle, notificationOptions);
});