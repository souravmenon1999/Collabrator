const { v4: uuidv4 } = require('uuid');
const { sendSseNotificationToThread } = require('./sseController');
const Thread = require('../models/subThreadModel').Thread;
const user = require('../models/userModel');
const sseController = require('./sseController');


const { RtcTokenBuilder, RtcRole } = require('agora-token');


// System cache to store active calls
const activeCalls = new Map(); // Key: `${folderId}-${spaceId}-${threadId}`, Value: callInfo

// Call log registry to store call details and participants
const callLogRegistry = new Map(); // Key: callId, Value: { threadId, folderId, spaceId, participants: [userIds] }


// const agoraAppId = '<Your App ID>';
// const agoraAppCertificate = '<Your App Certificate>';


const agoraAppId = process.env.AGORA_APP_ID;
const agoraAppCertificate = process.env.AGORA_APP_CERTIFICATE;

// Token Expiration Time (in seconds)
const currentTimestamp = Math.floor(Date.now() / 1000);
const expirationTime = currentTimestamp + 3600; // Valid for 1 hour


const notifyThreadMembersAboutCall = async (userId, callId, callType = 'audio') => {
  if (!userId || !callId) {
    console.error('Missing required parameters: userId or callId');
    return;
  }

  try {
    // Decode callId to extract folderId, spaceId, and threadId
    const parts = callId.split('-');
    if (parts.length < 3) {
      console.error('Invalid callId format. Expected at least folderId-spaceId-threadId.');
      return;
    }
    const [folderId, spaceId, threadId, ...rest] = parts; // Extract first three parts

    console.log('Decoded callId for notification:', { folderId, spaceId, threadId });

    // Fetch thread members from MongoDB
    const thread = await Thread.findById(threadId).populate('members', 'email'); // Assuming your Thread model has a 'members' field referencing Users
    if (!thread || !thread.members) {
      console.error(`Thread with ID ${threadId} not found or has no members.`);
      return;
    }
    const threadMembers = thread.members;
    console.log('Fetched thread members for notification:', threadMembers.map(member => member.email));

    // Get users currently in the call
    const callParticipants = activeCalls.get(callId) || callLogRegistry.get(callId)?.participants || [];
    console.log('Current call participants:', callParticipants);

    // Get online users (emails) from SSE controller
    const onlineUsers = new Set(sseController.activeSseClients.keys());
    console.log('Online users via SSE:', onlineUsers);

    // Construct notification data
    const notificationDataForUser = {
      callId: callId,
      callType: callType, // Include callType in the notification
    };

    // Send SSE notification to relevant thread members
    for (const member of threadMembers) {
      if (onlineUsers.has(member.email) && !callParticipants.includes(member._id.toString())) {
        const sseSent = sseController.sendSseNotification(member.email, {
          messageType: 'callNotification', // Generic call notification type
          ...notificationDataForUser,
        });

        if (sseSent) {
          console.log(`SSE notification sent successfully to ${member.email} for call ID: ${callId} (${callType})`);
        } else {
          console.error(`Failed to send SSE notification to ${member.email} for call ID: ${callId} (${callType})`);
        }
      } else {
        console.log(`Skipping notification for ${member.email}. Online: ${onlineUsers.has(member.email)}, In call: ${callParticipants.includes(member._id.toString())}`);
      }
    }

  } catch (error) {
    console.error('Error in notifyThreadMembersAboutCall:', error);
  }
};


const generateAgoraToken = (uid, channelName, role) => {
    console.log('app',agoraAppId,'certificatre',agoraAppCertificate);

    const HARDCODED_UID = "67e430afa5cf674a6571e421";
  const HARDCODED_CHANNEL = "new topic";

    if (!agoraAppId || !agoraAppCertificate) {
        console.error('Agora App ID or App Certificate not configured.');
        return null;
    }

    let roleToUse;
    switch (role) {
        case 'publisher':
            roleToUse = RtcRole.PUBLISHER;
            break;
        case 'subscriber':
            roleToUse = RtcRole.SUBSCRIBER;
            break;
        default:
            roleToUse = RtcRole.PUBLISHER; // Default to publisher
            break;
    }

    try {
        const token = RtcTokenBuilder.buildTokenWithUid(agoraAppId,agoraAppCertificate ,  channelName,
            uid,     // Hardcoded UID
            RtcRole.PUBLISHER,
            3600,3600);
        console.log('Generated Agora Token:', token, 'uid', uid);
        return token;
    } catch (error) {
        console.error('Error generating Agora token:', error);
        return null;
    }
};


