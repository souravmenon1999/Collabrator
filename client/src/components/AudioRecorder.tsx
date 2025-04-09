import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'; // Import forwardRef and useImperativeHandle
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';import { serverTimestamp } from 'firebase/firestore';
import { useUnreadCounts } from '../context/UnreadCountsContext';
import Cookies from 'js-cookie';
import { log } from 'console';
import { FaFileAudio } from 'react-icons/fa'; // Example using Font Awesome


interface AudioRecorderProps {
    selectedSubthreadId: string | null;
    onAudioMessageSent: (audioUrl: string) => void;
    onRecordingStateChange: (isRecording: boolean) => void;
    onCancelRecording: () => void;
}

// Wrap the functional component with forwardRef
const AudioRecorder = forwardRef<AudioRecorderRef, AudioRecorderProps>(({ selectedSubthreadId, onAudioMessageSent, onRecordingStateChange, onCancelRecording }, ref) => {
    const [isRecording, setIsRecording] = useState(false);
    const audioChunksRef = useRef<Blob[]>([]);
    const [recordedAudioChunks, setRecordedAudioChunks] = useState<Blob[]>([]); // New state

    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioContext = useRef<AudioContext | null>(null);
    const analyser = useRef<AnalyserNode | null>(null);
    const animationFrameId = useRef<number>(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const userId = Cookies.get('userId');
    const { incrementUnread } = useUnreadCounts();

    // Define the interface for the ref
    interface AudioRecorderRef {
        uploadAudio: () => Promise<void>;
    }

    // Use useImperativeHandle to expose the uploadAudio function
    useImperativeHandle(ref, () => ({
        uploadAudio: uploadAudio,
    }));

    useEffect(() => {
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
            if (audioContext.current && audioContext.current.state !== 'closed') {
                audioContext.current.close();
                audioContext.current = null; // Also set to null to avoid potential issues
            }
        };
    }, []);

    const startRecording = async () => {
        console.log('recording started');

        onRecordingStateChange(true);
        setIsRecording(true);
        audioChunksRef.current = []; // Clear previous chunks

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream, { timeslice: 1000 }); // timeslice in milliseconds (e.g., 1000ms = 1 second)

            // Initialize audio context and analyser here, after getting the stream
            if (!audioContext.current) {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                audioContext.current = ctx;
                analyser.current = ctx.createAnalyser();
                const source = ctx.createMediaStreamSource(stream); // Use the local 'stream' variable
                source.connect(analyser.current);
                analyser.current.fftSize = 2048;
                const bufferLength = analyser.current.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                const draw = () => {
                    animationFrameId.current = requestAnimationFrame(draw);
                    const canvas = canvasRef.current;
                    const canvasCtx = canvas?.getContext('2d');
                    if (!canvas || !canvasCtx) return;
                
                    canvasCtx.fillStyle = '#191919';
                    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
                
                    analyser.current?.getByteTimeDomainData(dataArray);
                
                    canvasCtx.fillStyle = '#007bff'; // Color of the bars
                    const barWidth = (canvas.width / bufferLength) * 3; // Adjust multiplier for bar width
                    let x = 0;
                
                    for (let i = 0; i < bufferLength; i++) {
                        const v = dataArray[i] / 128.0; // Normalize to 0-2
                        const height = Math.abs(v - 1) * canvas.height; // Height based on deviation from center
                
                        canvasCtx.fillRect(x, canvas.height / 2 - height / 2, barWidth, height);
                
                        x += barWidth + 1; // Add spacing between bars (adjust '1' for more/less space)
                    }
                };
                draw();
            }

            mediaRecorder.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    console.log('feeding chunks', event.data);
                    audioChunksRef.current.push(event.data); // Use ref to store audio chunks
                    setRecordedAudioChunks(prev => [...prev, event.data]); // Update state
                }
            };


            mediaRecorder.current.onstop = () => {
                console.log((audioChunksRef.current.length));
                console.log(typeof(audioChunksRef.current));
                console.log('Recording stopped, uploading...');
                setRecordedAudioChunks([...audioChunksRef.current]); // Update state on stop
                // uploadAudio(); // Will be called from ChatTabContent
            };


            mediaRecorder.current.start();
        } catch (error: any) {
            console.error("Error accessing microphone:", error.message);
            setIsRecording(false);
            onRecordingStateChange(false);
            // Handle error (e.g., display a message to the user)
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
            mediaRecorder.current.stop();
            setIsRecording(false); // Update recording state
            // Stop the audio stream
            mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
            // Optionally clear the animation frame
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        }
    };

    const uploadAudio = async () => {
        const finalAudioChunks = [...audioChunksRef.current]; // Convert ref to local array
console.log(finalAudioChunks.length);

        console.log('Audio Chunks before upload:', finalAudioChunks);
console.log(selectedSubthreadId,userId,finalAudioChunks);

        if (!selectedSubthreadId || !userId || finalAudioChunks.length === 0) {
            console.log('exited - missing data');
            return;
        }

        const audioBlob = new Blob(finalAudioChunks, { type: 'audio/webm' });
        const storage = getStorage();
        // Use Date.now() for the timestamp in the storage path
        const audioRef = storageRef(storage, `audio-messages/${selectedSubthreadId}/${userId}-${Date.now()}.webm`);
        const uploadTask = uploadBytesResumable(audioRef, audioBlob);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
            },
            (error) => {
                console.error("Error uploading audio:", error);
                // Handle unsuccessful uploads
            },
            async () => {
                // Handle successful uploads on complete
                // Get download URL
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                console.log('File available at', downloadURL);
                onAudioMessageSent(downloadURL);
                audioChunksRef.current = []; // Clear chunks after sending
                onCancelRecording(); // Hide recorder after sending
            }
        );
    };

    const handleDeleteRecording = () => {
        audioChunksRef.current = [];
        setRecordedAudioChunks([]); // Reset recorded audio chunks state

        setIsRecording(false);
        onCancelRecording(); // Revert to the text input
        // Optionally reset the canvas visualization
        const canvas = canvasRef.current;
        const canvasCtx = canvas?.getContext('2d');
        if (canvas && canvasCtx) {
            canvasCtx.fillStyle = '#191919';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        }
        audioContext.current = null; // Explicitly set audioContext to null on delete
        onCancelRecording(); // Revert to the text input

    };

    return (
        <div className="flex items-center w-full">
            {!isRecording && (!recordedAudioChunks || recordedAudioChunks.length === 0) ? (
                <button
                    onClick={startRecording}
                    className="p-2 bg-blue-500 text-white rounded-full focus:outline-none mr-2"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                </button>
            ) : isRecording ? (
                <>
                    <button onClick={stopRecording} className="p-2 bg-red-500 text-white rounded focus:outline-none mr-2">
                        Stop
                    </button>
                    <canvas
                        ref={canvasRef}
                        className="flex-grow"
                        height={20}
                        style={{ backgroundColor: '#191919' }}
                    />
                </>
            ) : recordedAudioChunks && recordedAudioChunks.length > 0 ? (
                <div className="flex items-center">
                    <FaFileAudio className="text-gray-400 text-lg mr-2" /> {/* Replace with your audio icon */}
                    <button onClick={handleDeleteRecording} className="p-2 bg-gray-400 text-white rounded focus:outline-none ml-2">
                        Delete
                    </button>
                    <button onClick={uploadAudio} className="p-2 bg-green-500 text-white rounded focus:outline-none ml-2">
                        Send
                    </button>
                </div>
            ) : (
                <canvas
                    ref={canvasRef}
                    className="flex-grow"
                    height={20}
                    style={{ backgroundColor: '#191919' }}
                />
            )}
        </div>
    );
});

export default AudioRecorder;