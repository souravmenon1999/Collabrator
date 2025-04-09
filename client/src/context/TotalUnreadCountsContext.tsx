// import React, { createContext, useState, useContext, ReactNode } from 'react';

// interface TotalUnreadCounts {
//   [spaceId: string]: number; // Space ID to Total Unread Count
// }

// interface TotalUnreadCountsContextProps {
//   totalUnreadCountsForSpaces: TotalUnreadCounts;
//   setTotalUnreadCountsForSpaces: React.Dispatch<React.SetStateAction<TotalUnreadCounts>>;
// }

// const TotalUnreadCountsContext = createContext<TotalUnreadCountsContextProps | undefined>(undefined);

// interface TotalUnreadCountsProviderProps {
//   children: ReactNode;
// }

// export const TotalUnreadCountsProvider: React.FC<TotalUnreadCountsProviderProps> = ({ children }) => {
//   const [totalUnreadCountsForSpaces, setTotalUnreadCountsForSpaces] = useState<TotalUnreadCounts>({});

//   const value: TotalUnreadCountsContextProps = {
//     totalUnreadCountsForSpaces,
//     setTotalUnreadCountsForSpaces,
//   };

//   return (
//     <TotalUnreadCountsContext.Provider value={value}>
//       {children}
//     </TotalUnreadCountsContext.Provider>
//   );
// };

// export const useTotalUnreadCounts = () => {
//   const context = useContext(TotalUnreadCountsContext);
//   if (!context) {
//     throw new Error("useTotalUnreadCounts must be used within a TotalUnreadCountsProvider");
//   }
//   return context;
// };

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { db } from '../firebaseConfig'; // Import your Firebase config (adjust path if needed)
import { Folder } from '../spaceInterface'; // Import your Folder interface (adjust path if needed)
import Cookies from 'js-cookie';
import { getDocs, collection, query, getDoc, doc, orderBy, startAfter } from 'firebase/firestore';


interface TotalUnreadCounts {
    [spaceId: string]: number | undefined; // Space ID to Total Unread Count, can be undefined initially (loading)
}

interface TotalUnreadCountsContextProps {
    totalUnreadCountsForSpaces: TotalUnreadCounts;
    setTotalUnreadCountsForSpaces: React.Dispatch<React.SetStateAction<TotalUnreadCounts>>;
    isTotalUnreadCountsLoading: boolean; // Loading state
    initializeTotalUnreadCountsForFolders: (folders: Folder[]) => Promise<void>; // Function to initialize counts
}

const TotalUnreadCountsContext = createContext<TotalUnreadCountsContextProps | undefined>(undefined);

interface TotalUnreadCountsProviderProps {
    children: ReactNode;
    folders: Folder[]; // Expect folders data to be passed to the Provider
}

const getUnreadMessageCount = async (threadId: string, currentUserId: string): Promise<number> => { // **Keep getUnreadMessageCount here in context for convenience**
    if (!threadId || !currentUserId) return 0;

    try {
        const readStatusDocRef = doc(db, `thread-messages/${threadId}/read-status`, currentUserId);
        const readStatusDocSnap = await getDoc(readStatusDocRef);
        const lastReadTimestamp = readStatusDocSnap.exists() ? readStatusDocSnap.data().lastReadTimestamp : null;

        let q = collection(db, `thread-messages/${threadId}/messages`);
        if (lastReadTimestamp) {
            q = query(q, orderBy('createdAt'), startAfter(lastReadTimestamp));
        }

        const messagesSnapshot = await getDocs(q);
        return messagesSnapshot.size;

    } catch (error) {
        console.error("Error fetching unread message count:", error);
        return 0;
    }
};


export const TotalUnreadCountsProvider: React.FC<TotalUnreadCountsProviderProps> = ({ children, folders }) => {
    const [totalUnreadCountsForSpaces, setTotalUnreadCountsForSpaces] = useState<TotalUnreadCounts>({}); // Initialize as empty object
    const [isTotalUnreadCountsLoading, setIsTotalUnreadCountsLoading] = useState<boolean>(true); // Initial loading state

    const userId = Cookies.get('userId'); // Get userId here to be accessible in the provider

    const initializeTotalUnreadCountsForFolders = async (foldersData: Folder[]) => {
        if (!userId) {
            setIsTotalUnreadCountsLoading(false); // Not logged in, stop loading
            return;
        }
        setIsTotalUnreadCountsLoading(true); // Start loading
        const initialCounts: TotalUnreadCounts = {};

        for (const folder of foldersData) { // Iterate over folders
            for (const space of folder.spaces) { // Iterate over spaces in each folder
                let totalSpaceCount = 0;
                if (space.subThreads && space.subThreads.length > 0) {
                    for (const thread of space.subThreads) { // Iterate over subthreads in each space
                        const unreadCount = await getUnreadMessageCount(thread.id, userId);
                        totalSpaceCount += unreadCount;
                    }
                }
                initialCounts[space.id] = totalSpaceCount; // Store total for space
            }
        }
        setTotalUnreadCountsForSpaces(initialCounts); // Update context state with initial counts
        setIsTotalUnreadCountsLoading(false); // Stop loading
    };


    useEffect(() => {
        if (folders && userId) {
            initializeTotalUnreadCountsForFolders(folders); // Call initializer when folders or userId changes
        } else {
            setTotalUnreadCountsForSpaces({}); // Clear counts if no folders or user
            setIsTotalUnreadCountsLoading(false);
        }
    }, [folders, userId]);


    const value: TotalUnreadCountsContextProps = {
        totalUnreadCountsForSpaces,
        setTotalUnreadCountsForSpaces,
        isTotalUnreadCountsLoading,
        initializeTotalUnreadCountsForFolders,
    };

    return (
        <TotalUnreadCountsContext.Provider value={value}>
            {children}
        </TotalUnreadCountsContext.Provider>
    );
};

export const useTotalUnreadCounts = () => {
    const context = useContext(TotalUnreadCountsContext);
    if (!context) {
        throw new Error("useTotalUnreadCounts must be used within a TotalUnreadCountsProvider");
    }
    return context;
};