const startAudioCallThread = async (req, res) => {
  console.log('started startAudioCallThread');

  const HARDCODED_UID = "67e430afa5cf674a6571e421";
  const { threadId, userId, folderId, spaceId, channelName, callType } = req.body;
  const callId = `${folderId}-${spaceId}-${threadId}`;
  const callKey = callId;
  console.log('callKey:', callKey);
  console.log('callId:', callId);

  if (!threadId || !userId || !folderId || !spaceId) {
      return res.status(400).json({ message: 'Missing required parameters.' });
  }

  let isExistingCall = false;

  // Check if an active call exists in this thread
  if (activeCalls.has(callId)) { // Use callId as the key here as well for consistency
      isExistingCall = true;
      console.log('Active audio call already exists with ID:', callId);
  } else {
      activeCalls.set(callId, [userId]); // Store the active users array with callId as key
      console.log('New audio call ID registered in activeCalls:', callId);
  }

  try {
      // Generate Agora token
      const agoraToken = generateAgoraToken(userId, channelName, 'publisher'); // Assuming initiator is a publisher

      if (agoraToken) {
          console.log('Successfully generated Agora token for audio call.');
          console.log('agoraToken:', agoraToken);
          console.log(userId);
          console.log(channelName);

          return res.status(isExistingCall ? 200 : 201).json({
              success: true,
              callId: callId,
              agoraToken: agoraToken,
              uid: userId // Return numeric UID (you need to generate/store this)
          });
      } else {
          console.error('Failed to generate Agora token for audio call.');
          return res.status(500).json({ message: 'Failed to generate Agora token for audio call.' });
      }
  } catch (error) {
      console.error('Error starting audio call:', error);
      return res.status(500).json({ message: 'Failed to start audio call.' });
  }
};

const startVideoCallThread = async (req, res) => {
  console.log('started startVideoCallThread');

  const HARDCODED_UID = "67e430afa5cf674a6571e421";
  const { threadId, userId, folderId, spaceId, channelName, callType } = req.body;
  const callId = `${folderId}-${spaceId}-${threadId}`;
  const callKey = callId;
  console.log('callKey:', callKey);
  console.log('callId:', callId);

  if (!threadId || !userId || !folderId || !spaceId) {
      return res.status(400).json({ message: 'Missing required parameters.' });
  }

  let isExistingCall = false;

  // Check if an active call exists in this thread
  if (activeCalls.has(callId)) { // Use callId as the key here as well for consistency
      isExistingCall = true;
      console.log('Active video call already exists with ID:', callId);
  } else {
      activeCalls.set(callId, [userId]); // Store the active users array with callId as key
      console.log('New video call ID registered in activeCalls:', callId);
  }

  try {
      // Generate Agora token
      const agoraToken = generateAgoraToken(userId, channelName, 'publisher'); // Assuming initiator is a publisher

      if (agoraToken) {
          console.log('Successfully generated Agora token for video call.');
          console.log('agoraToken:', agoraToken);
          console.log(userId);
          console.log(channelName);

          return res.status(isExistingCall ? 200 : 201).json({
              success: true,
              callId: callId,
              agoraToken: agoraToken,
              uid: userId // Return numeric UID (you need to generate/store this)
          });
      } else {
          console.error('Failed to generate Agora token for video call.');
          return res.status(500).json({ message: 'Failed to generate Agora token for video call.' });
      }
  } catch (error) {
      console.error('Error starting video call:', error);
      return res.status(500).json({ message: 'Failed to start video call.' });
  }
};

