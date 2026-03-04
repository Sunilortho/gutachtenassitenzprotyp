import { useState, useEffect } from 'react';
import { getCases, saveCase, deleteCase, Case, generateId } from '../lib/db';
import { 
  FileText, Plus, Search, Filter, 
  Clock, CheckCircle, AlertCircle, 
  MoreVertical, Trash2, Eye, Edit,
  Users, Activity, ClipboardCheck, TrendingUp
} from 'lucide-react';

interface DashboardProps {
  onOpenCase: (caseId: string) => void;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  documents: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  analysis: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  review: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30'
};

const statusLabels: Record<string, string> = {
  new: 'Neu',
  documents: 'Dokumente',
  analysis: 'In Analyse',
  review: 'Prüfung',
  completed: 'Abgeschlossen'
};

export default function Dashboard({ onOpenCase }: DashboardProps) {
  const [cases, setCases] = useState<Case[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [newCase, setNewCase] = useState({
    patient: '',
    type: 'Schmerztherapie',
    insurer: ''
  });

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
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Übersicht über alle Gutachten</p>
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
        <div className="bg-dark-50 border border-dark-100 rounded-2xl p-6 hover:border-primary/30 transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-all">
              <Users className="text-primary" size={20} />
            </div>
            <span className="text-slate-400 text-sm">Gesamt</span>
          </div>
          <div className="text-3xl font-bold text-white">{stats.total}</div>
        </div>
        <div className="bg-dark-50 border border-dark-100 rounded-2xl p-6 hover:border-blue-500/30 transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-all">
              <Clock className="text-blue-400" size={20} />
            </div>
            <span className="text-slate-400 text-sm">Neu</span>
          </div>
          <div className="text-3xl font-bold text-blue-400">{stats.new}</div>
        </div>
        <div className="bg-dark-50 border border-dark-100 rounded-2xl p-6 hover:border-purple-500/30 transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-all">
              <Activity className="text-purple-400" size={20} />
            </div>
            <span className="text-slate-400 text-sm">In Bearbeitung</span>
          </div>
          <div className="text-3xl font-bold text-purple-400">{stats.inProgress}</div>
        </div>
        <div className="bg-dark-50 border border-dark-100 rounded-2xl p-6 hover:border-green-500/30 transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-all">
              <ClipboardCheck className="text-green-400" size={20} />
            </div>
            <span className="text-slate-400 text-sm">Abgeschlossen</span>
          </div>
          <div className="text-3xl font-bold text-green-400">{stats.completed}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Suchen nach Patient, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-dark-50 border border-dark-100 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-5 py-3 bg-dark-50 border border-dark-100 rounded-xl text-white focus:ring-2 focus:ring-primary outline-none transition-all cursor-pointer"
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
      <div className="bg-dark-50 border border-dark-100 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-100/50 border-b border-dark-100">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Fall-ID</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Patient</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Typ</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Versicherer</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Status</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Dokumente</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Aktivität</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                  <FileText size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Keine Fälle gefunden</p>
                </td>
              </tr>
            ) : (
              filteredCases.map((c, i) => (
                <tr 
                  key={c.id} 
                  className="border-b border-dark-100 hover:bg-dark-100/30 cursor-pointer transition-colors"
                  onClick={() => onOpenCase(c.id)}
                >
                  <td className="px-6 py-4 font-medium text-primary">{c.id}</td>
                  <td className="px-6 py-4 text-white">{c.patient}</td>
                  <td className="px-6 py-4 text-slate-300">{c.type}</td>
                  <td className="px-6 py-4 text-slate-300">{c.insurer}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${statusColors[c.status]}`}>
                      {statusLabels[c.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{c.documents}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm">{c.lastActivity}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onOpenCase(c.id); }}
                        className="p-2 text-slate-400 hover:text-primary transition-colors"
                        title="Öffnen"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteCase(c.id); }}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors"
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-50 border border-dark-100 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Neuen Fall erstellen</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Patientenname *</label>
                <input
                  type="text"
                  value={newCase.patient}
                  onChange={(e) => setNewCase({ ...newCase, patient: e.target.value })}
                  className="w-full px-4 py-3 bg-dark border border-dark-100 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Max Mustermann"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Gutachten-Typ *</label>
                <select
                  value={newCase.type}
                  onChange={(e) => setNewCase({ ...newCase, type: e.target.value })}
                  className="w-full px-4 py-3 bg-dark border border-dark-100 rounded-xl text-white focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                >
                  <option>Schmerztherapie</option>
                  <option>Rehabilitation</option>
                  <option>Orthopädie</option>
                  <option>Neurologie</option>
                  <option>Psychiatrie</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Versicherer *</label>
                <input
                  type="text"
                  value={newCase.insurer}
                  onChange={(e) => setNewCase({ ...newCase, insurer: e.target.value })}
                  className="w-full px-4 py-3 bg-dark border border-dark-100 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="AOK, TK, Barmer..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewCaseModal(false)}
                className="flex-1 px-4 py-3 border border-dark-100 text-slate-300 rounded-xl font-medium hover:bg-dark-100 transition-colors"
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
