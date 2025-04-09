// // src/services/indexedDBService.ts
// import { openDB, DBSchema, IDBPDatabase } from 'idb';
// import { SSENotification } from '../types/types';
// import CryptoJS from 'crypto-js'; // Import CryptoJS

// interface NotificationDB extends DBSchema {
//     'unseen-notifications': {
//         key: IDBValidKey;
//         value: string; // Store encrypted string, not SSENotification directly
//         index: 'spaceId';
//     };
// }

// const DB_NAME = 'NotificationDatabase';
// const NOTIFICATION_STORE_NAME = 'unseen-notifications';
// const ENCRYPTION_KEY = 'YOUR_ENCRYPTION_KEY'; // **IMPORTANT: Replace with a strong, more secure key, ideally manage via environment variable**

// let dbPromise: Promise<IDBPDatabase<NotificationDB>> | null = null;

// const getDB = async (userEmail: string): Promise<IDBPDatabase<NotificationDB>> => {
//     const dbNameWithUser = `${DB_NAME}-${userEmail}`; // User-specific database name
//     if (!dbPromise) {
//         dbPromise = openDB<NotificationDB>(dbNameWithUser, 1, {
//             upgrade(db) {
//                 db.createObjectStore(NOTIFICATION_STORE_NAME, { keyPath: 'id' });
//                 // Example index:  store.createIndex('spaceId', 'spaceId');
//             },
//         });
//     }
//     return dbPromise;
// };

// // const encryptNotification = (notification: SSENotification): string => {
// //     return CryptoJS.AES.encrypt(JSON.stringify(notification), ENCRYPTION_KEY).toString();
// // };

// // const decryptNotification = (encryptedNotification: string): SSENotification | null => {
// //     try {
// //         console.log('kicked');
        
// //         const bytes = CryptoJS.AES.decrypt(encryptedNotification, ENCRYPTION_KEY);
// //         return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
// //     } catch (error) {
// //         console.error("Decryption error:", error);
// //         return null; // Or handle decryption failure as needed
// //     }
// // };

// export const encryptNotification = (notification: SSENotification): string => {
//     const notificationString = JSON.stringify(notification); // **Stringify FIRST**
//     return CryptoJS.AES.encrypt(notificationString, ENCRYPTION_KEY).toString(); // Encrypt the JSON string
// };

// export const decryptNotification = (encryptedNotification: string): SSENotification | null => {
//     try {
//         const bytes = CryptoJS.AES.decrypt(encryptedNotification, ENCRYPTION_KEY);
//         const decryptedString = bytes.toString(CryptoJS.enc.Utf8); // Decrypt back to a string
//         if (!decryptedString) { // Check if decryption resulted in an empty string (decryption failure)
//             console.error("Decryption failed: decrypted string is empty.");
//             return null;
//         }
//         return JSON.parse(decryptedString); // **Parse JSON string back to object**
//     } catch (error) {
//         console.error("Decryption error:", error);
//         return null;
//     }
// };

// export const storeUnseenNotification = async (userEmail: string, notification: SSENotification) => {
//     if (!notification.id) {
//         console.error("Notification must have an 'id' to be stored in IndexedDB.");
//         return;
//     }

//     console.log('--- INDEXEDDB STORING PROCESS ---');
//     console.log('indexedDBService: storeUnseenNotification called with notification:');
//     console.log(notification);
//     console.log('indexedDBService: Notification ID before transaction:', notification.id); // Log ID *before* transaction


//     const db = await getDB(userEmail);
//     console.log('indexedDBService: getDB result:', db);

//     const tx = db.transaction(NOTIFICATION_STORE_NAME, 'readwrite');
//     const store = tx.objectStore(NOTIFICATION_STORE_NAME);

//     let encryptedNotification: string; // Declare outside try block

//     try {
//         console.log('indexedDBService: Starting encryption *inside* transaction...'); // Log before encryption
//         encryptedNotification = encryptNotification(notification); // **ENCRYPT *INSIDE* TRANSACTION**
//         console.log('indexedDBService: Encryption complete *inside* transaction.'); // Log after encryption

//         console.log('indexedDBService: After encryption (inside transaction), about to put into store. Encrypted notification:');
//         console.log(encryptedNotification);
//         console.log('indexedDBService: Notification ID right before put (inside transaction):', notification.id);


//         await store.put(encryptedNotification); // Put *encrypted* notification

//         console.log('indexedDBService: store.put() completed SUCCESSFULLY (inside transaction)');
//         await tx.done; // Wait for transaction to complete *inside* try block
//         console.log('indexedDBService: Transaction completed SUCCESSFULLY');


//     } catch (error) {
//         console.error('indexedDBService: Error during transaction or store.put():', error);
//         tx.abort(); // Abort transaction on error
//         throw error; // Re-throw the error
//     } finally {
//         console.log('--- INDEXEDDB STORING PROCESS END ---');
//     }

// };

