import React, { useState, useEffect, useCallback, useRef } from "react"; // <-- IMPORTANT: Add useCallback here!import { ChevronDownIcon, ChevronUpIcon, PlusIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { useModal } from "../context/ModalContext";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import SpaceInterface from "./SpaceInterface";
import { spaceFields } from "../types/types";
import { useDispatch } from "react-redux";
import { deleteFolderAction } from "../redux/actions/dataActions";
// import NotificationsComponent from "./NotificationsComponent";
// import { NotificationBellIcon } from "./NotificationsComponent"; // <-- IMPORTANT: Import NotificationBellIcon
import { ChevronDownIcon,ChevronUpIcon, EllipsisVerticalIcon, PlusIcon } from "@heroicons/react/24/outline"; // <---- IMPORTANT: Add this import!
import {
  openGlobalNotifications,     // <-- Ensure these are imported from notificationActions.js
  openSpaceNotifications,
  toggleNotificationsPanel // Keep if you are still using toggle action somewhere else
} from '../redux/actions/notificationActions';
import { NotificationBellIcon } from './NotificationPanel'; // Ensure correct path
import EditFolderModal from "./modals/EditFolderModal";
import { useUnreadCounts } from "../context/UnreadCountsContext";


interface Folder {
  id: string;
  name: string;
  isExpanded: boolean;
  spaces: Space[]; // Spaces are now directly in Folder interface
  created: string;
  author: string;
  lastActivity?: string;
  hasNotification?: boolean;
  unreadCount?: number;
}

interface Space {
  id: string;
  name: string;
  folderId: string; // folderId is already in the Space object from backend
  subThreads: any[]; // Assuming subThreads type, adjust if needed
  created: string; // created timestamp
  description: string; // description of space
}

interface FolderListProps {
  onSpaceSelect: (folderId: string, spaceId: string) => void;
  // isOpen: boolean;             // Prop to control dropdown open state
  // toggleNotifications: () => void; // Prop to toggle dropdown
  // notificationCount: number;   // Prop for notification count
}

