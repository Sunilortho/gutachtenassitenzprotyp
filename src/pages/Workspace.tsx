import { useState, useEffect, useRef } from 'react';
import { useGutachtenWorker } from '../hooks/useGutachten';
import { 
  getCases, updateCase, getDocuments, saveDocument, deleteDocument, 
  Case, Document, generateId 
} from '../lib/db';
import { analyzeDocument, generateReport } from '../lib/deepseek';
import { 
  ArrowLeft, Upload, FileText, Trash2, 
  CheckCircle, AlertCircle, Download, Send, Mail,
  Bot, RefreshCw, Loader2, X, CheckSquare, Square,
  AlertTriangle, MessageSquare, Copy, Printer, Eye,
  Calendar, Clock, User, Building, Phone, MapPin,
  FilePlus, FileCheck, FileX, Activity, Pill, Stethoscope,
  Clipboard, Settings, ChevronRight, Star, Archive
} from 'lucide-react';

interface WorkspaceProps {
  caseId: string;
  onBack: () => void;
  theme: 'dark' | 'light';
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
  { id: 'labor', name: 'Laborbefunde', required: false },
];

// Issues that can be detected
const issueTemplates = [
  { id: 1, title: 'Unvollständige Dokumentation', description: 'Es fehlen erforderliche Unterlagen', severity: 'error' },
  { id: 2, title: 'Widersprüchliche Angaben', description: 'Angaben im Bericht widersprechen sich', severity: 'warning' },
  { id: 3, title: 'Fehlende Unterschriften', description: 'Dokumente sind nicht unterschrieben', severity: 'error' },
  { id: 4, title: 'Veraltete Befunde', description: 'Befunde älter als 3 Monate', severity: 'warning' },
  { id: 5, title: 'Fehlende Patientendaten', description: 'Patientenidentifikation unvollständig', severity: 'error' },
  { id: 6, title: 'Fehlende Einwilligung', description: 'Einwilligungserklärung fehlt', severity: 'error' },
  { id: 7, title: 'Unklare Diagnose', description: 'Diagnose ist nicht eindeutig formuliert', severity: 'warning' },
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
- Einweisungsbericht

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
Zeit: [Uhrzeit]

Bitte bringen Sie folgende Unterlagen mit:
- Versicherungskarte
-现有Berichte
- Medikamentenliste
- Aktuelle Laborbefunde

Bitte bestätigen Sie den Termin telefonisch unter [Telefonnummer].

Mit freundlichen Grüßen`
  },
  {
    id: 3,
    title: 'Gutachten fertig',
    subject: 'Gutachten fertiggestellt - Abholung/Versand',
    body: `Sehr geehrte Damen und Herren,

das Gutachten wurde fertiggestellt und kann abgerufen werden.

Fall-ID: [Case ID]
Patient: [Patientenname]
Gutachtentyp: [Typ]

Das Gutachten liegt ab sofort bereit und kann:
- Persönlich während unserer Sprechzeiten abgeholt werden
- Per Post versendet werden
- Digital übermittelt werden

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen`
  },
  {
    id: 4,
    title: 'Rückfrage zur Behandlung',
    subject: 'Rückfrage zum Behandlungsverlauf',
    body: `Sehr geehrte Damen und Herren,

bezüglich des o.g. Gutachtens haben wir folgende Rückfragen:

1. [Frage einfügen]
2. [Frage einfügen]
3. [Frage einfügen]

Wir bitten um zeitnahe Stellungnahme.

Mit freundlichen Grüßen`
  },
  {
    id: 5,
    title: 'Terminverschiebung',
    subject: 'Terminverschiebung Untersuchung',
    body: `Sehr geehrte(r) Patient(in),

leider müssen wir Ihren Untersuchungstermin verschieben.

Bisheriger Termin: [Datum/Uhrzeit]
Neuer Termin: [Datum/Uhrzeit]

Wir bitten um Verständnis und bestätigen Sie bitte den neuen Termin.

Mit freundlichen Grüßen`
  }
];

// Tasks that can be created
const taskTemplates = [
  { id: 1, title: 'Unterlagen anfordern', description: 'Fehlende Dokumente anfordern', priority: 'high' },
  { id: 2, title: 'Termin vereinbaren', description: 'Untersuchungstermin mit Patient vereinbaren', priority: 'high' },
  { id: 3, title: 'Arztbericht anfordern', description: 'Zusätzlichen Arztbericht anfordern', priority: 'medium' },
  { id: 4, title: 'Follow-up nach 4 Wochen', description: 'Follow-up Termin in 4 Wochen', priority: 'low' },
  { id: 5, title: 'Versicherung kontaktieren', description: 'Rückversicherung bei Versicherung', priority: 'medium' },
];

export default function Workspace({ caseId, onBack, theme }: WorkspaceProps) {
  const isDark = theme === 'dark';
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState<'documents' | 'analysis' | 'report' | 'issues' | 'emails' | 'tasks'>('documents');
  
  // Ensure documents is always an array (defensive)
  const docs = Array.isArray(documents) ? documents : [];
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
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Background worker hook
  const { startGutachten, cancelGutachten, status: workerStatus, progress: workerProgress, results: workerResults, currentTaskDetails } = useGutachtenWorker();

  // Ensure arrays are always arrays (defensive)
  const taskList = Array.isArray(tasks) ? tasks : [];
  const caseNotes = Array.isArray(caseData?.notes) ? caseData.notes : [];

  useEffect(() => {
    loadData();
  }, [caseId]);

  const loadData = () => {
    const cases = getCases();
    const found = cases.find(c => c.id === caseId);
    if (found) {
      setCaseData(found);
      if (found.report) setReport(found.report);
      if (found.tasks) setTasks(found.tasks);
    }
    
    const docs = getDocuments(caseId);
    setDocuments(docs);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Read file content based on type
      let text = '';
      try {
        if (file.type === 'text/plain') {
          text = await file.text();
        } else if (file.type === 'application/pdf') {
          // For PDF, show a note that extraction would happen
          text = `PDF Document: ${file.name}\n\n[PDF content extraction would happen here - using filename as placeholder]\n\nIn production, this would use pdfjs-dist to extract text from the PDF file.`;
        } else {
          text = await file.text();
        }
      } catch (e) {
        text = `Document: ${file.name}\n\n[Content could not be extracted - file saved]`;
      }
      
      const docType = classifyDocument(file.name);
      
      const newDoc: Document = {
        id: generateId('DOC'),
        caseId,
        name: file.name,
        type: docType,
        uploadedAt: new Date().toISOString(),
        text: text.substring(0, 3000),
        size: file.size
      };
      
      saveDocument(newDoc);
    }
    
    setUploading(false);
    loadData();
    
    updateCase(caseId, { 
      status: 'documents',
      documents: docs.length + files.length 
    });
  };

  const classifyDocument = (filename: string): string => {
    const lower = filename.toLowerCase();
    if (lower.includes('befund') || lower.includes('bericht') || lower.includes('arzt')) return 'Befundbericht';
    if (lower.includes('medik') || lower.includes('rezept') || lower.includes('medication')) return 'Medikationsplan';
    if (lower.includes('therapie') || lower.includes('treatment')) return 'Therapiebericht';
    if (lower.includes('diagnos') || lower.includes('icd')) return 'Diagnoseliste';
    if (lower.includes('mrt') || lower.includes('ct') || lower.includes('bild') || lower.includes('röntgen')) return 'Bildgebung';
    if (lower.includes('labor') || lower.includes('blut')) return 'Laborbefunde';
    if (lower.includes('einwill') || lower.includes('consent')) return 'Einwilligung';
    return 'Sonstiges';
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    
    for (const doc of documents) {
      if (!doc.analysis) {
        const result = await analyzeDocument(doc.text || '', doc.type);
        doc.analysis = result;
        saveDocument(doc);
        
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
    const notes = [...(caseNotes || []), { text: note, date: new Date().toISOString() }];
    updateCase(caseId, { notes });
    setNote('');
    loadData();
  };

  const handleRemoveDocument = (docId: string) => {
    deleteDocument(docId);
    loadData();
    const remaining = docs.filter(d => d.id !== docId);
    updateCase(caseId, { documents: remaining.length });
  };

  const toggleIssue = (issueId: number) => {
    setSelectedIssues(prev => 
      prev.includes(issueId) 
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    );
  };

  const addManualIssue = () => {
    const newIssue = {
      id: Date.now(),
      title: 'Manuell hinzugefügt',
      description: 'Benutzerdefinierter Hinweis',
      severity: 'warning',
      manual: true
    };
    setDetectedIssues(prev => [...prev, newIssue]);
  };

  const removeIssue = (issueId: number) => {
    setDetectedIssues(prev => prev.filter(i => i.id !== issueId));
    setSelectedIssues(prev => prev.filter(id => id !== issueId));
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

  const addTask = () => {
    if (!newTask.title.trim()) return;
    const task = {
      id: Date.now(),
      ...newTask,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    const updatedTasks = [...tasks, task];
    setTasks(updatedTasks);
    updateCase(caseId, { tasks: updatedTasks });
    setNewTask({ title: '', description: '', priority: 'medium' });
  };

  const toggleTaskStatus = (taskId: number) => {
    const updatedTasks = taskList.map(t => 
      t.id === taskId ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t
    );
    setTasks(updatedTasks);
    updateCase(caseId, { tasks: updatedTasks });
  };

  const deleteTask = (taskId: number) => {
    const updatedTasks = taskList.filter(t => t.id !== taskId);
    setTasks(updatedTasks);
    updateCase(caseId, { tasks: updatedTasks });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportToPDF = () => {
    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Gutachten - ${caseData?.patient}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
              h1 { color: #1a5f9c; }
              h2 { color: #0e3b63; margin-top: 30px; }
              .meta { color: #666; margin-bottom: 20px; }
              pre { white-space: pre-wrap; font-size: 12px; }
            </style>
          </head>
          <body>
            <h1>Medizinisches Gutachten</h1>
            <div class="meta">
              <p><strong>Patient:</strong> ${caseData?.patient}</p>
              <p><strong>Fall-ID:</strong> ${caseData?.id}</p>
              <p><strong>Typ:</strong> ${caseData?.type}</p>
              <p><strong>Versicherer:</strong> ${caseData?.insurer}</p>
              <p><strong>Datum:</strong> ${new Date().toLocaleDateString('de-DE')}</p>
            </div>
            <h2>Gutachtenbericht</h2>
            <pre>${report || 'Noch kein Gutachten erstellt.'}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const checklistStatus = checklistItems.map(item => {
    const hasDoc = docs.some(d => 
      d.type === item.name || d.name.toLowerCase().includes(item.name.toLowerCase())
    );
    return { ...item, present: hasDoc };
  });

  const allRequiredPresent = checklistStatus.filter(i => i.required).every(i => i.present);
  const completedTasks = taskList.filter(t => t.status === 'completed').length;

  if (!caseData) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{caseData.patient}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[caseData.status]}`}>
              {statusLabels[caseData.status]}
            </span>
          </div>
          <div className="flex items-center gap-4 text-gray-500 text-sm mt-1 flex-wrap">
            <span className="flex items-center gap-1"><FileText size={14}/> {caseData.id}</span>
            <span className="flex items-center gap-1"><Stethoscope size={14}/> {caseData.type}</span>
            <span className="flex items-center gap-1"><Building size={14}/> {caseData.insurer}</span>
            <span className="flex items-center gap-1"><Calendar size={14}/> {caseData.created}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {[
            { id: 'documents', label: '📄 Dokumente', count: docs.length },
            { id: 'analysis', label: '🤖 KI-Analyse', count: docs.filter(d => d.analysis).length },
            { id: 'issues', label: '⚠️ Probleme', count: detectedIssues.length },
            { id: 'emails', label: '📧 E-Mails', count: emailTemplates.length },
            { id: 'tasks', label: '✓ Aufgaben', count: `${completedTasks}/${taskList.length}` },
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
              {tab.count !== undefined && (
                <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">{tab.count}</span>
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
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileUpload(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 font-medium">Dateien hierher ziehen oder klicken zum Hochladen</p>
              <p className="text-gray-400 text-sm mt-1">PDF, TXT, DOC - Max. 10MB pro Datei</p>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.doc,.docx" onChange={(e) => handleFileUpload(e.target.files)} className="hidden" />
              {uploading && <div className="mt-4 flex items-center justify-center gap-2 text-[#1a5f9c]"><RefreshCw className="animate-spin" size={18} /><span>Wird hochgeladen...</span></div>}
            </div>

            {/* Checklist */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><CheckSquare size={18} /> Checkliste</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {checklistStatus.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    {item.present ? <CheckCircle className="text-green-500" size={18} /> : <AlertCircle className={item.required ? 'text-red-500' : 'text-yellow-500'} size={18} />}
                    <span className={item.present ? 'text-gray-700' : 'text-gray-500'}>{item.name}</span>
                    {item.required && !item.present && <span className="text-xs text-red-500 ml-auto">Erforderlich</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Document List */}
            {docs.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Hochgeladene Dokumente ({docs.length})</h3>
                <div className="space-y-2">
                  {docs.map(doc => (
                    <div key={doc.id} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
                      <FileText className="text-[#1a5f9c]" size={20} />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{doc.name}</p>
                        <p className="text-sm text-gray-500">{doc.type} • {new Date(doc.uploadedAt).toLocaleDateString('de-DE')} • {(doc.size / 1024).toFixed(1)} KB</p>
                      </div>
                      {doc.analysis && <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Analysiert</span>}
                      <button onClick={() => handleRemoveDocument(doc.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {docs.length > 0 && (
              <div className="flex flex-wrap gap-3">
                <button onClick={handleAnalyze} disabled={analyzing} className="flex items-center gap-2 bg-gradient-to-r from-[#1a5f9c] to-[#0e3b63] text-white px-5 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50">
                  {analyzing ? <><Loader2 className="animate-spin" size={18} /> Wird analysiert...</> : <><Bot size={18} /> KI-Analyse starten</>}
                </button>
                <button onClick={handleGenerateReport} disabled={!allRequiredPresent || generatingReport || caseData.status === 'completed'} className="flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-50">
                  {generatingReport ? <><Loader2 className="animate-spin" size={18} /> Wird erstellt...</> : <><FileText size={18} /> Gutachten erstellen</>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && (
          <div className="p-6 space-y-6">
            {/* Background Worker Panel */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Bot size={18} className="text-[#1a5f9c]" /> Hintergrundanalyse (Worker)</h3>
                <p className="text-sm text-gray-500">Verarbeitet alle Dokumente im Hintergrund mit automatischem Fallback</p>
              </div>
              <div className="flex gap-2">
                {workerStatus === 'running' ? (
                  <button
                    onClick={() => currentTaskDetails?.taskId && cancelGutachten(currentTaskDetails.taskId)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
                  >
                    <X size={16} /> Abbrechen
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const combined = docs.map(d => d.text || '').join('\n\n');
                      startGutachten(combined, { fallbackChain: [{ model: 'gemini' }, { model: 'local-stub' }] });
                    }}
                    disabled={docs.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1a5f9c] text-white rounded-lg font-medium hover:bg-[#0e3b63] transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={16} /> Analyse starten
                  </button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            {(workerStatus === 'running' || workerStatus === 'done') && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    {workerStatus === 'running' ? `Verarbeite… ${workerProgress}%` : 'Abgeschlossen'}
                    {currentTaskDetails?.lastModel && ` · Modell: ${currentTaskDetails.lastModel}`}
                  </span>
                  <span>{workerProgress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      workerStatus === 'done' ? 'bg-green-500' : 'bg-[#1a5f9c]'
                    }`}
                    style={{ width: `${workerProgress}%` }}
                  />
                </div>
              </div>
            )}

            {workerStatus === 'error' && (
              <p className="text-sm text-red-600 flex items-center gap-2"><AlertCircle size={14} /> Fehler bei der Verarbeitung. Bitte erneut versuchen.</p>
            )}
            {workerStatus === 'cancelled' && (
              <p className="text-sm text-yellow-600 flex items-center gap-2"><AlertTriangle size={14} /> Analyse wurde abgebrochen.</p>
            )}

            {/* Worker results summary */}
            {workerStatus === 'done' && workerResults && (
              <div className="bg-white rounded-lg p-4 border border-blue-100 space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Ergebnisse ({workerResults.length} Abschnitte)</h4>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {workerResults.map((r: any, i: number) => (
                    <div key={i} className="text-xs bg-gray-50 rounded p-2">
                      <span className="font-medium text-gray-600">Abschnitt {r.chunkIndex + 1}</span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.model === 'local-stub' ? 'bg-yellow-100 text-yellow-700' :
                        r.model === 'gemini' ? 'bg-purple-100 text-purple-700' :
                        r.model === 'error' ? 'bg-red-100 text-red-700' :
                        'bg-green-100 text-green-700'
                      }`}>{r.model}</span>
                      {r.result?.summary && (
                        <p className="mt-1 text-gray-500 truncate">{r.result.summary}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {(!Array.isArray(documents) || docs.filter(d => d.analysis).length === 0) ? (
              <div className="text-center py-12 text-gray-400"><Bot size={48} className="mx-auto mb-4 opacity-30" /><p>Noch keine Analyse verfügbar</p><p className="text-sm">Laden Sie Dokumente hoch und starten Sie die Analyse</p></div>
            ) : (
              docs.filter(d => d.analysis).map(doc => (
                <div key={doc.id} className="bg-gray-50 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-3">{doc.name}</h3>
                  {doc.analysis && (
                    <div className="space-y-4">
                      <div><h4 className="text-sm font-medium text-gray-500 mb-1">Patienteninfo</h4><p className="text-gray-900">{doc.analysis.patientInfo?.name || 'N/A'} • {doc.analysis.patientInfo?.age || 'N/A'}</p><p className="text-sm text-gray-600">{doc.analysis.patientInfo?.diagnosis}</p></div>
                      <div><h4 className="text-sm font-medium text-gray-500 mb-1">Zusammenfassung</h4><p className="text-gray-700">{doc.analysis.summary}</p></div>
                      {doc.analysis.recommendations && <div><h4 className="text-sm font-medium text-gray-500 mb-1">Empfehlungen</h4><ul className="space-y-1">{doc.analysis.recommendations.map((r: string, i: number) => <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><CheckCircle className="text-green-500 mt-0.5 shrink-0" size={14} />{r}</li>)}</ul></div>}
                      {doc.analysis.confidence && <div className="flex items-center gap-2"><span className="text-sm text-gray-500">Konfidenz:</span><div className="flex-1 h-2 bg-gray-200 rounded-full"><div className="h-full bg-green-500" style={{ width: `${(doc.analysis.confidence || 0) * 100}%` }} /></div><span className="text-sm font-medium text-gray-700">{Math.round((doc.analysis.confidence || 0) * 100)}%</span></div>}
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
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div><h3 className="font-semibold text-gray-900">Erkannte Probleme</h3><p className="text-sm text-gray-500">Automatisch erkannte + manuell hinzugefügte Issues</p></div>
              <div className="flex gap-2">
                <button onClick={addManualIssue} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors"><FilePlus size={16} />Manuell hinzufügen</button>
                {selectedIssues.length > 0 && <button onClick={generateEmailFromIssues} className="flex items-center gap-2 px-4 py-2 bg-[#1a5f9c] text-white rounded-lg font-medium hover:bg-[#0e3b63]"><Mail size={16} />E-Mail ({selectedIssues.length})</button>}
              </div>
            </div>

            {detectedIssues.length === 0 ? (
              <div className="text-center py-12 text-gray-400"><AlertTriangle size={48} className="mx-auto mb-4 opacity-30" /><p>Keine Probleme erkannt</p><p className="text-sm">Starten Sie die KI-Analyse</p></div>
            ) : (
              <div className="space-y-3">
                {detectedIssues.map(issue => (
                  <div key={issue.id} className={`flex items-center gap-4 p-4 border rounded-xl ${selectedIssues.includes(issue.id) ? 'border-[#1a5f9c] bg-blue-50' : 'border-gray-200'}`}>
                    <button onClick={() => toggleIssue(issue.id)}>{selectedIssues.includes(issue.id) ? <CheckCircle className="text-[#1a5f9c]" size={20} /> : <Square className="text-gray-400" size={20} />}</button>
                    <div className="flex-1"><p className="font-medium text-gray-900">{issue.title}</p><p className="text-sm text-gray-500">{issue.description}</p></div>
                    <button onClick={() => removeIssue(issue.id)} className="p-2 text-gray-400 hover:text-red-500"><X size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Emails Tab */}
        {activeTab === 'emails' && (
          <div className="p-6 space-y-6">
            <div><h3 className="font-semibold text-gray-900">E-Mail Vorlagen</h3><p className="text-sm text-gray-500">Klicken zum Bearbeiten oder Kopieren</p></div>
            <div className="grid gap-4">
              {emailTemplates.map(template => (
                <div key={template.id} className="border border-gray-200 rounded-xl p-5 hover:border-[#1a5f9c] transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{template.title}</h4>
                    <div className="flex gap-2">
                      <button onClick={() => { setEmailDraft({ subject: template.subject, body: template.body }); setShowEmailModal(true); }} className="p-2 text-gray-400 hover:text-[#1a5f9c]"><MessageSquare size={16} /></button>
                      <button onClick={() => copyToClipboard(`Betreff: ${template.subject}\n\n${template.body}`)} className="p-2 text-gray-400 hover:text-[#1a5f9c]"><Copy size={16} /></button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg"><p className="font-medium mb-1">Betreff: {template.subject}</p><p className="whitespace-pre-line">{template.body}</p></div>
                </div>
              ))}
            </div>

            {/* Current Draft */}
            {emailDraft.body && (
              <div className="border border-[#1a5f9c] rounded-xl p-5 bg-blue-50">
                <h4 className="font-semibold text-gray-900 mb-3">Aktueller Entwurf</h4>
                <div className="space-y-3">
                  <input type="text" value={emailDraft.subject} onChange={(e) => setEmailDraft({ ...emailDraft, subject: e.target.value })} placeholder="Betreff" className="w-full px-4 py-2 border border-gray-200 rounded-lg" />
                  <textarea value={emailDraft.body} onChange={(e) => setEmailDraft({ ...emailDraft, body: e.target.value })} rows={8} className="w-full px-4 py-2 border border-gray-200 rounded-lg font-mono text-sm" />
                  <div className="flex gap-2">
                    <button onClick={() => copyToClipboard(`Betreff: ${emailDraft.subject}\n\n${emailDraft.body}`)} className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"><Copy size={16} />Kopieren</button>
                    <button onClick={() => window.open(`mailto:?subject=${encodeURIComponent(emailDraft.subject)}&body=${encodeURIComponent(emailDraft.body)}`)} className="flex items-center gap-2 px-4 py-2 bg-[#1a5f9c] text-white rounded-lg"><Mail size={16} />Per E-Mail senden</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="p-6 space-y-6">
            <div><h3 className="font-semibold text-gray-900">Aufgaben</h3><p className="text-sm text-gray-500">Verwalten Sie anstehende Aufgaben für diesen Fall</p></div>

            {/* Add Task */}
            <div className="flex gap-2 flex-wrap">
              <input type="text" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} placeholder="Neue Aufgabe..." className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-lg" />
              <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} className="px-4 py-2 border border-gray-200 rounded-lg">
                <option value="low">Niedrig</option>
                <option value="medium">Mittel</option>
                <option value="high">Hoch</option>
              </select>
              <button onClick={addTask} disabled={!newTask.title.trim()} className="px-4 py-2 bg-[#1a5f9c] text-white rounded-lg font-medium disabled:opacity-50">Hinzufügen</button>
            </div>

            {/* Task Templates */}
            <div className="flex gap-2 flex-wrap">
              <span className="text-sm text-gray-500">Schnell hinzufügen:</span>
              {taskTemplates.map(t => (
                <button key={t.id} onClick={() => setNewTask({ title: t.title, description: t.description, priority: t.priority })} className="px-3 py-1 text-sm border border-gray-200 rounded-full hover:border-[#1a5f9c] hover:text-[#1a5f9c] transition-colors">{t.title}</button>
              ))}
            </div>

            {/* Task List */}
            {taskList.length === 0 ? (
              <div className="text-center py-12 text-gray-400"><Clipboard size={48} className="mx-auto mb-4 opacity-30" /><p>Keine Aufgaben vorhanden</p></div>
            ) : (
              <div className="space-y-2">
                {taskList.map(task => (
                  <div key={task.id} className={`flex items-center gap-4 p-4 border rounded-xl ${task.status === 'completed' ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}>
                    <button onClick={() => toggleTaskStatus(task.id)} className={task.status === 'completed' ? 'text-green-500' : 'text-gray-400'}>{task.status === 'completed' ? <CheckCircle size={20} /> : <Square size={20} />}</button>
                    <div className="flex-1"><p className={`font-medium ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{task.title}</p><p className="text-sm text-gray-500">{task.description}</p></div>
                    <span className={`px-2 py-1 text-xs rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-700' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{task.priority === 'high' ? 'Hoch' : task.priority === 'medium' ? 'Mittel' : 'Niedrig'}</span>
                    <button onClick={() => deleteTask(task.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                ))}
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
                  <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg font-medium hover:bg-gray-50"><Printer size={16} />Drucken</button>
                  <button onClick={() => { const blob = new Blob([report], { type: 'text/markdown' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${caseData.id}-gutachten.md`; a.click(); }} className="flex items-center gap-2 px-4 py-2 bg-[#1a5f9c] text-white rounded-lg"><Download size={16} />Herunterladen</button>
                </div>
                <div className="bg-gray-50 rounded-xl p-6"><pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">{report}</pre></div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400"><FileText size={48} className="mx-auto mb-4 opacity-30" /><p>Noch kein Gutachten erstellt</p></div>
            )}
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><MessageSquare size={18} />Notizen</h3>
        <div className="space-y-3 mb-4">
          {(caseNotes || []).map((n: any, i: number) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg"><p className="text-gray-700 text-sm">{typeof n === 'string' ? n : n.text}</p><p className="text-xs text-gray-400 mt-1">{n.date ? new Date(n.date).toLocaleString('de-DE') : ''}</p></div>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Neue Notiz hinzufügen..." className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a5f9c] outline-none" onKeyDown={(e) => e.key === 'Enter' && handleAddNote()} />
          <button onClick={handleAddNote} disabled={!note.trim()} className="px-4 py-2 bg-[#1a5f9c] text-white rounded-lg disabled:opacity-50"><Send size={16} /></button>
        </div>
      </div>
    </div>
  );
}
