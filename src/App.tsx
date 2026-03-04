import { useState, useEffect } from 'react';
import { initializeDemoData, getCurrentUser, login, logout } from './lib/db';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import { FileText, Settings, LogOut, User, Stethoscope } from 'lucide-react';

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

  const handleLogin = (email: string, userData?: any) => {
    const user = login(email, userData?.name || 'Demo User');
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
    <div className="min-h-screen bg-gradient-to-br from-dark to-dark-50">
      {/* Navbar */}
      <nav className="bg-dark-50/95 backdrop-blur-sm border-b border-dark-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20">
                <Stethoscope size={20} />
              </div>
              <span className="text-xl font-bold gradient-text">
                Gutachten Assistent
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-300">
                <User size={18} className="text-primary" />
                <span className="text-sm font-medium">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
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
