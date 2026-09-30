import { useContext, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';
import { Bell } from 'lucide-react';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Purchases from './pages/Purchases';
import Transfers from './pages/Transfers';
import Assignments from './pages/Assignments';
import Expenditures from './pages/Expenditures';
import Users from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }) => {
  const { user, loading, logout } = useContext(AuthContext);
  
  if (loading) return <div className="min-h-screen flex items-center justify-center text-white bg-military-navy font-mono">ESTABLISHING SECURE CONNECTION...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900 text-[#1e293b] dark:text-slate-100 flex overflow-hidden transition-colors">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 h-16 flex items-center justify-between px-6 shrink-0 shadow-sm transition-colors">
          <h1 className="text-gray-800 dark:text-white font-bold text-lg tracking-widest uppercase flex items-center gap-2">
            Asset Management Portal
          </h1>
          <div className="flex items-center gap-6">
            <button className="relative text-gray-500 hover:text-gray-800 transition">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 bg-red-500 rounded-full w-2 h-2"></span>
            </button>
            <div className="text-right flex flex-col items-end leading-tight">
              <span className="font-bold text-gray-700">{user.name}</span>
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                {user.role.replace('_', ' ')} | {user.base_id ? `Base: ${user.base_id}` : 'Global'}
              </span>
            </div>
            <button 
              onClick={logout}
              className="text-white bg-red-600/90 hover:bg-red-500 border border-red-700 px-4 py-1.5 rounded-sm text-sm font-bold tracking-wider transition-colors uppercase shadow-inner"
            >
              Logout
            </button>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  const { user } = useContext(AuthContext);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('military_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings.theme === 'Dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.style.colorScheme = 'dark';
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.style.colorScheme = 'light';
        }
      }
    } catch (e) {
      // ignore JSON parse errors
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        
        {/* Protected Routes Wrapper */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
        <Route path="/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
        <Route path="/transfers" element={<ProtectedRoute><Transfers /></ProtectedRoute>} />
        <Route path="/assignments" element={<ProtectedRoute><Assignments /></ProtectedRoute>} />
        <Route path="/expenditures" element={<ProtectedRoute><Expenditures /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