const audioCallInitiatedAckThread = async (req, res) => {
  const { callId, userId, callType } = req.body;
    // const notifyThreadMembersAboutCall = require('./path/to/your/notifyThreadMembersAboutCall'); // Adjust the path

    console.log('audio acknoelwdge triggered')

    if (!callId || !userId || !callType) {
        return res.status(400).json({ message: 'Missing required parameters for acknowledgement.' });
    }

    if (callType === 'start') {
      if (!callLogRegistry.has(callId)) {
          const parts = callId.split('-');
          if (parts.length < 3) {
              return res.status(400).json({ message: 'Invalid callId format. Expected at least folderId-spaceId-threadId.' });
          }
          const [folderId, spaceId, threadId, ...rest] = parts;
          callLogRegistry.set(callId, { threadId, folderId, spaceId, participants: [userId], callType: 'audio' });
          console.log('Audio call registered in callLogRegistry on start ack:', callLogRegistry);
      }

      if (!activeCalls.has(callId)) {
        activeCalls.set(callId, [userId]);
        console.log('Audio call registered in activeCalls on start ack:', activeCalls);
    } else {
        const activeUsers = activeCalls.get(callId);
        console.log('activeusers',activeUsers);
        if (!activeUsers.includes(userId)) {
            activeUsers.push(userId);
            activeCalls.set(callId, activeUsers);
            console.log('User added to existing active audio call on start ack:', activeCalls);
        }
    }

    try {
        await notifyThreadMembersAboutCall(userId, callId, 'audio');
        return res.json({ success: true, message: 'Audio start acknowledgement received and notification sent.' });
    } catch (error) {
        console.error('Error processing audio start acknowledgement:', error);
        return res.status(500).json({ message: 'Failed to process audio start acknowledgement.' });
    }
  } else if (callType === 'join') {
    if (!callLogRegistry.has(callId)) {
        return res.status(400).json({ message: `Audio call with ID ${callId} not found.` });
    }

    const callLog = callLogRegistry.get(callId);
    if (!callLog.participants.includes(userId)) {
        callLog.participants.push(userId);
        callLogRegistry.set(callId, callLog);
        console.log('User added to audio call log on join:', callLogRegistry);
    }

    if (activeCalls.has(callId)) {
        const activeUsers = activeCalls.get(callId);
        if (!activeUsers.includes(userId)) {
            activeUsers.push(userId);
            activeCalls.set(callId, activeUsers);
            console.log('User added to existing active audio call on join ack:', activeCalls);
        }
    } else {
        console.log('Active audio call not found for join acknowledgement:', callId);
        // Optionally, you might want to initialize active call here if it wasn't started properly
        // activeCalls.set(callId, [userId]);
    }

    return res.json({ success: true, message: 'Audio join acknowledgement received.' });
  } else {
    return res.status(400).json({ message: 'Invalid callType for acknowledgement. Expected "start" or "join".' });
  }
};

const videoCallInitiatedAckThread = async (req, res) => {
  const { callId, userId, callType } = req.body;
    // const notifyThreadMembersAboutCall = require('./path/to/your/notifyThreadMembersAboutCall'); // Adjust the path

    console.log('video acknoelwdge triggered')

    if (!callId || !userId || !callType) {
        return res.status(400).json({ message: 'Missing required parameters for acknowledgement.' });
    }

    if (callType === 'start') {
      if (!callLogRegistry.has(callId)) {
          const parts = callId.split('-');
          if (parts.length < 3) {
              return res.status(400).json({ message: 'Invalid callId format. Expected at least folderId-spaceId-threadId.' });
          }
          const [folderId, spaceId, threadId, ...rest] = parts;
          callLogRegistry.set(callId, { threadId, folderId, spaceId, participants: [userId], callType: 'video' });
          console.log('Video call registered in callLogRegistry on start ack:', callLogRegistry);
      }

      if (!activeCalls.has(callId)) {
        activeCalls.set(callId, [userId]);
        console.log('Video call registered in activeCalls on start ack:', activeCalls);
    } else {
        const activeUsers = activeCalls.get(callId);
        console.log('activeusers',activeUsers);
        if (!activeUsers.includes(userId)) {
            activeUsers.push(userId);
            activeCalls.set(callId, activeUsers);
            console.log('User added to existing active video call on start ack:', activeCalls);
        }
    }

    try {
        await notifyThreadMembersAboutCall(userId, callId, 'video');
        return res.json({ success: true, message: 'Video start acknowledgement received and notification sent.' });
    } catch (error) {
        console.error('Error processing video start acknowledgement:', error);
        return res.status(500).json({ message: 'Failed to process video start acknowledgement.' });
    }
  } else if (callType === 'join') {
    if (!callLogRegistry.has(callId)) {
        return res.status(400).json({ message: `Video call with ID ${callId} not found.` });
    }

    const callLog = callLogRegistry.get(callId);
    if (!callLog.participants.includes(userId)) {
        callLog.participants.push(userId);
        callLogRegistry.set(callId, callLog);
        console.log('User added to video call log on join:', callLogRegistry);
    }

    if (activeCalls.has(callId)) {
        const activeUsers = activeCalls.get(callId);
        if (!activeUsers.includes(userId)) {
            activeUsers.push(userId);
            activeCalls.set(callId, activeUsers);
            console.log('User added to existing active video call on join ack:', activeCalls);
        }
    } else {
        console.log('Active video call not found for join acknowledgement:', callId);
        // Optionally, you might want to initialize active call here if it wasn't started properly
        // activeCalls.set(callId, [userId]);
    }

    return res.json({ success: true, message: 'Video join acknowledgement received.' });
  } else {
    return res.status(400).json({ message: 'Invalid callType for acknowledgement. Expected "start" or "join".' });
  }
};

