import React, { useEffect, useState } from 'react';

interface UpdateData {
  timestamp: string;
  message: string;
  value: number;
}

const CustomAlert: React.FC<{ data: UpdateData; onClose: () => void }> = ({ data, onClose }) => (
  <div className="fixed top-5 right-5 w-80 bg-white rounded-lg shadow-lg p-4 animate-fade-in">
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-lg font-semibold text-gray-800">New Update</h3>
      <button 
        onClick={onClose}
        className="text-gray-500 hover:text-gray-700 text-xl focus:outline-none"
      >
        ×
      </button>
    </div>
    <div className="space-y-2">
      <p className="text-gray-700">{data.message}</p>
      <p className="text-gray-700">Value: {data.value.toFixed(2)}</p>
      <p className="text-sm text-gray-500">
        {new Date(data.timestamp).toLocaleString()}
      </p>
    </div>
  </div>
);

const UpdateListener: React.FC<{ startListening: boolean }> = ({ startListening }) => {
  const [showPopup, setShowPopup] = useState(false);
  const [updateData, setUpdateData] = useState<UpdateData | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  useEffect(() => {
    if (startListening) {
      const newEventSource = new EventSource('http://localhost:5000/events');

      newEventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setUpdateData(data);
        setShowPopup(true);

        // Hide popup after 3 seconds
        setTimeout(() => {
          setShowPopup(false);
        }, 3000);
      };

      newEventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        newEventSource.close();
        setEventSource(null);
      };

      setEventSource(newEventSource);
    } else {
      if (eventSource) {
        eventSource.close();
        setEventSource(null);
      }
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [startListening]);

  return (
    <>
      {showPopup && updateData && (
        <CustomAlert data={updateData} onClose={() => setShowPopup(false)} />
      )}
    </>
  );
};

export default UpdateListener;
