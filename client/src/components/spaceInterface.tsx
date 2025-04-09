import React, { useState, useEffect } from "react";
import 'font-awesome/css/font-awesome.min.css';
import { useModal } from "../context/ModalContext";
import { folderFields } from "../types/types"; // Assuming you have this import, if not remove duplicate
import { RootState } from "../redux/store";
import { useSelector } from "react-redux";
import { log } from "console";
import UpdateListener from "./updateListener";
import { taskFields } from "../types/types"; // Assuming you have this import
import EditSpaceModal from "./modals/EditSpaceModal";
import { deleteSpaceAction } from "../redux/actions/dataActions"; // Import deleteSpaceAction
import { useDispatch } from "react-redux";
import AddTaskForm from "./modals/AddTaskForm";
import ChatTabContent from "./ChatTabContent";
import axios from "axios";
import { deleteTaskAction, deleteSubThreadAction } from "../redux/actions/dataActions";
import AddTopicForm from "./modals/AddTopicForm";
import { db } from '../firebaseConfig'; // Import your Firebase config
import { getDatabase, ref, set, onDisconnect } from 'firebase/database'; // Import RDB functions
import { initiateAudioCall, initiateVideoCall } from "../utils/callController";
import { useCallModal } from "../context/CallModalContext";

import {
  collection,
  deleteDoc,
  getDocs,
  doc,
  getDoc,
  orderBy,
  query,
  startAfter,
  limit,
  serverTimestamp,
  setDoc,
  onSnapshot // Import onSnapshot - NEW IMPORT
} from 'firebase/firestore';
import Cookies from 'js-cookie';
import { useTotalUnreadCounts } from "../context/TotalUnreadCountsContext";
import { useUnreadCounts } from "../context/UnreadCountsContext";
import { threadId } from "worker_threads";

// Define TypeScript interfaces based on your JSON structure - consistent with previous response
interface Message {
  id: string;
  content: string;
  sender: "user" | "other";
  dueDate: Date|null;
  status: "sent" | "delivered" | "read";
}

interface SubThread {
  id: string;
  id: string;
  topic: string;
  spaceId: string;
  messages: any[];
  unread: any[];
  created: string;
}

interface Task {
  id: string;
  id: string;
  title: string;
  spaceId: string;
  dueDate: string | null;
  priority: string;
  statusCompleted: boolean;
  created: string;
}

interface Folder {
  id: string;
  id: string;
  name: string;
  folderId: string;
  subThreads: SubThread[];
  tasks: Task[];
  created: string;
  description: string;
}

interface TopLevelSpace {
  id: string;
  id: string;
  name: string;
  isExpanded: boolean;
  spaces: Folder[];
  created: string;
}


type SubthreadComponentProps = {
  folderId: string | null | undefined;  // TopLevelSpace ID
  spaceId: string | null | undefined;   // Folder ID
  onClose?: () => void;
};

interface SpaceTasksProps {
  folderId: string; // Assuming you pass folderId to this component
  spaceId: string;  // Assuming you pass spaceId to this component (current space)
  // ... other props
}


