import { useState, useEffect } from 'react';
import { initializeDemoData, getCurrentUser, login, logout } from './lib/db';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import { LogOut, User, Stethoscope, Menu, X, Sun, Moon } from 'lucide-react';

type Page = 'dashboard' | 'workspace' | 'login';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [currentCase, setCurrentCase] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('gutachten_theme');
    return (saved as 'dark' | 'light') || 'dark';
  });

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('gutachten_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

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

  const isDark = theme === 'dark';

  if (!user || currentPage === 'login') {
    return <Login onLogin={handleLogin} theme={theme} toggleTheme={toggleTheme} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isDark ? 'bg-gradient-to-br from-dark via-dark-50 to-dark' : 'bg-gradient-to-br from-slate-100 via-slate-50 to-white'}`}>
      {/* Navbar */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${isDark ? 'bg-dark-50/95 backdrop-blur-xl border-b border-dark-100' : 'bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                isDark 
                  ? 'bg-gradient-to-br from-primary to-accent' 
                  : 'bg-gradient-to-br from-primary to-blue-600'
              }`}>
                <Stethoscope size={20} className="text-white" />
              </div>
              <span className={`text-xl font-bold transition-colors duration-300 ${
                isDark ? 'gradient-text' : 'text-slate-800'
              }`}>
                Gutachten Assistent
              </span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2.5 rounded-xl transition-all duration-300 ${
                  isDark 
                    ? 'text-slate-400 hover:text-yellow-400 hover:bg-dark-100' 
                    : 'text-slate-500 hover:text-primary hover:bg-slate-100'
                }`}
                title={isDark ? 'Light mode' : 'Dark mode'}
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* User */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-gradient-to-br from-primary/50 to-accent/50' : 'bg-gradient-to-br from-primary/30 to-blue-500/30'
                }`}>
                  <User size={16} className={isDark ? 'text-white' : 'text-primary'} />
                </div>
                <span className="text-sm font-medium">{user.name}</span>
              </div>
              
              <button
                onClick={handleLogout}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  isDark 
                    ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' 
                    : 'text-slate-500 hover:text-red-500 hover:bg-red-50'
                }`}
                title="Abmelden"
              >
                <LogOut size={18} />
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  isDark 
                    ? 'text-slate-400 hover:text-yellow-400' 
                    : 'text-slate-500 hover:text-primary'
                }`}
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                className={`p-2 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className={`md:hidden py-4 border-t transition-colors duration-300 animate-fadeIn ${
              isDark ? 'border-dark-100' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isDark ? 'bg-gradient-to-br from-primary/50 to-accent/50' : 'bg-gradient-to-br from-primary/30 to-blue-500/30'
                }`}>
                  <User size={20} className={isDark ? 'text-white' : 'text-primary'} />
                </div>
                <span className={isDark ? 'text-white font-medium' : 'text-slate-800 font-medium'}>{user.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className={`flex items-center gap-2 transition-colors duration-300 ${
                  isDark ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'
                }`}
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
          <Dashboard onOpenCase={openCase} theme={theme} />
        )}
        {currentPage === 'workspace' && currentCase && (
          <Workspace caseId={currentCase} onBack={goBack} theme={theme} />
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
