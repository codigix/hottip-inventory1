import React, { useState } from 'react';
import { useTour } from '@/hooks/useTour';
import { chatroomTourConfig } from '../tours/chatroomTour';
import StartTourButton from '../StartTourButton';

/**
 * Example ChatRoom Component with Tour Integration
 */
const ChatRoomWithTour = () => {
  const [selectedChannel, setSelectedChannel] = useState('general');
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, user: 'John Doe', message: 'Hello everyone!', timestamp: '10:30 AM', avatar: '👨' },
    { id: 2, user: 'Jane Smith', message: 'Hi John! How are you?', timestamp: '10:31 AM', avatar: '👩' },
  ]);

  const channels = [
    { id: 'general', name: 'General', members: 45 },
    { id: 'announcements', name: 'Announcements', members: 128 },
    { id: 'tech', name: 'Tech Discussion', members: 32 },
    { id: 'events', name: 'Events', members: 67 },
  ];

  const activeMembers = [
    { id: 1, name: 'John Doe', status: 'online' },
    { id: 2, name: 'Jane Smith', status: 'online' },
    { id: 3, name: 'Bob Johnson', status: 'offline' },
    { id: 4, name: 'Alice Williams', status: 'online' },
  ];

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      setMessages([
        ...messages,
        {
          id: messages.length + 1,
          user: 'You',
          message: messageInput,
          timestamp: new Date().toLocaleTimeString(),
          avatar: '👤',
        },
      ]);
      setMessageInput('');
    }
  };

  return (
    <div className="space-y-6 h-screen flex flex-col">
      {/* Header with Tour Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">ChatRoom</h1>
        <StartTourButton
          tourConfig={chatroomTourConfig}
          tourName="chatroomTourDone"
        />
      </div>

      {/* Main Chat Container */}
      <div data-tour="chatroom-main" className="flex-1 bg-white rounded-lg shadow grid grid-cols-1 md:grid-cols-4 gap-0 overflow-hidden">
        
        {/* Channels Sidebar */}
        <div data-tour="chatroom-channels" className="md:col-span-1 border-r border-gray-200 p-4 overflow-y-auto bg-gray-50">
          <h3 className="font-bold mb-4">Channels</h3>
          <div className="space-y-2">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel.id)}
                className={`w-full text-left px-4 py-2 rounded transition ${
                  selectedChannel === channel.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-800 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium"># {channel.name}</div>
                <div className={`text-xs ${selectedChannel === channel.id ? 'text-blue-100' : 'text-gray-500'}`}>
                  {channel.members} members
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Messages Area */}
        <div className="md:col-span-2 flex flex-col">
          {/* Messages Header */}
          <div className="border-b border-gray-200 p-4">
            <h2 className="font-bold text-lg">
              # {channels.find(c => c.id === selectedChannel)?.name}
            </h2>
          </div>

          {/* Messages List */}
          <div data-tour="chatroom-messages" className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <div className="text-3xl">{msg.avatar}</div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold">{msg.user}</span>
                    <span className="text-xs text-gray-500">{msg.timestamp}</span>
                  </div>
                  <p className="text-gray-700 mt-1">{msg.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div data-tour="chatroom-input" className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Members Sidebar */}
        <div data-tour="chatroom-members" className="hidden md:block md:col-span-1 border-l border-gray-200 p-4 bg-gray-50 overflow-y-auto">
          <h3 className="font-bold mb-4">Active Members</h3>
          <div className="space-y-2">
            {activeMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer transition">
                <div className={`w-3 h-3 rounded-full ${member.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-sm">{member.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatRoomWithTour;
