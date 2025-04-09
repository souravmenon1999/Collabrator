const { google } = require('googleapis');
const User = require('../models/userModel'); // Import your User model
 require('dotenv').config();

 const oauth2Client = new google.auth.OAuth2(
     process.env.GOOGLE_CLIENT_ID,
     process.env.GOOGLE_CLIENT_SECRET,
     process.env.GOOGLE_REDIRECT_URI
 );

 const getAuthUrl = (userId, taskId) => {
     return oauth2Client.generateAuthUrl({
         access_type: 'offline',
         scope: ['https://www.googleapis.com/auth/calendar.events'],
         state: JSON.stringify({ userId, taskId })
     });
 };

 const getTokens = async (code) => {
     const { tokens } = await oauth2Client.getToken(code);
     
     return tokens;
 };

 const addTaskToCalendar = async (user, task) => { // Accept 'task' object
    console.log('addTaskToCalendar: START - DEBUG LOGS FOLLOW');  // *** DEBUG LOG START ***
    try {
        console.log("addTaskToCalendar: user.googleAccessToken:", user.googleAccessToken); // *** DEBUG LOG ***

        const freshOauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
        freshOauth2Client.setCredentials({ access_token: user.googleAccessToken });
        const calendar = google.calendar({ version: 'v3', auth: freshOauth2Client });

        const currentTime = new Date(); // Get current time
        const taskDueDate = task.DUEDATE ? new Date(task.DUEDATE) : currentTime; // Use task's DUEDATE
        const startTime = currentTime; // Start at current time

        const event = {
            summary: task.TITLE, // Use task title from the 'task' object
            description: task.DESCRIPTION, // Use task description from the 'task' object
            start: { dateTime: startTime }, // Start at current time
            end: { dateTime: taskDueDate }     // End at task's DUEDATE
        };

console.log('event', event);

        await calendar.events.insert({
            calendarId: 'primary',
            resource: event
        });
        console.log('Google Calendar event created');
    } catch (error) {
        console.error('addTaskToCalendar: Error adding event to Google Calendar - ERROR:', error); // *** DEBUG LOG ***
        console.log('addTaskToCalendar: Error Code:', error.code); // *** ADDED LOG ***
        console.log('addTaskToCalendar: Error Message:', error.message); // *** ADDED LOG ***
        if (error.code === 401 && (error.message.includes('invalid_token') || error.message.includes('expired') || error.message.includes('Invalid Credentials'))) {
            console.log("addTaskToCalendar: Access token is likely invalid or expired, attempting to refresh.");
            try {
                oauth2Client.setCredentials({ refresh_token: user.googleRefreshToken }); // Set refresh token
                const refreshedTokens = await oauth2Client.refreshAccessToken();
                user.googleAccessToken = refreshedTokens.credentials.access_token;
                await User.findByIdAndUpdate(user._id, { googleAccessToken: user.googleAccessToken }); // Update in DB
                console.log("addTaskToCalendar: Access token refreshed successfully.");
                await addTaskToCalendar(user, task); // Retry adding the event, pass the task
                return; // Exit this attempt after successful refresh and retry
            } catch (refreshError) {
                console.error("addTaskToCalendar: Error refreshing access token:", refreshError);
                throw refreshError; // Re-throw the refresh error
            }
        } else {
            console.error('addTaskToCalendar: General error adding event to Google Calendar:', error); // *** DEBUG LOG ***
            throw error;
        }
    }
    console.log('addTaskToCalendar: FINISHED - DEBUG LOGS END'); // *** DEBUG LOG END ***
};

 module.exports = {
     getAuthUrl,
     getTokens,
     addTaskToCalendar,
 };