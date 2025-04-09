// src/EditFolderModal.tsx
import React, { useState, useEffect } from 'react';
import { folderFields, FormField, Folder } from '../types/types';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './redux/store';
import { updateFolderAction } from '../../redux/actions/dataActions'; // Import the new action

interface EditFolderModalProps {
    folderId: string;
    onClose: () => void;
}

const EditFolderModal: React.FC<EditFolderModalProps> = ({ folderId, onClose }) => {
    const dispatch = useDispatch();
    const folder = useSelector((state: RootState) =>
        state.data.folders.find(f => f.id === folderId)
    );

    const [formData, setFormData] = useState<{ folderName: string, description: string }>({
        folderName: '',
        description: '',
    });

    useEffect(() => {
        if (folder) {
            setFormData({
                folderName: folder.name || '',
                description: folder.description || '',
            });
        }
    }, [folder]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Basic validation - you can add more robust validation if needed
        if (!formData.folderName) {
            alert("Folder Name is required.");
            return;
        }

        if (folderId) {
            const updatedFolderData = {
                id: folderId,
                name: formData.folderName,
                description: formData.description,
                // ... any other fields you want to update
            };
            dispatch(updateFolderAction(folderId, updatedFolderData)); // Dispatch update action
            onClose(); // Close modal after submit
        } else {
            console.error("Folder ID is missing for edit operation.");
        }
    };

    if (!folder) {
        return <div>Loading folder details...</div>; // Or handle loading/error state
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-1">
            <div className="bg-[#111b21] rounded-2xl w-full max-w-3xl mx-auto shadow-lg">
                <div className="p-4 border-b border-gray-600">
                    <h2 className="text-lg text-white">Edit Folder</h2> {/* Changed title to Edit Folder */}
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-4">
                        <div>
                            <label className="text-gray-400 block mb-1">Folder Name</label>
                            <input
                                type="text"
                                id="folderName"
                                name="folderName"
                                placeholder="Enter folder name"
                                className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white"
                                value={formData.folderName}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-gray-400 block mb-1">Description</label>
                            <input
                                type="text"
                                id="description"
                                name="description"
                                placeholder="Enter description"
                                className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-gray-600 flex justify-between">
                    <button className="w-1/2 text-center text-red-400 font-medium py-2" onClick={onClose}> {/* Changed button text to Cancel and added onClick */}
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="w-1/2 text-center text-green-400 font-medium py-2 border-l border-gray-600"> {/* Changed button text to Done and added onClick */}
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditFolderModal;