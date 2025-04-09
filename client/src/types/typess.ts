export interface FormField {
    id: string;
    type: "text" | "select" | "boolean" | "file" | "date" | "time" | "custom"; // Added "custom" type
    label: string;
    placeholder?: string;
    validationRules?: {
        required?: boolean;
        futureDate?: boolean; // For Due Date Validation
    };
    options?: { value: string; label: string }[];
    subFields?: FormField[];
    searchable?: boolean;
    toggleable?: boolean;
}

export const taskFields: FormField[] = [
    {
        id: "TITLE",
        type: "text",
        label: "Task Title",
        placeholder: "Enter task title",
        validationRules: {
            required: true,
        },
    },
    {
        id: "DESCRIPTION",
        type: "text",
        label: "Description",
        placeholder: "Enter description",
        validationRules: {
            required: true,
        },
    },
    {
        id: "DUEDATE",
        label: "Due Date",
        validationRules: {
            required: true,
            futureDate: true, // Add future date validation rule
        },
        subFields: [
            {
                id: "date",
                type: "date",
                label: "Date",
            },
            {
                id: "time",
                type: "time",
                label: "Time",
            },
        ],
    },
    {
        id: "NEXTACTIONDETAILS",
        label: "Next Action Details",
        subFields: [
            { id: "Activity", type: "text", label: "Activity" },
            { id: "date", type: "date", label: "Date" },
            { id: "time", type: "time", label: "Time" },
        ],
    },
    {
        id: "LINKEDSPACES",
        type: "custom", // Custom field for MultiSelectDropdown
        label: "Linked Spaces",
    },
    {
        id: "ASSIGNEE",
        type: "custom", // Custom field for MultiSelectDropdown
        label: "Assignee",
    },
    { id: "LOCATION", type: "text", label: "Location", placeholder: "Enter location" },
    { id: "FLAG", type: "boolean", label: "Flag", toggleable: true },
    {
        id: "SUBTASKS",
        label: "Subtasks",
        subFields: [
            { id: "SUBTASK_TITLE", type: "text", label: "Subtask Title", placeholder: "Enter subtask title" },
            { id: "SUBTASK_DESCRIPTION", type: "text", label: "Subtask Description", placeholder: "Enter subtask description" },
        ],
    },
    {
        id: "PRIORITY",
        type: "select",
        label: "Priority",
        options: [
            { value: "None", label: "None" },
            { value: "High", label: "High" },
            { value: "Medium", label: "Medium" },
            { value: "Low", label: "Low" },
        ],

    },
    {
        id: "LIST",
        type: "select",
        label: "Category",
        options: [
            { value: "EMI", label: "EMI" },
            { value: "High", label: "High" },
            { value: "Medium", label: "Medium" },
            { value: "Low", label: "Low" },
        ],

    },
    { id: "IMAGE", type: "file", label: "Image Upload" },
];