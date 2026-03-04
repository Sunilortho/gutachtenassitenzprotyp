import { useState, useEffect } from 'react';
import { Mail, Lock, ArrowRight, User, Phone, Building, Eye, EyeOff, CheckCircle, Stethoscope } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, userData?: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
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
    <div className="min-h-screen flex items-center justify-center bg-dark relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Floating particles */}
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
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiLz48cGF0aCBkPSJNMCAwaDFWNDBIMHoiIGZpbGw9Im5vbmUiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvZz48L3N2Zz4=')] opacity-30"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10 px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent blur-xl opacity-50 animate-pulse"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center text-white shadow-2xl rotate-3 hover:rotate-6 transition-transform duration-500">
              <Stethoscope size={42} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Gutachten Assistent</h1>
          <p className="text-slate-400 text-lg">KI-gestützte Gesundheitslösungen</p>
        </div>

        {/* Form */}
        <div className="bg-dark-50/60 backdrop-blur-2xl rounded-3xl shadow-2xl border border-dark-100/50 p-8 relative overflow-hidden">
          {/* Top gradient line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary"></div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-medium text-slate-300 mb-2">Name *</label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ihr Name"
                    className="w-full pl-10 pr-4 py-3.5 bg-dark/50 border border-dark-100 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    required={mode === 'register'}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">E-Mail-Adresse *</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ihre@email.de"
                  className="w-full pl-10 pr-4 py-3.5 bg-dark/50 border border-dark-100 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div className="animate-fadeIn">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Telefon</label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+49 123 456789"
                      className="w-full pl-10 pr-4 py-3.5 bg-dark/50 border border-dark-100 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="animate-fadeIn">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Praxis / Organisation</label>
                  <div className="relative group">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Ihre Praxis oder Organisation"
                      className="w-full pl-10 pr-4 py-3.5 bg-dark/50 border border-dark-100 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {mode === 'register' ? 'Passwort *' : 'Passwort'}
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Mindestens 6 Zeichen' : '••••••••'}
                  className="w-full pl-10 pr-12 py-3.5 bg-dark/50 border border-dark-100 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  required={mode === 'register'}
                  minLength={mode === 'register' ? 6 : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors"
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
                  className="mt-1 w-4 h-4 text-primary border-dark-100 rounded focus:ring-primary bg-dark/50"
                />
                <label htmlFor="terms" className="text-sm text-slate-400">
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
              className="w-full bg-gradient-to-r from-primary via-primary to-accent text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
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
          <div className="mt-6 pt-6 border-t border-dark-100/50">
            {mode === 'login' ? (
              <p className="text-center text-sm text-slate-400">
                Noch kein Konto?{' '}
                <button onClick={switchMode} className="text-primary font-medium hover:underline">
                  Jetzt registrieren
                </button>
              </p>
            ) : (
              <p className="text-center text-sm text-slate-400">
                Bereits ein Konto?{' '}
                <button onClick={switchMode} className="text-primary font-medium hover:underline">
                  Hier anmelden
                </button>
              </p>
            )}
          </div>

          {mode === 'login' && (
            <div className="mt-4 p-4 bg-primary/10 rounded-xl border border-primary/20">
              <p className="text-center text-sm text-primary">
                <strong>Demo-Modus:</strong> Geben Sie eine E-Mail ein, um fortzufahren
              </p>
              <p className="text-center text-xs text-slate-400 mt-2">
                Daten werden lokal in Ihrem Browser gespeichert
              </p>
            </div>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-slate-500">
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
        .animate-float {
          animation: float 6s ease-in-out infinite;
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
