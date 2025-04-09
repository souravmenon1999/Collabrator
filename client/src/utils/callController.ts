interface ThreadParams {
  folderId: string;
  spaceId: string;
  threadId: string;
  userId: string;
  channelName: string;
}

const initiateAudioCall = async (params: ThreadParams): Promise<{ success: boolean; callId?: string; message?: string, channelName?: string } | void> => {
  const { userId, threadId, folderId, spaceId, channelName } = params;
  console.log('Initiating audio call - u', userId, 't', threadId, 'f', folderId, spaceId);

  if (!userId || !threadId || !folderId || !spaceId || !channelName) {
    console.error('Missing required information to initiate audio call.');
    return;
  }

  try {
    const response = await fetch('http://localhost:5000/api/call/start-audio-call-thread', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        threadId,
        userId,
        folderId,
        spaceId,
        channelName,
      }),
    });

    const data = await response.json();

    if (data.success && data.callId) {
      console.log('Audio call initiation successful with callId:', data.callId);
      return { success: true, callId: data.callId, agoraToken: data.agoraToken };
    } else {
      console.error('Failed to initiate audio call:', data.message || 'Unknown error');
      return { success: false, message: data.message || 'Unknown error' };
    }
  } catch (error) {
    console.error('Error initiating audio call:', error);
    return { success: false, message: 'Network error during call initiation' };
  }
};

const initiateVideoCall = async (params: ThreadParams): Promise<{ success: boolean; callId?: string; message?: string, channelName?: string, agoraToken?: string } | void> => {
  const { userId, threadId, folderId, spaceId, channelName } = params;
  console.log('Initiating video call - u', userId, 't', threadId, 'f', folderId, spaceId);

  if (!userId || !threadId || !folderId || !spaceId || !channelName) {
    console.error('Missing required information to initiate video call.');
    return;
  }

  try {
    const response = await fetch('http://localhost:5000/api/call/start-video-call-thread', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        threadId,
        userId,
        folderId,
        spaceId,
        channelName,
      }),
    });

    const data = await response.json();

    if (data.success && data.callId) {
      console.log('Video call initiation successful with callId:', data.callId);
      return { success: true, callId: data.callId, agoraToken: data.agoraToken };
    } else {
      console.error('Failed to initiate video call:', data.message || 'Unknown error');
      return { success: false, message: data.message || 'Unknown error' };
    }
  } catch (error) {
    console.error('Error initiating video call:', error);
    return { success: false, message: 'Network error during call initiation' };
  }
};


const acknowledgeAudioCallInitiation = async (params: { userId?: string; callId?: string, callType: string, }) => {
  const { userId, callId, callType } = params
  console.log('Acknowledging audio call initiation - userId', userId, 'callId', callId);

  if (!userId || !callId) {
    console.error('Missing required information to acknowledge audio call initiation.');
    return;
  }

  try {
    const response = await fetch('http://localhost:5000/api/call/audio-call-initiated-ack-thread', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        callId: callId,
        callType: "start"
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('Audio call initiation acknowledgement successful.');
    } else {
      console.error('Failed to acknowledge audio call initiation:', data.message || 'Unknown error');
      // Optionally handle error state for acknowledgement
    }
  } catch (error) {
    console.error('Error acknowledging audio call initiation:', error);
    // Optionally handle network error for acknowledgement
  }
};


const acknowledgeVideoCallInitiation = async (params: { userId?: string; callId?: string, callType: string, }) => {
  const { userId, callId, callType } = params
  console.log('Acknowledging video call initiation - userId', userId, 'callId', callId);

  if (!userId || !callId) {
    console.error('Missing required information to acknowledge video call initiation.');
    return;
  }

  try {
    const response = await fetch('http://localhost:5000/api/call/video-call-initiated-ack-thread', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        callId: callId,
        callType: "start"
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('Video call initiation acknowledgement successful.');
    } else {
      console.error('Failed to acknowledge video call initiation:', data.message || 'Unknown error');
      // Optionally handle error state for acknowledgement
    }
  } catch (error) {
    console.error('Error acknowledging video call initiation:', error);
    // Optionally handle network error for acknowledgement
  }
};

export { initiateAudioCall, acknowledgeAudioCallInitiation, initiateVideoCall, acknowledgeVideoCallInitiation };