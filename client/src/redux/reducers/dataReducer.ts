// src/redux/reducers/dataReducer.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Folder, Space, SubThread } from '../../types/types'; // Import your types

interface DataState {
    folders: Folder[];
    spaces: Space[];
    subThreads: SubThread[];
}

const initialState: DataState = {
    folders: [],
    spaces: [],
    subThreads: [],
};

const dataSlice = createSlice({
    name: 'data',
    initialState,
    reducers: {
        setFolders: (state, action: PayloadAction<Folder[]>) => {
            state.folders = action.payload;
        },
        setSpaces: (state, action: PayloadAction<Space[]>) => {
            state.spaces = action.payload;
        },
        setSubThreads: (state, action: PayloadAction<SubThread[]>) => {
            state.subThreads = action.payload.map((subThread) => ({
                ...subThread,
                // Ensure all timestamps are converted to ISO strings
                messages: subThread.messages.map((message) => ({
                    ...message,
                    timestamp: message.timestamp instanceof Date ? message.timestamp.toISOString() : message.timestamp,
                })),
            }));
        },
        setAllData: (state, action: PayloadAction<{ folders: Folder[], spaces: Space[], subThreads: SubThread[] }>) => {
            // Update state with new data
            state.folders = action.payload.folders;
            state.spaces = action.payload.spaces;
            state.subThreads = action.payload.subThreads.map((subThread) => ({
                ...subThread,
                // Convert any `timestamp` to ISO string
                messages: subThread.messages.map((message) => ({
                    ...message,
                    timestamp: message.timestamp instanceof Date ? message.timestamp.toISOString() : message.timestamp,
                })),
            }));

            // Log the updated state values to the console
            console.log('Updated Folders:', state.folders);
            console.log('Updated Spaces:', state.spaces);
            console.log('Updated SubThreads:', state.subThreads);
        },
        addSpaceToFolder: (state, action: PayloadAction<{ folderId: string, newSpace: Space }>) => {
            const { folderId, newSpace } = action.payload;
            const folderIndex = state.folders.findIndex(folder => folder.id === folderId);
            if (folderIndex !== -1) {
                state.folders[folderIndex].spaces.push(newSpace);
                console.log('Space added to folder:', state.folders[folderIndex]);
            }
        },
        // addTaskToSpace: (state, action: PayloadAction<{ spaceId: string, newTask: Task }>) => {
        //     const { spaceId, newTask } = action.payload;

        //     // Find the folder that contains the space
        //     for (const folder of state.folders) {
        //         const spaceIndex = folder.spaces.findIndex(space => space.id === spaceId);
        //         if (spaceIndex !== -1) {
        //             // If space is found in this folder, add the new task to the space's tasks array
        //             folder.spaces[spaceIndex].tasks.push(newTask);
        //             console.log('Task added to space:', folder.spaces[spaceIndex], 'Task:', newTask);
        //             break; // Stop searching once the space is found and updated
        //         }
        //     }
        // },
        addSubThreadToSpace: (state, action: PayloadAction<{ spaceId: string, newSubThread: SubThread }>) => {
            const { spaceId, newSubThread } = action.payload;

            // Find the folder that contains the space
            for (const folder of state.folders) {
                const spaceIndex = folder.spaces.findIndex(space => space.id === spaceId);
                if (spaceIndex !== -1) {
                    // If space is found in this folder, add the new subThread to the space's subThreads array
                    folder.spaces[spaceIndex].subThreads.push(newSubThread);
                    console.log('SubThread added to space:', folder.spaces[spaceIndex], 'SubThread:', newSubThread);
                    break; // Stop searching once the space is found and updated
                }
            }
        },
        deleteFolder: (state, action: PayloadAction<string>) => {
            const folderIdToDelete = action.payload;
            state.folders = state.folders.filter(folder => folder.id !== folderIdToDelete); // Filter out the deleted folder
            console.log(`Folder with ID ${folderIdToDelete} deleted from Redux state.`); // Optional log
        },

        updateFolder: (state, action: PayloadAction<{ folderId: string, name: string, description: string }>) => { // Updated PayloadAction type
            const { folderId, name, description } = action.payload; // Extract name and description from payload
            const folderIndex = state.folders.findIndex(folder => folder.id === folderId);
            if (folderIndex !== -1) {
                // **Selectively update name and description only**
                state.folders[folderIndex].name = name;
                state.folders[folderIndex].description = description;
                console.log(`Folder with ID ${folderId} updated in Redux state (name and description).`); // Updated log
            }
        },
        updateSpace: (state, action: PayloadAction<{ spaceId: string, updatedSpace: any }>) => { // Payload now has updatedSpace directly
            const { spaceId, updatedSpace } = action.payload;
            const updatedFolders = state.folders.map(folder => {
                const spaceIndex = folder.spaces.findIndex(space => space.id === spaceId);
                if (spaceIndex !== -1) {
                    // Found the space, update specific properties immutably
                    const updatedSpaceInFolder = {
                        ...folder.spaces[spaceIndex], // Keep all existing properties of the space
                        name: updatedSpace.name,       // Update name from payload
                        description: updatedSpace.description, // Update description from payload
                        members: updatedSpace.members,   // Update members from payload
                        updatedAt: updatedSpace.updatedAt // Update updatedAt from payload (if needed, or handle date formatting)
                    };
                    const updatedSpaces = folder.spaces.map((space, index) => {
                        if (index === spaceIndex) {
                            return updatedSpaceInFolder; // Return the updated space object
                        }
                        return space;
                    });
                    return { ...folder, spaces: updatedSpaces };
                }
                console.log(folder);
                
                return folder; // Folder not containing the space, return unchanged
            });
            state.folders = updatedFolders;
            console.log(updatedFolders);
            
            console.log(`Space with ID ${spaceId} updated in Redux state (selective fields).`);
        },
        deleteSpace: (state, action: PayloadAction<string>) => {
            const spaceIdToDelete = action.payload;
            const updatedFolders = state.folders.map(folder => {
                return {
                    ...folder,
                    spaces: folder.spaces.filter(space => space.id !== spaceIdToDelete) // Filter out the deleted space
                };
            });
            state.folders = updatedFolders;
            console.log(`Space with ID ${spaceIdToDelete} deleted from Redux state.`); // Optional log
        },
        addTaskToSpace: (state, action: PayloadAction<{ spaceId: string, newTask: Task }>) => { // already exists - just for context
            const { spaceId, newTask } = action.payload;
            for (const folder of state.folders) {
                const spaceIndex = folder.spaces.findIndex(space => space.id === spaceId);
                if (spaceIndex !== -1) {
                    folder.spaces[spaceIndex].tasks.push(newTask);
                    console.log('Task added to space in Redux:', folder.spaces[spaceIndex], 'Task:', newTask);
                    break;
                }
            }
        },
        updateTaskInSpace: (state, action: PayloadAction<{ spaceId: string; updatedTask: Task }>) => {
            const { spaceId, updatedTask } = action.payload;
            for (const folder of state.folders) {
                const spaceIndex = folder.spaces.findIndex(space => space.id === spaceId);
                if (spaceIndex !== -1) {
                    const taskIndex = folder.spaces[spaceIndex].tasks.findIndex(task => task.id === updatedTask.id);
                    if (taskIndex !== -1) {
                        // Replace the old task with the updated task
                        folder.spaces[spaceIndex].tasks[taskIndex] = updatedTask;
                        console.log('Task updated in space in Redux:', folder.spaces[spaceIndex], 'Task:', updatedTask);
                        break; // Stop searching after update
                    }
                }
            }
        },
        deleteTaskFromSpace: (state, action: PayloadAction<{ spaceId: string; taskId: string }>) => {
            const { spaceId, taskId } = action.payload;
            for (const folder of state.folders) {
                const spaceIndex = folder.spaces.findIndex(space => space.id === spaceId);
                if (spaceIndex !== -1) {
                    // Filter out the deleted task from the space's tasks array
                    folder.spaces[spaceIndex].tasks = folder.spaces[spaceIndex].tasks.filter(task => task.id !== taskId);
                    console.log(`Task with ID ${taskId} deleted from space ${spaceId} in Redux.`);
                    break; // Stop searching after delete
                }
            }
        },

        updateSubThread: (state, action: PayloadAction<{ spaceId: string, updatedSubThread: SubThread }>) => {
            const { spaceId, updatedSubThread } = action.payload;

            for (const folder of state.folders) {
                const spaceIndex = folder.spaces.findIndex(space => space.id === spaceId);
                if (spaceIndex !== -1) {
                    const subThreadIndex = folder.spaces[spaceIndex].subThreads.findIndex(thread => thread.id === updatedSubThread.id);
                    if (subThreadIndex !== -1) {
                        // **Update the subThread immutably by replacing the old one**
                        state.folders[spaceIndex].spaces[spaceIndex].subThreads[subThreadIndex] = updatedSubThread;
                        console.log('SubThread updated in space in Redux:', folder.spaces[spaceIndex], 'SubThread:', updatedSubThread);
                        break; // Stop searching after update
                    }
                }
            }
        },
        deleteSubThread: (state, action: PayloadAction<{ spaceId: string, topicId: string }>) => {
            const { spaceId, topicId } = action.payload;

            for (const folder of state.folders) {
                const spaceIndex = folder.spaces.findIndex(space => space.id === spaceId);
                if (spaceIndex !== -1) {
                    // **Immutable removal of subThread**
                    folder.spaces[spaceIndex].subThreads = folder.spaces[spaceIndex].subThreads.filter(thread => thread.id !== topicId);
                    console.log('SubThread deleted from space in Redux:', folder.spaces[spaceIndex], 'Topic ID:', topicId);
                    break; // Stop searching after deletion
                }
            }
        },
    
    },
});

export const { setFolders, setSpaces, setSubThreads, setAllData, addSpaceToFolder,  addSubThreadToSpace, deleteFolder,updateFolder, updateSpace, deleteSpace, addTaskToSpace, // already exists - just for context
    updateTaskInSpace, // ADDED
    deleteTaskFromSpace, updateSubThread, deleteSubThread  } = dataSlice.actions;

export default dataSlice.reducer;