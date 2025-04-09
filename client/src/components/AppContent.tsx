// src/AppContent.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import FolderList from "./FolderList";
import TaskModal from "./AddTaskModal";
import SpaceInterface from "./SpaceInterface";
import { taskFields, folderFields, spaceFields, topicFields } from "../types/types";
import { useModal } from "../context/ModalContext";
import { useDispatch, useSelector } from "react-redux";
import { fetchData } from "../redux/actions/dataActions";
import { RootState } from "./redux/store";
import Cookies from 'js-cookie'; // Import js-cookie in AppContent
import usePushNotifications from "../hooks/usePushNotifications";
import { setupSSEConnection, closeSSEConnection, registerNotificationHandler, unregisterNotificationHandler } from '../services/sseService'; // Adjust path as needed
import NotificationsComponent, { NotificationBellIcon } from "./NotificationsComponent"; // <-- IMPORTANT: Import both NotificationsComponent and NotificationBellIcon
import {
    addNotification, // Import addNotification action
    removeNotification,
    clearAllNotifications,
    toggleNotificationsPanel,
    setNotificationsPanelVisibility
} from '../redux/actions/notificationActions'; // Import notification actions
import NotificationPanel, { NotificationBellIcon } from "./NotificationPanel"; // <-- Import NotificationPanel instead
import { storeUnseenNotification, getUnseenNotifications, removeUnseenNotification as idbRemoveUnseenNotification, clearAllUnseenNotifications as idbClearAllUnseenNotifications } from '../services/indexedDBService';
import { SpaceUnreadCountProvider } from "../context/SpaceUnreadCountContext";
import AgoraVoiceCalling from "./CallInterface";

interface ResponsiveLayoutProps {
    onSpaceSelect: (folderId: string, spaceId: string) => void;
    selectedSpaceInfo: { folderId: string | null, spaceId: string | null };
    isMobileView: boolean;
    handleCloseSpace: () => void;
    isOpen: boolean;             // Receive isOpen prop
    toggleNotifications: () => void; // Receive toggleNotifications prop
    notificationCount: number;
}


const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ onSpaceSelect, selectedSpaceInfo, isMobileView, handleCloseSpace, isOpen, toggleNotifications, notificationCount }) => {


    return (
        <div className="flex">
            {(!isMobileView || !selectedSpaceInfo.spaceId) && (
                <div className="flex-shrink-0 w-full md:w-[40%] lg:w-auto lg:min-w-[381px]">
<FolderList
    onSpaceSelect={onSpaceSelect}
    isOpen={isOpen}           // Pass isOpen to FolderList
    toggleNotifications={toggleNotifications} // Pass toggleNotifications to FolderList
    notificationCount={notificationCount}     // Pass notificationCount to FolderList
/>                </div>
            )}

            {(selectedSpaceInfo.spaceId || !isMobileView) && (
                <div className="flex-1 h-screen bg-black overflow-auto">
                    <SpaceInterface
                        folderId={selectedSpaceInfo.folderId || ''}
                        spaceId={selectedSpaceInfo.spaceId || ''}
                        onClose={isMobileView ? handleCloseSpace : undefined}
                    />
                </div>

            )}




        </div>
    );
};


