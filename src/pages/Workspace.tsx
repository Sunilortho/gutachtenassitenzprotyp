import { useState, useEffect, useRef } from 'react';
import { 
  getCases, updateCase, getDocuments, saveDocument, deleteDocument, 
  Case, Document, generateId 
} from '../lib/db';
import { analyzeDocument, generateReport } from '../lib/deepseek';
import { 
  ArrowLeft, Upload, FileText, Trash2, 
  CheckCircle, AlertCircle, Download, Send,
  Bot, RefreshCw, Loader2, X
} from 'lucide-react';

interface WorkspaceProps {
  caseId: string;
  onBack: () => void;
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

const checklistItems = [
  { id: 'befund', name: 'Befundbericht', required: true },
  { id: 'medizin', name: 'Medikationsplan', required: false },
  { id: 'therapie', name: 'Therapiebericht', required: true },
  { id: 'diagnose', name: 'Diagnoseliste', required: true },
  { id: 'bildgebung', name: 'Bildgebung (MRT/CT)', required: false },
];

export default function Workspace({ caseId, onBack }: WorkspaceProps) {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState<'documents' | 'analysis' | 'report'>('documents');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [report, setReport] = useState<string>('');
  const [note, setNote] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [caseId]);

  const loadData = () => {
    const cases = getCases();
    const found = cases.find(c => c.id === caseId);
    if (found) {
      setCaseData(found);
      if (found.report) {
        setReport(found.report);
        setActiveTab('report');
      }
    }
    
    const docs = getDocuments(caseId);
    setDocuments(docs);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Simulate file reading
      const text = await file.text();
      const docType = classifyDocument(file.name);
      
      const newDoc: Document = {
        id: generateId('DOC'),
        caseId,
        name: file.name,
        type: docType,
        uploadedAt: new Date().toISOString(),
        text: text.substring(0, 1000) // Store preview
      };
      
      saveDocument(newDoc);
    }
    
    setUploading(false);
    loadData();
    
