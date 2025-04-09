import React, { useState, useEffect, useCallback } from 'react';
import MultiSelectDropdown from '../MultiSelectDropdown.tsx'; // Adjust path as needed
import axios from 'axios';
import Cookies from 'js-cookie';
import { useDispatch } from 'react-redux';
import { addSubThreadToSpaceAction, updateSubThreadAction } from '../../redux/actions/dataActions.ts'; // Import updateSubThreadAction


// Modified interface to include formContext
interface AddTopicFormProps {
    mode: "add" | "edit"; // Keep existing mode for add/edit topic
    formContext: "addTopic" | "editTopic" | "addMember"; // New prop for form context
    initialTopicData?: any;
    currentSpaceId: string;
    onClose: () => void;
    onSubmitSuccess: (topic: any) => void;
}

const AddTopicForm: React.FC<AddTopicFormProps> = ({
    mode,
    formContext, // New prop
    initialTopicData,
    currentSpaceId,
    onClose,
    onSubmitSuccess
}) => {

    const dispatch = useDispatch();
    const [topicName, setTopicName] = useState<string>(initialTopicData?.TOPIC || ''); // Initialize from initialTopicData for all contexts
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [memberOptions, setMemberOptions] = useState<{ value: string, label: string, email: string }[]>([]);
    const [apiError, setApiError] = useState<string | null>(null);


    const isEditMode = mode === 'edit';
    let formTitle = "New Topic"; // Default form title
    let submitButtonText = "Done"; // Default submit button text
    const isTopicNameEditable = formContext !== "addMember"; // Topic name editable based on formContext

    if (formContext === 'editTopic') {
        formTitle = "Edit Topic";
        submitButtonText = "Update";
    } else if (formContext === 'addMember') {
        formTitle = "Add Members to Topic";
        submitButtonText = "Add Members"; // Or "Done", adjust as needed
    }


    // **useEffect 1: Fetch Space Members - Runs only when currentSpaceId changes (or on mount)**
    useEffect(() => {
        const fetchSpaceMembers = async () => {
            try {
                const response = await axios.post('http://localhost:5000/api/spaces/users', {
                    spaceIds: [currentSpaceId]
                });
                console.log(currentSpaceId);
                console.log(response.data);
                setMemberOptions(response.data);
                setApiError(null);
            } catch (error: any) {
                console.error("Error fetching space members:", error);
                setApiError("Failed to load space members. Please try again.");
            }
        };

        if (currentSpaceId) { // Fetch members only if currentSpaceId is available
            fetchSpaceMembers();
        }
    }, [currentSpaceId]); // Dependency array: only currentSpaceId


    // **useEffect 2: Initialize Form Fields - Runs when mode, initialTopicData, formContext, or memberOptions changes**
    useEffect(() => {
        if (isEditMode && initialTopicData) {
            setTopicName(initialTopicData.TOPIC || '');
            console.log('kicked');

            if (initialTopicData.members && Array.isArray(initialTopicData.members)) {
                const initialMemberIds = initialTopicData.members;
                console.log(initialMemberIds, 'members initial');
                console.log(memberOptions, 'options');

                // Synchronize selected members only AFTER memberOptions are available
                if (memberOptions.length > 0) { // Check if memberOptions are loaded
                    const selectedMemberIds = memberOptions.filter(option =>
                        initialMemberIds.includes(option.value)
                    ).map(option => option.value);
                    console.log(selectedMemberIds);
                    
                    setSelectedMembers(selectedMemberIds);
                } else {
                    // Handle case where memberOptions are not yet loaded, but initialTopicData has members (optional - you might want to show a loading state or handle this differently)
                    console.warn("Member options not yet loaded, cannot pre-select members.");
                    setSelectedMembers([]); // Or keep it empty and rely on options loading later
                }


            } else {
                setSelectedMembers([]);
            }
        } else if (mode === 'add') {
            setSelectedMembers([]);
        }

    }, [mode, initialTopicData, isEditMode, formContext, memberOptions]); // Dependency array: mode, initialTopicData, formContext, memberOptions // Dependencies: mode, initialTopicData, isEditMode, memberOptions, formContext
// Added formContext to dependency array


    const handleTopicNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTopicName(e.target.value);
    };

    const handleMemberSelect = useCallback((memberId: string) => {
        if (!selectedMembers.includes(memberId)) {
            setSelectedMembers(prevValues => [...prevValues, memberId]);
        }
    }, [selectedMembers]);

    const handleMemberRemove = useCallback((memberIdToRemove: string) => {
        setSelectedMembers(prevValues => prevValues.filter(id => id !== memberIdToRemove));
    }, []);


    const handleSubmit = async () => {
        console.log('Submit button clicked in mode:', mode, 'and formContext:', formContext); // Debug log

        setApiError(null);

        const email = Cookies.get('userEmail');

        if (!email) {
            setApiError("User email not found. Please ensure you are logged in.");
            return;
        }


        const topicData = {
            spaceId: currentSpaceId,
            name: topicName,
            email: email,
            members: selectedMembers
        };

        if (mode === 'add') {
            try {
                console.log('Adding topic:', topicData);
                const response = await axios.post('http://localhost:5000/api/topics/add', topicData);
                onSubmitSuccess(response.data);
                dispatch(addSubThreadToSpaceAction(currentSpaceId, response.data)); // Dispatch action to update Redux
                onClose();
            } catch (error: any) {
                console.error("Error adding topic:", error.response?.data.message || error.message);
                setApiError(error.response?.data.message || "Failed to add topic. Please try again.");
            }
        } else if (mode === 'edit' && formContext === 'editTopic') { // **Edit Topic Mode**
            if (!initialTopicData?.id) {
                console.error("Topic ID is missing for edit mode.");
                setApiError("Cannot edit topic: Topic ID is missing.");
                return;
            }
            try {
                const topicId = initialTopicData.id;
                console.log('Editing topic:', topicData, 'topicId:', topicId);
                const response = await axios.put(`http://localhost:5000/api/topics/${topicId}`, topicData);
                onSubmitSuccess(response.data);
                dispatch(updateSubThreadAction(currentSpaceId, response.data)); // Dispatch update action
                onClose();
            } catch (error: any) {
                console.error("Error editing topic:", error.response?.data.message || error.message);
                setApiError(error.response?.data.message || "Failed to edit topic. Please try again.");
            }
        } else if (mode === 'edit' && formContext === 'addMember') { // **Add Member Mode**
            if (!initialTopicData?.id) {
                console.error("Topic ID is missing for add member mode.");
                setApiError("Cannot add members: Topic ID is missing.");
                return;
            }
            try {
                const topicId = initialTopicData.id;
                console.log('Adding members to topic:', topicData, 'topicId:', topicId);
                const response = await axios.put(`http://localhost:5000/api/topics/${topicId}/members`, topicData); // **New backend endpoint needed: /api/topics/:topicId/members**
                onSubmitSuccess(response.data);
                dispatch(updateSubThreadAction(currentSpaceId, response.data)); // Dispatch update action
                onClose();
            } catch (error: any) {
                console.error("Error adding members to topic:", error.response?.data.message || error.message);
                setApiError(error.response?.data.message || "Failed to add members to topic. Please try again.");
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-1">
            <div className="bg-[#111b21] rounded-2xl w-full max-w-3xl mx-auto shadow-lg">
                <div className="p-4 border-b border-gray-600">
                    <h2 className="text-lg text-white">{formTitle}</h2>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-4">
                        <div>
                            <label className="text-gray-400 block mb-1">Topic Name</label>
                            <input
                                type="text"
                                placeholder="Enter topic name"
                                className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white"
                                value={topicName}
                                onChange={handleTopicNameChange}
                                id="topicName"
                                readOnly={!isTopicNameEditable} // **Conditionally set readOnly**
                            />
                        </div>
                         <div>
                            <label className="text-gray-400 block mb-1">Members</label>
                            <MultiSelectDropdown
                                options={memberOptions}
                                selectedValues={selectedMembers}
                                onSelect={handleMemberSelect}
                                onRemove={handleMemberRemove}
                            />
                        </div>
                    </div>
                     {apiError && (
                        <div className="text-red-500 col-span-full">
                            {apiError}
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-gray-600 flex justify-between">
                    <button className="w-1/2 text-center text-red-400 font-medium py-2" onClick={onClose}>
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="w-1/2 text-center text-green-400 font-medium py-2 border-l border-gray-600">
                        {submitButtonText} {/* Dynamic button text */}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddTopicForm;