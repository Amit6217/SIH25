import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, MessageSquare, Settings, LogOut, User } from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState([]);

  const handleNewChat = () => {
    // Create new chat logic
    console.log('New chat clicked');
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {chats.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs text-gray-400">Start a new chat to begin</p>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className="p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700 truncate">
                    {chat.title}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || ''}
            </p>
          </div>
        </div>
        
        <div className="space-y-1">
          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
