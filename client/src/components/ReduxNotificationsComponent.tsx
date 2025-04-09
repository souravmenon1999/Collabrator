import React, { useRef, useEffect } from "react";
import { SSENotification } from "../services/sseService";
import { BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "./redux/store";
import {
    clearAllNotifications,
    removeNotification,
    toggleNotificationsPanel,
    setNotificationsPanelVisibility
} from './redux/actions/notificationActions';

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
                <XMarkIcon className="h-5 w-5" />
            </button>
            <h3 className="font-semibold">{notification.taskTitle || notification.messageType}</h3>
            {notification.taskDescription && <p className="text-gray-300">{notification.taskDescription}</p>}
            {notification.dueDate && <p className="text-sm text-gray-400">Due Date: {notification.dueDate}</p>}
            {/* Display other notification details as needed based on messageType */}
        </div>
    );
};


const ReduxNotificationsComponent: React.FC = () => {
    console.log("ReduxNotificationsComponent rendered");
    const bellRef = useRef<HTMLButtonElement>(null);
    const dispatch = useDispatch();
    const reduxNotifications = useSelector((state: RootState) => state.notifications.notifications);
    const isNotificationsOpenRedux = useSelector((state: RootState) => state.notifications.isNotificationsOpen);


    const handleClearAllNotifications = () => {
        dispatch(clearAllNotifications());
    };

    const handleCloseNotification = (indexToRemove: number) => {
        if (reduxNotifications && reduxNotifications[indexToRemove]) {
            const notificationToRemove = reduxNotifications[indexToRemove];
            if (notificationToRemove && notificationToRemove.id) {
                dispatch(removeNotification(notificationToRemove.id));
            } else {
                console.warn("Removing notification by index as no ID is available.");
            }
        }
    };

    const toggleNotifications = () => {
        dispatch(toggleNotificationsPanel());
    };


    return (
        <div className="relative ml-4">
            {isNotificationsOpenRedux && (
                <div
                    className="fixed top-0 bottom-0 right-0 w-96 bg-[#2a3942] shadow-xl z-50 overflow-hidden transition-transform duration-300 ease-out"
                    style={{
                        transform: isNotificationsOpenRedux ? 'translateX(0)' : 'translateX(100%)',
                        opacity: isNotificationsOpenRedux ? 1 : 0,
                        pointerEvents: isNotificationsOpenRedux ? 'auto' : 'none',
                    }}
                >
                    <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                        <h4 className="text-white font-semibold text-lg">Notifications</h4>
                        <div className="flex items-center space-x-3">
                            <button onClick={handleClearAllNotifications} className="text-sm text-gray-400 hover:text-gray-300">
                                Clear All
                            </button>
                            <button
                                onClick={() => dispatch(setNotificationsPanelVisibility(false))}
                                className="text-gray-500 hover:text-gray-300"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                    <div className="h-full overflow-y-auto p-4">
                        {reduxNotifications.length > 0 ? (
                            reduxNotifications.map((notification, index) => (
                                <NotificationItem
                                    key={index}
                                    notification={notification}
                                    onClose={() => handleCloseNotification(index)}
                                />
                            ))
                        ) : (
                            <div className="p-6 text-gray-400 text-center">
                                No new notifications
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReduxNotificationsComponent;


interface ReduxNotificationBellIconProps {
}

export const ReduxNotificationBellIcon: React.FC<ReduxNotificationBellIconProps> = () => {
    const bellRef = useRef<HTMLButtonElement>(null);
    const dispatch = useDispatch();
    const reduxNotifications = useSelector((state: RootState) => state.notifications.notifications);

    const toggleNotifications = () => {
        dispatch(toggleNotificationsPanel());
    };

    return (
        <div className="relative ml-4 sticky top-0 z-40">
            <button
                ref={bellRef}
                onClick={toggleNotifications}
                className="relative p-2 rounded-full bg-[#202c33] hover:bg-[#182229] focus:outline-none"
            >
                <BellIcon className="h-6 w-6 text-gray-300" />
                {reduxNotifications.length > 0 && (
                    <span className="absolute top-0 right-0 flex items-center justify-center px-1.5 py-0.5 bg-red-500 text-xs font-bold text-white rounded-full">
                        {reduxNotifications.length}
                    </span>
                )}
            </button>
        </div>
    );
};