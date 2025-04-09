// services/googleAuthService.js
const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const googleScopes = [
    'https://www.googleapis.com/auth/calendar', // Google Calendar scope (You had this - may or may not be needed for Chat feature)
    'https://www.googleapis.com/auth/chat.messages', // Google Chat API scope - For sending/reading messages
    'https://www.googleapis.com/auth/chat.spaces',       // **REQUIRED:** For creating and managing Google Chat Spaces
     // **REQUIRED:** For adding members to Google Chat Spaces
];

const generateAuthUrl = (userId) => {
    console.log('google auth service');
    
    return oauth2Client.generateAuthUrl({
        access_type: 'offline', // To get refresh token
        scope: googleScopes,
        state: JSON.stringify({ userId }) // Include userId in state to identify user after callback
    });
};

const getGoogleTokens = async (code) => {
    try {
        const { tokens } = await oauth2Client.getToken(code);
        return tokens;
    } catch (error) {
        console.error('Error exchanging code for tokens:', error);
        throw new Error('Failed to retrieve Google tokens.');
    }
};

module.exports = {
    generateAuthUrl,
    getGoogleTokens,
};