const AppContent: React.FC = () => {
    const { openModal, showModal, modalType, closeModal, modalProps } = useModal();
    const dispatch = useDispatch();

    console.log("AppContent component rendered"); // Add log for component rendering

    const { fcmToken, notification, error } = usePushNotifications(); // **CALL THE HOOK HERE**

    console.log("fcmToken from hook (AppContent):", fcmToken); // Log fcmToken value
    console.log("notification from hook (AppContent):", notification); // Log notification value
    console.log("error from hook (AppContent):", error); // Log error value



    const userEmail = Cookies.get('userEmail');


    const folders = useSelector((state: RootState) => state.data.folders);
    const spaces = useSelector((state: RootState) => state.data.spaces);
    const subThreads = useSelector((state: RootState) => state.data.subThreads);
    const reduxNotifications = useSelector<RootState, SSENotification[]>((state) => state.yourNotificationsSlice);
    const isNotificationsOpenRedux = useSelector((state: RootState) => state.notifications.isNotificationsOpen); // Get notifications panel visibility from Redux - state

    
  

    const [selectedSpaceInfo, setSelectedSpaceInfo] = useState<{ folderId: string | null, spaceId: string | null }>({ folderId: null, spaceId: null });
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);


    const [notifications, setNotifications] = useState<SSENotification[]>([]);
    console.log("AppContent: Initial notifications state:", notifications); // <-- ADD THIS LINE HERE

    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);


    const [hasLoaded, setHasLoaded] = useState(false);

    useEffect(() => {
        if (hasLoaded) {
            return; // Already loaded, do nothing
        }
    
        const loadUnseen = async () => {
            console.log('pop');
            
            if (!userEmail) {
                console.warn("User email not found, cannot load unseen notifications.");
                return;
            }
            const unseenNotificationsFromDB = await getUnseenNotifications(userEmail);
            console.log('added');
            console.log(`Loaded unseen notifications from IndexedDB for user ${userEmail}:`, unseenNotificationsFromDB);
            unseenNotificationsFromDB.forEach(notification => {
                console.log('shit');
                dispatch(addNotification(notification));
            });
            setHasLoaded(true); // Set the flag after loading
        };
    
    
        loadUnseen();
    }, []); // Empty dependency array // Add userEmail to the dependency array

    // const handleNewNotification = useCallback((notification: SSENotification) => {
    //     console.log("AppContent: handleNewNotification CALLED with notification:", notification);
    //     console.log("AppContent: Notification data:", notification);
    
    //     // Add this condition to filter out "SSE connection established" messages:
    //     if (notification.message !== "SSE connection established") {
    //         console.log('hi');




    //          // <---- IMPORTANT FILTER CONDITION
    //         setNotifications(prevNotifications => [notification, ...prevNotifications]);
    //         dispatch(addNotification(notification));
    //         console.log(notifications);
            

    //     } else {
    //         console.log("AppContent: Ignored 'SSE connection established' notification (not adding to list)."); // Optional log to confirm filtering
    //     }
    //     console.log(reduxNotifications);
        
    // }, [setNotifications]);


    const handleNewNotification = useCallback(async (notification: SSENotification) => {
        console.log("AppContent: handleNewNotification CALLED with notification:", notification);
        console.log("AppContent: Notification data:", notification);

        if (notification.message !== "SSE connection established") {
            if (!userEmail) {
                console.warn("User email not found, cannot store unseen notification.");
                return;
            }
            const notificationWithSeenStatus: SSENotification = {
                ...notification,
                seen: false,
                id: notification.id || crypto.randomUUID(),
            };


            console.log("--- DEBUGGING NOTIFICATION ---");
            console.log("Before storing, notificationWithSeenStatus object:");
            console.log(notificationWithSeenStatus);
            console.log("Notification ID property:", notificationWithSeenStatus.id);
            console.log("--- END DEBUGGING ---");

            // setNotifications(prevNotifications => [notificationWithSeenStatus, ...prevNotifications]); // REMOVED: No longer updating local state
            dispatch(addNotification(notificationWithSeenStatus));
            // await storeUnseenNotification(userEmail, notificationWithSeenStatus);
            console.log(reduxNotifications);
        } else {
            console.log("AppContent: Ignored 'SSE connection established' notification.");
        }
    }, [dispatch, userEmail]); // D



    useEffect(() => {
        registerNotificationHandler(handleNewNotification);
        return () => {
            unregisterNotificationHandler();
        };
    }, [handleNewNotification]);

    const handleCloseNotification = async (indexToRemove: number, notificationId: SSENotification['id']) => {
        if (notificationId && userEmail) {
            await idbRemoveUnseenNotification(userEmail, notificationId);
        } else {
            if (!userEmail) console.warn("User email not found, cannot remove from IndexedDB.");
            if (!notificationId) console.warn("Notification ID missing, cannot remove from IndexedDB.");
        }
        dispatch(removeNotification(indexToRemove));
        // setNotifications(prevNotifications =>  // REMOVED: No longer updating local state
        //     prevNotifications.filter((_, index) => index !== indexToRemove)
        // );
    };

    const handleClearAllNotifications = async () => {
        dispatch(clearAllNotifications());
        if (userEmail) {
            await idbClearAllUnseenNotifications(userEmail);
        } else {
            console.warn("User email not found, cannot clear unseen notifications from IndexedDB.");
        }
        // setNotifications([]); // REMOVED: No longer updating local state
    };

    // const handleClearAllNotifications = () => {
    //     setNotifications([]);
    // };

    // const handleCloseNotification = (indexToRemove: number) => {
    //     setNotifications(prevNotifications =>
    //         prevNotifications.filter((_, index) => index !== indexToRemove)
    //     );
    // };

    const toggleNotifications = () => {
        setIsNotificationsOpen(!isNotificationsOpen);
    };

//     useEffect(() => {
//         const userEmail = Cookies.get('userEmail');
// console.log('started');

//         if (userEmail) {
//             setupSSEConnection(userEmail); // Initialize SSE connection when app mounts
//         } else {
//             console.warn("User email not found, SSE connection not started.");
//         }

