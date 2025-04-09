// src/redux/selectors.ts
import { createSelector } from 'reselect';
import { RootState } from './store'; // Adjust path to your store

const selectFolders = (state: RootState) => state.data.folders;
const selectFolderId = (_state: RootState, folderId: string | undefined) => folderId; // Selector to get folderId prop

export const selectCurrentFolderSpaces = createSelector(
    [selectFolders, selectFolderId], // Input selectors
    (folders, folderId) => {       // Transformation function
        if (!folderId) return []; // Handle case where folderId is undefined

        const folder = folders.find(f => f.id === folderId);
        return folder?.spaces || [];
    }
);