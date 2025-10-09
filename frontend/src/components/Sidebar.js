import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Plus, MessageSquare, Settings, LogOut, User, Trash2, X } from 'lucide-react';
import api from '../utils/api';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch chats on component mount and when location changes
  useEffect(() => {
    fetchChats();
  }, [location.pathname]);

  const fetchChats = async () => {
    try {
      const response = await api.get('/chats');
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const handleNewChat = async () => {
    try {
      setLoading(true);
      const response = await api.post('/chats', { title: '' });
      const newChat = response.data;
      
      // Add the new chat to the list
      setChats(prev => [newChat, ...prev]);
      
      // Navigate to the new chat
      navigate(`/chat/${newChat._id}`);
    } catch (error) {
      console.error('Error creating new chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = (chatId) => {
    navigate(`/chat/${chatId}`);
    // Close sidebar on mobile after selecting a chat
    if (onClose) {
      onClose();
    }
  };

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation(); // Prevent chat selection when deleting
    try {
      await api.delete(`/chats/${chatId}`);
      setChats(prev => prev.filter(chat => chat._id !== chatId));
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-white/80 backdrop-blur-xl border-r border-white/20 flex flex-col h-full
        transform transition-all duration-500 ease-out shadow-2xl lg:shadow-xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Mobile Header with Close Button */}
        <div className="p-3 lg:p-4 border-b border-white/20 flex items-center justify-between lg:block">
          <button
            onClick={handleNewChat}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 touch-manipulation hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-4 w-4" />
            {loading ? 'Creating...' : 'New Chat'}
          </button>
          
          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden ml-2 p-2 text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-xl transition-all duration-300 touch-manipulation hover:scale-105 active:scale-95"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-3 lg:p-4">
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
                key={chat._id}
                onClick={() => handleChatClick(chat._id)}
                className="group p-3 rounded-xl hover:bg-white/60 cursor-pointer transition-all duration-300 touch-manipulation hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm border border-white/20 hover:border-white/40 hover:shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-indigo-500 flex-shrink-0 group-hover:text-purple-600 transition-colors duration-300" />
                  <span className="text-sm text-gray-700 truncate flex-1 group-hover:text-gray-900 transition-colors duration-300">
                    {chat.title || 'New Chat'}
                  </span>
                  <button
                    onClick={(e) => handleDeleteChat(chat._id, e)}
                    className="opacity-0 group-hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-1 hover:bg-red-100 rounded-lg transition-all duration-300 touch-manipulation hover:scale-110"
                    title="Delete chat"
                    aria-label="Delete chat"
                  >
                    <Trash2 className="h-3 w-3 text-gray-500 hover:text-red-500 transition-colors duration-300" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* User Section */}
      <div className="p-3 lg:p-4 border-t border-white/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || ''}
            </p>
          </div>
        </div>
        
        <div className="space-y-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-3 text-sm text-gray-700 hover:bg-white/60 hover:text-gray-900 rounded-xl transition-all duration-300 touch-manipulation hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm border border-transparent hover:border-white/20"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
