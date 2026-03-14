import { useState } from 'react';
import { Mail, Lock, ArrowRight, User, Phone, Building, Eye, EyeOff, CheckCircle, Sun, Moon } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, userData?: any) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export default function Login({ onLogin, theme, toggleTheme }: LoginProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Registration fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [terms, setTerms] = useState(false);

  const isDark = theme === 'dark';

  const handleDemoLogin = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 400));
    onLogin('demo@gutachten.de', { name: 'Dr. med. Demo' });
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (mode === 'register') {
      const userData = { name, email, phone, company, registeredAt: new Date().toISOString() };
      localStorage.setItem('gutachten_user_' + email, JSON.stringify(userData));
      localStorage.setItem('gutachten_current_user', email);
      onLogin(email, userData);
    } else {
      onLogin(email);
    }
    
    setLoading(false);
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setPassword('');
  };

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-500 ${isDark ? 'bg-dark' : 'bg-gradient-to-br from-slate-100 via-slate-50 to-white'}`}>
      {/* Theme toggle button */}
      <button
        onClick={toggleTheme}
        className={`absolute top-4 right-4 z-50 p-3 rounded-full transition-all duration-300 ${isDark ? 'bg-dark-50 text-yellow-400 hover:bg-dark-100' : 'bg-white text-slate-600 shadow-lg hover:shadow-xl'}`}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute inset-0">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-primary/40 rounded-full animate-float"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${3 + Math.random() * 4}s`
                  }}
                />
              ))}
            </div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiLz48cGF0aCBkPSJNMCAwaDFWNDBIMHoiIGZpbGw9Im5vbmUiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvZz48L3N2Zz4=')] opacity-30"></div>
          </>
        ) : (
          <>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-100 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute inset-0">
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-primary/20 rounded-full animate-float-light"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${4 + Math.random() * 4}s`
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>
      
      <div className="w-full max-w-md relative z-10 px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4 group">
            {/* Glow effect */}
            <div className={`absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary blur-xl opacity-50 animate-pulse transition-opacity duration-300 ${isDark ? 'group-hover:opacity-70' : 'group-hover:opacity-40'}`}></div>
            
            {/* Logo icon - modern design */}
            <div className={`relative w-28 h-28 rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-105 hover:rotate-3 cursor-pointer ${
              isDark 
                ? 'bg-gradient-to-br from-primary to-accent' 
                : 'bg-gradient-to-br from-primary to-blue-600'
            }`}>
              {/* Inner design */}
              <div className="relative">
                {/* Stethoscope icon stylized */}
                <svg viewBox="0 0 64 64" className="w-14 h-14 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Circle */}
                  <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.3"/>
                  <circle cx="32" cy="32" r="18" stroke="currentColor" strokeWidth="2" fill="none"/>
                  {/* Heart/pulse */}
                  <path d="M20 32 L26 32 L30 24 L34 40 L38 32 L44 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  {/* Center dot */}
                  <circle cx="32" cy="32" r="4" fill="currentColor"/>
                </svg>
              </div>
            </div>
          </div>
          
          <h1 className={`text-4xl font-bold mb-2 tracking-tight transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Gutachten Assistent
          </h1>
          <p className={`text-lg transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            KI-gestützte Gesundheitslösungen
          </p>
        </div>

        {/* Form */}
        <div className={`rounded-3xl shadow-2xl p-8 relative overflow-hidden transition-all duration-500 ${
          isDark 
            ? 'bg-dark-50/60 backdrop-blur-2xl border border-dark-100/50' 
            : 'bg-white/80 backdrop-blur-2xl border border-slate-200/50 shadow-slate-200/50'
        }`}>
          {/* Top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div className="animate-fadeIn">
                <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Name *</label>
                <div className="relative group">
                  <User className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isDark ? 'text-slate-500 group-focus-within:text-primary' : 'text-slate-400 group-focus-within:text-primary'}`} size={18} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ihr Name"
                    className={`w-full pl-10 pr-4 py-3.5 rounded-xl transition-all duration-300 ${
                      isDark 
                        ? 'bg-dark/50 border border-dark-100 text-white placeholder-slate-500 focus:ring-primary' 
                        : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-primary'
                    }`}
                    required={mode === 'register'}
                  />
                </div>
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>E-Mail-Adresse *</label>
              <div className="relative group">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isDark ? 'text-slate-500 group-focus-within:text-primary' : 'text-slate-400 group-focus-within:text-primary'}`} size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ihre@email.de"
                  className={`w-full pl-10 pr-4 py-3.5 rounded-xl transition-all duration-300 ${
                    isDark 
                      ? 'bg-dark/50 border border-dark-100 text-white placeholder-slate-500 focus:ring-primary' 
                      : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-primary'
                  }`}
                  required
                />
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div className="animate-fadeIn">
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Telefon</label>
                  <div className="relative group">
                    <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isDark ? 'text-slate-500 group-focus-within:text-primary' : 'text-slate-400 group-focus-within:text-primary'}`} size={18} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+49 123 456789"
                      className={`w-full pl-10 pr-4 py-3.5 rounded-xl transition-all duration-300 ${
                        isDark 
                          ? 'bg-dark/50 border border-dark-100 text-white placeholder-slate-500 focus:ring-primary' 
                          : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-primary'
                      }`}
                    />
                  </div>
                </div>

                <div className="animate-fadeIn">
                  <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Praxis / Organisation</label>
                  <div className="relative group">
                    <Building className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isDark ? 'text-slate-500 group-focus-within:text-primary' : 'text-slate-400 group-focus-within:text-primary'}`} size={18} />
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Ihre Praxis oder Organisation"
                      className={`w-full pl-10 pr-4 py-3.5 rounded-xl transition-all duration-300 ${
                        isDark 
                          ? 'bg-dark/50 border border-dark-100 text-white placeholder-slate-500 focus:ring-primary' 
                          : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-primary'
                      }`}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className={`block text-sm font-medium mb-2 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {mode === 'register' ? 'Passwort *' : 'Passwort'}
              </label>
              <div className="relative group">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isDark ? 'text-slate-500 group-focus-within:text-primary' : 'text-slate-400 group-focus-within:text-primary'}`} size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Mindestens 6 Zeichen' : '••••••••'}
                  className={`w-full pl-10 pr-12 py-3.5 rounded-xl transition-all duration-300 ${
                    isDark 
                      ? 'bg-dark/50 border border-dark-100 text-white placeholder-slate-500 focus:ring-primary' 
                      : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-primary'
                  }`}
                  required={mode === 'register'}
                  minLength={mode === 'register' ? 6 : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isDark ? 'text-slate-500 hover:text-primary' : 'text-slate-400 hover:text-primary'}`}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="flex items-start gap-3 animate-fadeIn">
                <input
                  type="checkbox"
                  id="terms"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className={`mt-1 w-4 h-4 rounded transition-colors duration-300 ${isDark ? 'text-primary border-dark-100 bg-dark/50' : 'text-primary border-slate-300 bg-slate-50'}`}
                />
                <label htmlFor="terms" className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Ich akzeptiere die{' '}
                  <a href="#" className="text-primary hover:underline">Nutzungsbedingungen</a>
                  {' '}und{' '}
                  <a href="#" className="text-primary hover:underline">Datenschutzerklärung</a>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'register' && (!name || !email || !password || !terms))}
              className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark 
                  ? 'bg-gradient-to-r from-primary via-primary to-accent text-white hover:shadow-2xl hover:shadow-primary/30' 
                  : 'bg-gradient-to-r from-primary to-blue-600 text-white hover:shadow-2xl hover:shadow-primary/30'
              }`}
            >
              <span className="relative z-10">
                {loading ? (
                  'Bitte warten...'
                ) : mode === 'login' ? (
                  <>
                    Anmelden
                    <ArrowRight size={18} />
                  </>
                ) : (
                  <>
                    Konto erstellen
                    <CheckCircle size={18} />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Switch Mode */}
          <div className={`mt-6 pt-6 border-t transition-colors duration-300 ${isDark ? 'border-dark-100/50' : 'border-slate-200/50'}`}>
            {mode === 'login' ? (
              <p className={`text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Noch kein Konto?{' '}
                <button onClick={switchMode} className="text-primary font-medium hover:underline">
                  Jetzt registrieren
                </button>
              </p>
            ) : (
              <p className={`text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Bereits ein Konto?{' '}
                <button onClick={switchMode} className="text-primary font-medium hover:underline">
                  Hier anmelden
                </button>
              </p>
            )}
          </div>

          {mode === 'login' && (
            <div className="space-y-3 mt-4">
              {/* Demo starten button */}
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 border-2 disabled:opacity-50 ${
                  isDark
                    ? 'border-primary/40 text-primary hover:bg-primary/10'
                    : 'border-primary/30 text-primary hover:bg-primary/5'
                }`}
              >
                {loading ? 'Bitte warten...' : '▶ Demo starten — ohne Anmeldung'}
              </button>
              {/* GDPR notice */}
              <div className={`p-3 rounded-xl border text-center ${
                isDark ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-800'
              }`}>
                <p className="text-xs font-medium">⚠️ Demo-Modus: Bitte keine echten Patientendaten eingeben</p>
                <p className="text-xs mt-1 opacity-75">Daten werden lokal im Browser gespeichert und sind nicht verschlüsselt</p>
              </div>
            </div>
          )}
        </div>

        <p className={`text-center mt-6 text-sm transition-colors duration-300 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          © 2026 Medicortex. Alle Rechte vorbehalten.
        </p>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.4; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
          50% { transform: translateY(-10px) translateX(-10px); opacity: 0.4; }
          75% { transform: translateY(-30px) translateX(5px); opacity: 0.6; }
        }
        @keyframes float-light {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(-15px); opacity: 0.6; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-light {
          animation: float-light 7s ease-in-out infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
