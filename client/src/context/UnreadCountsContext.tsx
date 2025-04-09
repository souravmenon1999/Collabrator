import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, setDoc, getDocs } from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore'; // Import onSnapshot
import Cookies from 'js-cookie';
import { useSelector } from 'react-redux'; // Assuming you use Redux for space/folder data

interface UnreadCountsState {
  [subthreadId: string]: number;
}

interface TotalUnreadCountsForSpaces {
  [spaceId: string]: number;
}

interface UnreadCountsContextProps {
  unreadCounts: UnreadCountsState;
  totalUnreadCountsForSpaces: TotalUnreadCountsForSpaces;
  incrementUnread: (subthreadId: string) => Promise<void>;
  resetUnread: (subthreadId: string) => Promise<void>;
}

const UnreadCountsContext = createContext<UnreadCountsContextProps | undefined>(undefined);

interface UnreadCountsProviderProps {
  children: ReactNode;
}

export const UnreadCountsProvider: React.FC<UnreadCountsProviderProps> = ({ children }) => {
  const [unreadCounts, setUnreadCounts] = useState<UnreadCountsState>({});
  const [totalUnreadCountsForSpaces, setTotalUnreadCountsForSpaces] = useState<TotalUnreadCountsForSpaces>({});
  const userId = Cookies.get('userId');
  const folders = useSelector((state: any) => state.data.folders); // Access your folder/space data from Redux

  const fetchInitialUnreadCounts = useCallback(async () => {
    console.log(userId);
    
    if (!userId) return;
    const userUnreadDocRef = doc(db, 'user-unread-counts', userId);
    const docSnap = await getDoc(userUnreadDocRef);
    console.log(docSnap.data());
    
    console.log(docSnap.data.data);
    
    if (docSnap.exists()) {
      console.log('exists');
      
      setUnreadCounts(docSnap.data());
      console.log('setted');
      

      
      console.log(unreadCounts);
      
    } else {
      await setDoc(userUnreadDocRef, {});
      setUnreadCounts({});
    }
    const data = docSnap.data()
    setUnreadCounts(data);
    console.log(unreadCounts);
    

  }, [userId]);

  useEffect(() => {
    console.log('fected');
    
    fetchInitialUnreadCounts();
  }, [fetchInitialUnreadCounts]);

  useEffect(() => {
    if (!userId) return;
    const userUnreadDocRef = doc(db, 'user-unread-counts', userId);
    const unsubscribe = onSnapshot(userUnreadDocRef, (docSnap) => { // Use onSnapshot function here
      if (docSnap.exists()) {
        const data = docSnap.data() ;

        console.log('came');
        console.log(data);
        
        setUnreadCounts(data);
        console.log(unreadCounts);
        

      } 
    });
    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    const calculateTotalUnread = () => {
      const totals: TotalUnreadCountsForSpaces = {};
      if (folders && unreadCounts) {
        folders.forEach((folder) => {
          folder.spaces.forEach((space) => {
            let spaceTotal = 0;
            space.subThreads.forEach((thread) => {
              spaceTotal += unreadCounts[thread.id] || 0;
            });
            totals[space.id] = spaceTotal;
          });
        });
        setTotalUnreadCountsForSpaces(totals);
        console.log('spaces', totalUnreadCountsForSpaces)
      }
    };

    calculateTotalUnread();
    console.log('spaces', totalUnreadCountsForSpaces)


  }, [unreadCounts, folders]);

  const incrementUnread = useCallback(async (subthreadId: string, recipientId: string) => {
    if (!recipientId) return;
    console.log('updating read count for user:', recipientId, 'thread:', subthreadId);
    const userUnreadDocRef = doc(db, 'user-unread-counts', recipientId);
    await updateDoc(userUnreadDocRef, {
        [`${subthreadId}`]: (await getDoc(userUnreadDocRef)).data()?.[subthreadId] + 1 || 1,
    }, { merge: true });
},);

  const resetUnread = useCallback(async (subthreadId: string) => {
    if (!userId) return;
    setUnreadCounts((prevCounts) => ({
      ...prevCounts,
      [subthreadId]: 0,
    }));
    const userUnreadDocRef = doc(db, 'user-unread-counts', userId);
    await updateDoc(userUnreadDocRef, {
      [`${subthreadId}`]: 0,
    }, { merge: true });
  }, [userId]);

  const value: UnreadCountsContextProps = {
    unreadCounts,
    totalUnreadCountsForSpaces,
    incrementUnread,
    resetUnread,
  };

  return (
    <UnreadCountsContext.Provider value={value}>
      {children}
    </UnreadCountsContext.Provider>
  );
};

export const useUnreadCounts = () => {
  const context = useContext(UnreadCountsContext);
  if (!context) {
    throw new Error("useUnreadCounts must be used within a UnreadCountsProvider");
  }
  return context;
};