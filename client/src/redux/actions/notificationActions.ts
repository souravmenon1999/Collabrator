// src/redux/actions/notificationActions.ts
import { SSENotification } from '../../types/types'; // Assuming SSENotification type is defined

export const ADD_NOTIFICATION = 'ADD_NOTIFICATION';
export const REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION';
export const CLEAR_ALL_NOTIFICATIONS = 'CLEAR_ALL_NOTIFICATIONS';
export const TOGGLE_NOTIFICATIONS_PANEL = 'TOGGLE_NOTIFICATIONS_PANEL';
export const SET_NOTIFICATIONS_PANEL_VISIBILITY = 'SET_NOTIFICATIONS_PANEL_VISIBILITY';
export const SET_NOTIFICATION_FILTER_SPACE_ID = 'SET_NOTIFICATION_FILTER_SPACE_ID';
export const CLEAR_NOTIFICATION_FILTER_SPACE_ID = 'CLEAR_NOTIFICATION_FILTER_SPACE_ID';
export const OPEN_GLOBAL_NOTIFICATIONS = 'OPEN_GLOBAL_NOTIFICATIONS';
export const OPEN_SPACE_NOTIFICATIONS = 'OPEN_SPACE_NOTIFICATIONS';

interface AddNotificationAction {
    type: typeof ADD_NOTIFICATION;
    payload: SSENotification;
}

interface RemoveNotificationAction {
    type: typeof REMOVE_NOTIFICATION;
    payload: number; // Index to remove
}

interface ClearAllNotificationsAction {
    type: typeof CLEAR_ALL_NOTIFICATIONS;
}

interface ToggleNotificationsPanelAction {
    type: typeof TOGGLE_NOTIFICATIONS_PANEL;
}

interface SetNotificationsPanelVisibilityAction {
    type: typeof SET_NOTIFICATIONS_PANEL_VISIBILITY;
    payload: boolean;
}

interface SetNotificationFilterSpaceIdAction {
    type: typeof SET_NOTIFICATION_FILTER_SPACE_ID;
    payload: string; // spaceId
}

interface ClearNotificationFilterSpaceIdAction {
    type: typeof CLEAR_NOTIFICATION_FILTER_SPACE_ID;
}

interface OpenGlobalNotificationsAction {
    type: typeof OPEN_GLOBAL_NOTIFICATIONS;
}

interface OpenSpaceNotificationsAction {
    type: typeof OPEN_SPACE_NOTIFICATIONS;
    payload: string; // spaceId
}

export type NotificationActionTypes =
    | AddNotificationAction
    | RemoveNotificationAction
    | ClearAllNotificationsAction
    | ToggleNotificationsPanelAction
    | SetNotificationsPanelVisibilityAction
    | SetNotificationFilterSpaceIdAction
    | ClearNotificationFilterSpaceIdAction
    | OpenGlobalNotificationsAction
    | OpenSpaceNotificationsAction;
    

export const addNotification = (notification: SSENotification): AddNotificationAction => ({
    type: ADD_NOTIFICATION,
    payload: notification,
});

export const removeNotification = (index: number): RemoveNotificationAction => ({
    type: REMOVE_NOTIFICATION,
    payload: index,
});

export const clearAllNotifications = (): ClearAllNotificationsAction => ({
    type: CLEAR_ALL_NOTIFICATIONS,
});

export const toggleNotificationsPanel = (): ToggleNotificationsPanelAction => ({
    type: TOGGLE_NOTIFICATIONS_PANEL,
});

export const setNotificationsPanelVisibility = (isVisible: boolean): SetNotificationsPanelVisibilityAction => ({
    type: SET_NOTIFICATIONS_PANEL_VISIBILITY,
    payload: isVisible,
});

export const setNotificationFilterSpaceId = (spaceId: string): SetNotificationFilterSpaceIdAction => ({
    type: SET_NOTIFICATION_FILTER_SPACE_ID,
    payload: spaceId,
});

export const clearNotificationFilterSpaceId = (): ClearNotificationFilterSpaceIdAction => ({
    type: CLEAR_NOTIFICATION_FILTER_SPACE_ID,
});

export const openGlobalNotifications = (): OpenGlobalNotificationsAction => ({
    type: OPEN_GLOBAL_NOTIFICATIONS,
});

export const openSpaceNotifications = (spaceId: string): OpenSpaceNotificationsAction => ({
    type: OPEN_SPACE_NOTIFICATIONS,
    payload: spaceId,
});