# Gutachten Assistent - Voll funktionsfähige Version

## Setup

1. **Dependencies installieren:**
```bash
npm install
```

2. **Deep Seek API Key hinzufügen:**
Erstelle eine `.env` Datei im Root-Verzeichnis:
```env
VITE_DEEP_SEEK_API_KEY=your_deep_seek_api_key_here
```

3. **Entwicklung starten:**
```bash
npm run dev
```

4. **Build für Produktion:**
```bash
npm run build
```

## Deep Seek API Key erhalten

1. Gehe zu https://platform.deepseek.com/
2. Erstelle einen Account
3. Generiere einen API Key
4. Füge ihn in der .env Datei hinzu

## Funktionen

✅ **Benutzerauthentifizierung** - Login-System mit localStorage
✅ **Fallverwaltung** - CRUD-Operationen für Gutachten-Fälle
✅ **Dokumenten-Upload** - Drag & Drop Upload
✅ **KI-Analyse** - Deep Seek AI analysiert medizinische Dokumente
✅ **Gutachten-Erstellung** - Automatische Berichterstellung
✅ **Notizen** - Fallnotizen hinzufügen
✅ **Export** - Gutachten als Markdown herunterladen
✅ **Datenpersistenz** - Alles wird in localStorage gespeichert

## Demo

Ohne API Key funktioniert die App im Demo-Modus mit simulierten Daten.
