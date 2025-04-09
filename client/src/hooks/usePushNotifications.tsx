import { useState, useEffect, useRef } from 'react';
import { messaging } from '../firebaseConfig';
import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { FirebaseError } from 'firebase/app';
import Cookies from 'js-cookie';

interface UsePushNotificationsResult {
    fcmToken: string | null;
    notification: MessagePayload | null;
    error: FirebaseError | null;
}

const usePushNotifications = (): UsePushNotificationsResult => {
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const [notification, setNotification] = useState<MessagePayload | null>(null);
    const [error, setError] = useState<FirebaseError | null>(null);
    const previousUserEmail = useRef<string | undefined>(undefined);

    useEffect(() => {
        console.log('hi');
        console.log('useEffect in usePushNotifications is running'); // ADD THIS LINE


        const fetchTokenAndSetupListeners = async () => {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    console.log('granted');
                    
                    const token = await getToken(messaging, { vapidKey: 'BEunhKCKWwBWAgL0exMDdMHJSEcs7qm_z6r3Ely-wkIFkQJeAoGLVxtRJQDN4dpDO570QCE8Y6pBJvt_vyx-hHo' });
                    if (token) {
                        setFcmToken(token);
                        const userEmail = Cookies.get('userEmail'); // Get userEmail here
                        sendFcmTokenToBackend(token, userEmail);
                    } else {
                        console.warn('No FCM token received.');
                    }
                } else if (permission === 'denied') {
                    console.warn('Notification permission denied.');
                }
            } catch (err: any) {
                setError(err as FirebaseError);
                console.error('Error during FCM setup:', err);
            }
        };

        const currentUserEmail = Cookies.get('userEmail');
        if (currentUserEmail !== previousUserEmail.current) {
            console.log('userEmail cookie changed or initial run. Re-registering for push.');
            fetchTokenAndSetupListeners();
            previousUserEmail.current = currentUserEmail;
        } else {
            console.log('userEmail cookie did not change.');
        }


        const unsubscribe = onMessage(messaging, (payload: MessagePayload) => {
            console.log('Foreground message received: ', payload);
            setNotification(payload);

            if (payload.notification) {
                const notificationTitle = payload.notification.title || 'New Notification';
                const notificationOptions = {
                    body: payload.notification.body || 'Check your app for details.',
                    icon: payload.notification.icon || '/icons/notification-icon.png',
                };
        
                navigator.serviceWorker.ready.then(serviceWorkerRegistration => {
                    serviceWorkerRegistration.showNotification(notificationTitle, notificationOptions);
                });
            }

        });

        return () => {
            unsubscribe();
        };

    }, []);

    const sendFcmTokenToBackend = async (token: string, userEmail: string | undefined) => {
        try {
            const email: string = userEmail || 'UNKNOWN_USER_ID';
            const response: Response = await fetch(`http://localhost:5000/api/auth/fcm-device-token?email=${email}`, { // Corrected URL
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: email, fcmDeviceToken: token }), // Using 'email' as userId
            });
            if (!response.ok) {
                console.error('Failed to send FCM token to backend:', response.statusText);
            } else {
                console.log('FCM token sent to backend.');
            }
        } catch (error: any) {
            setError(error as FirebaseError);
            console.error('Error sending FCM token to backend:', error);
        }
    };

    return { fcmToken, notification, error };
};

export default usePushNotifications;