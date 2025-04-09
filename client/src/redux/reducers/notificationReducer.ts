// src/redux/reducers/notificationReducer.ts
import {
    ADD_NOTIFICATION,
    REMOVE_NOTIFICATION,
    CLEAR_ALL_NOTIFICATIONS,
    TOGGLE_NOTIFICATIONS_PANEL,
    SET_NOTIFICATIONS_PANEL_VISIBILITY,
    SET_NOTIFICATION_FILTER_SPACE_ID,
    CLEAR_NOTIFICATION_FILTER_SPACE_ID,
    OPEN_GLOBAL_NOTIFICATIONS,
    OPEN_SPACE_NOTIFICATIONS,
    ADD_TOPIC_TO_SPACE,
    NotificationActionTypes, // Import the action types
} from '../actions/notificationActions';
import { SSENotification } from '../../types/types'; // Import SSENotification type

interface NotificationState {
    notifications: SSENotification[];
    isNotificationsOpen: boolean;
    filterSpaceId: string | null;
}

const initialState: NotificationState = {
    notifications: [],
    isNotificationsOpen: false,
    filterSpaceId: null,
};

const notificationReducer = (state: NotificationState = initialState, action: NotificationActionTypes): NotificationState => {
    switch (action.type) {
        case ADD_NOTIFICATION:
            console.log(state.notifications);
        
            console.log(action.payload);
            
            return {
                ...state,
                notifications: [action.payload, ...state.notifications],
            };
        case REMOVE_NOTIFICATION:
            console.log('started clearing');
            
            return {
                ...state,
                notifications: state.notifications.filter((_, index) => index !== action.payload),
            };
        case CLEAR_ALL_NOTIFICATIONS:
            return {
                ...state,
                notifications: [],
            };
        case TOGGLE_NOTIFICATIONS_PANEL:
            return {
                ...state,
                isNotificationsOpen: !state.isNotificationsOpen,
            };
        case SET_NOTIFICATIONS_PANEL_VISIBILITY:
            return {
                ...state,
                isNotificationsOpen: action.payload,
            };
        case SET_NOTIFICATION_FILTER_SPACE_ID:
            return {
                ...state,
                filterSpaceId: action.payload,
            };
        case CLEAR_NOTIFICATION_FILTER_SPACE_ID:
            return {
                ...state,
                filterSpaceId: null,
            };
            case OPEN_GLOBAL_NOTIFICATIONS:
                console.log('OPEN_GLOBAL_NOTIFICATIONS reducer case triggered'); // Keep this line
                const newState = { // Create a new state object explicitly for logging
                    ...state,
                    isNotificationsOpen: true,
                    filterSpaceId: null,
                };
                console.log('New state after OPEN_GLOBAL_NOTIFICATIONS:', newState); // Log the newState
                return newState; // Return the newState
        case OPEN_SPACE_NOTIFICATIONS:
            return {
                ...state,
                isNotificationsOpen: true,
                filterSpaceId: action.payload,
            };
        
        default:
            return state;
    }
};

export default notificationReducer;