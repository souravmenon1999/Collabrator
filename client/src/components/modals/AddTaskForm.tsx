import React, { useState, useEffect, useCallback } from 'react';
import { taskFields, FormField } from '../../types/typess'; // Adjust path as needed
import MultiSelectDropdown from '../MultiSelectDropdown.tsx'; // Adjust path as needed
import axios from 'axios';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store'; // Adjust path as needed
import { selectCurrentFolderSpaces } from '../../redux/selectors'; // Import the memoized selector
import Cookies from 'js-cookie';
import {  addTaskAction, updateTaskAction } from '../../redux/actions/dataActions'; // Import your new actions
import { useDispatch } from 'react-redux';


interface AddTaskFormProps {
    mode: "add" | "edit";
    initialTaskData?: any; // Type this more specifically if you have a Task type
    currentSpaceId: string;
    folderId: string;
    onClose: () => void;
    onSubmitSuccess: (task: any) => void; // Define what data is passed on success
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({
    mode,
    initialTaskData,
    currentSpaceId,
    folderId,
    onClose,
    onSubmitSuccess
}) => {

    const dispatch = useDispatch(); // Get dispatch function


console.log(currentSpaceId);

    const currentFolderSpaces = useSelector((state: RootState) => selectCurrentFolderSpaces(state, folderId)); // Use memoized selector

    const [formData, setFormData] = useState<any>({}); // Use 'any' for now, refine later
    const [formErrors, setFormErrors] = useState<any>({});
    const [linkedSpacesOptions, setLinkedSpacesOptions] = useState<{ value: string, label: string }[]>([]);
    const [selectedLinkedSpaceValues, setSelectedLinkedSpaceValues] = useState<string[]>([]);
    const [assigneeOptions, setAssigneeOptions] = useState<{ value: string, label: string, email: string }[]>([]);
    const [selectedAssigneeValues, setSelectedAssigneeValues] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
   


    useEffect(() => {
        // Initialize form data for ADD mode
        if (mode === 'add') {
            const defaultFormData: any = {};
            taskFields.forEach(field => {
                if (field.id === 'DUEDATE') {
                    defaultFormData[field.id] = { date: '', time: '' }; // Initialize DUEDATE
                } else if (field.id === 'NEXTACTIONDETAILS') {
                    defaultFormData[field.id] = { Activity: '', date: '', time: '' }; // Initialize NEXTACTIONDETAILS
                } else if (field.id === 'SUBTASKS') {
                    defaultFormData[field.id] = []; // Initialize SUBTASKS as empty array
                }
                else {
                    defaultFormData[field.id] = '';
                }
            });
            setFormData(defaultFormData);
        }


        // Fetch spaces for the current folder
        const fetchFolderSpaces = async () => {
            const spaceOptions = currentFolderSpaces.map(space => ({
                value: space.id,
                label: space.name,
            }));
            setLinkedSpacesOptions(spaceOptions);

            // Pre-select current space and make it non-removable in 'add' mode
            if (mode === 'add' && currentSpaceId) {
                setSelectedLinkedSpaceValues([currentSpaceId]);
            }
        };
        fetchFolderSpaces();


        // Initialize form data and selected spaces/assignees for EDIT mode
        if (mode === 'edit' && initialTaskData) {
            setFormData(initialTaskData);


            if (typeof initialTaskData.DUEDATE === 'string' && initialTaskData.DUEDATE) { // Check if DUEDATE is string and not empty
                const formattedDateString = initialTaskData.DUEDATE; // "12 Mar 2025" example
                const dateObject = new Date(formattedDateString); // Parse into Date object
    
                if (!isNaN(dateObject.getTime())) { // Check if parsing was successful (valid Date)
                    const year = dateObject.getFullYear();
                    const month = String(dateObject.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed, pad with 0 if needed
                    const day = String(dateObject.getDate()).padStart(2, '0');      // Pad day with 0 if needed
                    const hours = String(dateObject.getHours()).padStart(2, '0');     // Pad hours
                    const minutes = String(dateObject.getMinutes()).padStart(2, '0');   // Pad minutes
    
                    setFormData(prevFormData => ({ // Update formData with reformatted DUEDATE
                        ...prevFormData,
                        DUEDATE: {
                            date: `${year}-${month}-${day}`, // "YYYY-MM-DD" format
                            time: `${hours}:${minutes}`,      // "HH:mm" format
                        }
                    }));
                } else {
                    console.warn("AddTaskForm: Warning - Could not parse DUEDATE string from backend:", formattedDateString);
                    // Handle case where date string parsing fails (e.g., set default, leave empty)
                }
            }

            // Pre-select linked spaces (assuming initialTaskData.LINKEDSPACES is array of space IDs)
            if (initialTaskData.LINKEDSPACES) {
                setSelectedLinkedSpaceValues(initialTaskData.LINKEDSPACES.map((space: any) => space._id || space)); //Handle both object and ID arrays
            }
            // Pre-select assignees (assuming initialTaskData.ASSIGNEE is array of user IDs or user objects)
            if (initialTaskData.ASSIGNEE) {
                setSelectedAssigneeValues(initialTaskData.ASSIGNEE.map((assignee: any) => assignee.userId?._id || assignee.userId || assignee._id || assignee)); //Handle different structures
            }
            console.log("AddTaskForm in EDIT mode - initialTaskData.DUEDATE:", initialTaskData.DUEDATE); // *** ADD THIS LINE ***
        }


    }, [mode, initialTaskData, currentSpaceId, currentFolderSpaces, folderId]);


    // Fetch assignees based on selected spaces
    useEffect(() => {
        const fetchAssignees = async () => {
            if (selectedLinkedSpaceValues.length > 0) {
                setIsLoading(true);
                try {
                    const response = await axios.post('http://localhost:5000/api/spaces/users', { // Changed to POST and endpoint URL
                        spaceIds: selectedLinkedSpaceValues // Sending spaceIds in request body
                    });
                    setAssigneeOptions(response.data);
                } catch (error) {
                    console.error("Error fetching assignees:", error);
                    // Handle error (e.g., display error message)
                } finally {
                    setIsLoading(false);
                }
            } else {
                setAssigneeOptions([]); // Clear assignee options if no spaces are selected
            }
        };
        fetchAssignees();
    }, [selectedLinkedSpaceValues]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData({ ...formData, [id]: value });
    };

    const handleSubFieldChange = (mainFieldId: string, subFieldId: string, value: any) => {
        setFormData(prevFormData => ({
            ...prevFormData,
            [mainFieldId]: {
                ...prevFormData[mainFieldId],
                [subFieldId]: value,
            }
        }));
    };
    const handleSubtaskChange = (index: number, fieldId: string, value: any) => {
        const updatedSubtasks = formData.SUBTASKS.map((subtask: any, i: number) => {
            if (i === index) {
                return { ...subtask, [fieldId]: value };
            }
            return subtask;
        });
        setFormData({ ...formData, SUBTASKS: updatedSubtasks });
    };

    const handleAddSubtask = () => {
        setFormData({
            ...formData,
            SUBTASKS: [...formData.SUBTASKS, { SUBTASK_TITLE: '', SUBTASK_DESCRIPTION: '' }], // Initialize new subtask fields
        });
    };

    const handleRemoveSubtask = (indexToRemove: number) => {
        const updatedSubtasks = formData.SUBTASKS.filter((_, index) => index !== indexToRemove);
        setFormData({ ...formData, SUBTASKS: updatedSubtasks });
    };


    const handleLinkedSpacesSelect = useCallback((spaceId: string) => {
        if (!selectedLinkedSpaceValues.includes(spaceId)) {
            setSelectedLinkedSpaceValues(prevValues => [...prevValues, spaceId]);
        }
    }, [selectedLinkedSpaceValues]);

    const handleLinkedSpacesRemove = useCallback((spaceIdToRemove: string) => {
        if (currentSpaceId !== spaceIdToRemove) { // Prevent removing current space
            setSelectedLinkedSpaceValues(prevValues => prevValues.filter(id => id !== spaceIdToRemove));
        }
    }, [currentSpaceId, selectedLinkedSpaceValues]);


    const handleAssigneeSelect = useCallback((assigneeId: string) => {
        if (!selectedAssigneeValues.includes(assigneeId)) {
            setSelectedAssigneeValues(prevValues => [...prevValues, assigneeId]);
        }
    }, [selectedAssigneeValues]);

    const handleAssigneeRemove = useCallback((assigneeIdToRemove: string) => {
        setSelectedAssigneeValues(prevValues => prevValues.filter(id => id !== assigneeIdToRemove));
    }, []);


    const validateForm = () => {
        let errors: any = {};
        let isValid = true;

        taskFields.forEach(field => {
            if (field.validationRules?.required && !formData[field.id]) {
                errors[field.id] = `${field.label} is required`;
                isValid = false;
            }
            if (field.validationRules?.futureDate && formData.DUEDATE.date) {
                const selectedDate = new Date(formData.DUEDATE.date);
                const now = new Date();
                if (selectedDate < now) {
                    errors.DUEDATE = "Due Date must be in the future";
                    isValid = false;
                }
            }
        });
        setFormErrors(errors);
        return isValid;
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            const taskDataToSubmit = {
                ...formData,
                LINKEDSPACES: selectedLinkedSpaceValues,
                ASSIGNEE: selectedAssigneeValues.map(userId => ({ userId })), // Format assignees
                userId:  "USER_ID_HERE", // Replace with actual user ID (from auth context)
                spaceId: currentSpaceId, // Or determine how spaceId should be sent - current folderId might not be correct for task's space context
            };

            const email = Cookies.get('userEmail');

            let response;
            if (mode === 'add') {
                response = await axios.post(`http://localhost:5000/api/tasks?email=${email}`, taskDataToSubmit); // add email as params into this
                if (response.status === 201) { // Assuming 201 Created on success
                    dispatch(addTaskAction(currentSpaceId, response.data)); // Dispatch addTaskAction with new task and spaceId
                }
            } else {
                response = await axios.put(`http://localhost:5000/api/tasks/${initialTaskData.id}?email=${email}`, taskDataToSubmit);
                if (response.status === 200) { // Assuming 200 OK on success
                    dispatch(updateTaskAction(currentSpaceId, response.data)); // Dispatch updateTaskAction with updated task and spaceId
                }
            }


            onSubmitSuccess(response.data); // Pass the created/updated task back
            onClose(); // Close the form after successful submission

        } catch (error: any) {
            console.error("Error submitting task:", error);
            // Handle error - display error message to user
            alert("Failed to save task. Please check console for details.");
        } finally {
            setIsLoading(false);
        }
    };


    const renderFormField = (field: FormField, index: number) => {
        switch (field.type) {
            case "text":
                return (
                    <div key={field.id} className="space-y-1">
                        <label htmlFor={field.id} className="text-gray-400 block text-sm">{field.label}</label>
                        <input
                            type="text"
                            id={field.id}
                            placeholder={field.placeholder}
                            className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white"
                            value={formData[field.id] || ''}
                            onChange={handleInputChange}
                        />
                        {formErrors[field.id] && <p className="text-red-500 text-xs">{formErrors[field.id]}</p>}
                    </div>
                );
            case "select":
                return (
                    <div key={field.id} className="space-y-1">
                        <label htmlFor={field.id} className="text-gray-400 block text-sm">{field.label}</label>
                        <select
                            id={field.id}
                            className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white"
                            value={formData[field.id] || ''}
                            onChange={handleInputChange}
                        >
                            <option value="">Select {field.label}</option>
                            {field.options?.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                         {formErrors[field.id] && <p className="text-red-500 text-xs">{formErrors[field.id]}</p>}
                    </div>
                );
            case "boolean":
                return (
                    <div key={field.id} className="flex items-center justify-between">
                        <label htmlFor={field.id} className="text-gray-400 text-sm">{field.label}</label>
                        <input
                            type="checkbox"
                            id={field.id}
                            className="form-checkbox h-5 w-5 text-green-500 rounded border-gray-600 bg-[#202c33] focus:ring-green-500"
                            checked={formData[field.id] || false}
                            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.checked })}
                        />
                    </div>
                );
            case "file":
                return (
                    <div key={field.id} className="space-y-1">
                        <label htmlFor={field.id} className="text-gray-400 block text-sm">{field.label}</label>
                        <input
                            type="file"
                            id={field.id}
                            className="w-full text-white"
                            onChange={handleInputChange} // You'll need to handle file uploads differently
                        />
                    </div>
                );
            case "date":
            case "time":
                if (field.subFields) {
                    return (
                        <div key={field.id} className="space-y-1">
                            <label className="text-gray-400 block text-sm">{field.label}</label>
                            <div className="flex gap-2">
                                {field.subFields.map(subField => (
                                    <div key={subField.id} className="flex-1 space-y-1">
                                        <label htmlFor={`${field.id}-${subField.id}`} className="text-gray-400 block text-xs">{subField.label}</label>
                                        <input
                                            type={subField.type}
                                            id={`${field.id}-${subField.id}`}
                                            className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white text-xs"
                                            value={formData[field.id]?.[subField.id] || ''}
                                            onChange={(e) => handleSubFieldChange(field.id, subField.id, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                             {formErrors[field.id] && <p className="text-red-500 text-xs">{formErrors[field.id]}</p>}
                        </div>
                    );
                }
                return null; // Should not reach here for date/time without subFields
            case "custom":
                if (field.id === "LINKEDSPACES") {
                    console.log("LINKEDSPACES options prop:", linkedSpacesOptions); // ADD THIS LINE

                    return (
                        <div key={field.id} className="space-y-1">
                            <label className="text-gray-400 block text-sm">{field.label}</label>
                            <MultiSelectDropdown
                                options={linkedSpacesOptions}
                                selectedValues={selectedLinkedSpaceValues}
                                onSelect={handleLinkedSpacesSelect}
                                onRemove={handleLinkedSpacesRemove}
                            />
                        </div>
                    );
                } else if (field.id === "ASSIGNEE") {
                    console.log("ASSIGNEE options prop:", assigneeOptions); // ADD THIS LINE

                    return (
                        <div key={field.id} className="space-y-1">
                            <label className="text-gray-400 block text-sm">{field.label}</label>
                            <MultiSelectDropdown
                                options={assigneeOptions}
                                selectedValues={selectedAssigneeValues}
                                onSelect={handleAssigneeSelect}
                                onRemove={handleAssigneeRemove}
                            />
                        </div>
                    );
                }
                return null; // Handle other custom fields if needed
            default:
                 // Add a default case to handle fields without explicit types if necessary
                if (field.id === "DUEDATE") { // **Handle DUEDATE by ID here**
                      return (
                          <div key={field.id} className="space-y-1">
                              <label className="text-gray-400 block text-sm">{field.label}</label>
                              <div className="flex gap-2">
                                  {field.subFields?.map(subField => ( // **Use optional chaining for subFields**
                                      <div key={subField.id} className="flex-1 space-y-1">
                                          <label htmlFor={`${field.id}-${subField.id}`} className="text-gray-400 block text-xs">{subField.label}</label>
                                          <input
                                              type={subField.type}
                                              id={`${field.id}-${subField.id}`}
                                              className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white text-xs"
                                              value={formData[field.id]?.[subField.id] || ''}
                                              onChange={(e) => handleSubFieldChange(field.id, subField.id, e.target.value)}
                                          />
                                      </div>
                                  ))}
                              </div>
                               {formErrors[field.id] && <p className="text-red-500 text-xs">{formErrors[field.id]}</p>}
                          </div>
                      );
                  }
                  return null;
        }
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-1"  >
            <div className="bg-[#111b21] rounded-2xl w-full max-w-3xl mx-auto shadow-lg">
                <div className="p-4 border-b border-gray-600">
                    <h2 className="text-lg text-white">{mode === "add" ? "Add New Task" : "Edit Task"}</h2>
                </div>
                <form onSubmit={handleSubmit} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 max-h-[70vh] overflow-y-auto">
                    {taskFields.slice(0, 5).map(renderFormField)} {/* Render first 5 fields in first column */}


                    <div className="space-y-4">
                        {taskFields.slice(5, 10).map(renderFormField)} {/* Render fields 6-10 in second column */}

                        {/* Subtasks Section */}
                        <div className="space-y-2">
                            <label className="text-gray-400 block text-sm">Subtasks</label>
                            {formData.SUBTASKS && formData.SUBTASKS.map((subtask: any, index: number) => (
                                <div key={index} className="flex gap-2 mb-2">
                                    <div className="flex-1 space-y-1">
                                        <label htmlFor={`subtask-title-${index}`} className="text-gray-400 block text-xs">Title</label>
                                        <input
                                            type="text"
                                            id={`subtask-title-${index}`}
                                            placeholder="Subtask Title"
                                            className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white text-xs"
                                            value={subtask.SUBTASK_TITLE || ''}
                                            onChange={(e) => handleSubtaskChange(index, 'SUBTASK_TITLE', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <label htmlFor={`subtask-description-${index}`} className="text-gray-400 block text-xs">Description</label>
                                        <input
                                            type="text"
                                            id={`subtask-description-${index}`}
                                            placeholder="Subtask Description"
                                            className="w-full p-2 border border-gray-600 rounded-lg bg-[#202c33] text-white text-xs"
                                            value={subtask.SUBTASK_DESCRIPTION || ''}
                                            onChange={(e) => handleSubtaskChange(index, 'SUBTASK_DESCRIPTION', e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="p-2 text-red-400 hover:text-red-500"
                                        onClick={() => handleRemoveSubtask(index)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            <button type="button" className="text-green-400 hover:text-green-500 text-sm" onClick={handleAddSubtask}>
                                + Add Subtask
                            </button>
                        </div>

                        {taskFields.slice(10).map(renderFormField)} {/* Render remaining fields in second column */}
                    </div>


                </form>
                <div className="p-4 border-t border-gray-600 flex justify-between">
                    <button className="w-1/2 text-center text-red-400 font-medium py-2" onClick={onClose}>
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="w-1/2 text-center text-green-400 font-medium py-2 border-l border-gray-600" disabled={isLoading}>
                        {isLoading ? "Saving..." : "Done"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddTaskForm;