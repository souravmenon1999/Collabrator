// src/redux/actions/dataActions.ts
import { setFolders, setSpaces, setSubThreads, setAllData, addSpaceToFolder, addTaskToSpace as addTaskToSpaceReducer, deleteFolder, updateFolder as updateFolderReducer, updateSpace as updateSpaceReducer, deleteSpace as deleteSpaceReducer, updateTaskInSpace as updateTaskInSpaceReducer, // IMPORT NEW REDUCER ACTION
    deleteTaskFromSpace as deleteTaskFromSpaceReducer, addSubThreadToSpace, updateSubThread, deleteSubThread   } from '../reducers/dataReducer'; // Import addSpaceToFolder
import { Dispatch } from 'redux';
import { Folder,Space, SubThread, SSENotification, Task }  from '../../types/types'; // Import types
import { generateDummyData } from '../../utils/dummyData';
import axios from 'axios'; 
import { addNotification } from './notificationActions';

// Import axios for making HTTP requests




const processTaskNotifications = (fetchedFolders: Folder[], email: string, dispatch: Dispatch<any>) => {
    const loggedInUserId = '67c80cce609894e13c31fe10'; // **Hardcoded userId - Replace with actual logged-in userId retrieval**

    fetchedFolders.forEach((folder: Folder) => {
        folder.spaces.forEach((space: Space) => {
            space.tasks.forEach((task: Task) => {
                task.ASSIGNEE.forEach(assignee => {
                    console.log(assignee);
                    
                    if (assignee.userId === folder.userId  && !assignee.isRead) {
                        const notificationMessage = `New task "${task.TITLE}" assigned to you in space "${space.name}" in folder "${folder.name}".`;

                        const notification: SSENotification = { // Use the SSENotification type here
                            message: notificationMessage,
                            spaceId: space.id,
                            taskId: task.id,
                            isRead: assignee.isRead,
                            userId: assignee.userId,
                            timestamp: new Date().toISOString(), // Or use task.createdAt if relevant
                        };
                         dispatch(addNotification(notification));
                        console.log('notifications',notification);
                        
                    }
                });
            });
        });
    });
};


export const fetchData = (email: string) => {
    return async (dispatch: Dispatch) => { // Make the inner function async
        const { spaces, subThreads } = generateDummyData();
        console.log(email);
        const apiUrl = `http://localhost:5000/api/folders?email=${email}`; // Construct API URL with email argument (CORRECTED)

        
        // Keep dummy data for spaces and subThreads

        try {
            const response = await axios.get(apiUrl); // Make GET request with правильно constructed URL
            const fetchedFolders = response.data;
            console.log(fetchedFolders);
             // Extract folder data from the response

            // Ensure that all `timestamp` fields in subThreads are converted to ISO strings before dispatch
            const formattedSubThreads = subThreads.map(subThread => ({
                ...subThread,
                messages: subThread.messages.map(message => ({
                    ...message,
                    timestamp: message.timestamp instanceof Date ? message.timestamp.toISOString() : message.timestamp,
                }))
            }));

            console.log("Fetched Folders from API:", fetchedFolders); // Log fetched folders
            console.log(spaces);
            console.log(formattedSubThreads);

            dispatch(setAllData({ folders: fetchedFolders, spaces, subThreads: formattedSubThreads })); // Dispatch fetched folders and dummy spaces/subThreads
            processTaskNotifications(fetchedFolders, email, dispatch);

        } catch (error) {
            console.error("Error fetching folders:", error);
            // Handle error appropriately, maybe dispatch an error action or display an error message
            // For now, you might still want to dispatch dummy data in case of an error, or just dispatch an empty folders array
            dispatch(setAllData({ folders: [], spaces, subThreads: formattedSubThreads })); // Or dispatch with dummy folders if you have them, or just empty array
        }
    };
};

export const deleteFolderAction = (folderId: string) => {
    return async (dispatch: Dispatch) => {
        try {
            const response = await axios.delete(`http://localhost:5000/api/folders/${folderId}`); // Adjust API endpoint if needed
            if (response.status === 200) {
                dispatch(deleteFolder(folderId)); // Dispatch reducer action on success
                alert("Folder deleted successfully!"); // Optional success message
            } else {
                alert("Failed to delete folder."); // Optional error message
                console.error("Failed to delete folder:", response.data);
            }
        } catch (error: any) {
            alert("Error deleting folder."); // Generic error alert
            console.error("Error deleting folder:", error.message);
        }
    };
};

export const updateFolderAction = (folderId: string, updatedFolderData: any) => { // Type updatedFolderData more specifically if possible
    return async (dispatch: Dispatch) => {
        try {
            const response = await axios.put(`http://localhost:5000/api/folders/${folderId}`, updatedFolderData); // Adjust API endpoint if needed
            if (response.status === 200) {
                // Dispatch reducer action with ONLY folderId, name, and description from updatedFolderData
                dispatch(updateFolderReducer({
                    folderId: folderId,
                    name: updatedFolderData.name,
                    description: updatedFolderData.description,
                }));
                alert("Folder updated successfully!"); // Optional success message
            } else {
                alert("Failed to update folder."); // Optional error message
                console.error("Failed to update folder:", response.data);
            }
        } catch (error: any) {
            alert("Error updating folder."); // Generic error alert
            console.error("Error updating folder:", error.message);
        }
    };
};


export const updateSpaceAction = (spaceId: string, updatedSpaceData: any) => { // Now accepts TWO arguments: spaceId and updatedSpaceData
    return (dispatch: Dispatch) => {
        dispatch(updateSpaceReducer({ spaceId: spaceId, updatedSpace: updatedSpaceData })); // Correctly pass spaceId and updatedSpace to reducer
        console.log("Space update reducer dispatched for space ID:", spaceId); // Log spaceId
    };
};

export const deleteSpaceAction = (spaceId: string) => {
    return async (dispatch: Dispatch) => {
        try {
            const response = await axios.delete(`http://localhost:5000/api/spaces/${spaceId}`); // DELETE request to delete space
            if (response.status === 200) {
                dispatch(deleteSpaceReducer(spaceId)); // Dispatch reducer to update Redux state
                alert("Space deleted successfully!"); // Optional success message
            } else {
                alert("Failed to delete space."); // Optional error message
                console.error("Failed to delete space:", response.data);
            }
        } catch (error: any) {
            alert("Error deleting space."); // Generic error alert
            console.error("Error deleting space:", error.message);
        }
    };
};

export const addTaskAction = (spaceId: string, newTask: Task) => {
    return (dispatch: Dispatch) => {
        dispatch(addTaskToSpaceReducer({ spaceId, newTask })); // Dispatch the addTaskToSpace reducer action
        console.log('AddTaskAction dispatched for space ID:', spaceId, 'Task:', newTask);
    };
};


// Action creator for updating a task
export const updateTaskAction = (spaceId: string, updatedTask: Task) => {
    return (dispatch: Dispatch) => {
        dispatch(updateTaskInSpaceReducer({ spaceId, updatedTask })); // Dispatch the updateTaskInSpace reducer action
        console.log('UpdateTaskAction dispatched for space ID:', spaceId, 'Task:', updatedTask);
    };
};

// Action creator for deleting a task
export const deleteTaskAction = (spaceId: string, taskId: string) => {
    return (dispatch: Dispatch) => {
        dispatch(deleteTaskFromSpaceReducer({ spaceId, taskId })); // Dispatch the deleteTaskFromSpace reducer action
        console.log('DeleteTaskAction dispatched for space ID:', spaceId, 'Task ID:', taskId);
    };
};



export const addSubThreadToSpaceAction = (spaceId: string, newSubThread: SubThread) => { // Correct action name and type
    return (dispatch: Dispatch) => {
        dispatch(addSubThreadToSpace({ spaceId, newSubThread })); // Dispatch the addSubThreadToSpace reducer action
        console.log('addSubThreadToSpaceAction dispatched for space ID:', spaceId, 'SubThread:', newSubThread);
    };
};

export const updateSubThreadAction = (spaceId: string, updatedSubThread: SubThread) => {
    return (dispatch: Dispatch) => {
        dispatch(updateSubThread({ spaceId, updatedSubThread })); // Dispatch the new reducer action
        console.log('updateSubThreadAction dispatched for space ID:', spaceId, 'SubThread:', updatedSubThread);
    };
};

export const deleteSubThreadAction = (spaceId: string, topicId: string) => {
    return (dispatch: Dispatch) => {
        dispatch(deleteSubThread({ spaceId, topicId })); // Dispatch the new reducer action
        console.log('deleteSubThreadAction dispatched for space ID:', spaceId, 'topicId:', topicId);
    };
};