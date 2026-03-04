import { useState, useEffect } from 'react';
import { getCases, saveCase, deleteCase, Case, generateId } from '../lib/db';
import { 
  FileText, Plus, Search, 
  Trash2, Eye,
  Users, Activity, ClipboardCheck
} from 'lucide-react';

interface DashboardProps {
  onOpenCase: (caseId: string) => void;
  theme: 'dark' | 'light';
}

const statusColors: Record<string, { dark: string; light: string }> = {
  new: { dark: 'bg-blue-500/20 text-blue-400 border-blue-500/30', light: 'bg-blue-100 text-blue-600 border-blue-200' },
  documents: { dark: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', light: 'bg-yellow-100 text-yellow-600 border-yellow-200' },
  analysis: { dark: 'bg-purple-500/20 text-purple-400 border-purple-500/30', light: 'bg-purple-100 text-purple-600 border-purple-200' },
  review: { dark: 'bg-orange-500/20 text-orange-400 border-orange-500/30', light: 'bg-orange-100 text-orange-600 border-orange-200' },
  completed: { dark: 'bg-green-500/20 text-green-400 border-green-500/30', light: 'bg-green-100 text-green-600 border-green-200' }
};

const statusLabels: Record<string, string> = {
  new: 'Neu',
  documents: 'Dokumente',
  analysis: 'In Analyse',
  review: 'Prüfung',
  completed: 'Abgeschlossen'
};

export default function Dashboard({ onOpenCase, theme }: DashboardProps) {
  const [cases, setCases] = useState<Case[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [newCase, setNewCase] = useState({
    patient: '',
    type: 'Schmerztherapie',
    insurer: ''
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = () => {
    const data = getCases();
    setCases(data);
  };

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: cases.length,
    new: cases.filter(c => c.status === 'new').length,
    inProgress: cases.filter(c => ['documents', 'analysis', 'review'].includes(c.status)).length,
    completed: cases.filter(c => c.status === 'completed').length
  };

  const handleCreateCase = () => {
    if (!newCase.patient || !newCase.insurer) return;

    const caseId = generateId('CASE');
    const newCaseData: Case = {
      id: caseId,
      patient: newCase.patient,
      type: newCase.type,
      insurer: newCase.insurer,
      status: 'new',
      created: new Date().toISOString().split('T')[0],
      lastActivity: new Date().toISOString(),
      documents: 0,
      tasks: [],
      notes: []
    };

    saveCase(newCaseData);
    loadCases();
    setShowNewCaseModal(false);
    setNewCase({ patient: '', type: 'Schmerztherapie', insurer: '' });
  };

  const handleDeleteCase = (id: string) => {
    if (confirm('Möchten Sie diesen Fall wirklich löschen?')) {
      deleteCase(id);
      loadCases();
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold transition-colors duration-300 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Dashboard
          </h1>
          <p className={`mt-1 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Übersicht über alle Gutachten
          </p>
        </div>
        <button
          onClick={() => setShowNewCaseModal(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-accent text-white px-6 py-3 rounded-xl font-semibold hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5 transition-all"
        >
          <Plus size={18} />
          Neuer Fall
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] ${
          isDark 
            ? 'bg-dark-50 border border-dark-100 hover:border-primary/30' 
            : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-primary/20' : 'bg-primary/10'}`}>
              <Users className="text-primary" size={20} />
            </div>
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Gesamt</span>
          </div>
          <div className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.total}</div>
        </div>
        <div className={`rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] ${
          isDark 
            ? 'bg-dark-50 border border-dark-100 hover:border-blue-500/30' 
            : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Clock className="text-blue-400" size={20} />
            </div>
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Neu</span>
          </div>
          <div className="text-3xl font-bold text-blue-400">{stats.new}</div>
        </div>
        <div className={`rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] ${
          isDark 
            ? 'bg-dark-50 border border-dark-100 hover:border-purple-500/30' 
            : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Activity className="text-purple-400" size={20} />
            </div>
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>In Bearbeitung</span>
          </div>
          <div className="text-3xl font-bold text-purple-400">{stats.inProgress}</div>
        </div>
        <div className={`rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] ${
          isDark 
            ? 'bg-dark-50 border border-dark-100 hover:border-green-500/30' 
            : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <ClipboardCheck className="text-green-400" size={20} />
            </div>
            <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Abgeschlossen</span>
          </div>
          <div className="text-3xl font-bold text-green-400">{stats.completed}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} size={18} />
          <input
            type="text"
            placeholder="Suchen nach Patient, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-12 pr-4 py-3 rounded-xl transition-all duration-300 ${
              isDark 
                ? 'bg-dark-50 border border-dark-100 text-white placeholder-slate-500 focus:ring-primary' 
                : 'bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-primary'
            }`}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={`px-5 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
            isDark 
              ? 'bg-dark-50 border border-dark-100 text-white focus:ring-primary' 
              : 'bg-white border border-slate-200 text-slate-800 focus:ring-primary'
          }`}
        >
          <option value="all">Alle Status</option>
          <option value="new">Neu</option>
          <option value="documents">Dokumente</option>
          <option value="analysis">In Analyse</option>
          <option value="review">Prüfung</option>
          <option value="completed">Abgeschlossen</option>
        </select>
      </div>

      {/* Cases Table */}
      <div className={`rounded-2xl overflow-hidden transition-all duration-300 ${
        isDark ? 'bg-dark-50 border border-dark-100' : 'bg-white border border-slate-200 shadow-sm'
      }`}>
        <table className="w-full">
          <thead className={`border-b transition-colors duration-300 ${
            isDark ? 'bg-dark-100/50 border-dark-100' : 'bg-slate-50 border-slate-200'
          }`}>
            <tr>
              <th className={`text-left px-6 py-4 text-xs font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Fall-ID</th>
              <th className={`text-left px-6 py-4 text-xs font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Patient</th>
              <th className={`text-left px-6 py-4 text-xs font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Typ</th>
              <th className={`text-left px-6 py-4 text-xs font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Versicherer</th>
              <th className={`text-left px-6 py-4 text-xs font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status</th>
              <th className={`text-left px-6 py-4 text-xs font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Dokumente</th>
              <th className={`text-left px-6 py-4 text-xs font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Aktivität</th>
              <th className={`text-right px-6 py-4 text-xs font-semibold uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={8} className={`px-6 py-12 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  <FileText size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Keine Fälle gefunden</p>
                </td>
              </tr>
            ) : (
              filteredCases.map((c, i) => (
                <tr 
                  key={c.id} 
                  className={`border-b transition-colors duration-300 cursor-pointer hover:bg-primary/5 ${
                    isDark ? 'border-dark-100' : 'border-slate-100'
                  }`}
                  onClick={() => onOpenCase(c.id)}
                >
                  <td className="px-6 py-4 font-medium text-primary">{c.id}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>{c.patient}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{c.type}</td>
                  <td className={`px-6 py-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{c.insurer}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${statusColors[c.status][isDark ? 'dark' : 'light']}`}>
                      {statusLabels[c.status]}
                    </span>
                  </td>
                  <td className={`px-6 py-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{c.documents}</td>
                  <td className={`px-6 py-4 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{c.lastActivity}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onOpenCase(c.id); }}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark ? 'text-slate-400 hover:text-primary hover:bg-primary/10' : 'text-slate-500 hover:text-primary hover:bg-primary/5'
                        }`}
                        title="Öffnen"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteCase(c.id); }}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-500 hover:text-red-500 hover:bg-red-50'
                        }`}
                        title="Löschen"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Case Modal */}
      {showNewCaseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl p-6 w-full max-w-md transition-all duration-300 ${
            isDark ? 'bg-dark-50 border border-dark-100' : 'bg-white border border-slate-200'
          }`}>
            <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>Neuen Fall erstellen</h2>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Patientenname *</label>
                <input
                  type="text"
                  value={newCase.patient}
                  onChange={(e) => setNewCase({ ...newCase, patient: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl transition-all duration-300 ${
                    isDark 
                      ? 'bg-dark border border-dark-100 text-white placeholder-slate-500 focus:ring-primary' 
                      : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-primary'
                  }`}
                  placeholder="Max Mustermann"
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Gutachten-Typ *</label>
                <select
                  value={newCase.type}
                  onChange={(e) => setNewCase({ ...newCase, type: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer ${
                    isDark 
                      ? 'bg-dark border border-dark-100 text-white focus:ring-primary' 
                      : 'bg-slate-50 border border-slate-200 text-slate-800 focus:ring-primary'
                  }`}
                >
                  <option>Schmerztherapie</option>
                  <option>Rehabilitation</option>
                  <option>Orthopädie</option>
                  <option>Neurologie</option>
                  <option>Psychiatrie</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Versicherer *</label>
                <input
                  type="text"
                  value={newCase.insurer}
                  onChange={(e) => setNewCase({ ...newCase, insurer: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl transition-all duration-300 ${
                    isDark 
                      ? 'bg-dark border border-dark-100 text-white placeholder-slate-500 focus:ring-primary' 
                      : 'bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-primary'
                  }`}
                  placeholder="AOK, TK, Barmer..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewCaseModal(false)}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  isDark 
                    ? 'border border-dark-100 text-slate-300 hover:bg-dark-100' 
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreateCase}
                disabled={!newCase.patient || !newCase.insurer}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-medium disabled:opacity-50 hover:shadow-xl hover:shadow-primary/20 transition-all"
              >
                Erstellen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