//         const handleNotification = (notification: any) => { // Define a handler function
//             console.log("App.tsx received SSE notification:", notification);
//             if (notification.messageType === 'taskAssigned') {
//                 alert(`Global SSE Notification: New Task Assigned - ${notification.taskTitle}`); // Example global handling
//                 // **In a real app, you would likely update global state here (Context, Redux, etc.)
//                 // to make the notification data accessible to other components.**
//             }
//             // Handle other notification types based on notification.messageType
//         };

//         registerNotificationHandler(handleNotification); // Register the handler

//         return () => { // Cleanup function - on app unmount/component unmount (App is typically always mounted in a SPA)
//             closeSSEConnection(); // Close SSE connection when App unmounts (though App usually doesn't unmount in SPA)
//             unregisterNotificationHandler(); // Unregister handler on unmount
//         };
//     }, []); 

useEffect(() => {
    const userEmail = Cookies.get('userEmail');
    console.log('AppContent: useEffect - setting up/closing SSE connection'); // Added log for clarity

    if (userEmail) {
        setupSSEConnection(userEmail); // Initialize SSE connection
        console.log('AppContent: SSE connection setup initiated.'); // Added log
    } else {
        console.warn("AppContent: User email not found, SSE connection not started.");
    }


    return () => { // Cleanup function
        closeSSEConnection(); // Close SSE connection when App unmounts
        console.log('AppContent: SSE connection closed on unmount.'); // Added log
    };
}, []); // Dependency array is still empty - we want this to run only on mount/unmount



    useEffect(() => {
        const userEmail = Cookies.get('userEmail'); // Get email from cookie in component
        if (userEmail) { // Check if email exists before dispatching
            dispatch(fetchData(userEmail)); // Pass email to fetchData
            console.log('dispatched fetchData with email:', userEmail);
        } else {
            console.warn('userEmail cookie not found. Unable to fetch data.');
            // Optionally handle the case where the email is not found (e.g., redirect to login)
        }
    }, [dispatch]);

    useEffect(() => {
        console.log("Folders:", folders);
        console.log("Spaces:", spaces);
        console.log("SubThreads:", subThreads);
    }, [folders, spaces, subThreads]);


    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobileView(mobile);
            // REMOVED this line:
            // setSelectedSpaceInfo({ folderId: null, spaceId: null }); // Reset selection on desktop
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleSpaceSelect = (folderId: string, spaceId: string) => {
        console.log(folderId, spaceId);

        setSelectedSpaceInfo({ folderId, spaceId });
        if (!isMobileView) setSelectedSpaceInfo({ folderId, spaceId });
    };

    const handleCloseSpace = () => setSelectedSpaceInfo({ folderId: null, spaceId: null });



    return (
        <>
        {/* <NotificationsComponent
    isOpen={isNotificationsOpen}
    toggleNotifications={toggleNotifications}
    notifications={notifications}
    handleClearAllNotifications={handleClearAllNotifications}
    handleCloseNotification={handleCloseNotification}
/> */}
 <AgoraVoiceCalling />
<NotificationPanel
    handleClearAllNotifications={handleClearAllNotifications}
    handleCloseNotification={handleCloseNotification}
/>
<ResponsiveLayout
    onSpaceSelect={handleSpaceSelect}
    selectedSpaceInfo={selectedSpaceInfo}
    isMobileView={isMobileView}
    handleCloseSpace={handleCloseSpace}
    isOpen={isNotificationsOpen}       // Pass isOpen
    toggleNotifications={toggleNotifications} // Pass toggleNotifications
    notificationCount={notifications.length} // <---- ADD THIS LINE: Pass notificationCount
/>
            {showModal && (
                <> {/* Use a fragment to group console.log and TaskModal */}
                    {console.log("AppContent: modalType before TaskModal:", modalType)}
                    <TaskModal
                        onClose={closeModal}
                        title={(() => {
                            switch (modalType) {
                                case "task": return "New Task";
                                case "folder": return "New Folder";
                                case "space": return "New Space";
                                case "addTopic": return "New Topic"; // Add this line
                                default: return "New Item";
                            }
                        })()}
                        formFields={
                            modalType === "task" ? taskFields :
                                modalType === "folder" ? folderFields :
                                    modalType === "space" ? spaceFields :
                                        modalType === "addTopic" ? topicFields :
                                            []
                        }
                        modalFormType={modalType} // <----- CORRECT: Direct assignment of modalType

                        folderId={selectedSpaceInfo.folderId || ''}
                        {...modalProps}
                    />
                </>
            )}
        </>
    );
};

export default AppContent;