const SubthreadComponent: React.FC<SubthreadComponentProps> = ({ folderId, spaceId, onClose }) => {
  console.log("TopLevelSpace ID (folderId):", folderId);
  console.log('SubthreadComponent rendered');
  console.log("Folder ID (spaceId):", spaceId);
  const { unreadCounts ,resetUnread } = useUnreadCounts();
  const rdb = getDatabase(); // Get Realtime Database instance
 

  const { isCallModalVisible, setIsCallModalVisible, callType, setCallType, tokenID, setTokenID, setChannelName, setCallID } = useCallModal();


  const dispatch = useDispatch();

  const { totalUnreadCountsForSpaces, setTotalUnreadCountsForSpaces } = useTotalUnreadCounts(); // Consume the context

  const foldersRedux = useSelector((state: RootState) => state.data.folders) as TopLevelSpace[]; // Explicit type casting
  const [selectedSpace, setSelectedSpace] = useState<Folder | null>(null); // Correct type for selectedSpace
  const [filteredSubThreads, setFilteredSubThreads] = useState<SubThread[]>([]); // Correct type for filteredSubThreads

  const userId = Cookies.get('userId'); // Get userId from cookie

  const [messages, setMessages] = useState<Message>();


  useEffect(() => {
    if (spaceId && folderId) {
      // 1. Find the Top-Level Space:
      const selectedTopLevelSpace = foldersRedux.find(topLevelSpace => topLevelSpace.id === folderId);

      if (selectedTopLevelSpace) {
        // 2. Find the Folder (nested space) within the Top-Level Space:
        const selectedFolder = selectedTopLevelSpace.spaces.find(folder => folder.id === spaceId);

        if (selectedFolder) {
          setSelectedSpace(selectedFolder); // Set the selected folder details
        } else {
          setSelectedSpace(null);
          console.warn(`Folder with id ${spaceId} not found in top-level space ${folderId}`);
        }
      } else {
        setSelectedSpace(null);
        console.warn(`Top-level space with id ${folderId} not found`);
      }

      // Filter subThreads based on spaceId (which is actually Folder ID for subThreads)
      const subThreadsResult = subThreads.filter((subthread: SubThread) => subthread.spaceId === spaceId);
      setFilteredSubThreads(subThreadsResult);

    } else {
      setSelectedSpace(null);
      setFilteredSubThreads([]); // Clear filtered subThreads as well
    }
  }, [spaceId, folderId, foldersRedux]);

   // Re-fetch unread counts when selectedSpace or userId changes




  const [startListening, setStartListening] = useState(false);

  const startUpdates = async () => {
    try {
      await fetch('http://localhost:5000/trigger-updates', {
        method: 'POST'
      });
      setStartListening(true);
    } catch (error) {
      console.error('Error starting updates:', error);
    }
  };


  const subThreads = useSelector((state: RootState) => state.data.subThreads) as SubThread[]; // Explicit type casting
  const spaces = useSelector((state: RootState) => state.data.spaces); // You might not need this useSelector for spaces as per corrected logic.

  // The following useEffect for filteredSpaces and filteredSubThreads is now redundant and potentially incorrect
  // because the primary way to filter subThreads and select the space is handled in the corrected useEffect above.
  // You should remove this useEffect to avoid confusion and potential conflicts.

  // useEffect(() => {
  //   if (spaceId) {
  //     // Filter subThreads based on spaceId
  //     const subThreadsResult = subThreads.filter((subthread: { spaceId: string }) => subthread.spaceId === spaceId);

  //     // Filter spaces based on spaceId - This part is likely redundant and might be selecting the wrong thing
  //     const spaceResult = spaces.find((space: { id: string }) => space.id === spaceId) || null;

  //     // Update the state
  //     setFilteredSubThreads(subThreadsResult);
  //     setFilteredSpaces(spaceResult); // You are not using filteredSpaces anywhere in the component

  //     // Debugging logs
  //     console.log("Filtered SubThreads (redundant useEffect):", subThreadsResult);
  //     console.log("Filtered Space (redundant useEffect):", spaceResult);
  //   }
  // }, [spaceId, subThreads, spaces]);


  const [isAddTaskFormOpen, setIsAddTaskFormOpen] = useState(false);
  const [addTaskFormMode, setAddTaskFormMode] = useState<"add" | "edit">("add"); // Default to 'add' mode
  const [taskToEdit, setTaskToEdit] = useState<any | null>(null); // State to hold task data for editing (optional)



  const openAddTaskFormForAdd = (currentSpaceId: string, folderId: string) => {
    setAddTaskFormMode("add");
    setTaskToEdit(null); // Clear any previous task data
    setIsAddTaskFormOpen(true);
};

const openAddTaskFormForEdit = (taskData: any) => {
    setAddTaskFormMode("edit");
    setTaskToEdit(taskData); // Set the task data to be edited
    setIsAddTaskFormOpen(true);
};

const closeAddTaskForm = () => {
    setIsAddTaskFormOpen(false);
    setTaskToEdit(null); // Clear taskToEdit when closing
};

const handleTaskSubmitSuccess = (newTaskOrUpdatedTask: any) => {
    console.log("Task submitted successfully:", newTaskOrUpdatedTask);
    // Here you would typically update your task list in the component's state
    // or trigger a refresh of task data from your data source.
    closeAddTaskForm(); // Close the form after successful submission
};


  console.log("Modal Context:", useModal());
  const { openModal } = useModal();
  const [selectedSubthreadId, setSelectedSubthreadId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"chat" | "tasks">("chat");
  const [isOpen, setIsOpen] = useState(false);
  const [menu, setMenu] = useState(false);

  // Re-fetch unread counts when selectedSpace or userId changes

  useEffect(() => {
    if (selectedSubthreadId) {
      // Reset unread count when the subthread is opened
      resetUnread(selectedSubthreadId);

      // Set user presence in RDB when entering the subthread
      
  
      // Set up listener for the currently open subthread's messages
      const messagesCollectionRef = collection(db, `thread-messages/${selectedSubthreadId}/messages`);
      const q = query(messagesCollectionRef, orderBy('createdAt')); // You might want to add a limit here
  
      const unsubscribeMessages = onSnapshot(q, (snapshot) => {
        const newMessages: Message[] = []; // Correct declaration here!
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            newMessages.push({
              id: change.doc.id,
              ...(change.doc.data() as Message),
            });
          }
        });
        setMessages((prevMessages) => {
          const existingIds = new Set(prevMessages.map((msg) => msg.id));
          const uniqueNewMessages = newMessages.filter((msg) => !existingIds.has(msg.id));
          return [...prevMessages, ...uniqueNewMessages];
        });
      });
  
      return () => {
        unsubscribeMessages();
      };
    } else {
      setMessages([]); // Set to empty array instead of undefined to reset.
    }
  }, [selectedSubthreadId, resetUnread]);

  // const handleSelectSubthread = (id: string) => {
  //   setSelectedSubthreadId((prev) => (prev === id ? null : id)); // Toggle selection
  // };

  const handleTabSelect = (tab: "chat" | "tasks") => {
    setSelectedTab(tab);
  };

  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    // Handle sending message logic
    console.log('Message sent:', message);
    setMessage('');
  };

  const tasks = [ // Mock tasks data for demonstration
    { id: '1', title: 'Task 1', description: 'Description for task 1', dueDate: new Date(), completed: false, assignees: [] },
    { id: '2', title: 'Task 2', description: 'Description for task 2', dueDate: new Date(), completed: true, assignees: [] },
  ];

  console.log(selectedSpace);

  

 const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
 const [editSpaceModalVisible, setEditSpaceModalVisible] = useState(false);
