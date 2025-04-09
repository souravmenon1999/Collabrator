import { useState } from "react";
import {
  PaperAirplaneIcon,
  MicrophoneIcon,
  PlusIcon,
  CameraIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

const dummyMessages = [
  { id: 1, sender: "Sinto", text: "Created a task for @Alwyn", time: "10:09 PM", type: "task" },
  { id: 2, sender: "Me", text: "Elit, sed do eiusmod tempor incididunt.", time: "10:10 PM", type: "text" },
  { id: 3, sender: "Sinto", text: "Dolore magna aliqua.", time: "10:11 PM", type: "text" },
  { id: 4, sender: "Alwyn", text: "Lorem ipsum", time: "10:12 PM", type: "text" },
  { id: 5, sender: "Me", text: "Ut enim ad minim veniam", time: "10:13 PM", type: "text" },
];

export default function ChatUI() {
  const [messages, setMessages] = useState(dummyMessages);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: messages.length + 1, sender: "Me", text: input, time: "10:15 PM", type: "text" }]);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-[#EAE6DF] flex flex-col items-center p-4">
      {/* Chat Header */}
      <div className="w-full max-w-md bg-[#075E54] p-4 flex justify-between items-center shadow-md rounded-t-lg text-white">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-xl font-bold">L</div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold">Lorem Ipsum</h1>
            <p className="text-sm text-gray-200">Last conversation today at 09:16</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="w-full max-w-md bg-[#DADADA] p-4 flex flex-col space-y-3 overflow-y-auto h-96 border-t border-b">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "Me" ? "justify-end" : "justify-start"}`}>
            <div className={`p-2 rounded-lg text-sm shadow-md ${msg.sender === "Me" ? "bg-[#25D366] text-white" : "bg-white text-gray-900"}`}>
              <span className="block font-semibold text-xs text-gray-700">{msg.sender}</span>
              <p>{msg.text}</p>
              <span className="text-xs text-gray-600 block mt-1 text-right">{msg.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <div className="w-full max-w-md bg-[#FFFFFF] p-2 flex items-center shadow-md rounded-b-lg">
        <button className="p-2 text-gray-500">
          <PlusIcon className="w-6 h-6" />
        </button>
        <input
          type="text"
          className="flex-1 p-2 mx-2 border rounded-full bg-[#F0F0F0]"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="p-2 text-gray-500">
          <CameraIcon className="w-6 h-6" />
        </button>
        <button className="p-2 text-gray-500">
          <DocumentTextIcon className="w-6 h-6" />
        </button>
        <button className="p-2 text-gray-500">
          <MicrophoneIcon className="w-6 h-6" />
        </button>
        <button className="p-2 text-green-500" onClick={sendMessage}>
          <PaperAirplaneIcon className="w-6 h-6 rotate-90" />
        </button>
      </div>
    </div>
  );
}
