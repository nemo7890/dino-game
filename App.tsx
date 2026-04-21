/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Menu from './pages/Menu';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Leaderboard from './pages/Leaderboard';
import DeveloperFooter from './components/DeveloperFooter';
import { useState, useEffect, ReactNode } from 'react';
import { playSound } from './lib/sound';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" />;
  return <>{children}</>;
};

const AuthRedirect = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  if (user) return <Navigate to="/menu" />;
  return <>{children}</>;
};

const TopNav = ({ toggleTheme, isNightMode }: { toggleTheme: () => void, isNightMode: boolean }) => {
  const { user, username, logout } = useAuth();
  
  return (
    <nav className="h-16 px-4 md:px-8 flex shrink-0 items-center justify-between border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-[#17181b]">
      <div className="flex items-center space-x-4">
        <img src="/images/dino.png" alt="Logo" className="w-8 h-8 md:w-10 md:h-10 border-2 border-gray-800 dark:border-[#e8eaed] bg-gray-200 dark:bg-[#535353] rounded object-contain p-1" onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20,2H14V4H12V6H10V8H8V10H6V12H4V14H2V16H4V18H6V20H8V22H10V20H12V18H14V16H16V14H18V12H20V10H22V2H20Z" fill="white"/></svg>';
        }} />
        <span className="text-xl md:text-3xl font-bold uppercase hidden sm:block text-black dark:text-[#e8eaed] pt-1">CRAZY DINOS</span>
      </div>
      <div className="flex items-center gap-4 md:space-x-6">
        <button
            onClick={toggleTheme}
            className="hidden md:flex items-center justify-between w-28 bg-gray-100 dark:bg-[#282a2e] p-2 rounded border border-gray-300 dark:border-gray-700 font-mono"
          >
            <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Night Mode</span>
            <div className={`w-8 h-4 rounded-full flex items-center px-1 transition-colors ${isNightMode ? 'bg-blue-600' : 'bg-gray-500'}`}>
              <div className={`w-2 h-2 bg-white rounded-full transition-all ${isNightMode ? 'ml-auto' : ''}`}></div>
            </div>
        </button>
        {user && (
          <div className="flex items-center space-x-3 font-mono">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400">Logged in as</p>
              <p className="text-xs md:text-sm font-semibold text-green-600 dark:text-green-400">{username}</p>
            </div>
            <button onClick={() => { playSound('/sounds/click.mp3'); logout(); }} className="px-3 py-1 md:px-4 md:py-1 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors text-[10px] md:text-xs uppercase font-bold">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

const AppContent = () => {
  const [isNightMode, setIsNightMode] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });

  useEffect(() => {
    if (isNightMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isNightMode]);

  const toggleTheme = () => { playSound('/sounds/click.mp3'); setIsNightMode(!isNightMode); };

  return (
    <div className="min-h-screen relative font-mono overflow-hidden flex flex-col bg-white text-gray-900 dark:bg-[#202124] dark:text-[#e8eaed] selection:bg-gray-300 dark:selection:bg-gray-700 transition-colors duration-300">
      <TopNav toggleTheme={toggleTheme} isNightMode={isNightMode} />

      <div className="flex-1 flex flex-col relative w-full h-[calc(100vh-112px)] overflow-hidden">
        <Routes>
          <Route path="/" element={<AuthRedirect><Login /></AuthRedirect>} />
          <Route path="/menu" element={<ProtectedRoute><Menu /></ProtectedRoute>} />
          <Route path="/lobby/:type" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
          <Route path="/game/:roomId?" element={<ProtectedRoute><Game /></ProtectedRoute>} />
          <Route path="/leaderboards" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        </Routes>
      </div>
      <DeveloperFooter />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
