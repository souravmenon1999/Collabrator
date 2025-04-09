// services/googleChatService.js
const axios = require('axios');

const createGoogleChatSpace = async (accessToken, spaceName) => {
    try {
        const response = await axios.post(
            'https://chat.googleapis.com/v1/spaces',
            {
                displayName: spaceName,
                spaceType: 'SPACE' // Or 'ROOM' if you want a named group chat
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data; // Returns the created space object from Google Chat API

    } catch (error) {
        console.error("Error creating Google Chat Space:", error.response ? error.response.data : error.message);
        throw new Error(`Failed to create Google Chat Space: ${error.response ? error.response.data.error.message : error.message}`); // Re-throw for controller to handle
    }
};

module.exports = {
    createGoogleChatSpace,
    // ... you can add other Google Chat API functions here later
};