const [spaceIdToEdit, setSpaceIdToEdit] = useState<string | null>(null);


const handleEditSpaceClick = (spaceId: string) => {
  setSpaceIdToEdit(spaceId);
  setEditSpaceModalVisible(true);
};


const handleCloseEditSpaceModal = () => {
  setEditSpaceModalVisible(false);
  setSpaceIdToEdit(null);
};

const handleDeleteSpaceClick = (spaceId: string) => {
  const confirmDelete = window.confirm("Are you sure you want to delete this space? This action is irreversible.");
  if (confirmDelete) {
      dispatch(deleteSpaceAction(spaceId)); // Dispatch deleteSpaceAction
  }
};




const openDropdown = ( spaceId: string, folderId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent folder toggle when dropdown is clicked
    setDropdownOpen( spaceId);
  };
   // Function to CLOSE the dropdown on mouse leave
const closeDropdown = () => {
  setDropdownOpen(null); // Set dropdownOpen to null to close
};

  


const handleDeleteTask = async (taskId: string) => {
  if (!window.confirm("Are you sure you want to delete this task?")) { // Optional confirmation
      return;
  }
  try {

    
      await axios.delete(`http://localhost:5000/api/tasks/${taskId}`);
      console.log(`Task with ID ${taskId} deleted successfully.`);

      dispatch(deleteTaskAction(spaceId, taskId)); // Dispatch deleteTaskAction with spaceId and taskId

      // Update frontend task list - example: refetch tasks after deletion
      // Re-fetch tasks to update the list, or update state more efficiently if possible

      // Or, if you want to update state more directly without refetching:
      // setTasks(currentTasks => currentTasks.filter(task => task._id !== taskId));

  } catch (error: any) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task. See console for details.");
  }
};


