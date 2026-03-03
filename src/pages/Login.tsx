import { useState } from 'react';
import { FileText, Mail, Lock, ArrowRight, User, Phone, Building, Eye, EyeOff, CheckCircle } from 'lucide-react';

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
      // Save registration data
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#1a5f9c] to-[#0e3b63] rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg">
            GA
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Gutachten Assistent</h1>
          <p className="text-gray-500 mt-2">
            {mode === 'login' ? 'Melden Sie sich an, um fortzufahren' : 'Erstellen Sie ein Konto'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ihr Name"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a5f9c] focus:border-transparent outline-none transition-all"
                    required={mode === 'register'}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                E-Mail-Adresse *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ihre@email.de"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a5f9c] focus:border-transparent outline-none transition-all"
                  required
                />
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+49 123 456789"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a5f9c] focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Praxis / Organisation
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Ihre Praxis oder Organisation"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a5f9c] focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mode === 'register' ? 'Passwort *' : 'Passwort'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Mindestens 6 Zeichen' : '••••••••'}
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a5f9c] focus:border-transparent outline-none transition-all"
                  required={mode === 'register'}
                  minLength={mode === 'register' ? 6 : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                  className="mt-1 w-4 h-4 text-[#1a5f9c] border-gray-300 rounded focus:ring-[#1a5f9c]"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  Ich akzeptiere die{' '}
                  <a href="#" className="text-[#1a5f9c] hover:underline">Nutzungsbedingungen</a>
                  {' '}und{' '}
                  <a href="#" className="text-[#1a5f9c] hover:underline">Datenschutzerklärung</a>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'register' && (!name || !email || !password || !terms))}
              className="w-full bg-gradient-to-r from-[#1a5f9c] to-[#0e3b63] text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="mt-6 pt-6 border-t border-gray-100">
            {mode === 'login' ? (
              <p className="text-center text-sm text-gray-500">
                Noch kein Konto?{' '}
                <button
                  onClick={switchMode}
                  className="text-[#1a5f9c] font-medium hover:underline"
                >
                  Jetzt registrieren
                </button>
              </p>
            ) : (
              <p className="text-center text-sm text-gray-500">
                Bereits ein Konto?{' '}
                <button
                  onClick={switchMode}
                  className="text-[#1a5f9c] font-medium hover:underline"
                >
                  Hier anmelden
                </button>
              </p>
            )}
          </div>

          {mode === 'login' && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl">
              <p className="text-center text-sm text-blue-700">
                <strong>Demo-Modus:</strong> Geben Sie eine E-Mail ein, um fortzufahren
              </p>
            </div>
          )}
        </div>

        <p className="text-center mt-6 text-sm text-gray-400">
          © 2024 Gutachten Assistent
        </p>
      </div>
    </div>
  );
}
