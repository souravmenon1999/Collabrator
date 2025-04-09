export interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  toggleable?: boolean;
  options?: { value: string, label: string }[];
  subFields?: FormField[];
  searchable?: boolean;
  validationRules?: {
    required?: boolean;
    // You can add other rules later if needed
  }; // Corrected: Removed extra comma
}
export const taskFields: FormField[] = [
  {
    id: "TITLE",
    type: "text",
    label: "Task Title",
    placeholder: "Enter task title",
    validationRules: { // Add validation rules for "Task Title" - MAKE IT REQUIRED
      required: true,
    }, // <-- COMMA was ALREADY HERE - the issue is on the line ABOVE
  },
  { id: "DESCRIPTION", type: "text", label: "Description", placeholder: "Enter description", validationRules: { // Add validation rules for "Description" (assuming user intended this field to have validation too)
    required: true, // Or whatever validation rule is intended
  }, },
  {
    id: "DUEDATE",
    label: "Due Date",
    subFields: [
      {
        id: "date",
        type: "date",
        label: "Date",
        validationRules: { // validationRules is a separate property here
          required: true,
        },
      },
      {
        id: "time",
        type: "time",
        label: "Time",
        validationRules: { // validationRules is a separate property here
          required: true,
        },
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
  { id: "ASSIGNEE", type: "select", label: "Assignee", placeholder: "Enter assignee", searchable: true , options: []},
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

export const folderFields: FormField[] = [
  { id: "folderName", type: "text", label: "Folder Nam", placeholder: "Enter folder name" },
  { id: "description", type: "text", label: "Description", placeholder: "Enter description" }
];

/* export const spaceFields: FormField[] = [
  { id: "spaceName", type: "text", label: "Space Name", placeholder: "Enter space name" },
  { id: "owner", type: "text", label: "Owner", placeholder: "Enter owner name" }
]; */

// types/types.ts

// In your types/types.ts, update spaceFields:
export const spaceFields: FormField[] = [
  { 
      id: "spaceName", 
      type: "text", 
      label: "Space Name", 
      placeholder: "Enter space name" 
  },
  {
      id: "owner",
      type: "select",
      label: "Add Members",
      options: [],
      searchable: true,
       // Will be populated dynamically
  },
];;

export const topicFields: FormField[] = [
  { id: "topicName", type: "text", label: "Topic Name", placeholder: "Enter topic name" }
];


// types/types.ts
export interface SubThread {
  id: string;
  title: string;
  messages: Message[];
  unread: number;
  spaceId: string;
}
export interface Space {
  id: string;
  name: string;
  folderId: string;
  subThreads: string[]; // array of subThread IDs
  created: string; // Date string for when the space was created
}


export interface Folder {
  id: string;
  name: string;
  isExpanded: boolean;
  spaces: string[]; // array of space IDs
  created: string;
  author: string;
  lastActivity?: string;
  hasNotification?: boolean;
  unreadCount?: number;
}

// Redux state shape
export interface AppState {
  folders: {
    byId: { [key: string]: Folder };
    allIds: string[];
  };
  spaces: {
    byId: { [key: string]: Space };
    allIds: string[];
  };
  subThreads: {
    byId: { [key: string]: SubThread };
    allIds: string[];
  };
}