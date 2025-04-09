// src/App.tsx
import React from 'react';
import { Provider } from "react-redux";
import { store } from "./redux/store";
import { ModalProvider } from "./context/ModalContext";
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';

import SignupPage from './components/SignupPage';
import LoginPage from './components/LoginPage';
import AppContent from './components/AppContent'; // Import the separated AppContent

import usePushNotifications from './hooks/usePushNotifications';
import { TotalUnreadCountsProvider } from './context/TotalUnreadCountsContext';
import { UnreadCountsProvider } from './context/UnreadCountsContext';

import {
    LocalUser, // Plays the microphone audio track
    RemoteUser, // Plays the remote user audio
    useIsConnected, // Returns whether the SDK is connected to Agora's server
    useJoin, // Automatically join and leave a channel on mount and unmount
    useLocalMicrophoneTrack, // Create a local microphone audio track
    usePublish, // Publish the local track
    useRemoteUsers,
    IAgoraRTC, // Retrieve the list of remote users
  } from "agora-rtc-react";
  import AgoraRTC from "agora-rtc-sdk-ng";
  import { AgoraRTCProvider } from 'agora-rtc-react';
  import { CallModalProvider } from './context/CallModalContext';


function HomePage() {

    
  
    return (
        <div>
            <h2 className="text-2xl font-bold mb-4 text-center">Welcome to the App!</h2>
            <div className="flex justify-center space-x-4 mb-4">
                <Link to="/signup" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                    Sign Up
                </Link>
                <Link to="/login" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                    Login
                </Link>
                <Link to="/app" className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                    Go to App
                </Link>
            </div>
            {/* Removed AppContent from HomePage */}
        </div>
    );
}


// **Final Export**
export default function App() {



    return (
        <Provider store={store}>
            <ModalProvider>
            
            
            <UnreadCountsProvider>
            <CallModalProvider>
            <TotalUnreadCountsProvider>
                <Router>
                    <Routes>
                        <Route path="/signup" element={<SignupPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/app" element={<AppContent />} /> {/* AppContent on /app route */}
                        <Route path="/" element={<HomePage />} /> {/* HomePage for default route */}
                    </Routes>
                </Router>
                </TotalUnreadCountsProvider>
                </CallModalProvider>
                </UnreadCountsProvider>
                
                
            </ModalProvider>
            
        </Provider>
    );
}