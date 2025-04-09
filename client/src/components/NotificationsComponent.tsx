import React, { useState, useRef, useEffect } from "react";

import { SSENotification } from "../services/sseService"; // Import the notification interface
import { registerNotificationHandler, unregisterNotificationHandler } from '../services/sseService'; // Import notification handler registration
import { BellIcon, XMarkIcon } from "@heroicons/react/24/outline"; // XMarkIcon added


interface NotificationItemProps {
    notification: SSENotification;
    onClose: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
    return (
        <div className="p-4 mb-2 bg-gray-800 rounded-md shadow-md text-white relative">
            <button
                onClick={onClose}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-300"
            >
<XMarkIcon className="h-5 w-5" />            </button>
            <h3 className="font-semibold">{notification.taskTitle || notification.messageType}</h3>
            {notification.taskDescription && <p className="text-gray-300">{notification.taskDescription}</p>}
            {notification.dueDate && <p className="text-sm text-gray-400">Due Date: {notification.dueDate}</p>}
            {/* Display other notification details as needed based on messageType */}
        </div>
    );
};


interface NotificationsComponentProps {
    isOpen: boolean;
    toggleNotifications: () => void;
    notifications: SSENotification[];
    handleClearAllNotifications: () => void;
    handleCloseNotification: (indexToRemove: number) => void;
}
const NotificationsComponent: React.FC<NotificationsComponentProps> = ({ isOpen, toggleNotifications, notifications, handleClearAllNotifications, handleCloseNotification }) => {    console.log("NotificationsComponent rendered"); // <-- Add this log

    const bellRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleNewNotification = (notification: SSENotification) => {
            console.log("handleNewNotification called with:", notification); // <-- Add this log

            setNotifications(prevNotifications => [notification, ...prevNotifications]); // Add new notification to the top
        };

        registerNotificationHandler(handleNewNotification); // Register handler on mount

        return () => {
            unregisterNotificationHandler(); // Unregister handler on unmount
        };
    }, []);

   
    

    


    return (
        <div className="relative ml-4"> {/* Container for bell icon and dropdown */}
           
            {isOpen && (
                <div
                    className="fixed top-0 bottom-0 right-0 w-96 bg-[#2a3942] shadow-xl z-50 overflow-hidden transition-transform duration-300 ease-out" // Full height, fixed width
                    style={{
                        transform: isOpen ? 'translateX(0)' : 'translateX(100%)', // Still slide from right (100% of *container* width now)
                        opacity: isOpen ? 1 : 0,
                        pointerEvents: isOpen ? 'auto' : 'none',
                        // No need for 'top' and 'right' in inline style anymore, controlled by className 'fixed top-0 bottom-0 right-0'
                    }}
                >
                    <div className="p-4 border-b border-gray-700 flex justify-between items-center"> {/* Increased padding */}
                        <h4 className="text-white font-semibold text-lg">Notifications</h4> {/* Slightly larger heading */}
                        <div className="flex items-center space-x-3"> {/* Increased spacing */}
                            <button onClick={handleClearAllNotifications} className="text-sm text-gray-400 hover:text-gray-300"> {/* Slightly smaller text */}
                                Clear All
                            </button>
                            <button
                                onClick={toggleNotifications}
                                className="text-gray-500 hover:text-gray-300"
                            >
                                <XMarkIcon className="h-6 w-6" /> {/* Slightly larger icon */}
                            </button>
                        </div>
                    </div>
                    <div className="h-full overflow-y-auto p-4"> {/* Full height scrollable area, added padding */}
                        {notifications.length > 0 ? (
                            notifications.map((notification, index) => (
                                <NotificationItem
                                    key={index}
                                    notification={notification}
                                    onClose={() => handleCloseNotification(index)}
                                />
                            ))
                        ) : (
                            <div className="p-6 text-gray-400 text-center"> {/* Increased padding */}
                                No new notifications
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationsComponent;

interface NotificationBellIconProps {
    isOpen: boolean;
    toggleNotifications: () => void;
    notificationCount: number;
}

export const NotificationBellIcon: React.FC<NotificationBellIconProps> = ({ isOpen, toggleNotifications, notificationCount }) => {
    const bellRef = useRef<HTMLButtonElement>(null);

    return (
        <div className="relative ml-4 sticky top-0 z-40">
            <button
                ref={bellRef}
                onClick={toggleNotifications}
                className="relative p-2 rounded-full bg-[#202c33] hover:bg-[#182229] focus:outline-none"
            >
                <BellIcon className="h-6 w-6 text-gray-300" />
                {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 flex items-center justify-center px-1.5 py-0.5 bg-red-500 text-xs font-bold text-white rounded-full">
                        {notificationCount}
                    </span>
                )}
            </button>
        </div>
    );
};
