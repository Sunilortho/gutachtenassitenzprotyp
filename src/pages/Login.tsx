import { useState } from 'react';
import { FileText, Mail, Lock, ArrowRight, User, Phone, Building, Eye, EyeOff, CheckCircle, Stethoscope } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark via-dark-50 to-dark px-4 py-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-primary/20 rotate-3">
            <Stethoscope size={36} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Gutachten Assistent</h1>
          <p className="text-slate-400">KI-gestützte Gesundheitslösungen</p>
        </div>

        {/* Form */}
        <div className="bg-dark-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-dark-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ihr Name"
                    className="w-full pl-10 pr-4 py-3 bg-dark border border-dark-100 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    required={mode === 'register'}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">E-Mail-Adresse *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ihre@email.de"
                  className="w-full pl-10 pr-4 py-3 bg-dark border border-dark-100 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Telefon</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+49 123 456789"
                      className="w-full pl-10 pr-4 py-3 bg-dark border border-dark-100 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Praxis / Organisation</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Ihre Praxis oder Organisation"
                      className="w-full pl-10 pr-4 py-3 bg-dark border border-dark-100 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {mode === 'register' ? 'Passwort *' : 'Passwort'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Mindestens 6 Zeichen' : '••••••••'}
                  className="w-full pl-10 pr-12 py-3 bg-dark border border-dark-100 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  required={mode === 'register'}
                  minLength={mode === 'register' ? 6 : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-primary border-dark-100 rounded focus:ring-primary bg-dark"
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
              className="w-full bg-gradient-to-r from-primary to-accent text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
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
            </button>
          </form>

          {/* Switch Mode */}
          <div className="mt-6 pt-6 border-t border-dark-100">
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
    </div>
  );
}
