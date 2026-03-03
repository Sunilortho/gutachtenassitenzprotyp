# Gutachten Assistent - Vollständiges Medizinisches Gutachten-System

## 🚀 Features

### ✅ Benutzerauthentifizierung
- **Registrierung** mit Name, E-Mail, Telefon, Praxis/Organisation
- **Login** mit E-Mail und Passwort
- **Demo-Modus** - funktioniert auch ohne Registrierung

### ✅ Fallverwaltung (Dashboard)
- Übersicht aller Gutachten-Fälle
- Statistiken (neu, in Bearbeitung, abgeschlossen)
- Suche und Filterung nach Status
- Fall-Erstellung mit Patientenname, Typ, Versicherer

### ✅ Dokumentenmanagement
- **PDF-Upload** mit Drag & Drop
- Automatische Dokumenten-Klassifizierung
- Checkliste für erforderliche Dokumente
- Dokumentenliste mit Status

### ✅ KI-Analyse (OpenRouter)
- Automatische Analyse hochgeladener Dokumente
- Patienteninfo Extraktion
- Zusammenfassung und Empfehlungen
- Konfidenz-Score

### ✅ Problemerkennung (Issues)
- Automatisch erkannte Probleme aus der KI-Analyse
- Auswahl mehrerer Issues
- **E-Mail-Generierung** aus ausgewählten Problemen

### ✅ E-Mail Vorlagen
- 3 integrierte E-Mail-Vorlagen:
  1. Anforderung weiterer Unterlagen
  2. Einladung zur Untersuchung
  3. Gutachten fertig
- **E-Mail-Editor** mit Vorschau
- **Kopieren** oder **per E-Mail senden** (mailto:)

### ✅ Gutachten-Erstellung
- Automatische Berichterstellung mit KI
- Professionelles Gutachten-Format
- **Download** als Markdown
- **Drucken**-Funktion

### ✅ Notizen
- Fallbezogene Notizen hinzufügen
- Persistente Speicherung

---

## 📦 Setup

### 1. Dependencies installieren
```bash
npm install
```

### 2. OpenRouter API Key hinzufügen
Erstelle eine `.env` Datei:
```env
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
```

**OpenRouter Key erhalten:** https://openrouter.ai/

### 3. Development starten
```bash
npm run dev
```

### 4. Build für Produktion
```bash
npm run build
```

---

## 🌐 Vercel Deployment

1. Importiere das Repo auf https://vercel.com
2. Füge Environment Variable hinzu:
   - **Name:** `VITE_OPENROUTER_API_KEY`
   - **Value:** dein OpenRouter API Key
3. Deploy!

---

## 📝 API-Free Modus

Ohne API Key funktioniert die App im **Demo-Modus** mit simulierten Daten.
