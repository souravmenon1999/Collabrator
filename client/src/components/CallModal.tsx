import React, { useEffect } from 'react';
import { useCallModal } from '../contexts/CallModalContext';

interface CallModalProps {
  // You might want to pass additional props here if needed
}

const CallModal: React.FC<CallModalProps> = ({}) => {
  const { isCallModalVisible, setIsCallModalVisible, callType } = useCallModal();

  useEffect(() => {
    if (isCallModalVisible && callType) {
      console.log(`Call Modal is visible for a ${callType} call.`);
      // Here you would potentially fetch more call details or update UI based on callType
    }
  }, [isCallModalVisible, callType]);

  if (!isCallModalVisible) {
    return null;
  }

  let modalContent: React.ReactNode = null;

  if (callType === 'audio') {
    modalContent = <div>Initiating Audio Call...</div>;
  } else if (callType === 'video') {
    modalContent = <div>Initiating Video Call...</div>;
  } else {
    modalContent = <div>Something is happening...</div>; // Initial or fallback state
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        padding: '20px',
        border: '1px solid #ccc',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        zIndex: 1000, // Ensure it's on top
      }}
    >
      {modalContent}
      <button onClick={() => setIsCallModalVisible(false)}>Close</button> {/* For testing/closing */}
      {/* You will likely have more UI elements here */}
    </div>
  );
};

export default CallModal;