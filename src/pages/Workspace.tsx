import { useState, useEffect, useRef } from 'react';
import { 
  getCases, updateCase, getDocuments, saveDocument, deleteDocument, 
  Case, Document, generateId 
} from '../lib/db';
import { analyzeDocument, generateReport } from '../lib/deepseek';
import { 
  ArrowLeft, Upload, FileText, Trash2, 
  CheckCircle, AlertCircle, Download, Send, Mail,
  Bot, RefreshCw, Loader2, X, CheckSquare, Square,
  AlertTriangle, MessageSquare, Copy, Printer
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

// Issues that can be detected
const issueTemplates = [
  { id: 1, title: 'Unvollständige Dokumentation', description: 'Es fehlen erforderliche Unterlagen' },
  { id: 2, title: 'Widersprüchliche Angaben', description: 'Angaben im Bericht widersprechen sich' },
  { id: 3, title: 'Fehlende Unterschriften', description: 'Dokumente sind nicht unterschrieben' },
  { id: 4, title: 'Veraltete Befunde', description: 'Befunde älter als 3 Monate' },
  { id: 5, title: 'Fehlende Patientendaten', description: 'Patientenidentifikation unvollständig' },
];

// Email templates
const emailTemplates = [
  {
    id: 1,
    title: 'Anforderung weiterer Unterlagen',
    subject: 'Anforderung weiterer Unterlagen für Gutachten',
    body: `Sehr geehrte Damen und Herren,

für die Erstellung des Gutachtens benötigen wir folgende weitere Unterlagen:

- Aktuelle Medikationsliste
- Verlaufsberichte der letzten 6 Monate
- Bildgebende Diagnostik (MRT/CT)

Wir bitten um Zusendung innerhalb von 2 Wochen.

Mit freundlichen Grüßen`
  },
  {
    id: 2,
    title: 'Einladung zur Untersuchung',
    subject: 'Einladung zur fachärztlichen Untersuchung',
    body: `Sehr geehrte(r) Patient(in),

wir laden Sie zu einer fachärztlichen Untersuchung ein.

Termin: [Datum einfügen]
Ort: [Praxisadresse]
Mitbringen: Versicherungskarte,现有Berichte, Medikamentenliste

Bitte bestätigen Sie den Termin.

Mit freundlichen Grüßen`
  },
  {
    id: 3,
    title: 'Gutachten fertig',
    subject: 'Gutachten fertiggestellt',
    body: `Sehr geehrte Damen und Herren,

das Gutachten wurde fertiggestellt und kann abgerufen werden.

Fall-ID: [Case ID]
Patient: [Patientenname]

Das Gutachten ist im System hinterlegt.

Mit freundlichen Grüßen`
  }
];

export default function Workspace({ caseId, onBack }: WorkspaceProps) {
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState<'documents' | 'analysis' | 'report' | 'issues' | 'emails'>('documents');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [report, setReport] = useState<string>('');
  const [note, setNote] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [detectedIssues, setDetectedIssues] = useState<any[]>([]);
  const [selectedIssues, setSelectedIssues] = useState<number[]>([]);
  const [emailDraft, setEmailDraft] = useState({ subject: '', body: '' });
  const [showEmailModal, setShowEmailModal] = useState(false);
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
      
      // Read file content
      let text = '';
      if (file.type === 'text/plain') {
        text = await file.text();
      } else if (file.type === 'application/pdf') {
        // For PDF, we'd need a PDF parser - using placeholder for now
        text = `PDF Document: ${file.name}\n\n[PDF content would be extracted here - currently showing placeholder for PDF files]`;
      } else {
        text = await file.text();
      }
      
      const docType = classifyDocument(file.name);
      
      const newDoc: Document = {
        id: generateId('DOC'),
        caseId,
        name: file.name,
        type: docType,
        uploadedAt: new Date().toISOString(),
        text: text.substring(0, 2000)
      };
      
      saveDocument(newDoc);
    }
    
    setUploading(false);
    loadData();
    
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
        
        // Detect issues
        if (result.issues && result.issues.length > 0) {
          const newIssues = result.issues.map((issue: string, idx: number) => ({
            id: Date.now() + idx,
            title: issue,
            description: 'Automatisch erkannt durch KI',
            severity: 'warning'
          }));
          setDetectedIssues(prev => [...prev, ...newIssues]);
        }
      }
    }
    
    setAnalyzing(false);
    loadData();
    
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

  const toggleIssue = (issueId: number) => {
    setSelectedIssues(prev => 
      prev.includes(issueId) 
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    );
  };

  const generateEmailFromIssues = () => {
    if (selectedIssues.length === 0) return;
    
    const selected = detectedIssues.filter(i => selectedIssues.includes(i.id));
    const body = selected.map(i => `- ${i.title}: ${i.description}`).join('\n');
    
    setEmailDraft({
      subject: 'Anmerkungen zum Gutachtenfall',
      body: `Sehr geehrte Damen und Herren,

bei der Prüfung des Falles sind folgende Punkte aufgefallen:

${body}

Wir bitten um Stellungnahme.

Mit freundlichen Grüßen`
    });
    
    setShowEmailModal(true);
    setActiveTab('emails');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {[
            { id: 'documents', label: '📄 Dokumente', count: documents.length },
            { id: 'analysis', label: '🤖 KI-Analyse', count: documents.filter(d => d.analysis).length },
            { id: 'issues', label: '⚠️ Probleme', count: detectedIssues.length },
            { id: 'emails', label: '📧 E-Mail Vorlagen', count: emailTemplates.length },
            { id: 'report', label: '📋 Gutachten', count: report ? 1 : 0 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors relative ${
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
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
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
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckSquare size={18} />
                Checkliste
              </h3>
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

            {/* Action Buttons */}
            {documents.length > 0 && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#1a5f9c] to-[#0e3b63] text-white px-5 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
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
                  className="flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-50"
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

        {/* Issues Tab */}
        {activeTab === 'issues' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Erkannte Probleme</h3>
                <p className="text-sm text-gray-500">Automatisch erkannte Issues aus der KI-Analyse</p>
              </div>
              {selectedIssues.length > 0 && (
                <button
                  onClick={generateEmailFromIssues}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1a5f9c] text-white rounded-lg font-medium hover:bg-[#0e3b63] transition-colors"
                >
                  <Mail size={16} />
                  E-Mail generieren
                </button>
              )}
            </div>

            {detectedIssues.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <AlertTriangle size={48} className="mx-auto mb-4 opacity-30" />
                <p>Noch keine Probleme erkannt</p>
                <p className="text-sm">Starten Sie die KI-Analyse um Probleme zu erkennen</p>
              </div>
            ) : (
              <div className="space-y-3">
                {detectedIssues.map(issue => (
                  <div 
                    key={issue.id}
                    className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${
                      selectedIssues.includes(issue.id) 
                        ? 'border-[#1a5f9c] bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleIssue(issue.id)}
                  >
                    {selectedIssues.includes(issue.id) ? (
                      <CheckCircle className="text-[#1a5f9c]" size={20} />
                    ) : (
                      <Square className="text-gray-400" size={20} />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{issue.title}</p>
                      <p className="text-sm text-gray-500">{issue.description}</p>
                    </div>
                    <AlertTriangle className="text-yellow-500" size={18} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Emails Tab */}
        {activeTab === 'emails' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900">E-Mail Vorlagen</h3>
              <p className="text-sm text-gray-500">Vorlagen für häufige Kommunikation</p>
            </div>

            <div className="grid gap-4">
              {emailTemplates.map(template => (
                <div 
                  key={template.id}
                  className="border border-gray-200 rounded-xl p-5 hover:border-[#1a5f9c] transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{template.title}</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEmailDraft({ subject: template.subject, body: template.body });
                          setShowEmailModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-[#1a5f9c] transition-colors"
                        title="Bearbeiten"
                      >
                        <MessageSquare size={16} />
                      </button>
                      <button
                        onClick={() => copyToClipboard(`Betreff: ${template.subject}\n\n${template.body}`)}
                        className="p-2 text-gray-400 hover:text-[#1a5f9c] transition-colors"
                        title="Kopieren"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium mb-1">Betreff: {template.subject}</p>
                    <p className="whitespace-pre-line">{template.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Current Draft */}
            {emailDraft.body && (
              <div className="border border-[#1a5f9c] rounded-xl p-5 bg-blue-50">
                <h4 className="font-semibold text-gray-900 mb-3">Aktueller Entwurf</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={emailDraft.subject}
                    onChange={(e) => setEmailDraft({ ...emailDraft, subject: e.target.value })}
                    placeholder="Betreff"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                  <textarea
                    value={emailDraft.body}
                    onChange={(e) => setEmailDraft({ ...emailDraft, body: e.target.value })}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg font-mono text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(`Betreff: ${emailDraft.subject}\n\n${emailDraft.body}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      <Copy size={16} />
                      Kopieren
                    </button>
                    <button
                      onClick={() => window.open(`mailto:?subject=${encodeURIComponent(emailDraft.subject)}&body=${encodeURIComponent(emailDraft.body)}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#1a5f9c] text-white rounded-lg font-medium hover:bg-[#0e3b63] transition-colors"
                    >
                      <Mail size={16} />
                      Per E-Mail senden
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Report Tab */}
        {activeTab === 'report' && (
          <div className="p-6">
            {report ? (
              <div className="space-y-4">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Printer size={16} />
                    Drucken
                  </button>
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
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageSquare size={18} />
          Notizen
        </h3>
        
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