const audioCallEndedOrLeftThread = async (req, res) => {
  const { callId, userId
  } = req.body;

  if (!callId || !userId) {
      return res.status(400).json({ message: 'Missing required parameters: callId and userId.' });
  }

  console.log(`User ${userId} is leaving or ending audio call ${callId}`);

  // Handle user leaving
  if (activeCalls.has(callId)) {
      let activeUsers = activeCalls.get(callId);
      activeUsers = activeUsers.filter(uid => uid !== userId); // Remove the user

      if (activeUsers.length > 0) {
          activeCalls.set(callId, activeUsers);
          console.log(`User ${userId} removed from active audio call ${callId}. Remaining participants:`, activeUsers);
          return res.json({ success: true, message: `User ${userId} left the audio call.` });
      } else {
          // If no users are left, remove the call from active calls
          activeCalls.delete(callId);
          console.log(`Audio call ${callId} ended as the last participant (${userId}) left.`);

          // Optionally, you might want to update callLogRegistry to mark the call as ended
          if (callLogRegistry.has(callId)) {
              const callLog = callLogRegistry.get(callId);
              callLog.endTime = new Date();
              callLogRegistry.set(callId, callLog);
              console.log(`Audio call ${callId} end time recorded.`);
          }
console.log('audio call ended')
          return res.json({ success: true, message: `Audio call ${callId} ended as the last participant left.` });
      }
  } else {
      console.log(`Audio call with ID ${callId} not found in active calls.`);
      return res.status(404).json({ message: `Audio call with ID ${callId} not found.` });
  }
};

const videoCallEndedOrLeftThread = async (req, res) => {
  const { callId, userId
  } = req.body;

  if (!callId || !userId) {
      return res.status(400).json({ message: 'Missing required parameters: callId and userId.' });
  }

  console.log(`User ${userId} is leaving or ending video call ${callId}`);

  // Handle user leaving
  if (activeCalls.has(callId)) {
      let activeUsers = activeCalls.get(callId);
      activeUsers = activeUsers.filter(uid => uid !== userId); // Remove the user

      if (activeUsers.length > 0) {
          activeCalls.set(callId, activeUsers);
          console.log(`User ${userId} removed from active video call ${callId}. Remaining participants:`, activeUsers);
          return res.json({ success: true, message: `User ${userId} left the video call.` });
      } else {
          // If no users are left, remove the call from active calls
          activeCalls.delete(callId);
          console.log(`Video call ${callId} ended as the last participant (${userId}) left.`);

          // Optionally, you might want to update callLogRegistry to mark the call as ended
          if (callLogRegistry.has(callId)) {
              const callLog = callLogRegistry.get(callId);
              callLog.endTime = new Date();
              callLogRegistry.set(callId, callLog);
              console.log(`Video call ${callId} end time recorded.`);
          }
console.log('video call ended')
          return res.json({ success: true, message: `Video call ${callId} ended as the last participant left.` });
      }
  } else {
      console.log(`Video call with ID ${callId} not found in active calls.`);
      return res.status(404).json({ message: `Video call with ID ${callId} not found.` });
  }
};


module.exports = {
  startAudioCallThread,
  audioCallInitiatedAckThread,
  audioCallEndedOrLeftThread,
  startVideoCallThread,
  videoCallInitiatedAckThread,
  videoCallEndedOrLeftThread
};