const [isTopicFormOpen, setIsTopicFormOpen] = useState(false); // Renamed state variable
  const [topicToEdit, setTopicToEdit] = useState<SubThread | null>(null); // State to hold topic to edit

  const openAddTopicForm = () => { // Renamed function
    setTopicToEdit(null); // Clear topic to edit when adding new
    setIsTopicFormOpen(true);
  };

  const openEditTopicForm = (e: React.MouseEvent, topic: SubThread) => { // New function to open Edit form
    e.preventDefault(); // Prevent tab selection on edit button click
    setTopicToEdit(topic); // Set the topic to be edited
    setIsTopicFormOpen(true); // Open the form
  };


  const closeAddTopicForm = () => { // Renamed function
    setIsTopicFormOpen(false);
    setTopicToEdit(null); // Clear topic to edit when closing form
  };

  const handleTopicSubmitSuccess = (newTopicOrUpdatedTopic: any) => { // Modified to handle both new and updated topics
    console.log("Topic submitted successfully:", newTopicOrUpdatedTopic);
    // Here you would typically update your topic list or refresh data
    closeAddTopicForm(); // Close the form after successful submission
    // **No need to do extra state update here, Redux reducer will handle it**
  };


  const openAddMemberForm = (e: React.MouseEvent, topic: SubThread) => {
    e.preventDefault(); // Prevent tab selection
    setTopicToEdit(topic); // Set the topic we're adding members to
    setIsTopicFormOpen(true); // Open the form
  };


  const handleDeleteTopic = async (e: React.MouseEvent, topicId: string) => {
     // Prevent accidental tab selection
     e.preventDefault();
    e.stopPropagation(); // Prevent list item click if any

    const confirmDelete = window.confirm("Are you sure you want to delete this topic? This action is irreversible.");
    if (!confirmDelete) {
        return; // Do nothing if user cancels
    }

    try {

      const messagesCollectionRef = collection(db, `thread-messages/${topicId}/messages`);
      const querySnapshot = await getDocs(messagesCollectionRef);

      // Delete each document in the collection
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises); // Wait for all deletions to complete
      console.log(`Firestore chats for topic ${topicId} deleted successfully.`);


        await axios.delete(`http://localhost:5000/api/topics/${topicId}`); // **DELETE request to backend**
        console.log(`Topic with ID ${topicId} deleted successfully.`);

        dispatch(deleteSubThreadAction(spaceId, topicId)); // **Dispatch Redux action to delete topic**

        // Optionally, you could refresh the topic list here if needed,
        // but Redux update should ideally handle the UI refresh.

    } catch (error: any) {
        console.error("Error deleting topic:", error);
        alert("Failed to delete topic. See console for details.");
    }
};

const handleSelectSubthread = async (threadId: string) => {
  setSelectedSubthreadId((prev) => (prev === threadId ? null : threadId));
    setSelectedTab('chat');

  e.log(`Set unread count to 0 for thread: ${threadId}, user: ${userId} in handleSelectSubthread`);
  
};

