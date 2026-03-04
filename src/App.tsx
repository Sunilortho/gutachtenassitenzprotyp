import { useState, useEffect } from 'react';
import { initializeDemoData, getCurrentUser, login, logout } from './lib/db';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import { LogOut, User, Stethoscope, Menu, X } from 'lucide-react';

type Page = 'dashboard' | 'workspace' | 'login';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [currentCase, setCurrentCase] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    setMobileMenuOpen(false);
  };

  const goBack = () => {
    setCurrentCase(null);
    setCurrentPage('dashboard');
  };

  if (!user || currentPage === 'login') {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-dark-50 to-dark">
      {/* Navbar */}
      <nav className="bg-dark-50/95 backdrop-blur-xl border-b border-dark-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Stethoscope size={20} />
              </div>
              <span className="text-xl font-bold gradient-text hidden sm:block">
                Gutachten Assistent
              </span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 text-slate-300">
                <div className="w-8 h-8 bg-gradient-to-br from-primary/50 to-accent/50 rounded-full flex items-center justify-center">
                  <User size={16} className="text-white" />
                </div>
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

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-slate-400"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-dark-100 animate-fadeIn">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary/50 to-accent/50 rounded-full flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <span className="text-white font-medium">{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
              >
                <LogOut size={18} />
                Abmelden
              </button>
            </div>
          )}
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default App;
