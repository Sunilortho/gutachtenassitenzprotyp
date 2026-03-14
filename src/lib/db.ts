/**
 * db.ts
 * LocalStorage-based database for persistence.
 * Includes export/import JSON backup ("Sitzung sichern") and data deletion.
 */

const STORAGE_KEYS = {
  CASES: 'gutachten_cases',
  DOCUMENTS: 'gutachten_documents',
  USERS: 'gutachten_users',
  SETTINGS: 'gutachten_settings',
  CURRENT_USER: 'gutachten_current_user'
};

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'doctor' | 'admin';
  createdAt: string;
}

export interface Case {
  id: string;
  patient: string;
  type: string;
  insurer: string;
  status: 'new' | 'documents' | 'analysis' | 'review' | 'completed';
  created: string;
  lastActivity: string;
  documents: number;
  tasks: any[];
  notes: any[];
  report?: string;
  gutachtenType?: string;
}

export interface Document {
  id: string;
  caseId: string;
  name: string;
  type: string;
  uploadedAt: string;
  analysis?: any;
  text?: string;
  size?: number;
  extractionWarning?: string;
  isPasswordProtected?: boolean;
  isScannedImage?: boolean;
}

// ─── Demo Data ─────────────────────────────────────────────────────────────────

export function initializeDemoData() {
  const existingCases = localStorage.getItem(STORAGE_KEYS.CASES);

  // Migrate old data if needed
  if (existingCases) {
    try {
      const cases = JSON.parse(existingCases);
      const migrated = cases.map((c: any) => ({
        ...c,
        tasks: Array.isArray(c.tasks) ? c.tasks : [],
        notes: Array.isArray(c.notes)
          ? c.notes.map((n: any) =>
              typeof n === 'string' ? { text: n, date: new Date().toISOString() } : n
            )
          : [],
      }));
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(migrated));
    } catch (e) {
      console.error('Migration failed', e);
    }
  }

  if (!existingCases) {
    const demoCases: Case[] = [
      {
        id: 'ORTH-2024-001',
        patient: 'Hans Müller',
        type: 'Renten-Gutachten',
        insurer: 'Deutsche Rentenversicherung',
        status: 'completed',
        created: '2024-01-10',
        lastActivity: '2024-01-15',
        documents: 3,
        tasks: [
          {
            id: 1,
            title: 'MRT-Befund anfordern',
            status: 'completed',
            priority: 'high',
            createdAt: '2024-01-10',
          },
        ],
        notes: [{ text: 'Patient zeigt gute Kooperation bei Untersuchung', date: '2024-01-15' }],
        report: '# Gutachten\n\nPatient wurde untersucht...',
        gutachtenType: 'Renten',
      },
      {
        id: 'ORTH-2024-002',
        patient: 'Maria Fischer',
        type: 'BU-Gutachten',
        insurer: 'Allianz Versicherung',
        status: 'analysis',
        created: '2024-01-12',
        lastActivity: '2024-01-14',
        documents: 2,
        tasks: [],
        notes: [],
        gutachtenType: 'BU',
      },
      {
        id: 'ORTH-2024-003',
        patient: 'Klaus Weber',
        type: 'Haftpflicht-Gutachten',
        insurer: 'Barmer GEK',
        status: 'documents',
        created: '2024-01-13',
        lastActivity: '2024-01-14',
        documents: 1,
        tasks: [],
        notes: [],
        gutachtenType: 'Haftpflicht',
      },
    ];

    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(demoCases));

    const demoUser: User = {
      id: 'user-1',
      email: 'doctor@demo.de',
      name: 'Dr. med. Demo',
      role: 'doctor',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([demoUser]));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(demoUser));
  }
}

// ─── Cases ─────────────────────────────────────────────────────────────────────

export function getCases(): Case[] {
  const data = localStorage.getItem(STORAGE_KEYS.CASES);
  return data ? JSON.parse(data) : [];
}

