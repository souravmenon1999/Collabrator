import React, { createContext, useState, useContext, ReactNode, Dispatch, SetStateAction, useEffect } from 'react';

interface CallModalContextType {
  isCallModalVisible: boolean;
  setIsCallModalVisible: Dispatch<SetStateAction<boolean>>;
  callType: 'audio' | 'video' | null;
  setCallType: Dispatch<SetStateAction<'audio' | 'video' | null>>;
  tokenID: string | null;
  setTokenID: Dispatch<SetStateAction<string | null>>;
  channelName: string | null;
  setChannelName: Dispatch<SetStateAction<string | null>>;
  setCallID: Dispatch<SetStateAction<string | null>>;
  callID: string | null;
}

const CallModalContext = createContext<CallModalContextType | undefined>(undefined);

interface CallModalProviderProps {
  children: ReactNode;
}

export const CallModalProvider: React.FC<CallModalProviderProps> = ({ children }) => {
  const [isCallModalVisible, setIsCallModalVisible] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video' | null>(null);
  const [tokenID, setTokenID] = useState<string | null>(null);
  const [channelName, setChannelName] = useState<string | null>(null);
  const [callID, setCallID] = useState<string | null>(null);

  useEffect(() =>{
    console.log(channelName, 'channelName');
    
  },[channelName])

  return (
    <CallModalContext.Provider value={{ isCallModalVisible, setIsCallModalVisible, callType, setCallType, tokenID, setTokenID,  channelName,
      setChannelName, callID, setCallID }}>
      {children}
    </CallModalContext.Provider>
  );
};

export const useCallModal = () => {
  const context = useContext(CallModalContext);
  if (!context) {
    throw new Error('useCallModal must be used within a CallModalProvider');
  }
  return context;
};