export default function FolderList({ onSpaceSelect}: FolderListProps) {

  const { unreadCounts, totalUnreadCountsForSpaces } = useUnreadCounts();


  const [editFolderModalVisible, setEditFolderModalVisible] = useState(false);
  const [folderIdToEdit, setFolderIdToEdit] = useState<string | null>(null);


  const handleEditFolderClick = (folderId: string) => {
      setFolderIdToEdit(folderId);
      setEditFolderModalVisible(true);
  };

  const handleCloseEditFolderModal = () => {
      setEditFolderModalVisible(false);
      setFolderIdToEdit(null);
  };


  const dispatch = useDispatch();

  const handleDeleteFolder = (folderIdToDelete: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete the folder .`);
    if (confirmDelete) {
        dispatch(deleteFolderAction(folderIdToDelete)); // Dispatch deleteFolderAction with the received folder ID
    }
};

const handleHeaderBellClick = () => {
  console.log('done');
  
  dispatch(openGlobalNotifications()); // Dispatch OPEN_GLOBAL_NOTIFICATIONS action
};


const handleSpaceBellClick = (spaceId: string) => {
  return () => {
      dispatch(openSpaceNotifications(spaceId)); // Dispatch OPEN_SPACE_NOTIFICATIONS with spaceId
  };
};

const reduxNotifications = useSelector((state: RootState) => state.notifications.notifications);

const [editModalOpen, setEditModalOpen] = useState(false);
const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null);

// UseEffect to open modal when folderToEdit is updated
useEffect(() => {
  if (folderToEdit) {
    console.log("folderToEdit updated in useEffect:", folderToEdit); // Optional log
    setEditModalOpen(true); // Open modal when folderToEdit is set
  } else {
    setEditModalOpen(false); // Optionally close modal when folderToEdit is set to null
  }
}, [folderToEdit]); // Dependency array: useEffect runs when folderToEdit changes


// Function to open edit modal and set folder to edit (now only sets folderToEdit)
const handleEditFolder = (folder: Folder) => {
  setFolderToEdit(folder); //  Now only sets folderToEdit, useEffect will open modal
  console.log("handleEditFolder called, setFolderToEdit:", folder); // Optional log
  // setEditModalOpen(true); // REMOVE this line - modal is opened by useEffect
};

// Function to close edit modal (now only sets folderToEdit to null)
const handleCloseEditModal = () => {
  setFolderToEdit(null); // Setting folderToEdit to null will trigger useEffect to close modal
  // setEditModalOpen(false); // REMOVE this line - modal is closed by useEffect
};

// Function to save folder changes (unchanged)
const handleSaveFolder = (name: string, description: string) => {
  if (folderToEdit) {
    // Logic to update folder (e.g., dispatch Redux action)
    console.log("Updated folder:", { ...folderToEdit, name, description });
    handleCloseEditModal();
  }
};








  const { openModal } = useModal();

  const folderListFromRedux = useSelector((state: RootState) => state.data.folders); // Get folders directly from Redux (populated with spaces)


  console.log("Folders from Redux (populated):", folderListFromRedux); // Log populated folders


  const [folders, setFolders] = useState<Folder[]>([]); // State to hold folders for local component logic (expansion etc.)
  const [isAllExpanded, setIsAllExpanded] = useState<boolean>(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showSpaceInterface, setShowSpaceInterface] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [draggedSpace, setDraggedSpace] = useState<string | null>(null);
  const [dragX, setDragX] = useState<{ [key: string]: number }>({});
  const startX = useRef<{ [key: string]: number }>({});


  useEffect(() => {
    setFolders(folderListFromRedux); // Update local folders state when Redux folders change
  }, [folderListFromRedux]); // React to changes in Redux folders


  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleTouchStart = (spaceId: string, e: React.TouchEvent) => {
    startX.current[spaceId] = e.touches[0].clientX;
    setDraggedSpace(spaceId);
  };

  const handleTouchMove = (spaceId: string, e: React.TouchEvent) => {
    if (draggedSpace !== spaceId) return;
    const currentX = e.touches[0].clientX;
    const delta = startX.current[spaceId] - currentX;
    const translationX = Math.min(Math.max(-delta, -121), 0);
    setDragX((prev) => ({ ...prev, [spaceId]: translationX }));
  };

  const handleTouchEnd = (spaceId: string) => {
    const currentTranslation = dragX[spaceId] || 0;
    setDragX((prev) => ({
      ...prev,
      [spaceId]: currentTranslation <= -50 ? -121 : 0,
    }));
    setDraggedSpace(null);
  };

  const handleMouseDown = (spaceId: string, e: React.MouseEvent) => {
    console.log('down');

    startX.current[spaceId] = e.clientX;
    setDraggedSpace(spaceId);
  };

  const handleMouseMove = (spaceId: string, e: React.MouseEvent) => {
    if (draggedSpace !== spaceId) return;
    const currentX = e.clientX;
    const delta = startX.current[spaceId] - currentX;
    const translationX = Math.min(Math.max(-delta, -121), 0);
    setDragX((prev) => ({ ...prev, [spaceId]: translationX }));
  };

  const handleMouseUp = (spaceId: string) => {
    const currentTranslation = dragX[spaceId] || 0;
    setDragX((prev) => ({
      ...prev,
      [spaceId]: currentTranslation <= -50 ? -121 : 0,
    }));
    setDraggedSpace(null);
  };


  const expandAllFolders = () => {
    setIsAllExpanded((prev) => !prev);

    setFolders((currentFolders) =>
      currentFolders.map((folder) => ({
        ...folder,
        isExpanded: !isAllExpanded,
      }))
    );
  };

  const toggleFolder = (id: string) => {
    setFolders((currentFolders) =>
      currentFolders.map((folder) =>
        folder.id === id
          ? { ...folder, isExpanded: !folder.isExpanded }
          : folder
      )
    );
  };


  const openDropdown = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent folder toggle when dropdown is clicked
    setDropdownOpen( folderId);
  };

  // Function to CLOSE the dropdown on mouse leave
const closeDropdown = () => {
  setDropdownOpen(null); // Set dropdownOpen to null to close
};



  return (
    <>
      <div className="w-full md:w-[auto] bg-[#191919] shadow-lg h-screen overflow-auto">
        <div className="p-4 border-b border-[#2a3942] flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-200">Folders</h1>

          <button
            onClick={() => openModal("folder")}
            className="p-2 rounded-full bg-[#202c33] hover:bg-[#182229]"
          >
            <img src="icons/add-icon.svg" alt="" />
          </button>

          {/* <NotificationBellIcon
        isOpen={isOpen}           // Pass isOpen prop
        toggleNotifications={toggleNotifications} // Pass toggleNotifications prop
        notificationCount={notificationCount}     // Pass notificationCount prop
    /> */}
        <NotificationBellIcon onClick={handleHeaderBellClick} count={reduxNotifications.length} />


          {isAllExpanded ? (
            <><button onClick={expandAllFolders}>

              <ChevronUpIcon className="w-4 h-4 ml-1 text-white " />
            </button>

            </>
          ) : (
            <button onClick={expandAllFolders}>

              <ChevronDownIcon className="w-4 h-4 ml-1 text-white" />
            </button>
          )}
          <EllipsisVerticalIcon
            className="w-6 h-6 text-white hover:text-blue-200 cursor-pointer hover:bg-blue-900 rounded"
            onMouseEnter={(e) => openDropdown(null, e)} // Open global dropdown on hover
            />

        </div>

        <div className="p-2">
          {folders.map((folder) => (
            <div key={folder.id} className="mb-1 pt-6 pb-6  border-b-1 border-black ">
              <div
                className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-[#202c33]"
                onClick={() => toggleFolder(folder.id)}
              >
                <div className="flex items-center">
                  {/*  <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white mr-2">
                         {folder.name[0].toUpperCase()}
                      </div> */}
                  <span className="text-sm text-gray-200 w-[136px] h-[19px] whitespace-nowrap overflow-hidden text-ellipsis">{folder.name}</span>
                  {/* {folder.hasNotification && folder.unreadCount && (
                        <span>
     <svg className="w-2 h-2 text-green-500 ml-3" fill="currentColor" viewBox="0 0 8 8">
                        <circle cx="4" cy="4" r="3" stroke="white" strokeWidth="1" fill="currentColor" />
                      </svg>
                        </span>


                        )} */}
                </div>
                <div className="flex gap-2 items-center" >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log("Folder ID before opening modal:", folder.id); // ADD THIS LINE

                      openModal("space", { folderId: folder.id }); // Pass modalType "space" and folderId
                    }}
                    className="flex items-center text-sm text-gray-400 p-2 pl-4 hover:bg-[#202c33] w-full"
                  >
                    <PlusIcon className=" h-4  text-red-400" />
                    <span className="text-xs">Add space</span>
                  </button>
                  <div className="relative">
                  <EllipsisVerticalIcon
                    className="w-6 h-6 text-white hover:text-blue-200 cursor-pointer hover:bg-blue-900 rounded"
                    onMouseEnter={(e) => openDropdown(folder.id, e)} // Open folder dropdown on hover
                    />
                  {dropdownOpen === folder.id && (
                    <div               onMouseLeave={closeDropdown} // **Correct Placement: on the dropdown content div**
                    className="absolute right-0 -mt-1 w-48 bg-[#202c33] rounded-md shadow-xl z-9">
                    <button
        className="block px-4 py-2 text-sm text-gray-200 hover:bg-blue-500 w-full text-left"
        // onClick={(e) => {
        //   e.stopPropagation();
          
        //   handleEditFolder(folder);
        // }}
        onClick={() => handleEditFolderClick(folder.id)}
      >
        Edit Folder
      </button>
                      <button
                className="block px-4 py-2 text-sm text-gray-200 hover:bg-red-500 w-full text-left"
                onClick={(e) => {
                    
                    // Call handleDeleteFolder and PASS folder.id as argument
                    handleDeleteFolder(folder.id);
                }}
            >
                Delete Folder
            </button>
                    </div>
                  )}
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 mr-2 transform transition-transform text-white ${folder.isExpanded ? "rotate-180" : "rotate-0"
                      } text-gray-300`}
                  />
                </div>

              </div>

              {editFolderModalVisible && folderIdToEdit && (
                <EditFolderModal
                    folderId={folderIdToEdit}
                    onClose={handleCloseEditFolderModal}
                />
            )}

            

              {folder.isExpanded && (
                <div className="ml-0 lg:ml-13">
                  {folder.spaces ? (
  folder.spaces.map((space) => (
    <div key={space.id} className="relative">
      <div className="absolute inset-y-0 right-0 flex gap-2 pr-3 items-center bg-[#191919]">
        <button className="flex flex-col items-center ">
          <img
            src="icons/dots.svg"
            alt="Delete"
            className="w-6 h-6 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="text-gray-500">More</span>
        </button>

        <button className="flex flex-col items-center">
          <img
            src="icons/bin.svg"
            alt=""
            className="w-6 h-6 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="text-gray-500">Archive</span>
        </button>
      </div>
      <div
        className="flex items-center justify-between p-5 pl-4 text-sm bg-[#191919] rounded-lg transform transition-transform duration-300 ease-out border-b border-gray-700"
        style={{
          transform: `translateX(${dragX[space.id] || 0}px)`,
          touchAction: 'none',
        }}
        onTouchStart={(e) => handleTouchStart(space.id, e)}
        onTouchMove={(e) => handleTouchMove(space.id, e)}
        onTouchEnd={() => handleTouchEnd(space.id)}
        onMouseDown={(e) => handleMouseDown(space.id, e)}
        onMouseMove={(e) => handleMouseMove(space.id, e)}
        onMouseUp={() => handleMouseUp(space.id)}
        onDragStart={(e) => e.preventDefault()}
        onClick={() => {
          setShowSpaceInterface(true);
          console.log(folder.id, space.id);
          onSpaceSelect(folder.id, space.id);
        }}
      >
        <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white mr-2">
          <img className="w-8 h-8 rounded-full" src="data:image/jpeg;base64,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" alt="" />
        </div>
        <div className="flex flex-col" onClick={() => {
          setShowSpaceInterface(true);
          console.log(folder.id, space.id);
          onSpaceSelect(folder.id, space.id);
        }} >
          <span className="text-gray-300">{space.name}</span>
          <div className="text-xs text-gray-500">
            <div>Created {space.created} by Sinto</div> {/* Display space.created */}
            <div>Last Activity 5:22 PM</div> {/* Example - adjust if you have lastActivity for spaces */}
          </div>
        </div>

        {/* Display unread count badge - now accessing context */}
        {totalUnreadCountsForSpaces[space.id] > 0 && (
          <span style={{ marginLeft: '8px', backgroundColor: 'red', color: 'white', borderRadius: '50%', padding: '4px' }}>
            {totalUnreadCountsForSpaces[space.id]}
          </span>
        )}


{unreadCounts && unreadCounts[space.id] > 0 && (
  <span style={{ marginLeft: '8px', backgroundColor: 'red', color: 'white', borderRadius: '50%', padding: '4px' }}>
    {unreadCounts[space.id]}
  </span>
)}
        {/*
          <span className="unread-badge ml-2 text-xs bg-blue-500 text-white rounded-full px-2 py-1">
            ({totalUnreadCountsForSpaces[space.id]})
          </span> */}

        <NotificationBellIcon onClick={handleSpaceBellClick(space.id)} count={
          reduxNotifications.filter(notif => notif.spaceId === space.id).length
        } />
      </div>
    </div>
  ))
) : null} 
                </div>
              )}

              
              {/*               <div className=" p-3 text-xs text-gray-500"><div>Created 31 Dec 2024 by Sinto</div><div>Last Activity 5:22 PM</div></div>
               */}            </div>
          ))}
        </div>
      </div>
      
    </>
  );
}