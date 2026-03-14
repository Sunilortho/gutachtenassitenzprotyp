import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getCases, updateCase, getDocuments, saveDocument, deleteDocument,
  Case, Document, generateId
} from '../lib/db';
import { analyzeDocument, generateReport, GutachtenType } from '../lib/deepseek';
import { extractFileText } from '../lib/extractText';
import { classifyDocument } from '../lib/classifyDocument';
import { generatePrintableReport } from '../lib/reportTemplate';
import {
  ArrowLeft, Upload, FileText, Trash2,
  CheckCircle, AlertCircle, Download, Send, Mail,
  Bot, RefreshCw, Loader2, X, CheckSquare, Square,
  AlertTriangle, MessageSquare, Copy, Printer, Eye,
  Calendar, Building, FilePlus, Stethoscope,
  Clipboard, ChevronDown, ChevronUp, Info, Save, FolderOpen
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

// ─── Orthopedic Checklist ──────────────────────────────────────────────────────
const checklistItems = [
  { id: 'befund',       name: 'Befundbericht',             required: true  },
  { id: 'arztbrief',    name: 'Arztbrief',                 required: false },
  { id: 'therapie',     name: 'Therapiebericht',           required: true  },
  { id: 'diagnose',     name: 'Diagnoseliste',             required: true  },
  { id: 'bildgebung',   name: 'Bildgebung (MRT/CT)',        required: false },
  { id: 'roentgen',     name: 'Röntgenbefund',             required: false },
  { id: 'beweglich',    name: 'Beweglichkeitsmessung',     required: false },
  { id: 'ws',           name: 'Wirbelsäulenstatus',        required: false },
  { id: 'op',           name: 'Operationsbericht',         required: false },
  { id: 'reha',         name: 'Reha-Bericht',              required: false },
  { id: 'medizin',      name: 'Medikationsplan',           required: false },
  { id: 'labor',        name: 'Laborbefunde',              required: false },
];

// ─── Orthopedic Auto-Detected Issue Templates ─────────────────────────────────
const orthoIssueTemplates = [
  { id: 'img_old',    title: 'Bildgebung älter als 12 Monate', description: 'Bei akuter Verletzung sollte aktuelle Bildgebung (< 12 Monate) vorliegen', severity: 'error' },
  { id: 'no_base',    title: 'Fehlender Ausgangsbefund',       description: 'Vergleichsuntersuchung / Ausgangsbefund fehlt für Kausalitätsbeurteilung', severity: 'warning' },
  { id: 'no_icd',     title: 'ICD-10 Code nicht angegeben',   description: 'Diagnosen sollten mit ICD-10 M-Codes kodiert sein', severity: 'warning' },
  { id: 'no_trt',     title: 'Kein Behandlungsverlauf',       description: 'Behandlungsverlauf für relevanten Zeitraum fehlt', severity: 'error' },
  { id: 'no_rom',     title: 'Fehlende Funktionsdiagnostik',  description: 'Neutral-Null-Messung (ROM) nicht dokumentiert', severity: 'warning' },
  { id: 'incomplete', title: 'Unvollständige Dokumentation',  description: 'Erforderliche Unterlagen fehlen', severity: 'error' },
  { id: 'contradict', title: 'Widersprüchliche Angaben',      description: 'Angaben in Dokumenten widersprechen sich', severity: 'warning' },
  { id: 'no_sign',    title: 'Fehlende Unterschriften',       description: 'Dokumente sind nicht unterschrieben', severity: 'error' },
];

// ─── Orthopedic Email Templates ───────────────────────────────────────────────
const emailTemplates = [
  {
    id: 1,
    title: 'Anforderung weiterer Unterlagen',
    subject: 'Anforderung weiterer Unterlagen für orthopädisches Gutachten',
    body: `Sehr geehrte Damen und Herren,

für die Erstellung des orthopädischen Gutachtens benötigen wir folgende weitere Unterlagen:

- Aktuelle MRT/CT-Aufnahmen (< 12 Monate)
- Verlaufsberichte der letzten 12 Monate
- Physiotherapie-Verlaufsdokumentation
- Neutral-Null-Messung (Beweglichkeitsmessung)
- Einweisungs- und Entlassungsbericht

Wir bitten um Zusendung innerhalb von 2 Wochen.

Mit freundlichen Grüßen
Dr. med. [Name]
Facharzt für Orthopädie und Unfallchirurgie`
  },
  {
    id: 2,
    title: 'Einladung zur Untersuchung',
    subject: 'Einladung zur fachärztlichen Untersuchung',
    body: `Sehr geehrte(r) Patient(in),

wir laden Sie zu einer fachärztlichen Untersuchung ein.

Termin: [Datum einfügen]
Ort: [Praxisadresse München]
Zeit: [Uhrzeit]

Bitte bringen Sie folgende Unterlagen mit:
- Versicherungskarte
- Alle vorliegenden Befundberichte und Arztbriefe
- Medikamentenliste
- Aktuelle Laborbefunde
- Bildgebung (MRT/CT/Röntgen) auf CD oder digital

Bitte bestätigen Sie den Termin telefonisch unter [Telefonnummer].

Mit freundlichen Grüßen
Dr. med. [Name]
Facharzt für Orthopädie und Unfallchirurgie`
  },
  {
    id: 3,
    title: 'Anforderung Röntgenbilder / MRT-CD',
    subject: 'Anforderung Bildgebung (Röntgen / MRT / CT) für Gutachten',
    body: `Sehr geehrte Damen und Herren,

für die Erstellung eines orthopädischen Gutachtens benötigen wir die Originaldaten der folgenden Bildgebung:

- Röntgenaufnahmen: [Datum / Region angeben]
- MRT-Aufnahmen: [Datum / Region angeben]
- CT-Aufnahmen: [Datum / Region angeben]

Bitte senden Sie uns die Aufnahmen als DICOM-Daten auf CD/DVD oder als digitalen Download.

Wir bitten um Zusendung innerhalb von 10 Werktagen.

Mit freundlichen Grüßen
Dr. med. [Name]
Facharzt für Orthopädie und Unfallchirurgie`
  },
  {
    id: 4,
    title: 'Einholung Fremdgutachten',
    subject: 'Anforderung Fremdgutachten / Zweitmeinung',
    body: `Sehr geehrte Damen und Herren,

im Rahmen der gutachterlichen Beurteilung des o.g. Falles bitten wir um Übersendung des vorliegenden Fremdgutachtens / der Zweitmeinung von:

Gutachter: [Name]
Datum: [Datum]
Thema: [Thema]

Für Rückfragen stehen wir gerne zur Verfügung.

Mit freundlichen Grüßen
Dr. med. [Name]
Facharzt für Orthopädie und Unfallchirurgie`
  },
  {
    id: 5,
    title: 'Anforderung OP-Bericht / Entlassungsbericht',
    subject: 'Anforderung Operationsbericht / Entlassungsbericht',
    body: `Sehr geehrte Damen und Herren,

für die Erstellung des orthopädischen Gutachtens benötigen wir folgende Unterlagen aus dem stationären Aufenthalt:

- Operationsbericht vom [Datum]
- Entlassungsbericht vom [Datum]
- Anästhesieprotokoll (falls relevant)
- Histologiebefund (falls relevant)

Bitte senden Sie uns die Unterlagen innerhalb von 10 Werktagen.

Mit freundlichen Grüßen
Dr. med. [Name]
Facharzt für Orthopädie und Unfallchirurgie`
  },
  {
    id: 6,
    title: 'Rückfrage an behandelnden Orthopäden',
    subject: 'Rückfrage zum Behandlungsverlauf – Orthopädie',
    body: `Sehr geehrte(r) Kollegin / Kollege,

im Rahmen der gutachterlichen Beurteilung des gemeinsamen Patienten [Patientenname] haben wir folgende Rückfragen:

1. Wie ist der aktuelle Behandlungsverlauf?
2. Liegen aktuelle Bildgebungsbefunde vor?
3. Wurden Neutral-Null-Messungen durchgeführt? Wenn ja, bitte Ergebnisse mitteilen.
4. Welche Therapiemaßnahmen wurden bisher durchgeführt?

Wir bitten um zeitnahe Stellungnahme.

Mit kollegialen Grüßen
Dr. med. [Name]
Facharzt für Orthopädie und Unfallchirurgie`
  },
  {
    id: 7,
    title: 'Anforderung Physiotherapie-Verlaufsdokumentation',
    subject: 'Anforderung Physiotherapie-Verlaufsdokumentation',
    body: `Sehr geehrte Damen und Herren,

für die Erstellung eines orthopädischen Gutachtens benötigen wir die vollständige Physiotherapie-Verlaufsdokumentation für den Patienten [Patientenname]:

- Zeitraum: [Von – Bis]
- Behandlungseinheiten: Anzahl und Inhalt
- Therapieziele und Erreichungsgrad
- Abschlussbericht / aktueller Verlaufsbericht

Wir bitten um Zusendung innerhalb von 10 Werktagen.

Mit freundlichen Grüßen
Dr. med. [Name]
Facharzt für Orthopädie und Unfallchirurgie`
  },
  {
    id: 8,
    title: 'Gutachten fertig',
    subject: 'Gutachten fertiggestellt – Abholung/Versand',
    body: `Sehr geehrte Damen und Herren,

das orthopädische Gutachten wurde fertiggestellt und kann abgerufen werden.

Fall-ID: [Case ID]
Patient: [Patientenname]
Gutachtentyp: [Typ]

Das Gutachten liegt ab sofort bereit und kann:
- Persönlich während unserer Sprechzeiten abgeholt werden
- Per Post versendet werden
- Digital übermittelt werden (verschlüsselt)

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen
Dr. med. [Name]
Facharzt für Orthopädie und Unfallchirurgie`
  },
];

// ─── Task Templates ───────────────────────────────────────────────────────────
const taskTemplates = [
  { id: 1, title: 'MRT/CT anfordern',              description: 'Aktuelle Bildgebung anfordern', priority: 'high' },
  { id: 2, title: 'Untersuchungstermin vereinbaren', description: 'Termin mit Patient vereinbaren', priority: 'high' },
  { id: 3, title: 'Arztbericht anfordern',          description: 'Zusätzlichen Arztbericht anfordern', priority: 'medium' },
  { id: 4, title: 'Röntgenbilder anfordern',        description: 'Röntgen-CD / DICOM-Daten anfordern', priority: 'medium' },
  { id: 5, title: 'Versicherung kontaktieren',      description: 'Rückversicherung bei Versicherung', priority: 'medium' },
  { id: 6, title: 'Follow-up nach 4 Wochen',        description: 'Nachkontrolle vereinbaren', priority: 'low' },
];

// ─── Gutachten Types ──────────────────────────────────────────────────────────
const GUTACHTEN_TYPES: GutachtenType[] = ['Renten', 'BU', 'Haftpflicht', 'Sozialmedizin'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Workspace({ caseId, onBack, theme }: WorkspaceProps) {
  const isDark = theme === 'dark';
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  // Tab order: Dokumente → Analyse → Probleme → Gutachten → Aufgaben → E-Mails
  const [activeTab, setActiveTab] = useState<'documents' | 'analysis' | 'issues' | 'report' | 'tasks' | 'emails'>('documents');

  const docs = Array.isArray(documents) ? documents : [];
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [report, setReport] = useState<string>('');
  const [gutachtenType, setGutachtenType] = useState<GutachtenType>('Renten');
  const [note, setNote] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [detectedIssues, setDetectedIssues] = useState<any[]>([]);
  const [selectedIssues, setSelectedIssues] = useState<number[]>([]);
  const [emailDraft, setEmailDraft] = useState({ subject: '', body: '' });
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' });
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const taskList = Array.isArray(tasks) ? tasks : [];
  const caseNotes = Array.isArray(caseData?.notes) ? caseData.notes : [];

  // Keyboard shortcut: Ctrl+Enter → analyze
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (docs.length > 0 && !analyzing) {
          handleAnalyze();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [docs.length, analyzing]);

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
      if (found.gutachtenType) setGutachtenType(found.gutachtenType as GutachtenType);
    }
    const d = getDocuments(caseId);
    setDocuments(d);
  };

  // ─── File Upload with Real Extraction ───────────────────────────────────────

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Verarbeite ${file.name} (${i + 1}/${files.length})…`);

      const result = await extractFileText(file);

      const docType = classifyDocument(file.name, result.text);

      const newDoc: Document = {
        id: generateId('DOC'),
        caseId,
        name: file.name,
        type: docType,
        uploadedAt: new Date().toISOString(),
        text: result.text.substring(0, 5000),
        size: file.size,
        extractionWarning: result.warning || result.error,
        isPasswordProtected: result.isPasswordProtected,
        isScannedImage: result.isScannedImage,
      };

      saveDocument(newDoc);
    }

    setUploading(false);
    setUploadProgress('');
    loadData();

    // Fix: sync document count with actual stored docs
    const freshDocs = getDocuments(caseId);
    updateCase(caseId, {
      status: 'documents',
      documents: freshDocs.length,
    });
  };

  // ─── Analysis ───────────────────────────────────────────────────────────────

  const handleAnalyze = useCallback(async () => {
    setAnalyzing(true);

    for (const doc of docs) {
      if (!doc.analysis) {
        const result = await analyzeDocument(doc.text || '', doc.type);
        doc.analysis = result;
        saveDocument(doc);

        // Auto-detect orthopedic issues from AI flags
        const newIssues: any[] = [];
        if (result.flags && result.flags.length > 0) {
          result.flags.forEach((flag: string, idx: number) => {
            newIssues.push({
              id: Date.now() + idx,
              title: flag.replace(/^(WARNUNG|HINWEIS):\s*/i, ''),
              description: `Erkannt in: ${doc.name}`,
              severity: flag.toUpperCase().startsWith('WARNUNG') ? 'error' : 'warning',
            });
          });
        }
        if (result.issues && result.issues.length > 0) {
          result.issues.forEach((issue: string, idx: number) => {
            newIssues.push({
              id: Date.now() + 100 + idx,
              title: issue,
              description: `KI-Analyse: ${doc.name}`,
              severity: 'warning',
            });
          });
        }
        if (newIssues.length > 0) {
          setDetectedIssues(prev => [...prev, ...newIssues]);
        }
      }
    }

    // Auto-detect structural orthopedic issues
    autoDetectOrthoIssues();

    setAnalyzing(false);
    loadData();
    updateCase(caseId, { status: 'analysis' });
  }, [docs, caseId]);

  const autoDetectOrthoIssues = () => {
    const newIssues: any[] = [];

    // No ROM documentation
    const hasRom = docs.some(d => d.type === 'Beweglichkeitsmessung' || (d.text || '').toLowerCase().includes('neutral-null'));
    if (!hasRom) {
      newIssues.push({ id: Date.now() + 200, ...orthoIssueTemplates.find(t => t.id === 'no_rom')! });
    }

    // No ICD-10 codes
    const hasIcd = docs.some(d => (d.text || '').match(/[Mm]\d{2}/));
    if (!hasIcd) {
      newIssues.push({ id: Date.now() + 201, ...orthoIssueTemplates.find(t => t.id === 'no_icd')! });
    }

    // No imaging
    const hasImaging = docs.some(d => ['Bildgebung', 'Röntgenbefund'].includes(d.type));
    if (!hasImaging) {
      newIssues.push({ id: Date.now() + 202, ...orthoIssueTemplates.find(t => t.id === 'img_old')! });
    }

    if (newIssues.length > 0) {
      setDetectedIssues(prev => {
        const existingTitles = new Set(prev.map(i => i.title));
        return [...prev, ...newIssues.filter(i => !existingTitles.has(i.title))];
      });
    }
  };

  // ─── Report Generation ──────────────────────────────────────────────────────

  const handleGenerateReport = async () => {
    if (!caseData) return;
    setGeneratingReport(true);

    const generatedReport = await generateReport(caseData, docs, gutachtenType);
    setReport(generatedReport);

    updateCase(caseId, {
      status: 'completed',
      report: generatedReport,
      gutachtenType,
    });

    setGeneratingReport(false);
    setActiveTab('report');
    loadData();
  };

  const exportToPrint = () => {
    if (!caseData) return;
    const html = generatePrintableReport({
      caseData,
      reportMarkdown: report,
      gutachtenType,
    });
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  // ─── Notes ──────────────────────────────────────────────────────────────────

  const handleAddNote = () => {
    if (!note.trim() || !caseData) return;
    const notes = [...(caseNotes || []), { text: note, date: new Date().toISOString() }];
    updateCase(caseId, { notes });
    setNote('');
    loadData();
  };

  // ─── Documents ──────────────────────────────────────────────────────────────

  const handleRemoveDocument = (docId: string) => {
    deleteDocument(docId);
    loadData();
    // Fix: sync count after deletion
    const remaining = getDocuments(caseId);
    updateCase(caseId, { documents: remaining.length });
  };

  // ─── Issues ─────────────────────────────────────────────────────────────────

  const toggleIssue = (issueId: number) => {
    setSelectedIssues(prev =>
      prev.includes(issueId) ? prev.filter(id => id !== issueId) : [...prev, issueId]
    );
  };

  const addManualIssue = () => {
    setDetectedIssues(prev => [
      ...prev,
      {
        id: Date.now(),
        title: 'Manuell hinzugefügt',
        description: 'Benutzerdefinierter Hinweis',
        severity: 'warning',
        manual: true,
      },
    ]);
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
      body: `Sehr geehrte Damen und Herren,\n\nbei der Prüfung des Falles sind folgende Punkte aufgefallen:\n\n${body}\n\nWir bitten um Stellungnahme.\n\nMit freundlichen Grüßen`,
    });
    setActiveTab('emails');
  };

  // ─── Tasks ──────────────────────────────────────────────────────────────────

  const addTask = () => {
    if (!newTask.title.trim()) return;
    const task = { id: Date.now(), ...newTask, status: 'pending', createdAt: new Date().toISOString() };
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

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  // ─── Checklist ──────────────────────────────────────────────────────────────

  const checklistStatus = checklistItems.map(item => {
    const hasDoc = docs.some(d =>
      d.type === item.name ||
      d.name.toLowerCase().includes(item.name.toLowerCase().split(' ')[0])
    );
    return { ...item, present: hasDoc };
  });

  const allRequiredPresent = checklistStatus.filter(i => i.required).every(i => i.present);
  const completedTasks = taskList.filter(t => t.status === 'completed').length;

  if (!caseData) return <div className="p-8 text-center text-gray-500">Lade Fall…</div>;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
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
            <span className="flex items-center gap-1"><FileText size={14} /> {caseData.id}</span>
            <span className="flex items-center gap-1"><Stethoscope size={14} /> {caseData.type}</span>
            <span className="flex items-center gap-1"><Building size={14} /> {caseData.insurer}</span>
            <span className="flex items-center gap-1"><Calendar size={14} /> {caseData.created}</span>
          </div>
        </div>
      </div>

      {/* Tabs — workflow order: Dokumente → Analyse → Probleme → Gutachten → Aufgaben → E-Mails */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {[
            { id: 'documents', label: '📄 Dokumente',  count: docs.length },
            { id: 'analysis',  label: '🤖 KI-Analyse', count: docs.filter(d => d.analysis).length },
            { id: 'issues',    label: '⚠️ Probleme',   count: detectedIssues.length },
            { id: 'report',    label: '📋 Gutachten',  count: report ? 1 : 0 },
            { id: 'tasks',     label: '✓ Aufgaben',    count: `${completedTasks}/${taskList.length}` },
            { id: 'emails',    label: '📧 E-Mails',    count: emailTemplates.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors relative min-h-[44px] ${
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

        {/* ── DOCUMENTS TAB ── */}
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
              <p className="text-gray-400 text-sm mt-1">PDF, DOCX, TXT — Max. 10 MB pro Datei</p>
              <p className="text-gray-400 text-xs mt-1">Tipp: Ctrl+Enter startet die KI-Analyse</p>
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
                  <span>{uploadProgress || 'Wird hochgeladen…'}</span>
                </div>
              )}
            </div>

            {/* Checklist */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckSquare size={18} /> Checkliste Orthopädie-Gutachten
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {checklistStatus.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    {item.present
                      ? <CheckCircle className="text-green-500 shrink-0" size={18} />
                      : <AlertCircle className={item.required ? 'text-red-500 shrink-0' : 'text-yellow-500 shrink-0'} size={18} />
                    }
                    <span className={item.present ? 'text-gray-700' : 'text-gray-500'}>{item.name}</span>
                    {item.required && !item.present && (
                      <span className="text-xs text-red-500 ml-auto">Erforderlich</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Document List */}
            {docs.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Hochgeladene Dokumente ({docs.length})
                </h3>
                <div className="space-y-2">
                  {docs.map(doc => (
                    <div key={doc.id} className="border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-4 p-4">
                        <FileText className="text-[#1a5f9c] shrink-0" size={20} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                          <p className="text-sm text-gray-500">
                            {doc.type} · {new Date(doc.uploadedAt).toLocaleDateString('de-DE')}
                            {doc.size ? ` · ${(doc.size / 1024).toFixed(1)} KB` : ''}
                          </p>
                          {/* Extraction warnings */}
                          {doc.isPasswordProtected && (
                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                              <AlertTriangle size={12} /> Passwortgeschützt — Text konnte nicht extrahiert werden
                            </p>
                          )}
                          {doc.isScannedImage && (
                            <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                              <AlertTriangle size={12} /> Gescanntes Bild-PDF — OCR erforderlich für vollständige Analyse
                            </p>
                          )}
                          {doc.extractionWarning && !doc.isPasswordProtected && !doc.isScannedImage && (
                            <p className="text-xs text-yellow-600 mt-1">{doc.extractionWarning}</p>
                          )}
                        </div>
                        {doc.analysis && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full shrink-0">
                            Analysiert
                          </span>
                        )}
                        {/* Preview toggle */}
                        <button
                          onClick={() => setPreviewDocId(previewDocId === doc.id ? null : doc.id)}
                          className="p-2 text-gray-400 hover:text-[#1a5f9c] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title="Vorschau"
                        >
                          {previewDocId === doc.id ? <ChevronUp size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => handleRemoveDocument(doc.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {/* Document preview — first 500 chars */}
                      {previewDocId === doc.id && doc.text && (
                        <div className="px-4 pb-4">
                          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 font-mono whitespace-pre-wrap border border-gray-200 max-h-40 overflow-y-auto">
                            {doc.text.substring(0, 500)}{doc.text.length > 500 ? '…' : ''}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">Vorschau: erste 500 Zeichen</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {docs.length > 0 && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#1a5f9c] to-[#0e3b63] text-white px-5 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 min-h-[44px]"
                  title="Ctrl+Enter"
                >
                  {analyzing
                    ? <><Loader2 className="animate-spin" size={18} /> Analysiere…</>
                    : <><Bot size={18} /> KI-Analyse starten (Ctrl+Enter)</>
                  }
                </button>
                <button
                  onClick={handleGenerateReport}
                  disabled={!allRequiredPresent || generatingReport || caseData.status === 'completed'}
                  className="flex items-center gap-2 bg-green-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all disabled:opacity-50 min-h-[44px]"
                  title={!allRequiredPresent ? 'Erforderliche Dokumente fehlen noch' : ''}
                >
                  {generatingReport
                    ? <><Loader2 className="animate-spin" size={18} /> Wird erstellt…</>
                    : <><FileText size={18} /> Gutachten erstellen</>
                  }
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── ANALYSIS TAB ── */}
        {activeTab === 'analysis' && (
          <div className="p-6 space-y-6">
            {docs.filter(d => d.analysis).length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Bot size={48} className="mx-auto mb-4 opacity-30" />
                <p>Noch keine Analyse verfügbar</p>
                <p className="text-sm">Laden Sie Dokumente hoch und starten Sie die Analyse (Ctrl+Enter)</p>
              </div>
            ) : (
              docs.filter(d => d.analysis).map(doc => {
                const a = doc.analysis;
                const lowConfidence = a.confidence !== undefined && a.confidence < 0.6;
                return (
                  <div key={doc.id} className="bg-gray-50 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="font-semibold text-gray-900">{doc.name}</h3>
                      <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-full">{doc.type}</span>
                    </div>

                    {/* Low confidence warning banner */}
                    {lowConfidence && (
                      <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-300 rounded-lg p-3 text-sm text-yellow-800">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <span>
                          <strong>Niedrige Konfidenz ({Math.round(a.confidence * 100)}%)</strong> — Die KI-Analyse ist unsicher.
                          Bitte Ergebnisse manuell prüfen.
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Patienteninfo</h4>
                        <p className="text-gray-900">{a.patientInfo?.name || 'N/A'} · {a.patientInfo?.age || 'N/A'}</p>
                        <p className="text-sm text-gray-600">{a.patientInfo?.diagnosis}</p>
                        {a.patientInfo?.icdCodes?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {a.patientInfo.icdCodes.map((code: string) => (
                              <span key={code} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-mono">{code}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Konfidenz</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full">
                            <div
                              className={`h-full rounded-full ${a.confidence >= 0.7 ? 'bg-green-500' : a.confidence >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${(a.confidence || 0) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{Math.round((a.confidence || 0) * 100)}%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Zusammenfassung</h4>
                      <p className="text-gray-700 text-sm">{a.summary}</p>
                    </div>

                    {/* Orthopedic findings */}
                    {a.orthopedicFindings && (
                      <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                        <h4 className="text-sm font-medium text-blue-800 flex items-center gap-1">
                          <Stethoscope size={14} /> Orthopädische Befunde
                        </h4>
                        {a.orthopedicFindings.romImpairments?.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-blue-700">Beweglichkeitseinschränkungen (ROM):</p>
                            <ul className="text-xs text-blue-800 ml-3 space-y-0.5">
                              {a.orthopedicFindings.romImpairments.map((r: string, i: number) => <li key={i}>• {r}</li>)}
                            </ul>
                          </div>
                        )}
                        {a.orthopedicFindings.causalityAssessment && (
                          <p className="text-xs text-blue-800"><strong>Kausalität:</strong> {a.orthopedicFindings.causalityAssessment}</p>
                        )}
                        {a.orthopedicFindings.mdeRelevance && (
                          <p className="text-xs text-blue-800"><strong>MdE:</strong> {a.orthopedicFindings.mdeRelevance}</p>
                        )}
                      </div>
                    )}

                    {a.recommendations?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Empfehlungen</h4>
                        <ul className="space-y-1">
                          {a.recommendations.map((r: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <CheckCircle className="text-green-500 mt-0.5 shrink-0" size={14} />{r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {a.flags?.length > 0 && (
                      <div className="bg-red-50 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-red-700 mb-1 flex items-center gap-1">
                          <AlertTriangle size={14} /> Warnhinweise
                        </h4>
                        <ul className="space-y-1">
                          {a.flags.map((f: string, i: number) => (
                            <li key={i} className="text-xs text-red-700">• {f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── ISSUES TAB ── */}
        {activeTab === 'issues' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">Erkannte Probleme</h3>
                <p className="text-sm text-gray-500">Automatisch erkannte + manuell hinzugefügte Issues</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={addManualIssue}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors min-h-[44px]"
                >
                  <FilePlus size={16} /> Manuell hinzufügen
                </button>
                {selectedIssues.length > 0 && (
                  <button
                    onClick={generateEmailFromIssues}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1a5f9c] text-white rounded-lg font-medium hover:bg-[#0e3b63] min-h-[44px]"
                  >
                    <Mail size={16} /> E-Mail ({selectedIssues.length})
                  </button>
                )}
              </div>
            </div>

            {/* Quick-add orthopedic issue templates */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Schnell hinzufügen (Orthopädie-spezifisch):</p>
              <div className="flex flex-wrap gap-2">
                {orthoIssueTemplates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      const exists = detectedIssues.some(i => i.title === t.title);
                      if (!exists) {
                        setDetectedIssues(prev => [...prev, { id: Date.now(), ...t }]);
                      }
                    }}
                    className="px-3 py-1 text-xs border border-gray-200 rounded-full hover:border-[#1a5f9c] hover:text-[#1a5f9c] transition-colors"
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>

            {detectedIssues.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <AlertTriangle size={48} className="mx-auto mb-4 opacity-30" />
                <p>Keine Probleme erkannt</p>
                <p className="text-sm">Starten Sie die KI-Analyse oder fügen Sie manuell hinzu</p>
              </div>
            ) : (
              <div className="space-y-3">
                {detectedIssues.map(issue => (
                  <div
                    key={issue.id}
                    className={`flex items-center gap-4 p-4 border rounded-xl ${
                      selectedIssues.includes(issue.id) ? 'border-[#1a5f9c] bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <button onClick={() => toggleIssue(issue.id)} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
                      {selectedIssues.includes(issue.id)
                        ? <CheckCircle className="text-[#1a5f9c]" size={20} />
                        : <Square className="text-gray-400" size={20} />
                      }
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{issue.title}</p>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${issue.severity === 'error' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {issue.severity === 'error' ? 'Fehler' : 'Hinweis'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{issue.description}</p>
                    </div>
                    <button onClick={() => removeIssue(issue.id)} className="p-2 text-gray-400 hover:text-red-500 min-h-[44px] min-w-[44px] flex items-center justify-center">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── REPORT TAB ── */}
        {activeTab === 'report' && (
          <div className="p-6 space-y-4">
            {/* Gutachten type selector */}
            <div className="flex items-center gap-4 flex-wrap">
              <label className="text-sm font-medium text-gray-700">Gutachtentyp:</label>
              <div className="flex gap-2 flex-wrap">
                {GUTACHTEN_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => setGutachtenType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                      gutachtenType === type
                        ? 'bg-[#1a5f9c] text-white'
                        : 'border border-gray-200 text-gray-600 hover:border-[#1a5f9c]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {report ? (
              <div className="space-y-4">
                <div className="flex justify-end gap-2 flex-wrap">
                  <button
                    onClick={exportToPrint}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 min-h-[44px]"
                  >
                    <Printer size={16} /> Drucken / PDF
                  </button>
                  <button
                    onClick={() => copyToClipboard(report)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 min-h-[44px]"
                  >
                    <Copy size={16} /> Kopieren
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
                    className="flex items-center gap-2 px-4 py-2 bg-[#1a5f9c] text-white rounded-lg min-h-[44px]"
                  >
                    <Download size={16} /> Herunterladen
                  </button>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">{report}</pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 space-y-4">
                <FileText size={48} className="mx-auto opacity-30" />
                <p>Noch kein Gutachten erstellt</p>
                <button
                  onClick={handleGenerateReport}
                  disabled={!allRequiredPresent || generatingReport}
                  className="flex items-center gap-2 mx-auto bg-green-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 min-h-[44px]"
                >
                  {generatingReport
                    ? <><Loader2 className="animate-spin" size={18} /> Wird erstellt…</>
                    : <><FileText size={18} /> {gutachtenType}-Gutachten erstellen</>
                  }
                </button>
                {!allRequiredPresent && (
                  <p className="text-xs text-red-500 flex items-center justify-center gap-1">
                    <Info size={12} /> Erforderliche Dokumente (Befundbericht, Therapiebericht, Diagnoseliste) fehlen noch
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── TASKS TAB ── */}
        {activeTab === 'tasks' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900">Aufgaben</h3>
              <p className="text-sm text-gray-500">Verwalten Sie anstehende Aufgaben für diesen Fall</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                placeholder="Neue Aufgabe…"
                className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-lg min-h-[44px]"
              />
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                className="px-4 py-2 border border-gray-200 rounded-lg min-h-[44px]"
              >
                <option value="low">Niedrig</option>
                <option value="medium">Mittel</option>
                <option value="high">Hoch</option>
              </select>
              <button
                onClick={addTask}
                disabled={!newTask.title.trim()}
                className="px-4 py-2 bg-[#1a5f9c] text-white rounded-lg font-medium disabled:opacity-50 min-h-[44px]"
              >
                Hinzufügen
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="text-sm text-gray-500 self-center">Schnell hinzufügen:</span>
              {taskTemplates.map(t => (
                <button
                  key={t.id}
                  onClick={() => setNewTask({ title: t.title, description: t.description, priority: t.priority })}
                  className="px-3 py-1 text-sm border border-gray-200 rounded-full hover:border-[#1a5f9c] hover:text-[#1a5f9c] transition-colors"
                >
                  {t.title}
                </button>
              ))}
            </div>
            {taskList.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Clipboard size={48} className="mx-auto mb-4 opacity-30" />
                <p>Keine Aufgaben vorhanden</p>
              </div>
            ) : (
              <div className="space-y-2">
                {taskList.map(task => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-4 p-4 border rounded-xl ${task.status === 'completed' ? 'bg-green-50 border-green-200' : 'border-gray-200'}`}
                  >
                    <button onClick={() => toggleTaskStatus(task.id)} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
                      {task.status === 'completed'
                        ? <CheckCircle className="text-green-500" size={20} />
                        : <Square className="text-gray-400" size={20} />
                      }
                    </button>
                    <div className="flex-1">
                      <p className={`font-medium ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{task.title}</p>
                      {task.description && <p className="text-sm text-gray-500">{task.description}</p>}
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-700' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                      {task.priority === 'high' ? 'Hoch' : task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                    </span>
                    <button onClick={() => deleteTask(task.id)} className="p-2 text-gray-400 hover:text-red-500 min-h-[44px] min-w-[44px] flex items-center justify-center">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── EMAILS TAB ── */}
        {activeTab === 'emails' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900">E-Mail Vorlagen — Orthopädie</h3>
              <p className="text-sm text-gray-500">Klicken zum Bearbeiten oder Kopieren</p>
            </div>
            <div className="grid gap-4">
              {emailTemplates.map(template => (
                <div key={template.id} className="border border-gray-200 rounded-xl p-5 hover:border-[#1a5f9c] transition-colors">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <h4 className="font-semibold text-gray-900">{template.title}</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEmailDraft({ subject: template.subject, body: template.body })}
                        className="p-2 text-gray-400 hover:text-[#1a5f9c] min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Bearbeiten"
                      >
                        <MessageSquare size={16} />
                      </button>
                      <button
                        onClick={() => copyToClipboard(`Betreff: ${template.subject}\n\n${template.body}`)}
                        className="p-2 text-gray-400 hover:text-[#1a5f9c] min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Kopieren"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium mb-1">Betreff: {template.subject}</p>
                    <p className="whitespace-pre-line text-xs">{template.body.substring(0, 200)}{template.body.length > 200 ? '…' : ''}</p>
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
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg min-h-[44px]"
                  />
                  <textarea
                    value={emailDraft.body}
                    onChange={(e) => setEmailDraft({ ...emailDraft, body: e.target.value })}
                    rows={10}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg font-mono text-sm"
                  />
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => copyToClipboard(`Betreff: ${emailDraft.subject}\n\n${emailDraft.body}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg min-h-[44px]"
                    >
                      <Copy size={16} /> Kopieren
                    </button>
                    <button
                      onClick={() => window.open(`mailto:?subject=${encodeURIComponent(emailDraft.subject)}&body=${encodeURIComponent(emailDraft.body)}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#1a5f9c] text-white rounded-lg min-h-[44px]"
                    >
                      <Mail size={16} /> Per E-Mail senden
                    </button>
                    <button
                      onClick={() => setEmailDraft({ subject: '', body: '' })}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg min-h-[44px]"
                    >
                      <X size={16} /> Verwerfen
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageSquare size={18} /> Notizen
        </h3>
        <div className="space-y-3 mb-4">
          {(caseNotes || []).map((n: any, i: number) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-700 text-sm">{typeof n === 'string' ? n : n.text}</p>
              <p className="text-xs text-gray-400 mt-1">
                {n.date ? new Date(n.date).toLocaleString('de-DE') : ''}
              </p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Neue Notiz hinzufügen…"
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1a5f9c] outline-none min-h-[44px]"
            onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
          />
          <button
            onClick={handleAddNote}
            disabled={!note.trim()}
            className="px-4 py-2 bg-[#1a5f9c] text-white rounded-lg disabled:opacity-50 min-h-[44px]"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
