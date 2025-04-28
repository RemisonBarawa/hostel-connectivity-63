import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import StudentDashboard from './pages/StudentDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import HostelSearch from './pages/HostelSearch';
import Chat from './pages/Chat';
import { ChatToggle } from './components/chat/ChatToggle';
import { ChatProvider } from './contexts/ChatContext';

function App() {
  return (
    <ChatProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/owner-dashboard" element={<OwnerDashboard />} />
            <Route path="/admin-dashboard" element={<AdminDashboard />} />
            <Route path="/hostel-search" element={<HostelSearch />} />
            <Route path="/chat" element={<Chat />} />
          </Routes>
        </main>
        <ChatToggle />
      </div>
    </ChatProvider>
  );
}

export default App;
