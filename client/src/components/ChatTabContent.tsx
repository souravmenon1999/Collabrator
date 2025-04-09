import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebaseConfig'; // Import your Firebase config
import { collection, doc, addDoc, onSnapshot, query, orderBy, serverTimestamp, getDocs } from 'firebase/firestore';
import Cookies from 'js-cookie'; // Assuming you have js-cookie installed
import { useUnreadCounts } from '../context/UnreadCountsContext';
import { useSelector } from 'react-redux'; // If you are using Redux
import {  get } from 'firebase/database'; // Import RDB get
import { getDatabase, ref, set, onDisconnect } from 'firebase/database'; // Import RDB functions
import AudioRecorder from './AudioRecorder';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid'; // For generating unique file names


interface Message {
    id: string;
    userId: string;
    content: string;
    createdAt: any;
    type?: string; // Added optional type property
    subject?: string; // Added optional subject property
    parentMessageId?: string; // Firebase Timestamp
}

interface ChatTabContentProps {
    selectedSubthreadId: string | null;
}

interface UserInfo {
    value: string; // User ID
    label: string; // User Name
    email: string;
}

const ChatTabContent: React.FC<ChatTabContentProps> = ({ selectedSubthreadId }) => {

    const audioRecorderRef = useRef<AudioRecorder>(null);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]); // State to hold messages
    const [isRecordingAudio, setIsRecordingAudio] = useState(false);
    const [isAudioRecorderVisible, setIsAudioRecorderVisible] = useState(false); // New state
    const [isSubjectInputVisible, setIsSubjectInputVisible] = useState(false); // New state for subject input visibility
    const [isAddingSubject, setIsAddingSubject] = useState(false); // To control subject input mode
    const [currentSubject, setCurrentSubject] = useState(''); // To hold the subject being typed
    const [subject, setSubject] = useState(''); // New state to hold the subject text
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);


    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [usersInfo, setUsersInfo] = useState<Record<string, UserInfo>>({});
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const { incrementUnread } = useUnreadCounts();
    const rdb = getDatabase(); // Get Realtime Database instance

    const userId = Cookies.get('userId');

     // Assuming your Redux state has a 'folders' slice
     const folders = useSelector((state: any) => state.data.folders); // Adjust selector based on your state structure

   
    // Function to get user ID from cookies (adapt to your cookie setup)
    const getUserIdFromCookie = () => {
        // **Replace 'your_user_id_cookie_name' with the actual name of your user ID cookie**
        return Cookies.get('userId');
    };

    const handleToggleSubjectInput = () => {
        setIsAddingSubject(!isAddingSubject);
        setCurrentSubject(''); // Clear any ongoing subject input
    };

    const handleSendMessage = async () => {

        if (isAudioRecorderVisible) {
            console.log('state change initiated');
            
            // If audio recorder is visible, trigger the upload from AudioRecorder
            setIsAudioRecorderVisible(false);
            setIsRecordingAudio(false); // Optionally hide after sending
            return;
        }

        if ( audioRecorderRef.current) {
            // If audio recorder is visible, trigger the upload from AudioRecorder
            (audioRecorderRef.current as any).uploadAudio(); // Type assertion needed
            return;
        }

        if ((message.trim() && selectedSubthreadId ) || (isSubjectInputVisible && subject.trim())  ) {
          const userId = getUserIdFromCookie();
          if (!userId) {
            console.error("User ID not found in cookie.");
            return;
          }

          try {
            const messagesCollectionRef = collection(db, `thread-messages/${selectedSubthreadId}/messages`);
            const newMessage: {
                userId: string;
                content: string;
                createdAt: any;
                type?: string;
                subject?: string; // Include subject in the type
                parentMessageId?: string; // Add parentMessageId here

            } = {
                userId: userId,
                content: message,
                createdAt: serverTimestamp(),
                type: 'text',
            };

            if (replyingTo) {
                newMessage.parentMessageId = replyingTo.id;
                if (replyingTo.subject && !isSubjectInputVisible && !subject.trim()) {
                    newMessage.subject = replyingTo.subject;
                }
                setReplyingTo(null); // Clear the replyingTo state after sending
            } else if (isSubjectInputVisible || subject.trim()) {
                console.log('subject',subject);

                newMessage.subject = subject;
                setMessage(''); // Clear the main message input if a subject is entered
                setSubject('');
                setIsSubjectInputVisible(false);
            } else if (message.trim()) {
                newMessage.content = message;
            } else {
                return; // Don't send if neither message nor subject has content
            }
            console.log('new message', newMessage);
            
            await addDoc(messagesCollectionRef, newMessage);
            setMessage('');

            // Increment unread count for other users in the subthread
            let selectedSubthread;
            console.log(folders);

            folders.forEach(folder => {
                const space = folder.spaces.find(space =>
                    space.subThreads.some(thread => thread.id === selectedSubthreadId)
                );
                if (space) {
                    selectedSubthread = space.subThreads.find(thread => thread.id === selectedSubthreadId);
                }
            });


            if (selectedSubthread && selectedSubthread.members) {
                const presenceChecks = selectedSubthread.members.map(async memberId => {
                    if (memberId !== userId) {
                        const presenceRef = ref(rdb, `online-users/${selectedSubthreadId}/${memberId}`);
                        const snapshot = await get(presenceRef);

                        if (!snapshot.exists()) {
                            incrementUnread(selectedSubthreadId, memberId);
                        } else {
                            console.log(`User ${memberId} is online and viewing thread ${selectedSubthreadId}, skipping unread increment.`);
                        }
                    }
                });

                // `presenceChecks` is now an array of Promises. `Promise.all()` will wait for all of them to resolve.
                await Promise.all(presenceChecks);
            }

          } catch (error) {
            console.error("Error sending message:", error);
          }
        }
      };

      const handleCancelAudio = () => {
        console.log('cancelling');
        
        setIsAudioRecorderVisible(false);
    };

    const handleAudioMessageSent = async (audioUrl: string) => {
        if (audioUrl && selectedSubthreadId) {
            const userId = getUserIdFromCookie();
            if (!userId) {
                console.error("User ID not found in cookie.");
                setIsRecordingAudio(false);
                return;
            }
            try {
                const messagesCollectionRef = collection(db, `thread-messages/${selectedSubthreadId}/messages`);
                const newMessage: Message = {
                    userId: userId,
                    content: audioUrl,
                    createdAt: serverTimestamp(),
                    type: 'audio',
                };
    
                if (replyingTo) {
                    newMessage.parentMessageId = replyingTo.id; // Only add if replyingTo exists
                    // Inherit the subject from the message being replied to
                    if (replyingTo.subject) {
                        newMessage.subject = replyingTo.subject;
                    }
                    setReplyingTo(null); // Clear replyingTo state
                }
    
                await addDoc(messagesCollectionRef, newMessage);
    
                // Increment unread count for other users in the subthread (similar to handleSendMessage)
                const selectedSubthread = findSelectedSubthread(folders, selectedSubthreadId); // Assuming you'll define this helper function
    
                if (selectedSubthread && selectedSubthread.members) {
                    const presenceChecks = selectedSubthread.members.map(async memberId => {
                        if (memberId !== userId) {
                            const presenceRef = ref(rdb, `online-users/${selectedSubthreadId}/${memberId}`);
                            const snapshot = await get(presenceRef);
    
                            if (!snapshot.exists()) {
                                incrementUnread(selectedSubthreadId, memberId);
                            } else {
                                console.log(`User ${memberId} is online and viewing thread ${selectedSubthreadId}, skipping unread increment.`);
                            }
                        }
                    });
                    await Promise.all(presenceChecks);
                }
    
            } catch (error) {
                console.error("Error sending audio message:", error);
            }
        }
        setIsRecordingAudio(false);
    };
    
    // Ensure this helper function is defined within your component or imported
    const findSelectedSubthread = (folders: any, selectedSubthreadId: string | null) => {
        if (!selectedSubthreadId) return null;
        for (const folder of folders) {
            const space = folder.spaces.find(space =>
                space.subThreads.some(thread => thread.id === selectedSubthreadId)
            );
            if (space) {
                return space.subThreads.find(thread => thread.id === selectedSubthreadId);
            }
        }
        return null;
    };
      useEffect(() => {
        if (!selectedSubthreadId || !userId) {
            setMessages();
            setUsersInfo({}); // Clear user info as well

            return;
        }
    
        // --- REALTIME DATABASE PRESENCE MANAGEMENT ---
        const presenceRef = ref(rdb, `online-users/${selectedSubthreadId}/${userId}`);
        set(presenceRef, true); // Set user as online when entering the subthread
        onDisconnect(presenceRef).set(null); // Remove user from online list when they disconnect
    
        console.log('rdb connection established for presence');

        // --- FETCH USER DETAILS ---
        let memberIds: string[] = [];
        folders.forEach(folder => {
        folder.spaces.forEach(space => {
            const subthread = space.subThreads.find(thread => thread.id === selectedSubthreadId);
            if (subthread && subthread.members) {
                memberIds = subthread.members;
            }
        });
    });

    if (memberIds.length > 0) {
        const fetchUsersDetails = async (userIds: string) => {
            try {
                const response = await fetch('http://localhost:5000/api/users/details', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userIds }),
                });

                if (!response.ok) {
                    console.error('Failed to fetch users details:', response.status);
                    return;
                }

                const usersData: { _id: string; name: string; email: string }= await response.json();
                const usersMap: Record<string, { value: string; label: string; email: string }> = {};
                usersData.forEach(user => {
                    usersMap[user._id] = {
                        value: user._id,
                        label: user.name,
                        email: user.email,
                    };
                });
                setUsersInfo(usersMap);

            } catch (error) {
                console.error('Error fetching users details:', error);
            }
        };
        fetchUsersDetails(memberIds);
    } else {
        setUsersInfo({});
    }


    
        // --- FIRESTORE MESSAGE LISTENER (REMAINS THE SAME) ---
        const messagesCollectionRef = collection(db, `thread-messages/${selectedSubthreadId}/messages`);
        const q = query(messagesCollectionRef, orderBy('createdAt'));
    
        const unsubscribeMessages = onSnapshot(q, (snapshot) => {
            const newMessages: Message []= [];
                        snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    newMessages.push({
                        id: change.doc.id,
                        ...change.doc.data() as Message
                    });
                }
            });
            setMessages((prevMessages) => {
                
                
                const existingIds = new Set(prevMessages.map(msg => msg.id));
                const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg.id));

                const allMessages = [...prevMessages, ...uniqueNewMessages];
                // After updating messages, check if we need to scroll
                if (replyingTo && allMessages.some(msg => msg.id === replyingTo.id)) {
                    setTimeout(() => { // Use setTimeout to ensure messages are rendered
                        scrollToMessage(replyingTo.id);
                        console.log('cleared');
                        
                         // Clear replyingTo after scrolling
                    }, 200);
                } else if (uniqueNewMessages.length > 0 && uniqueNewMessages[0].parentMessageId) {
                    setTimeout(() => {
                        scrollToMessage(uniqueNewMessages[0].parentMessageId);
                    }, 200);
                }

                console.log([...prevMessages, ...uniqueNewMessages]);
                
                return allMessages;
            });
        }, (error) => {
            console.error("Error listening to messages:", error);
            alert("Failed to load messages. Please try again later.");
        });
    
        // --- CLEANUP FUNCTION ---
        return () => {
            // This function will run when the component unmounts or selectedSubthreadId changes
            unsubscribeMessages(); // Cleanup Firestore listener
    
            // The onDisconnect handler in RDB should automatically handle removal upon disconnection.
            // However, for a clean unmount when the subthread changes, we can explicitly set to null here as well.
            set(presenceRef, null);
            console.log('rdb connection closed for presence');
        };
    
    }, [selectedSubthreadId, userId, rdb, replyingTo ]);
    
    
    const handleFileButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            // Optionally, you can trigger the upload immediately here or have a separate send button
        }
    };

    const handleSendFile = async () => {
        if (selectedFile && selectedSubthreadId) {
            const userId = getUserIdFromCookie();
            if (!userId) {
                console.error("User ID not found in cookie.");
                return;
            }

            try {
                // Proceed with file upload to Firebase Storage (implementation in Step 2)
                console.log("Uploading file:", selectedFile);
                await uploadFileToStorage(selectedFile, selectedSubthreadId, userId);
                setSelectedFile(null); // Clear the selected file after sending
            } catch (error) {
                console.error("Error sending file:", error);
                alert("Failed to send file.");
            }
        } else if (!selectedSubthreadId) {
            console.warn("No subthread selected to send the file to.");
        } else {
            console.warn("No file selected.");
        }
    };

    const uploadFileToStorage = async (file: File, subthreadId: string, userId: string) => {
        try {
            const storage = getStorage();
            const fileName = `${userId}-${Date.now()}-${uuidv4()}-${file.name}`; // Create a unique file name
            const fileRef = storageRef(storage, `chat-files/${subthreadId}/${fileName}`);

            const uploadTask = uploadBytesResumable(fileRef, file);

            return new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        // You can add progress updates here if needed
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log('Upload is ' + progress + '% done');
                    },
                    (error) => {
                        console.error("Error uploading file:", error);
                        reject(error);
                    },
                    async () => {
                        // Upload completed successfully, get download URL
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        console.log('File available at', downloadURL);
                        // Now, store this URL in Firestore (Step 3)
                        await saveFileMessageToFirestore(downloadURL, file.type, file.name, subthreadId, userId);
                        resolve(downloadURL);
                    }
                );
            });
        } catch (error) {
            console.error("Error initiating file upload:", error);
            throw error;
        }
    };

    const saveFileMessageToFirestore = async (fileUrl: string, fileType: string, fileName: string, subthreadId: string, userId: string) => {
        try {
            const messagesCollectionRef = collection(db, `thread-messages/${selectedSubthreadId}/messages`);
            const newMessage = {
                userId: userId,
                content: fileUrl,
                type: 'file',
                fileType: fileType,
                fileName: fileName,
                createdAt: serverTimestamp(),
            };
            await addDoc(messagesCollectionRef, newMessage);
    
            // Increment unread count for other users in the subthread (similar to handleSendMessage)
            const selectedSubthread = findSelectedSubthread(folders, selectedSubthreadId); // Ensure this helper is available
    
            if (selectedSubthread && selectedSubthread.members) {
                const presenceChecks = selectedSubthread.members.map(async memberId => {
                    if (memberId !== userId) {
                        const presenceRef = ref(rdb, `online-users/${selectedSubthreadId}/${memberId}`);
                        const snapshot = await get(presenceRef);
    
                        if (!snapshot.exists()) {
                            incrementUnread(selectedSubthreadId, memberId);
                        } else {
                            console.log(`User ${memberId} is online and viewing thread ${selectedSubthreadId}, skipping unread increment.`);
                        }
                    }
                });
                await Promise.all(presenceChecks);
            }
    
        } catch (error) {
            console.error("Error saving file message to Firestore:", error);
        }
    };
    // Add rdb to the dependency array

    const scrollToMessage = (messageId: string) => {
        console.log('scrolling');
        
        const messageElement = document.getElementById(messageId);
        console.log(messageElement);
        
        if (messageElement && chatContainerRef.current) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="flex flex-col h-[300px] ">
<div ref={chatContainerRef} className="flex-1 overflow-auto p-4">
{messages && messages.length > 0 ? (
    messages.map((msg) => (
        <div
            key={msg.id}
            id={msg.id}
            className={`flex ${msg.userId === getUserIdFromCookie() ? "justify-end" : "justify-start"} mb-2`}
        >
            <div
                className={`max-w-[70%] p-2 rounded-lg shadow-md relative ${ // Added relative for absolute positioning of reply button
                    msg.userId === getUserIdFromCookie()
                        ? "text-white"
                        : "text-white"
                } ${msg.subject ? "bg-blue-800" : (msg.userId === getUserIdFromCookie() ? "bg-[#333232]" : "bg-[#171616]")}`}
            >
                {msg.subject && (
                    <div className="mb-1 text-sm font-semibold text-yellow-300">
                        Subject: {msg.subject}
                    </div>
                )}
                {msg.parentMessageId && (
                    <div
                        className="mb-2 p-2 rounded-md bg-gray-700 text-gray-300 text-sm cursor-pointer" // Added cursor and onClick
                        onClick={() => scrollToMessage(msg.parentMessageId)}
                    >
                        <div className="font-semibold">
                            Replying to {usersInfo[messages.find(m => m.id === msg.parentMessageId)?.userId]?.label || 'Unknown User'}
                        </div>
                        <div>
                        {messages.find(m => m.id === msg.parentMessageId)?.type === 'audio' ? (
    <img src="/icons/mic-icon.svg" alt="Audio Reply" width="20" height="20" />
) : messages.find(m => m.id === msg.parentMessageId)?.type === 'file' ? (
    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
) : (
    <>
        {messages.find(m => m.id === msg.parentMessageId)?.content.substring(0, 30) || 'Original message not found'}
        {messages.find(m => m.id === msg.parentMessageId)?.content.length > 30 && '...'}
    </>
)}
                        </div>
                    </div>
                )}
                <button
                    onClick={() => setReplyingTo(msg)}
                    className="focus:outline-none text-gray-400 hover:text-blue-500 absolute top-1 right-1" // Adjusted top and right
                >
                    <div><img src="/icons/replyIcon.svg" alt="reply" width="20" height="20" />
                    </div>
                </button>

                <div className="flex justify-between items-center mb-1">
                    <div>
                        <span className="text-xs text-gray-400 mr-2">
                            {usersInfo[msg.userId]?.label || 'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-500">
                            {msg.createdAt?.toDate().toLocaleTimeString()}
                        </span>
                    </div>
                </div>
                {msg.type === 'audio' ? (
                    <audio controls src={msg.content}>
                        Your browser does not support the audio element.
                    </audio>
                ) : msg.type === 'file' ? (
                    <div>
                        <p className="text-sm text-gray-400">File: {msg.fileName}</p>
                        <a href={msg.content} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            Download
                        </a>
                    </div>
                ) : (
                    <p>{msg.content}</p>
                )}
            </div>
        </div>
    ))
) : (
    <p className="text-gray-500">No messages yet. Be the first to chat!</p>
)}
</div>
{replyingTo && (
    <div className="bg-gray-800 text-white rounded-md py-2 px-3 mb-2 flex items-center justify-between">
        <div>
            <div className="text-xs font-semibold">
                Replying to {usersInfo[replyingTo.userId]?.label || 'Unknown User'}
            </div>
            <div className="text-sm text-gray-400">
                {replyingTo.content.length > 20 ? replyingTo.content.substring(0, 20) + '...' : replyingTo.content}
            </div>
        </div>
        <button
            onClick={() => setReplyingTo(null)}
            className="focus:outline-none text-gray-500 hover:text-gray-400"
        >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </button>
    </div>
)}
<div className="border-t border-gray-300 p-3 bg-[#0d2439] flex items-center">
{subject && (
        <div className="bg-gray-700 text-white rounded-md py-1 px-2 mr-2 flex items-center">
            {subject}
            <button
                onClick={() => setSubject('')}
                className="ml-1 focus:outline-none"
            >
                <svg className="w-4 h-4 fill-current text-gray-400" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
        </div>
    )}
    {isAudioRecorderVisible ? (
        <div className="flex-1 mr-3">
            <AudioRecorder
                key={isAudioRecorderVisible} // Add a key prop

                ref={audioRecorderRef}
                selectedSubthreadId={selectedSubthreadId}
                onAudioMessageSent={handleAudioMessageSent}
                onRecordingStateChange={setIsRecordingAudio}
                onCancelRecording={handleCancelAudio} // Pass the cancel callback
            />
        </div>
    ) : (
        <input
        type="text"
        value={isAddingSubject ? currentSubject : message}
        onChange={(e) => {
            if (isAddingSubject) {
                setCurrentSubject(e.target.value);
            } else {
                setMessage(e.target.value);
            }
        }}
        placeholder={isAddingSubject ? "Enter subject..." : (subject ? "Type a message..." : "Type a message...")}
        className="flex-1 mr-3 border-none outline-none bg-transparent text-white"
        onKeyDown={(e) => {
            if (isAddingSubject && e.key === 'Enter' && currentSubject.trim()) {
                setSubject(currentSubject.trim());
                setIsAddingSubject(false);
            }
        }}
    />
    )}
    
    <button
        onClick={handleSendMessage}
        className="text-blue-500 ml-3 font-semibold focus:outline-none"
        disabled={isAudioRecorderVisible} // Disable text send when recording
    >
        <img src="icons/send-icon.svg" alt="send" />
    </button>
    <button
        onClick={handleFileButtonClick}
        className="ml-3 focus:outline-none"
        disabled={isAudioRecorderVisible} // Disable file upload when recording
    >
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
    </button>
    <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
    />
    
    {selectedFile && (
        <button
            onClick={handleSendFile}
            className="text-green-500 ml-3 font-semibold focus:outline-none"
        >
            Send File
        </button>
    )}
   <button
        onClick={() => setIsAudioRecorderVisible(!isAudioRecorderVisible)}
        className={`ml-3 focus:outline-none ${isAudioRecorderVisible ? 'text-blue-500' : 'text-gray-400'}`}
         // Prevent double-clicking during recording
    >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
    </button>
    <button
        onClick={handleToggleSubjectInput}
        className={`ml-3 focus:outline-none ${isAddingSubject || subject ? 'text-blue-500' : 'text-gray-400'}`}
        disabled={subject} // Disable if a subject is already added
    >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h10M7 16h10" />
        </svg>
    </button>
</div>
        </div>
    );
};

export default ChatTabContent;