const joinCall = async (threadId: string, threadName: string, callType: "audio" | "video" | null) => {
  setCallType(callType);
  setIsCallModalVisible(true);
  console.log('started');

  let callResult;

  if (callType === 'audio') {
    callResult = await initiateAudioCall({
      folderId: folderId,
      spaceId: spaceId,
      threadId: threadId,
      userId: userId,
      channelName: threadName,
    });
  } else if (callType === 'video') {
    callResult = await initiateVideoCall({
      folderId: folderId,
      spaceId: spaceId,
      threadId: threadId,
      userId: userId,
      channelName: threadName,
    });
  } else {
    setIsCallModalVisible(false);
    console.error('Invalid call type:', callType);
    return;
  }

  console.log(callResult);


  if (callResult?.success && callResult.callId) {
    console.log(`${callType} call initiated successfully:`, callResult);

    console.log(callResult.agoraToken);
    console.log('cool');
    console.log(threadName);
    console.log('call id', callResult.callId);


    setTokenID(callResult.agoraToken); // Assuming your backend returns { agoraToken: '...' }
    setCallID(callResult.callId);

    setChannelName(threadName);

    // You might set channel name directly here as well
  } else {
    setIsCallModalVisible(false);
    console.error(`Failed to initiate ${callType} call`);
  }
};



  return (
    <div className="p-4  h-screen">
      <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4 p-4  rounded-lg shadow-md max-[470px]:mb-0">
      <div className="flex items-center">
        {/* Profile picture */}
        {onClose && (
        <button
          onClick={onClose}
          className="p-2 text-white hover:bg-gray-700"
        >
          <img src="icons/back.svg" alt="Back" className="w-6 h-6" />
        </button>
      )}  <img
          src="data:image/jpeg;base64,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" // Replace with your actual image URL
          alt="Profile"
          className="w-10 h-10 rounded-full mr-4 hidden min-[470px]:block "
        />
        <div className="hidden min-[470px]:block">
        <h1 className="text-xl font-bold mb-2 text-white">
  {selectedSpace && selectedSpace.name ? selectedSpace.name : 'Space Name'} {/* Display space name */}
</h1>
          <p className="text-gray-500 mb-4 text-xs">Last conversation at a time</p>
        </div>
      </div>
      <div className="flex items-center space-x-4">
      <div className="relative">
      {/* Dropdown for small screens */}


      {/* Visible Icons for larger screens */}
      <div className=" flex gap-4">
        {/* Audio Call Icon */}
        <button className="text-blue-500 hover:text-blue-700">
          <img src="icons/phone.svg" alt="Audio Call" className="w-6 h-6" />
        </button>
        {/* Video Call Icon */}
        <button className="hover:text-green-700">
          <img  src="icons/camera.svg" alt="Video Call" className="w-6 h-6 text-white hover:text-blue-200 cursor-pointer hover:bg-blue-900 rounded" />
        </button>

      </div>
    </div>
        {/* Three Dots Menu */}
        <button className=" hover:text-gray-700" onMouseEnter={(e) => openDropdown( spaceId, folderId, e)} // Open folder dropdown on hover
        >
        <img className="w-6 h-6 text-white hover:text-blue-200 cursor-pointer hover:bg-blue-900 rounded" src="icons/dots.svg" alt="" /> {/* Replace with an icon */}
        </button>
      </div>



      {dropdownOpen === spaceId && (
                    <div               onMouseLeave={closeDropdown} // **Correct Placement: on the dropdown content div**
                    className="absolute right-[33px] mt-[107px]  w-48 bg-[#202c33] rounded-md shadow-xl z-9">
                    <button
        className="block px-4 py-2 text-sm text-gray-200 hover:bg-blue-500 w-full text-left"
        // onClick={(e) => {
        //   e.stopPropagation();
          
        //   handleEditFolder(folder);
        // }}
        onClick={() => handleEditSpaceClick(spaceId)}
      >
        Edit Folder
      </button>
                      <button
                className="block px-4 py-2 text-sm text-gray-200 hover:bg-red-500 w-full text-left"
                onClick={(e) => {
                    
                    // Call handleDeleteFolder and PASS folder.id as argument
                    handleDeleteSpaceClick(spaceId)
                }}
            >
                Delete Folder
            </button>
                    </div>

                                    

                  )}





    </div>

    {editSpaceModalVisible && spaceIdToEdit && folderId && (
  <EditSpaceModal
    spaceId={spaceIdToEdit}
    folderId={folderId}
    onClose={handleCloseEditSpaceModal}
  />
)}
    <div className="flex flex-row max-[470px]:flex hidden justify-center">

      <div>
      <img
          src="data:image/jpeg;base64,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" // Replace with your actual image URL
          alt="Profile"
          className="w-10 h-10 rounded-full mr-4"
        />
      </div>

   <div >
   <h1 className="text-xl font-bold mb-2 text-white">
 <h1 className="text-xl font-bold mb-2 text-white">
  {selectedSpace && selectedSpace.name ? selectedSpace.name : 'Space Name'} {/* Display space name */}
</h1>
</h1>          <p className="text-gray-500 mb-4 text-xs">Last conversation at a time</p>
        </div>
    </div>
      </div>
      {/* Header Section */}
    <div className="flex gap-1">

    {/* <button onClick={() => 
    
    openModal('addTopic', { spaceId: spaceId })}
    className=" text-xs flex items-center gap-2 px-4 py-2 mb-3 text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all">
  
  Create Topic
</button> */}
<button onClick={openAddTopicForm} className=" text-xs flex items-center gap-2 px-4 py-2 mb-3 text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
       
        Add Topic
    </button>
    <button
        onClick={startUpdates}
        className="text-xs flex items-center gap-2 px-4 py-2 mb-3 text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
      >
        Start Updates
      </button>
    

<button onClick={() => openAddTaskFormForAdd(spaceId, folderId)} className="px-4 py-2 mb-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all"> {/* Replace currentSpaceId and folderId with your actual values */}
                Add New Task
            </button>
     

    </div>
    {isTopicFormOpen && (
        <AddTopicForm
          mode={topicToEdit ? "edit" : "add"} // Determine mode based on topicToEdit
          initialTopicData={topicToEdit}      // Pass topic data for edit mode (can be null for add)
          currentSpaceId={spaceId || ""}
          onClose={closeAddTopicForm}
          onSubmitSuccess={handleTopicSubmitSuccess}
        />
      )}

    {isAddTaskFormOpen && (
                <AddTaskForm
                    mode={addTaskFormMode}
                    initialTaskData={taskToEdit}
                    currentSpaceId={spaceId} // Pass the relevant currentSpaceId and folderId
                    folderId={folderId}
                    onClose={closeAddTaskForm}
                    onSubmitSuccess={handleTaskSubmitSuccess}
                />
            )}

      <UpdateListener startListening={startListening} />
      {/* Top Tiles Section */}
      <div className="flex gap-4 mb-9 bg-green overflow-auto scrollbar-hidden text-sm w-full">
      {selectedSpace && selectedSpace.subThreads && ( // Conditional rendering: check if selectedSpace and subThreads exist
  selectedSpace.subThreads.map((sub) => (  // Now map over selectedSpace.subThreads
    <button
      key={sub.id}
      className={`p-2 rounded-lg flex-shrink-0 ${
        selectedSubthreadId === sub.id
          ? "bg-[#384a6b] text-white"
          : "bg-[#191919] text-[#c4c6ca]"
      }`}
      onClick={() => handleSelectSubthread(sub.id)}
    >
      {sub.TOPIC} {/* Use sub.topic, as "title" might not be the correct property for subthreads */}
      {sub.unread > 0 && (
        <span className="ml-2 text-xs bg-[#4a66ff] text-white px-2 py-0.5 rounded-full">
          {sub.unread}
        </span>
      )}
    </button>
  ))
)}
      </div>

      {/* Vertical List Section */}
      <div className="space-y-2 h-[63%] overflow-auto">
        {selectedSpace && selectedSpace.subThreads && selectedSpace.subThreads.length > 0 ? ( // Conditional rendering for selectedSpace.subThreads
          selectedSpace.subThreads.map((sub) => ( // Map over selectedSpace.subThreads
            <div key={sub.id} className=" p-3 rounded-lg bg-[#191919]">
              <button
                className="w-full text-left font-bold text-white"
                onClick={() => handleSelectSubthread(sub.id)}
              >
                <div className="flex justify-between"> <div className="flex flex-col justify-between text-gray-300">
<div>              {sub.TOPIC} {/* Display sub.topic from selectedSpace.subThreads */}
</div>
<div className="flex gap-2 items-center"> {/* Added gap and vertical alignment */}

    <img className="w-4 h-4" src="icons/email.svg" alt="no image" /> {/* Corrected icon sizing with w-4 h-4 */}
    <img className="w-4 h-4" src="icons/bell.svg" alt="no image" /> {/* Corrected icon sizing with w-4 h-4 */}

    <div className="relative w-6 h-6">
    <img className="w-full h-full" src="icons/messages.svg" alt="no image" />
    {console.log("unreadCounts[sub.id][userId]:", unreadCounts[sub.id]?.[userId])}

    {typeof unreadCounts[sub.id] === 'number' && unreadCounts[sub.id] > 0 && (
       <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center bg-indigo-500 text-white text-xs font-bold rounded-full px-0.5 py-0">
       {unreadCounts[sub.id]}
   </span>
    )}
  
</div>
    <button
        onClick={(e) => handleDeleteTopic(e, sub.id)}
        className="delete-button text-white text-xs hover:text-red-200"
    >
        Delete
    </button>

</div>


 </div>
 <button
  className="bg-gray-800 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2"
  onClick={() =>
    joinCall(
      sub.id,
      sub.TOPIC,
      'audio'
     )
  }
>
  
  <img src="icons/mic-icon.svg" alt="" />
</button>
<button className="bg-gray-800 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 ml-2"
onClick={() =>
  joinCall(
    sub.id,
    sub.TOPIC,
    'video'
   )
}>
  
  <img src="icons/camera.svg" alt="" />
  </button>
              <div className="flex flex-col items-center">
<div>
              {selectedSubthreadId === sub.id ? (
  <button onClick={() => setSelectedSubthreadId(null)} className="p-2 rounded-lg  text-white">
    −
  </button>
) : (
  <button onClick={() => handleSelectSubthread(sub.id)} className="p-2 rounded-lg  text-gray-300">
    <img src="icons/plus-icon.svg" alt="" />
  </button>
  
)}


</div>

<div>
<button
                        onClick={(e) => openAddMemberForm(e, sub)} // Call new function
                        className="add-member-button text-white text-xs hover:text-green-200" // Style as needed
                      >
                        Add Member
                      </button>
                      {/* <button
                                            onClick={(e) => handleDeleteTopic(e, sub.id)} // Call handleDeleteTopic on click
                                            className="delete-button text-white text-xs hover:text-red-200"
                                        >
                                            Delete
                                        </button> */}
{/* <button
                          onClick={(e) => openEditTopicForm(e, sub)} // Open Edit Form on click
                          className="edit-button text-white text-xs hover:text-blue-200"
                      >
                        Edit
                      </button> */}
</div>

{isTopicFormOpen && (
        <AddTopicForm
          mode={topicToEdit ? "edit" : "add"}
          formContext={topicToEdit ? "editTopic" : "addTopic"} // **MODIFIED formContext PROP** - Determine context dynamically
          initialTopicData={topicToEdit}
          currentSpaceId={spaceId || ""}
          onClose={closeAddTopicForm}
          onSubmitSuccess={handleTopicSubmitSuccess}
        />
      )}


              </div>

              </div>


            </button>


            {selectedSubthreadId === sub.id && (
              <div className="mt-2 p-2  rounded-lg shadow bg-[#1E1E1E]">

                <div className="mt-2 p-2 rounded-lg shadow bg-[#1E1E1E]">

  <div className="flex ">
    <button
      onClick={() => handleTabSelect("chat")}
      className={`flex-1 p-2 text-center border-b-2 ${
        selectedTab === "chat" ? " text-blue-500 font-semibold" : "border-transparent text-gray-500"
      }`}
    >
      Chat
    </button>
    <button
      onClick={() => handleTabSelect("tasks")}
      className={`flex-1 p-2 text-center border-b-2 ${
        selectedTab === "tasks" ? " text-blue-500 font-semibold" : "border-transparent text-gray-500"
      }`}
    >
      Tasks
    </button>
  </div>
</div>



                {selectedTab === "chat" && (

<ChatTabContent selectedSubthreadId={selectedSubthreadId} /> // Render ChatTabContent here
  // <div className="flex flex-col h-[300px]">

  //   <div className="flex-1 overflow-auto p-4">
  //     <h3 className="font-semibold"></h3>
  //     {sub.messages && sub.messages.length > 0 ? (
  //       sub.messages.map((msg) => (
  //         <div
  //           key={msg.id}
  //           className={`flex ${
  //             msg.sender === "user" ? "justify-end" : "justify-start"
  //           } mb-2`}
  //         >
  //           <div
  //             className={`max-w-[70%] p-2 rounded-lg ${
  //               msg.sender === "user"
  //                 ? "bg-[#333232] text-white"
  //                 : "bg-[#171616] text-white"
  //             } shadow-md`}
  //           >
  //             <p>{msg.content}</p>
  //             <span className="text-xs text-gray-500 block mt-1 text-right">
  //             {new Date(msg.timestamp).toLocaleTimeString()}

  //             </span>
  //           </div>
  //         </div>
  //       ))
  //     ) : (
  //       <p className="text-gray-500">No messages</p>
  //     )}
  //   </div>


  //   <div className="border-t border-gray-300 p-3 bg-[#0d2439] flex items-center">


  //     <div className="relative flex items-center">


  //       <div className="hidden sm:flex items-center">
  //         <button className="text-gray-600">
  //           <img src="icons/emoji.svg" alt="emoji" className="w-5 h-5" />
  //         </button>
  //         <button className="text-gray-600 ml-3">
  //           <img src="icons/file-pin.svg" alt="file pin" className="w-5 h-5" />
  //         </button>
  //         <button className="text-gray-600 ml-3">
  //           <img src="icons/text-icon.svg" alt="text" className="w-5 h-5" />
  //         </button>
  //         <button className="text-gray-600 ml-3">
  //           <img src="icons/photo.svg" alt="photo" className="w-5 h-5" />
  //         </button>
  //       </div>


  //       <button
  //         className="sm:hidden text-gray-600"
  //         onClick={() => setMenu(!menu)}
  //       >
  //         <img src="icons/menu-icon.svg" alt="menu" className="w-6 h-6" />
  //       </button>


  //       {menu && (
  //         <div className="absolute right-[-83px] top-[-203px] mt-2 w-32 bg-[#230a0a] shadow-md rounded-lg p-2 sm:hidden">
  //           {["emoji", "file-pin", "text-icon", "photo"].map((icon) => (
  //             <button key={icon} className="w-full flex items-center text-gray-600 p-2 hover:bg-gray-100">
  //               <img src={`icons/${icon}.svg`} alt={icon} className="w-5 h-5 mr-2" />
  //               {icon.charAt(0).toUpperCase() + icon.slice(1)}
  //             </button>
  //           ))}
  //         </div>
  //       )}
  //     </div>


  //     <input
  //       type="text"
  //       value={message}
  //       onChange={(e) => setMessage(e.target.value)}
  //       placeholder="Type a message..."
  //       className="flex-1 ml-3 border-none outline-none bg-transparent text-white"
  //     />


  //     <button className="text-gray-600 ml-3">
  //       <img src="icons/mic-icon.svg" alt="mic" className="w-5 h-5" />
  //     </button>
  //     <button
  //       onClick={handleSendMessage}
  //       className="text-blue-500 ml-3 font-semibold"
  //       disabled={!message.trim()}
  //     >
  //       <img src="icons/send-icon.svg" alt="send" />
  //     </button>
  //   </div>
  // </div>
)}

                {selectedTab === "tasks" && (
                  <div className="bg-green">
                    <h3 className="font-semibold"></h3>
                    {selectedSpace.tasks.map((task) => (
  <div key={task.id} className="border p-2 mt-1 bg-gradient-to-br from-black via-[#1f2f38] to-black text-white rounded-md">
    <p><strong>{task.TITLE}</strong></p>
    <p>{task.description}</p>

    <p className="text-sm text-gray-500">
    {console.log("Task object in SubthreadComponent:", task)}

    Due: {task.dueDate ? new Date(task.dueDate).toDateString() : 'No due date'}    </p>
    <li key={task.id}>
            
            <button onClick={() => openAddTaskFormForEdit(task)}>Edit</button> {/* Button to trigger edit */}
        </li>

        <li key={task.id}>
                
                {/* Delete Button added here */}
                <button onClick={() => handleDeleteTask(task.id)}>Delete</button>
            </li>
  </div>
))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      ) : (
        <p className="text-gray-500">No subthreads available.</p>
      )}
    </div>
    </div>
  );
};

export default SubthreadComponent;