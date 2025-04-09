import React, { useState, useEffect, useCallback } from 'react';
import { spaceFields, FormField, Space } from '../../types/types';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../redux/store';
import { updateSpaceAction } from '../../redux/actions/dataActions';
import MultiSelectDropdown from '../MultiSelectDropdown.tsx';
import axios from 'axios';

interface EditSpaceModalProps {
    spaceId: string;
    folderId: string;
    onClose: () => void;
}

const EditSpaceModal: React.FC<EditSpaceModalProps> = ({ spaceId, folderId, onClose }) => {
    const dispatch = useDispatch();
    const space = useSelector((state: RootState) => {
        const folder = state.data.folders.find(f => f.id === folderId);
        return folder?.spaces.find(s => s.id === spaceId);
    });

    const [formData, setFormData] = useState<{ spaceName: string, description: string, members: string[] }>({
        spaceName: '',
        description: '',
        members: [],
    });
    const [spaceMembersOptions, setSpaceMembersOptions] = useState<{ value: string, label: string, email: string }[]>([]); // For EXISTING space members (we might not need this state anymore directly)
    const [allUsersOptions, setAllUsersOptions] = useState<{ value: string, label: string, email: string }[]>([]);     // NEW: For ALL users
    const [isLoadingMembers, setIsLoadingMembers] = useState(true);
    const [errorLoadingMembers, setErrorLoadingMembers] = useState<string | null>(null);


    useEffect(() => {
        if (spaceId) {
            fetchSpaceDetailsAndMembers(spaceId);
        }
        fetchAllUsers(); // Fetch all users when modal mounts
    }, [spaceId]);

    const fetchSpaceDetailsAndMembers = useCallback(async (spaceIdToFetch: string) => {
        setIsLoadingMembers(true);
        setErrorLoadingMembers(null);
        try {
            const membersResponse = await axios.get(`http://localhost:5000/api/spaces/${spaceIdToFetch}/members`);
            console.log("API Response for space members:", membersResponse.data); // Log API response
            const membersOptions = membersResponse.data; // Already in correct format

            // We might not need to set spaceMembersOptions separately anymore if we only use allUsersOptions for the dropdown
            // setSpaceMembersOptions(membersOptions);

            if (space) {
                setFormData({
                    spaceName: space.name || '',
                    description: space.description || '',
                    members: membersOptions.map(member => member.value) || [], // Initialize with existing member IDs for pre-selection
                });
            }

        } catch (error: any) {
            console.error("Error fetching space details and members:", error);
            setErrorLoadingMembers("Failed to load space members.");
        } finally {
            setIsLoadingMembers(false);
        }
    }, [space]);


    const fetchAllUsers = useCallback(async () => {
        setIsLoadingMembers(true); // Or consider separate loading state for all users
        setErrorLoadingMembers(null);
        try {
            const usersResponse = await axios.get('http://localhost:5000/api/users');
            console.log("API Response for all users:", usersResponse.data); // Log API response
            const usersOptions = usersResponse.data.map(user => ({
                value: user.id, // Adjust based on your user object structure
                label: user.name,
                email: user.email,
            }));
            setAllUsersOptions(usersOptions);
        } catch (error: any) {
            console.error("Error fetching all users:", error);
            setErrorLoadingMembers("Failed to load all users.");
        } finally {
            setIsLoadingMembers(false); // Or set loading state to false
        }
    }, []);


    const handleMemberSelect = useCallback((memberId: string) => {
        setFormData(prevState => {
            // Check if the memberId is already in the members array
            if (prevState.members.includes(memberId)) {
                // Optionally, you can provide feedback to the user here, e.g., an alert:
                alert("Member is already added to the space.");
                return prevState; // Return the previous state without adding the duplicate
            } else {
                // Member is not already in the list, so add it
                return {
                    ...prevState,
                    members: [...prevState.members, memberId],
                };
            }
        });
    }, []);

    const handleMemberRemove = useCallback((memberIdToRemove: string) => {
        setFormData(prevState => ({
            ...prevState,
            members: prevState.members.filter(memberId => memberId !== memberIdToRemove),
        }));
    }, []);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.spaceName) {
            alert("Space Name is required.");
            return;
        }
    
        if (spaceId && folderId) {
            const updatedSpaceData = {
                id: spaceId, // Include spaceId in the data sent to backend
                folderId: folderId,
                name: formData.spaceName,
                description: formData.description,
                members: formData.members, // Send selected member IDs
            };
            try {
                await axios.put(`http://localhost:5000/api/spaces/${spaceId}`, updatedSpaceData); // PUT request to update route
                dispatch(updateSpaceAction(spaceId, updatedSpaceData)); // Update Redux state if needed
                onClose();
            } catch (error) {
                console.error("Error updating space:", error);
                alert("Failed to update space."); // Or better error handling
            }
        } else {
            console.error("Space ID or Folder ID missing for edit operation.");
        }
    };
    if (!space || isLoadingMembers) {
        return <div>Loading space details...</div>;
    }
    if (errorLoadingMembers) {
        return <div>Error: {errorLoadingMembers}</div>;
    }


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-1">
            <div className="bg-[#111b21] rounded-2xl w-full max-w-3xl mx-auto shadow-lg">
                <div className="p-4 border-b border-gray-600">
                    <h2 className="text-lg text-white">Edit Space</h2>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-4">
                        <div>
                            <label className="text-gray-400 block mb-1">Space Name</label>
                            <input
                                type="text"
                                id="spaceName"
                                name="spaceName"
                                placeholder="Enter space name"
                                className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white"
                                value={formData.spaceName}
                                onChange={handleChange}
                            />
                        </div>
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
                    <div className="space-y-4">
                        <div>
                            <label className="text-gray-400 block mb-1">Members</label>
                            <MultiSelectDropdown
                                options={allUsersOptions} // Use allUsersOptions now for all users
                                selectedValues={formData.members} // These are the pre-selected (existing space members)
                                onSelect={handleMemberSelect}
                                onRemove={handleMemberRemove}
                            />
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-gray-600 flex justify-between">
                    <button className="w-1/2 text-center text-red-400 font-medium py-2" onClick={onClose}>
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="w-1/2 text-center text-green-400 font-medium py-2 border-l border-gray-600">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditSpaceModal;