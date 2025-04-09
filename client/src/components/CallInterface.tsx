import React, { useState, useEffect, useRef } from "react";
 import {
   LocalUser,
   RemoteUser,
   useIsConnected,
   useJoin,
   useLocalMicrophoneTrack,
   usePublish,
   useRemoteUsers,
   AgoraRTCProvider, // Make sure this is included in the import
   useLocalCameraTrack, // Import for video
 } from "agora-rtc-react";
 import AgoraRTC, { ClientConfig } from "agora-rtc-sdk-ng";
 import { useCallModal } from "../context/CallModalContext";
 import { initiateAudioCall } from "../utils/callController"; // Assuming this is still used
 import Cookies from 'js-cookie';
 import { acknowledgeAudioCallInitiation } from "../utils/callController"; // Assuming this is still used
 import axios from "axios";
 import { useSelector } from "react-redux";
 import { RootState } from "../redux/store";

 interface BasicsProps {
   appId: string;
   channel: string;
   token: string;
   onClose: () => void;
   callType: "audio" | "video" | null; // Receive callType as prop
 }

 const Basics = ({ appId, channel, token, onClose, callType }: BasicsProps) => {
  const [calling, setCalling] = useState(false);
  const [micOn, setMic] = useState(true);
  const userId = Cookies.get('userId');
  const isConnected = useIsConnected();
  const remoteUsers = useRemoteUsers();
  const [userDetails, setUserDetails] = useState<Record<string, string>>({});
  const { callID } = useCallModal(); // Get callID from context
  const folders = useSelector((state: RootState) => state.data.folders); // Access folders from Redux
  const [folderName, setFolderName] = useState<string | null>(null);
  const [spaceName, setSpaceName] = useState<string | null>(null);
  const [threadTopic, setThreadTopic] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragStartPos = useRef({ x: 0, y: 0 });
  const [cameraOn, setCameraOn] = useState(callType === 'video');
  const [tracksReady, setTracksReady] = useState(false);

  
  const { localMicrophoneTrack, ready: micReady, error: micError } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack, ready: cameraReady, error: cameraError } = useLocalCameraTrack(cameraOn); // Use local camera track

  // Log join details
  console.log("Joining with:", { appId, channel, token, uid: userId, calling, callType });
  useJoin({ appid: appId, channel, token, uid: userId }, calling);

  useEffect(() => {
    if (callID && folders.length > 0) {
      const [folderId, spaceId, threadId] = callID.split('-');
      const foundFolder = folders.find(folder => folder.id === folderId);
      if (foundFolder) {
        setFolderName(foundFolder.name);
        const foundSpace = foundFolder.spaces.find(space => space.id === spaceId);
        if (foundSpace) {
          setSpaceName(foundSpace.name);
          const foundThread = foundSpace.subThreads.find(thread => thread.id === threadId);
          if (foundThread) {
            setThreadTopic(foundThread.TOPIC);
          } else {
            setThreadTopic(`Thread ID: ${threadId}`);
          }
        } else {
          setSpaceName(`Space ID: ${spaceId}`);
          setThreadTopic(null);
        }
      } else {
        setFolderName(`Folder ID: ${folderId}`);
        setSpaceName(null);
        setThreadTopic(null);
      }
    } else {
      setFolderName(null);
      setSpaceName(null);
      setThreadTopic(null);
    }
  }, [callID, folders]);

  // Debug microphone track
  useEffect(() => {
    console.log("Mic Status - Ready:", micReady, "Track exists:", !!localMicrophoneTrack, "Enabled:", localMicrophoneTrack?.enabled, "Error:", micError?.message);
    if (localMicrophoneTrack) {
      console.log("Local track details:", localMicrophoneTrack);
    }
  }, [micReady, localMicrophoneTrack, micError]);

  // Debug camera track
  useEffect(() => {
    console.log("Camera Status - Ready:", cameraReady, "Track exists:", !!localCameraTrack, "Enabled:", localCameraTrack?.enabled, "Error:", cameraError?.message);
    if (localCameraTrack) {
      console.log("Local camera track details:", localCameraTrack);
    }
  }, [cameraReady, localCameraTrack, cameraError]);

  // Publish track
  usePublish(
    (callType === 'audio'
      ? [localMicrophoneTrack]
      : callType === 'video'
        ? [localMicrophoneTrack, localCameraTrack]
        : []
    ).filter((track): track is NonNullable<typeof track> => !!track)
  );

  useEffect(() => {
    const fetchParticipantDetails = async () => {
      try {
        const response = await axios.post('http://localhost:5000/api/users/details', {
          userIds: remoteUsers.map(user => user.uid)
        });

        const details = response.data.reduce((acc, user) => ({
          ...acc,
          [user._id]: user.name
        }), {});
        console.log(details, 'deta');
        console.log(remoteUsers,'remote');


        setUserDetails(details);
      } catch (error) {
        console.error('Error fetching participant details:', error);
      }
    };

    if (remoteUsers.length > 0) {
      fetchParticipantDetails();
    }
  }, [remoteUsers]);

  // Set calling state
  useEffect(() => {
    if (appId && channel && token) setCalling(true);
  }, [appId, channel, token]);

  useEffect(() => {
    if (isConnected && callID) {
      // Acknowledge call initiation based on the call type
      const acknowledgeEndpoint = callType === 'audio' ? 'audio-call-initiated-ack-thread' : 'video-call-initiated-ack-thread';
      axios.post(`http://localhost:5000/api/call/${acknowledgeEndpoint}`, { userId, callId: callID, callType: 'start' })
        .then(() => console.log(`${callType} call initiation acknowledged.`))
        .catch(error => console.error(`Error acknowledging ${callType} call initiation:`, error));
    }
  }, [isConnected, userId, callID, callType]);


  // Cleanup
  useEffect(() => {
    return () => {
      if (localMicrophoneTrack) {
        localMicrophoneTrack.stop();
        localMicrophoneTrack.close();
      }
      if (localCameraTrack) {
        localCameraTrack.stop();
        localCameraTrack.close();
      }
    };
  }, [localMicrophoneTrack, localCameraTrack]);

  const handleClose = async () => {
    setCalling(false);
    const endCallEndpoint = callType === 'audio' ? 'audio-call-ended' : 'video-call-ended';
    try {
      // Trigger the backend function to handle leaving/ending the call
      await axios.post(`http://localhost:5000/api/call/${endCallEndpoint}`, {
        callId: callID,
        userId: userId,
      });
      console.log(`Successfully notified backend about leaving/ending the ${callType} call.`);
    } catch (error) {
      console.error(`Error notifying backend about leaving/ending the ${callType} call:`, error);
      // Optionally handle the error, e.g., show a message to the user
    } finally {
      onClose(); // Close the modal after notifying the backend (or after error handling)
       // Ensure modal context is also updated
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    // Capture initial mouse position and current element position
    dragStartPos.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elementX: position.x,
      elementY: position.y,
    };
  };


  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !modalRef.current) return;

    // Calculate delta movement
    const deltaX = e.clientX - dragStartPos.current.mouseX;
    const deltaY = e.clientY - dragStartPos.current.mouseY;

    // Update position based on initial element position + delta
    setPosition({
      x: dragStartPos.current.elementX + deltaX,
      y: dragStartPos.current.elementY + deltaY,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  if (micError || cameraError) return <div>Error: {(micError || cameraError)?.message}</div>;

  return (
    <div className="fixed top-0 left-0 w-full h-full  bg-opacity-70 flex justify-center items-center z-50"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
     <div
  ref={modalRef}
  className="bg-gray-800 p-8 rounded-xl shadow-lg text-white w-96 max-w-full cursor-grab"
  style={{
    position: 'fixed',
    left: '50%',
    top: '50%',
    transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
    userSelect: isDragging ? 'none' : 'auto',
  }}
  onMouseDown={handleMouseDown}
  onMouseMove={handleMouseMove}
  onMouseUp={handleMouseUp}
  onMouseLeave={handleMouseLeave}
>
        <div className="flex items-center justify-between mb-4">
          <div>
            {folderName && <h4 className="text-sm text-gray-400 mb-1">Folder: {folderName}</h4>}
            {spaceName && <h5 className="text-md text-gray-300 mb-1">Space: {spaceName}</h5>}
            {threadTopic && <h3 className="text-lg font-semibold">{threadTopic}</h3>}
            {!folderName && !spaceName && !threadTopic && <h3 className="text-lg font-semibold">{callType === 'video' ? 'Video Call' : 'Audio Call'}</h3>}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-300 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {isConnected ? (
          <div>
            {callType === 'video' && (
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-blue-500 mb-3">
                <LocalUser videoTrack={localCameraTrack} audioTrack={localMicrophoneTrack} />
                <div className="absolute bottom-0 left-0 right-0 bg-gray-700 bg-opacity-50 p-1 text-center text-xs">You</div>
              </div>
            )}
            {callType === 'audio' && (
              <div className="flex items-center mb-3">
                <div className="rounded-full bg-gray-700 h-8 w-8 flex items-center justify-center mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <samp className="font-medium">You</samp>
              </div>
            )}

            <h4 className="text-sm text-gray-400 mt-4 mb-2">Participants:</h4>
            <ul className="space-y-2">
              {remoteUsers.length > 0 ? (
                remoteUsers.map(user => (
                  <li key={user.uid} className="flex items-center">
                    {callType === 'video' ? (
                      <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-green-500 mr-2">
                        <RemoteUser key={user.uid} uid={user.uid} videoTrack audioTrack />
                        <div className="absolute bottom-0 left-0 right-0 bg-gray-700 bg-opacity-50 p-1 text-center text-xs">
                          {userDetails[String(user.uid)] || `User ${String(user.uid).slice(-4)}`}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-full bg-gray-700 h-8 w-8 flex items-center justify-center mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <p className="text-gray-300">
                      {userDetails[String(user.uid)] || `User ${String(user.uid).slice(-4)}`}
                    </p>
                  </li>
                ))
              ) : (
                <p className="text-gray-500">No participants yet</p>
              )}
            </ul>

            <div className="mt-6 flex justify-around">
              <button
                onClick={() => setMic(prev => !prev)}
                className={`bg-gray-700 hover:bg-gray-600 text-white rounded-full p-3 focus:outline-none ${micOn ? '' : 'opacity-50'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={micOn ? "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" : "M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"} />
                </svg>
              </button>
              {callType === 'video' && (
  <button
    onClick={() => setCameraOn(prev => !prev)}
    className={`bg-gray-700 hover:bg-gray-600 text-white rounded-full p-3 focus:outline-none ${cameraOn ? '' : 'opacity-50'}`}
  >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cameraOn ? "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" : "M17.293 13.293A1 1 0 0117 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h5a1 1 0 01.707.293l7 7z"} />
                  </svg>
                </button>
              )}
              <button
                onClick={handleClose}
                className="bg-red-600 hover:bg-red-500 text-white rounded-full p-3 focus:outline-none"
              >
               End Call
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center h-32">
            <p className="text-gray-500 animate-pulse">Joining...</p>
          </div>
        )}
      </div>
    </div>
  );
};
 export const AgoraVoiceCalling = () => {
  const { isCallModalVisible, setIsCallModalVisible, callType, tokenID, channelName, setTokenID, callID } = useCallModal();
  const appId = import.meta.env.VITE_AGORA_APP_ID;
  const [client, setClient] = useState<AgoraRTC.Client | null>(null);

  const clientConfig: ClientConfig = {
    mode: "rtc",
    codec: "vp8",
  };

  useEffect(() => {
    if (isCallModalVisible) {
      // Create a new client instance when the modal opens
      const newClient = AgoraRTC.createClient(clientConfig);
      setClient(newClient);
    } else {
      // Cleanup client when the modal closes
      if (client) {
        client.leave().catch((err) => {
          console.log("Client leave error:", err);
        });
        client.removeAllListeners(); // Cleanup all listeners
        setClient(null);
      }
    }
  }, [isCallModalVisible]);

  return (
    <>
      {client && (
        <AgoraRTCProvider client={client}>
          {isCallModalVisible ? (
            callType === 'video' ? (
              <Basics
                appId={appId}
                channel={channelName}
                token={tokenID}
                onClose={() => setIsCallModalVisible(false)}
                callType={callType} // Pass callType to Basics
              />
            ) : (
              callType === 'audio' && channelName && appId && tokenID ? (
                <Basics
                  appId={appId}
                  channel={channelName}
                  token={tokenID}
                  onClose={() => setIsCallModalVisible(false)}
                  callType={callType} // Pass callType to Basics
                />
              ) : (
                <div>Loading call settings...</div>
              )
            )
          ) : null}
        </AgoraRTCProvider>
      )}
    </>
  );
};
 export default AgoraVoiceCalling;