export function saveCase(newCase: Case): void {
  const cases = getCases();
  const existing = cases.findIndex(c => c.id === newCase.id);
  if (existing >= 0) {
    cases[existing] = newCase;
  } else {
    cases.push(newCase);
  }
  localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
}

export function updateCase(id: string, updates: Partial<Case>): void {
  const cases = getCases();
  const index = cases.findIndex(c => c.id === id);
  if (index >= 0) {
    cases[index] = { ...cases[index], ...updates, lastActivity: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
  }
}

export function deleteCase(id: string): void {
  const cases = getCases().filter(c => c.id !== id);
  localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
}

// ─── Documents ─────────────────────────────────────────────────────────────────

export function getDocuments(caseId?: string): Document[] {
  const data = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
  const docs: Document[] = data ? JSON.parse(data) : [];
  if (caseId) {
    return docs.filter(d => d.caseId === caseId);
  }
  return docs;
}

export function saveDocument(doc: Document): void {
  const docs = getDocuments();
  const existing = docs.findIndex(d => d.id === doc.id);
  if (existing >= 0) {
    docs[existing] = doc;
  } else {
    docs.push(doc);
  }
  localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
}

export function deleteDocument(id: string): void {
  const docs = getDocuments().filter(d => d.id !== id);
  localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
}

// ─── User ──────────────────────────────────────────────────────────────────────

export function getCurrentUser(): User | null {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
}

export function login(email: string, name?: string): User | null {
  const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  let user = users.find(u => u.email === email);

  if (!user) {
    user = {
      id: `user-${Date.now()}`,
      email,
      name: name || email.split('@')[0],
      role: 'doctor',
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  return user;
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

// ─── Settings ──────────────────────────────────────────────────────────────────

export function getSettings(): any {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return data
    ? JSON.parse(data)
    : {
        language: 'de',
        theme: 'light',
        doctorName: '',
        practiceAddress: '',
      };
}

export function saveSettings(settings: any): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

// ─── ID Generator ──────────────────────────────────────────────────────────────

export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
}

// ─── Session Export / Import ───────────────────────────────────────────────────

export interface SessionBackup {
  version: number;
  exportedAt: string;
  cases: Case[];
  documents: Document[];
  settings: any;
}

/**
 * Export all cases and documents to a JSON file download.
 * "Sitzung sichern" button.
 */
export function exportSession(): void {
  const backup: SessionBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    cases: getCases(),
    documents: getDocuments(),
    settings: getSettings(),
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `gutachten-sitzung-${dateStr}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import a session backup from a JSON file.
 * Returns a summary of what was imported.
 */
export async function importSession(file: File): Promise<{ cases: number; documents: number }> {
  const text = await file.text();
  const backup: SessionBackup = JSON.parse(text);

  if (!backup.version || !Array.isArray(backup.cases)) {
    throw new Error('Ungültiges Backup-Format');
  }

  // Merge: existing data is preserved, imported data overwrites by ID
  const existingCases = getCases();
  const existingDocs = getDocuments();

  const mergedCases = [...existingCases];
  for (const c of backup.cases) {
    const idx = mergedCases.findIndex(ec => ec.id === c.id);
    if (idx >= 0) {
      mergedCases[idx] = c;
    } else {
      mergedCases.push(c);
    }
  }

  const mergedDocs = [...existingDocs];
  for (const d of backup.documents) {
    const idx = mergedDocs.findIndex(ed => ed.id === d.id);
    if (idx >= 0) {
      mergedDocs[idx] = d;
    } else {
      mergedDocs.push(d);
    }
  }

  localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(mergedCases));
  localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(mergedDocs));
  if (backup.settings) {
    saveSettings(backup.settings);
  }

  return { cases: backup.cases.length, documents: backup.documents.length };
}

/**
 * Delete all application data from localStorage.
 * "Daten löschen" button.
 */
export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
}