// export const getUnseenNotifications = async (userEmail: string): Promise<SSENotification[]> => {
//     const db = await getDB(userEmail); // Pass userEmail to getDB
//     const tx = db.transaction(NOTIFICATION_STORE_NAME, 'readonly');
//     const store = tx.objectStore(NOTIFICATION_STORE_NAME);
//     const encryptedNotifications: string[] = await store.getAll(); // Get all encrypted strings
//     return encryptedNotifications.map(encrypted => decryptNotification(encrypted)).filter(notif => notif !== null) as SSENotification[]; // Decrypt and filter out any decryption failures
// };

// export const removeUnseenNotification = async (userEmail: string, notificationId: SSENotification['id']) => {
//     if (!notificationId) {
//         console.error("Notification ID is required to remove from IndexedDB.");
//         return;
//     }
//     const db = await getDB(userEmail); // Pass userEmail to getDB
//     const tx = db.transaction(NOTIFICATION_STORE_NAME, 'readwrite');
//     const store = tx.objectStore(NOTIFICATION_STORE_NAME);
//     await store.delete(notificationId);
//     return tx.done;
// };

// export const clearAllUnseenNotifications = async (userEmail: string) => {
//     const db = await getDB(userEmail); // Pass userEmail to getDB
//     const tx = db.transaction(NOTIFICATION_STORE_NAME, 'readwrite');
//     const store = tx.objectStore(NOTIFICATION_STORE_NAME);
//     await store.clear();
//     return tx.done;
// };

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { SSENotification } from '../types/types';
import CryptoJS from 'crypto-js';

interface NotificationDB extends DBSchema {
    'unseen-notifications': {
        key: string; // Key is now the notification ID (string)
        value: string; // Encrypted notification string
    };
}

const DB_NAME = 'NotificationDatabase';
const NOTIFICATION_STORE_NAME = 'unseen-notifications';
const ENCRYPTION_KEY =  'default-secure-key'; // Use environment variable

// Track database instances per user
const dbPromises = new Map<string, Promise<IDBPDatabase<NotificationDB>>>();

const getDB = async (userEmail: string): Promise<IDBPDatabase<NotificationDB>> => {
    const dbNameWithUser = `${DB_NAME}-${userEmail}`;
    if (!dbPromises.has(dbNameWithUser)) {
        const promise = openDB<NotificationDB>(dbNameWithUser, 1, {
            upgrade(db) {
                // Create object store without keyPath
                const store = db.createObjectStore(NOTIFICATION_STORE_NAME);
                // Optional: Create an index if needed for querying by spaceId
                // store.createIndex('spaceId', 'spaceId');
            },
        });
        dbPromises.set(dbNameWithUser, promise);
    }
    return dbPromises.get(dbNameWithUser)!;
};

export const encryptNotification = (notification: SSENotification): string => {
    const notificationString = JSON.stringify(notification); // **Stringify FIRST**
    return CryptoJS.AES.encrypt(notificationString, ENCRYPTION_KEY).toString(); // Encrypt the JSON string
};

export const decryptNotification = (encryptedNotification: string): SSENotification | null => {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedNotification, ENCRYPTION_KEY);
        const decryptedString = bytes.toString(CryptoJS.enc.Utf8); // Decrypt back to a string
        if (!decryptedString) { // Check if decryption resulted in an empty string (decryption failure)
            console.error("Decryption failed: decrypted string is empty.");
            return null;
        }
        return JSON.parse(decryptedString); // **Parse JSON string back to object**
    } catch (error) {
        console.error("Decryption error:", error);
        return null;
    }
};

export const storeUnseenNotification = async (userEmail: string, notification: SSENotification) => {
    if (!notification.id) {
        console.error("Notification missing 'id'");
        return;
    }

    const db = await getDB(userEmail);
    const tx = db.transaction(NOTIFICATION_STORE_NAME, 'readwrite');
    const store = tx.objectStore(NOTIFICATION_STORE_NAME);

    try {
        const encrypted = encryptNotification(notification);
        // Store encrypted data with notification.id as the key
        await store.put(encrypted, notification.id);
        await tx.done;
    } catch (error) {
        console.error('Store error:', error);
        tx.abort();
        throw error;
    }
};

export const getUnseenNotifications = async (userEmail: string): Promise<SSENotification[]> => {
    const db = await getDB(userEmail);
    const tx = db.transaction(NOTIFICATION_STORE_NAME, 'readonly');
    const store = tx.objectStore(NOTIFICATION_STORE_NAME);
    const allEncrypted = await store.getAll();
    return allEncrypted
        .map(encrypted => decryptNotification(encrypted))
        .filter((notif): notif is SSENotification => notif !== null);
};

export const removeUnseenNotification = async (userEmail: string, notificationId: string) => {
    const db = await getDB(userEmail);
    const tx = db.transaction(NOTIFICATION_STORE_NAME, 'readwrite');
    const store = tx.objectStore(NOTIFICATION_STORE_NAME);
    await store.delete(notificationId);
    await tx.done;
};

export const clearAllUnseenNotifications = async (userEmail: string) => {
    console.log('clearing');
    
    const db = await getDB(userEmail);
    const tx = db.transaction(NOTIFICATION_STORE_NAME, 'readwrite');
    const store = tx.objectStore(NOTIFICATION_STORE_NAME);
    await store.clear();
    await tx.done;
};