    // Update case status
    updateCase(caseId, { 
      status: 'documents',
      documents: documents.length + files.length 
    });
  };

  const classifyDocument = (filename: string): string => {
    const lower = filename.toLowerCase();
    if (lower.includes('befund') || lower.includes('bericht')) return 'Befundbericht';
    if (lower.includes('medik') || lower.includes('rezept')) return 'Medikationsplan';
    if (lower.includes('therapie')) return 'Therapiebericht';
    if (lower.includes('diagnos')) return 'Diagnoseliste';
    if (lower.includes('mrt') || lower.includes('ct') || lower.includes('bild')) return 'Bildgebung';
    return 'Sonstiges';
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    
    // Analyze each document
    for (const doc of documents) {
      if (!doc.analysis) {
        const result = await analyzeDocument(doc.text || '', doc.type);
        doc.analysis = result;
        saveDocument(doc);
      }
    }
    
    setAnalyzing(false);
    loadData();
    
    // Update case status
    updateCase(caseId, { status: 'analysis' });
  };

  const handleGenerateReport = async () => {
    if (!caseData) return;
    
    setGeneratingReport(true);
    
    const generatedReport = await generateReport(caseData, documents);
    setReport(generatedReport);
    
    updateCase(caseId, { 
      status: 'completed',
      report: generatedReport 
    });
    
    setGeneratingReport(false);
    setActiveTab('report');
    loadData();
  };

  const handleAddNote = () => {
    if (!note.trim() || !caseData) return;
    
    const notes = [...(caseData.notes || []), note];
    updateCase(caseId, { notes });
    setNote('');
    loadData();
  };

  const handleRemoveDocument = (docId: string) => {
    deleteDocument(docId);
    loadData();
    
    const remaining = documents.filter(d => d.id !== docId);
    updateCase(caseId, { documents: remaining.length });
  };

  const checklistStatus = checklistItems.map(item => {
    const hasDoc = documents.some(d => 
      d.type === item.name || d.name.toLowerCase().includes(item.name.toLowerCase())
    );
    return { ...item, present: hasDoc };
  });

  const allRequiredPresent = checklistStatus.filter(i => i.required).every(i => i.present);

  if (!caseData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{caseData.patient}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[caseData.status]}`}>
              {statusLabels[caseData.status]}
            </span>
          </div>
          <p className="text-gray-500">{caseData.id} • {caseData.type} • {caseData.insurer}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'documents', label: 'Dokumente', count: documents.length },
            { id: 'analysis', label: 'KI-Analyse', count: documents.filter(d => d.analysis).length },
            { id: 'report', label: 'Gutachten', count: report ? 1 : 0 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-4 font-medium text-sm transition-colors relative ${
                activeTab === tab.id 
                  ? 'text-[#1a5f9c] border-b-2 border-[#1a5f9c]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="p-6 space-y-6">
            {/* Upload Area */}
            <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragOver ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-[#1a5f9c]'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFileUpload(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 font-medium">
                Dateien hierher ziehen oder klicken zum Hochladen
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Unterstützte Formate: PDF, TXT, DOC
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.txt,.doc,.docx"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              {uploading && (
                <div className="mt-4 flex items-center justify-center gap-2 text-[#1a5f9c]">
                  <RefreshCw className="animate-spin" size={18} />
                  <span>Wird hochgeladen...</span>
                </div>
              )}
            </div>

            {/* Checklist */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Checkliste</h3>
              <div className="space-y-2">
                {checklistStatus.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    {item.present ? (
                      <CheckCircle className="text-green-500" size={18} />
                    ) : (
                      <AlertCircle className={item.required ? 'text-red-500' : 'text-yellow-500'} size={18} />
                    )}
                    <span className={item.present ? 'text-gray-700' : 'text-gray-500'}>
                      {item.name}
                    </span>
                    {item.required && !item.present && (
                      <span className="text-xs text-red-500 ml-auto">Erforderlich</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Document List */}
            {documents.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Hochgeladene Dokumente</h3>
                <div className="space-y-2">
                  {documents.map(doc => (
                    <div 
                      key={doc.id}
                      className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow"
                    >
                      <FileText className="text-[#1a5f9c]" size={20} />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <p className="text-sm text-gray-500">{doc.type} • {new Date(doc.uploadedAt).toLocaleDateString('de-DE')}</p>
                      </div>
                      {doc.analysis && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Analysiert
                        </span>
                      )}
                      <button
                        onClick={() => handleRemoveDocument(doc.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analyze Button */}
            {documents.length > 0 && (
              <div className="flex gap-3">
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#1a5f9c] to-[#0e3b63] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Wird analysiert...
                    </>
                  ) : (
                    <>
                      <Bot size={18} />
                      KI-Analyse starten
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleGenerateReport}
                  disabled={!allRequiredPresent || generatingReport || caseData.status === 'completed'}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-50"
                >
                  {generatingReport ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Wird erstellt...
                    </>
                  ) : (
                    <>
                      <FileText size={18} />
                      Gutachten erstellen
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="p-6 space-y-6">
            {documents.filter(d => d.analysis).length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Bot size={48} className="mx-auto mb-4 opacity-30" />
                <p>Noch keine Analyse verfügbar</p>
                <p className="text-sm">Laden Sie Dokumente hoch und starten Sie die Analyse</p>
              </div>
            ) : (
              documents.filter(d => d.analysis).map(doc => (
                <div key={doc.id} className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">{doc.name}</h3>
                  
                  {doc.analysis && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Patienteninfo</h4>
                        <p className="text-gray-900">
                          {doc.analysis.patientInfo?.name || 'N/A'} • {doc.analysis.patientInfo?.age || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">{doc.analysis.patientInfo?.diagnosis}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Zusammenfassung</h4>
                        <p className="text-gray-700">{doc.analysis.summary}</p>
                      </div>
                      
                      {doc.analysis.recommendations && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-1">Empfehlungen</h4>
                          <ul className="space-y-1">
                            {doc.analysis.recommendations.map((r: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                <CheckCircle className="text-green-500 mt-0.5 shrink-0" size={14} />
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {doc.analysis.confidence && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Konfidenz:</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500"
                              style={{ width: `${(doc.analysis.confidence || 0) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {Math.round((doc.analysis.confidence || 0) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Report Tab */}
        {activeTab === 'report' && (
          <div className="p-6">
            {report ? (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      const blob = new Blob([report], { type: 'text/markdown' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${caseData.id}-gutachten.md`;
                      a.click();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1a5f9c] text-white rounded-lg font-medium hover:bg-[#0e3b63] transition-colors"
                  >
                    <Download size={16} />
                    Herunterladen
                  </button>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                    {report}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <FileText size={48} className="mx-auto mb-4 opacity-30" />
                <p>Noch kein Gutachten erstellt</p>
                <p className="text-sm">Erstellen Sie zuerst ein Gutachten aus den analysierten Dokumenten</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Notizen</h3>
        
        <div className="space-y-3 mb-4">
          {(caseData.notes || []).map((n, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg text-gray-700 text-sm">
              {n}
            </div>
          ))}
        </div>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Neue Notiz hinzufügen..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a5f9c] outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
          />
          <button
            onClick={handleAddNote}
            disabled={!note.trim()}
            className="px-4 py-2 bg-[#1a5f9c] text-white rounded-lg font-medium disabled:opacity-50 hover:bg-[#0e3b63] transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
