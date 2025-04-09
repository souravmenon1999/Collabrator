const express = require('express');
const router = express.Router();
const folderController = require('../controllers/folderController'); // Import controller
const spaceController = require('../controllers/spaceController'); // Import controller
const topicController = require('../controllers/topicController')
const taskController = require('../controllers/taskController')
const userController = require('../controllers/userController');
const sseController = require('../controllers/sseController')
const notificationController = require('../controllers/notificationController'); // <-- Import notification controller (already should be there)
const callController = require('../controllers/callController');


// Notification routes  <-- Notification route (already should be there)
router.post('/notifications/markAsRead', notificationController.markNotificationsAsRead);


//auth Routes
router.post('/auth/signup', userController.signup);
router.post('/auth/login', userController.login); // Add login route
router.post('/auth/fcm-device-token', userController.storeFcmDeviceToken); // Route with email as parameter
router.post('/users/details', userController.getUsersDetails);

// Call Routes (New and Updated)
router.post('/call/start-audio-call-thread', callController.startAudioCallThread);
router.post('/call/start-video-call-thread', callController.startVideoCallThread); // New route for video call start

router.post('/call/audio-call-initiated-ack-thread', callController.audioCallInitiatedAckThread);
router.post('/call/video-call-initiated-ack-thread', callController.videoCallInitiatedAckThread); // New route for video call ack

router.post('/call/audio-call-ended', callController.audioCallEndedOrLeftThread); // New route
router.post('/call/video-call-ended', callController.videoCallEndedOrLeftThread); // New route for video call end
// sse routes
router.get('/sse', sseController.sseEndpoint); // <--  **INSECURE - NO AUTHENTICATION**



// Create new folder
router.post('/folders', folderController.createFolder);
 // <-- **CRITICAL: Define DELETE route here**


// Get all folders for a user (example)
router.get('/folders', folderController.getUserFolders);
router.delete('/folders/:folderId', folderController.deleteFolder); // <-- Added '/' at the beginning
router.put('/folders/:folderId', folderController.updateFolder); // <-- **ADD PUT ROUTE for updateFolder**

// Space routes
router.post('/spaces', spaceController.createSpace); // Route for creating spaces
router.get('/spaces/:spaceId/members', spaceController.getSpaceMembers); // <-- New route to get space members

router.get('/spaces/:spaceId', spaceController.getSpace); // Example route to get a space by ID
router.get('/spaces/:spaceId/members', spaceController.getSpaceMembers); // <-- New route to get space members
router.put('/spaces/:spaceId', spaceController.updateSpace); // <-- Add this PUT route for updating a space
router.delete('/spaces/:spaceId', spaceController.deleteSpace); // <-- Add DELETE route for deleting a space
router.post('/spaces/users', taskController.getUsersFromSpaces); // Changed to POST and removed :spaceIds param


// topic Routes
router.post('/topics/add', topicController.addTopic); // POST request to /api/topics will be handled by addTopic controller
router.put('/topics/:topicId', topicController.updateTopic); // **ADD THIS ROUTE for updating topic**


//task Routes

router.post('/tasks',taskController.createTask)
router.put('/tasks/:taskId', taskController.updateTask);
router.delete('/topics/:topicId', topicController.deleteTopic); // **ADD THIS ROUTE for deleting topic**



router.get('/google/callback', taskController.handleGoogleCallback);
router.get('/google-callback', userController.googleCallback); // Google callback route



// Route to get all users for the dropdown
router.get('/users', userController.getAllUsers); // <--- Add this line
router.post('/users/details', userController.getUsersDetails);

// ... other folder routes (GET, PUT, DELETE for folders) ...

module.exports = router;