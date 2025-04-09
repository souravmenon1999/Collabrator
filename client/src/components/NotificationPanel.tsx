// src/NotificationPanel.tsx
import React from 'react';
import { SSENotification } from '../types/types'; // Make sure the path to your SSENotification type is correct
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import {
    setNotificationsPanelVisibility,
    clearNotificationFilterSpaceId,
    removeNotification,
    clearAllNotifications,
    toggleNotificationsPanel, // If you still want a toggle option
} from '../redux/actions/notificationActions';
import { BellIcon } from "@heroicons/react/24/outline"; // Import BellIcon
import { removeUnseenNotification, clearAllUnseenNotifications } from '../services/indexedDBService';
import Cookies from 'js-cookie'; // Import js-cookie in AppContent
import axios from 'axios';

interface NotificationPanelProps {
    // handleClearAllNotifications: () => void; // Handlers are now actions dispatched directly, no need for props for these
    // handleCloseNotification: (indexToRemove: number) => void; // Handlers are now actions dispatched directly, no need for props for these
}

const NotificationPanel: React.FC<NotificationPanelProps> = () => {
    const dispatch = useDispatch();
    // Get visibility and notifications and filterSpaceId directly from Redux using useSelector
    const isOpen = useSelector((state: RootState) => state.notifications.isNotificationsOpen);   
     const notificationsFromRedux = useSelector((state: RootState) => state.notifications.notifications);
    const filterSpaceId = useSelector((state: RootState) => state.notifications.filterSpaceId);

    if (!isOpen) {
        return null; // Do not render the panel if isOpen is false in Redux state
    }

    // Apply filtering based on filterSpaceId from Redux state
    const filteredNotifications = filterSpaceId
        ? notificationsFromRedux.filter(notification => notification.spaceId === filterSpaceId)
        : notificationsFromRedux;

    const handleClosePanel = () => {
        dispatch(setNotificationsPanelVisibility(false)); // Dispatch action to close panel (set visibility to false in Redux)
        dispatch(clearNotificationFilterSpaceId());      // Dispatch action to clear space filter (set filterSpaceId to null in Redux)
    };

    const userEmail = Cookies.get('userEmail');
    

    const handleClearAll = async () => { // Make handleClearAll async
        const taskIdsToMarkRead = filteredNotifications.map(notification => notification.taskId); // Get taskIds of displayed notifications
console.log(taskIdsToMarkRead);

        try {
            const response = await axios.post('http://localhost:5000/api/notifications/markAsRead',{ taskIds: taskIdsToMarkRead, userEmail: userEmail }); // Call backend API
            if (response.status === 200) {
                dispatch(clearAllNotifications()); // Only clear Redux notifications on successful backend update
                console.log('Notifications marked as read in backend and cleared in Redux');
                clearAllUnseenNotifications(userEmail);
            } else {
                console.error('Failed to mark notifications as read in backend:', response.data);
                alert('Failed to clear all notifications. Please try again.'); // Or better error handling
            }
        } catch (error) {
            console.error('Error marking notifications as read in backend:', error);
            alert('Error clearing all notifications. Please check console.'); // Or better error handling
        }
    };


    const handleCloseNotificationItem = async ( userEmail: string, taskId: string, index: number) => {
        try {
            console.log(taskId, userEmail );
            
            const response = await axios.post('http://localhost:5000/api/notifications/markAsRead', { taskIds: [taskId], userEmail: userEmail }); // **Send taskId and userEmail in request body**
            if (response.status === 200) {
                dispatch(removeNotification(index)); // Only remove from Redux on successful backend update
                if (userEmail) {
                 console.log('indexed db not needed');
                 
                }
                console.log('Notification marked as read in backend and dismissed from Redux');
            } else {
                console.error('Failed to mark notification as read in backend:', response.data);
                alert('Failed to dismiss notification. Please try again.'); // Or better error handling
            }
        } catch (error) {
            console.error('Error marking notification as read in backend:', error);
            alert('Error dismissing notification. Please check console.'); // Or better error handling
        }
    };

    // If you want to keep a Toggle button instead of just a Close button, you can use handleTogglePanel instead of handleClosePanel for the button's onClick
    const handleTogglePanel = () => {
        dispatch(toggleNotificationsPanel()); // Dispatch action to toggle panel visibility in Redux
        dispatch(clearNotificationFilterSpaceId()); // Optionally clear the space filter when toggling off
    };


    return (
<div
    className="fixed top-0 bottom-0 right-0 w-96 bg-[#2a3942] shadow-xl z-50 overflow-hidden transition-transform duration-300 ease-out"
    style={{
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)', // Keep transition if you want animation
        opacity: isOpen ? 1 : 0, // Keep opacity control if you want animation
        pointerEvents: isOpen ? 'auto' : 'none', // Keep pointerEvents control if you want animation
    }}
>           <div className="p-4 border-b border-gray-700 flex justify-between items-center">
    <h4 className="text-white font-semibold text-lg">Notifications</h4>
    <div className="flex items-center space-x-3">
    <button onClick={handleClearAll} className="text-sm text-gray-400 hover:text-gray-300">
                        Clear All
                    </button>
        <button
            onClick={handleClosePanel}
            className="text-gray-500 hover:text-gray-300"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    </div>
</div>
<div className="h-full overflow-y-auto p-4">                {filteredNotifications.length === 0 ? (
                    <p className="text-gray-500 p-2">No new notifications.</p>
                ) : (
                    filteredNotifications.map((notification, index) => (
                        <div key={index} className="notification-item p-3 mb-2 border-b last:border-b-0">
                            <p className="font-semibold">{notification.taskTitle || notification.messageType}</p> {/* Display taskTitle or messageType */}
                            <p className="text-sm text-gray-700">{notification.taskDescription || notification.message}</p> {/* Display taskDescription or message */}
                            {/* Display other notification details as needed, e.g., notification.assignedby, notification.dueDate */}
                            <div className="flex justify-end mt-2">
                            <button onClick={() => {
    
    handleCloseNotificationItem( userEmail, notification.taskId, index);
}} className="text-red-500 hover:text-red-700 text-sm">Dismiss</button>                         </div>
                        </div>
                    ))
                )}
            </div>
            <div className="notification-footer bg-gray-100 p-3 border-t flex justify-end">
                <button onClick={handleClearAll} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-700 text-sm">Clear All</button>
            </div>
        </div>
    );
};

export default NotificationPanel;

// NotificationBellIcon component can be in the same file or a separate file (like NotificationPanel.tsx or even in FolderList if only used there)
export const NotificationBellIcon = ({ onClick, count }: { onClick: () => void, count: number }) => (
    <div className="relative inline-block">
        <button onClick={onClick} className="p-1 focus:outline-none"> {/* Added basic button styling and removed focus outline */}
            <span role="img" aria-label="notifications">
                
            <BellIcon className="h-6 w-6 text-gray-300" />


                </span> {/* Using emoji for bell icon, can replace with SVG or icon component */}
            {count > 0 && (
                <span className="absolute top-[-5px] right-[-5px] bg-red-500 text-white rounded-full px-2 text-xs">{count}</span>
            )}
        </button>
    </div>
);