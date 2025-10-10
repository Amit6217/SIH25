import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ChatInterface from './components/ChatInterface';
import Login from './components/Login';
import Register from './components/Register';
import Sidebar from './components/Sidebar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Menu } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on mobile when screen size changes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-400"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 relative overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <main className="flex-1 flex flex-col lg:ml-0 relative z-10">
        {/* Mobile Header with Hamburger Menu */}
        <div className="lg:hidden flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
          <button
            onClick={toggleSidebar}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all duration-300 touch-manipulation hover:scale-105 active:scale-95"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-white">LegalEase</h1>
          <div className="w-10"></div> {/* Spacer for centering */}
        </div>
        
        <Routes>
          <Route path="/" element={<ChatInterface />} />
          <Route path="/chat/:chatId" element={<ChatInterface />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
