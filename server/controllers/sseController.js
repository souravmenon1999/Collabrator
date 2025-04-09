// controllers/sseController.js
const activeSseClients = new Map(); // Store active SSE clients (email -> array of response objects)

/**
 * Establishes an SSE connection for a user, identified by email in query params.
 *
 * Endpoint: /sse?email=user@example.com
 * MUST be accessed by authenticated users (ensure authentication middleware is in place).
 */
const sseEndpoint = (req, res) => {
    // SSE setup headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const email = req.query.email; // Get email from query parameters

    if (!email) {
        console.error('SSE connection attempt without email in query parameters.');
        return res.status(400).send('Email is required in query parameters for SSE connection.');
    }

    // **Modified: Use email as the key in activeSseClients**
    if (activeSseClients.has(email)) {
        // User already has active connections, append to the existing array
        activeSseClients.get(email).push(res);
    } else {
        // First connection for this user (email), create a new array with the response
        activeSseClients.set(email, [res]);
    }

    console.log(`SSE connection opened for email: ${email}`);
    console.log(`Active SSE clients for email ${email}: ${activeSseClients.get(email).length}`);
    console.log(`Total active users (via SSE): ${activeSseClients.size}`);

    // Send a connection confirmation event (optional)
    res.write(`data: ${JSON.stringify({ message: 'SSE connection established', timestamp: new Date().toISOString() })}\n\n`);


    

    req.on('close', () => {
        // **Modified: Remove specific response based on email**
        if (activeSseClients.has(email)) {
            const userResponses = activeSseClients.get(email);
            const updatedResponses = userResponses.filter(response => response !== res); // Filter out the closing response

            if (updatedResponses.length > 0) {
                activeSseClients.set(email, updatedResponses); // Update with filtered array
            } else {
                activeSseClients.delete(email); // Remove user (email) if no connections left
            }
            console.log(`SSE client disconnected: Email ${email}`);
            console.log(`Active SSE clients for email ${email} remaining: ${activeSseClients.get(email)?.length || 0}`);
            console.log(`Total active users (via SSE) remaining: ${activeSseClients.size}`);
        }
    });
};

/**
 * Sends an SSE notification to a specific user identified by email.
 *
 * @param {string} userEmail - The email of the user to send the notification to.
 * @param {object} notificationData - The notification payload.
 * @returns {boolean} - True if sent via SSE, false if user not online via SSE.
 */
const sendSseNotification = (userEmail, notificationData) => {
    const userResponses = activeSseClients.get(userEmail); // **Get array of responses using email**

    if (userResponses && userResponses.length > 0) { // **Check if array exists and is not empty**
        userResponses.forEach(res => { // **Iterate through array and send to each response**
            const eventData = JSON.stringify(notificationData);
            res.write(`data: ${eventData}\n\n`);
        });
        console.log(`SSE notification sent to email: ${userEmail} (to ${userResponses.length} devices)`);
        return true;
    } else {
        console.log(`Email ${userEmail} is not online via SSE (no active connections). Will fallback to push (FCM).`);
        return false;
    }
};

module.exports = {
    sseEndpoint,
    sendSseNotification,
    activeSseClients,
};