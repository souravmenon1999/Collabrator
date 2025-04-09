// services/sseService.ts (or sseService.ts)

interface SSENotification { // Define interface for your notification data (same as before)
    messageType: string;
    taskTitle?: string;
    taskDescription?: string;
    dueDate?: string;
    spaceId: string;
    seen: boolean; // Add a 'seen' property, initially set to false
    id?: string | number;
}

const activeEventSource: { current: EventSource | null } = { current: null }; // Use a ref-like object to hold EventSource instance globally

let notificationHandler: ((notification: SSENotification) => void) | null = null; // Function to handle notifications

export const setupSSEConnection = (userEmail: string) => {
    if (!userEmail) {
        console.warn("Cannot setup SSE connection: No user email provided.");
        return;
    }

    if (activeEventSource.current) {
        console.warn("SSE connection already exists. Closing existing connection and creating a new one.");
        activeEventSource.current.close(); // Close existing connection if any
        activeEventSource.current = null;
    }

    const sseUrl = `http://localhost:5000/api/sse?email=${userEmail}`;
    const eventSource = new EventSource(sseUrl, {
        // Authentication headers (if needed - REMOVED in insecure example)
        // headers: { 'Authorization': `Bearer ${userToken}` },
        // withCredentials: true
    });

    activeEventSource.current = eventSource; // Store EventSource instance globally

    eventSource.onopen = () => {
        console.log("SSE connection established globally!"); // <-- Connection established log
    };

    eventSource.onmessage = (event) => {
        try {
            const notificationData: SSENotification = JSON.parse(event.data);
            console.log("SSE Message received globally:", notificationData);

            if (notificationHandler) {
                notificationHandler(notificationData); // Call the registered handler
            } else {
                console.warn("No notification handler registered to process SSE messages.");
            }

        } catch (error) {
            console.error("Error parsing SSE message data in global handler:", error);
        }
    };

    eventSource.onerror = (error) => {
        console.error("SSE error in global handler:", error);
        // Implement reconnection logic or global error handling if needed
    };

    eventSource.onclose = () => {
        console.log("SSE connection closed globally.");
        activeEventSource.current = null; // Clear the instance on close
    };
};

export const closeSSEConnection = () => {
    if (activeEventSource.current) {
        activeEventSource.current.close();
        activeEventSource.current = null;
        console.log("SSE connection manually closed.");
    }
};

export const registerNotificationHandler = (handler: (notification: SSENotification) => void) => {
    notificationHandler = handler;
    console.log("Notification handler registered.");
};

export const unregisterNotificationHandler = () => {
    notificationHandler = null;
    console.log("Notification handler unregistered.");
};