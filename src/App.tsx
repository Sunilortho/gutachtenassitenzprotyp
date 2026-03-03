import { useState, useEffect } from 'react';
import { initializeDemoData, getCurrentUser, login, logout } from './lib/db';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import { FileText, Settings, LogOut, User } from 'lucide-react';

type Page = 'dashboard' | 'workspace' | 'login';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [currentCase, setCurrentCase] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    initializeDemoData();
    const savedUser = getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
      setCurrentPage('dashboard');
    }
  }, []);

  const handleLogin = (email: string) => {
    const user = login(email, 'demo');
    setUser(user);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setCurrentPage('login');
  };

  const openCase = (caseId: string) => {
    setCurrentCase(caseId);
    setCurrentPage('workspace');
  };

  const goBack = () => {
    setCurrentCase(null);
    setCurrentPage('dashboard');
  };

  if (!user || currentPage === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navbar */}
      <nav className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-[#1a5f9c] to-[#0e3b63] rounded-lg flex items-center justify-center text-white font-bold">
                GA
              </div>
              <span className="text-xl font-semibold bg-gradient-to-r from-[#0e3b63] to-[#1a5f9c] bg-clip-text text-transparent">
                Gutachten Assistent
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <User size={18} />
                <span className="text-sm font-medium">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                title="Abmelden"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentPage === 'dashboard' && (
          <Dashboard onOpenCase={openCase} />
        )}
        {currentPage === 'workspace' && currentCase && (
          <Workspace caseId={currentCase} onBack={goBack} />
        )}
      </main>
    </div>
  );
}

export default App;
