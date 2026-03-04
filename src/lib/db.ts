// LocalStorage-based database for persistence

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
}

export interface Document {
  id: string;
  caseId: string;
  name: string;
  type: string;
  uploadedAt: string;
  analysis?: any;
  text?: string;
}

// Initialize with demo data if empty
export function initializeDemoData() {
  const existingCases = localStorage.getItem(STORAGE_KEYS.CASES);
  
  // Migrate old data if needed
  if (existingCases) {
    try {
      const cases = JSON.parse(existingCases);
      const migrated = cases.map((c: any) => ({
        ...c,
        tasks: Array.isArray(c.tasks) ? c.tasks : [],
        notes: Array.isArray(c.notes) ? c.notes.map((n: any) => typeof n === 'string' ? { text: n, date: new Date().toISOString() } : n) : []
      }));
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(migrated));
    } catch (e) {
      console.error('Migration failed', e);
    }
  }
  
  if (!existingCases) {
    const demoCases: Case[] = [
      {
        id: 'SCHM-2024-001',
        patient: 'Hans Müller',
        type: 'Schmerztherapie',
        insurer: 'AOK',
        status: 'completed',
        created: '2024-01-10',
        lastActivity: '2024-01-15',
        documents: 3,
        tasks: [{ id: 1, title: 'Dokument prüfen', status: 'completed', priority: 'high', createdAt: '2024-01-10' }],
        notes: [{ text: 'Patient zeigt gute Besserung', date: '2024-01-15' }],
        report: '# Gutachten\n\nPatient wurde untersucht...'
      },
      {
        id: 'SCHM-2024-002',
        patient: 'Maria Fischer',
        type: 'Schmerztherapie',
        insurer: 'TK',
        status: 'analysis',
        created: '2024-01-12',
        lastActivity: '2024-01-14',
        documents: 2,
        tasks: [],
        notes: []
      },
      {
        id: 'REHA-2024-001',
        patient: 'Klaus Weber',
        type: 'Rehabilitation',
        insurer: 'Barmer',
        status: 'documents',
        created: '2024-01-13',
        lastActivity: '2024-01-14',
        documents: 1,
        tasks: [],
        notes: []
      }
    ];
    
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(demoCases));
    
    // Demo user
    const demoUser: User = {
      id: 'user-1',
      email: 'doctor@demo.de',
      name: 'Dr. Demo',
      role: 'doctor',
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([demoUser]));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(demoUser));
  }
}

// Cases
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

// Documents
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

// User
export function getCurrentUser(): User | null {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
}

export function login(email: string, name?: string): User | null {
  // Demo login - accept any credentials
  const users: User[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  let user = users.find(u => u.email === email);
  
  if (!user) {
    user = {
      id: `user-${Date.now()}`,
      email,
      name: name || email.split('@')[0],
      role: 'doctor',
      createdAt: new Date().toISOString()
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

// Settings
export function getSettings(): any {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return data ? JSON.parse(data) : {
    language: 'de',
    theme: 'light'
  };
}

export function saveSettings(settings: any): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

// Generate unique ID
export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
}
