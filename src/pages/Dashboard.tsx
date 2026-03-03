import { useState, useEffect } from 'react';
import { getCases, saveCase, deleteCase, Case, generateId } from '../lib/db';
import { 
  FileText, Plus, Search, Filter, 
  Clock, CheckCircle, AlertCircle, 
  MoreVertical, Trash2, Eye, Edit
} from 'lucide-react';

interface DashboardProps {
  onOpenCase: (caseId: string) => void;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  documents: 'bg-yellow-100 text-yellow-700',
  analysis: 'bg-purple-100 text-purple-700',
  review: 'bg-orange-100 text-orange-700',
  completed: 'bg-green-100 text-green-700'
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
      tasks: 0,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Übersicht über alle Gutachten</p>
        </div>
        <button
          onClick={() => setShowNewCaseModal(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#1a5f9c] to-[#0e3b63] text-white px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          <Plus size={18} />
          Neuer Fall
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Gesamt</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-blue-600">{stats.new}</div>
          <div className="text-sm text-gray-500">Neu</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-purple-600">{stats.inProgress}</div>
          <div className="text-sm text-gray-500">In Bearbeitung</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-500">Abgeschlossen</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Suchen nach Patient, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a5f9c] focus:border-transparent outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a5f9c] outline-none bg-white"
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Fall-ID</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Patient</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Typ</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Versicherer</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Dokumente</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Aktivität</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                  <FileText size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Keine Fälle gefunden</p>
                </td>
              </tr>
            ) : (
              filteredCases.map((c, i) => (
                <tr 
                  key={c.id} 
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onOpenCase(c.id)}
                >
                  <td className="px-6 py-4 font-medium text-[#1a5f9c]">{c.id}</td>
                  <td className="px-6 py-4 text-gray-900">{c.patient}</td>
                  <td className="px-6 py-4 text-gray-600">{c.type}</td>
                  <td className="px-6 py-4 text-gray-600">{c.insurer}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusColors[c.status]}`}>
                      {statusLabels[c.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{c.documents}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{c.lastActivity}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onOpenCase(c.id); }}
                        className="p-2 text-gray-400 hover:text-[#1a5f9c] transition-colors"
                        title="Öffnen"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteCase(c.id); }}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Neuen Fall erstellen</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patientenname *</label>
                <input
                  type="text"
                  value={newCase.patient}
                  onChange={(e) => setNewCase({ ...newCase, patient: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a5f9c] outline-none"
                  placeholder="Max Mustermann"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gutachten-Typ *</label>
                <select
                  value={newCase.type}
                  onChange={(e) => setNewCase({ ...newCase, type: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a5f9c] outline-none bg-white"
                >
                  <option>Schmerztherapie</option>
                  <option>Rehabilitation</option>
                  <option>Orthopädie</option>
                  <option>Neurologie</option>
                  <option>Psychiatrie</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Versicherer *</label>
                <input
                  type="text"
                  value={newCase.insurer}
                  onChange={(e) => setNewCase({ ...newCase, insurer: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1a5f9c] outline-none"
                  placeholder="AOK, TK, Barmer..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewCaseModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreateCase}
                disabled={!newCase.patient || !newCase.insurer}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#1a5f9c] to-[#0e3b63] text-white rounded-xl font-medium disabled:opacity-50 hover:shadow-lg transition-all"
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
