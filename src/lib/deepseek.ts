/**
 * deepseek.ts
 * OpenRouter AI integration — DeepSeek model.
 * Orthopedic specialty-aware prompts, confidence thresholds, structured Gutachten generation.
 *
 * API key is read from VITE_OPENROUTER_API_KEY environment variable.
 * If missing, mock data is returned (demo mode).
 */

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AnalysisResult {
  patientInfo: {
    name: string;
    age: string;
    diagnosis: string;
    icdCodes?: string[];
  };
  summary: string;
  recommendations: string[];
  issues: string[];
  orthopedicFindings?: {
    romImpairments?: string[];
    imagingFindings?: string[];
    causalityAssessment?: string;
    mdeRelevance?: string;
  };
  flags?: string[];
  confidence: number;
}

export type GutachtenType = 'Renten' | 'BU' | 'Haftpflicht' | 'Sozialmedizin';

// ─── System Prompt ─────────────────────────────────────────────────────────────

const ORTHO_SYSTEM_PROMPT = `Du bist ein erfahrener Facharzt für Orthopädie und medizinischer Gutachter in Deutschland.
Fachgebiet: Orthopädie und Unfallchirurgie
Kontext: Niedergelassene Gutachterpraxis München — Erstellung von Gutachten für Versicherungen und Gerichte.

Deine Expertise umfasst:
- Beweglichkeitseinschränkungen (ROM-Beurteilung nach Neutral-Null-Methode)
- ICD-10 Codes im orthopädischen Bereich (M-Codes: Erkrankungen des Muskel-Skelett-Systems)
- Kausalitätsbeurteilung zwischen Trauma und klinischem Befund
- Minderung der Erwerbsfähigkeit (MdE) nach SGB VII und BU-Versicherungsbedingungen
- Gutachtenrelevante Aspekte gemäß §§ SGB VII / BU-Versicherung / Haftpflicht
- Erkennung von Inkonsistenzen zwischen Diagnose, Bildgebung und Medikation

Antworte IMMER auf Deutsch. Antworte IMMER im geforderten JSON-Format.`;

// ─── Document Analysis ─────────────────────────────────────────────────────────

export async function analyzeDocument(
  documentText: string,
  documentType: string
): Promise<AnalysisResult> {
  if (!OPENROUTER_API_KEY) {
    return getMockAnalysis(documentType);
  }

  const prompt = `Analysiere das folgende medizinische Dokument für ein orthopädisches Gutachten.

Dokumenttyp: ${documentType}

Dokumentinhalt:
${documentText.substring(0, 4000)}

Antworte im folgenden JSON-Format (alle Felder auf Deutsch):
{
  "patientInfo": {
    "name": "Patientenname oder 'Nicht angegeben'",
    "age": "Alter oder 'Nicht angegeben'",
    "diagnosis": "Hauptdiagnose",
    "icdCodes": ["M54.4", "M51.1"]
  },
  "summary": "Klinisch relevante Zusammenfassung in 2-3 Sätzen für Gutachtenzwecke",
  "recommendations": [
    "Konkrete Empfehlung 1 (z.B. weitere Bildgebung, Untersuchung)",
    "Empfehlung 2"
  ],
  "issues": [
    "Erkanntes Problem oder Inkonsistenz 1",
    "Problem 2"
  ],
  "orthopedicFindings": {
    "romImpairments": ["Einschränkung 1 (z.B. LWS-Flexion auf 60° reduziert)", "Einschränkung 2"],
    "imagingFindings": ["Bildgebungsbefund 1", "Bildgebungsbefund 2"],
    "causalityAssessment": "Beurteilung der Kausalität zwischen Trauma und Befund (falls relevant)",
    "mdeRelevance": "MdE-Relevanz: Einschätzung der Minderung der Erwerbsfähigkeit (falls beurteilbar)"
  },
  "flags": [
    "WARNUNG: Fehlende MRT trotz klinischer Beschwerden",
    "HINWEIS: ICD-10 Code nicht angegeben"
  ],
  "confidence": 0.85
}

Wichtige Prüfpunkte:
- Sind ICD-10 Codes (M-Codes) angegeben?
- Gibt es Widersprüche zwischen Diagnose und Medikation?
- Fehlt Bildgebung trotz klinischer Beschwerden?
- Ist die Kausalität zwischen Trauma und Befund nachvollziehbar?
- Gibt es Lücken im Behandlungsverlauf?`;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Gutachten Assistent'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          { role: 'system', content: ORTHO_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 2500
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Ensure confidence is a number between 0 and 1
      parsed.confidence = Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5));
      return parsed as AnalysisResult;
    }

    return getMockAnalysis(documentType);
  } catch (error) {
    console.error('[deepseek] analyzeDocument error:', error);
    return getMockAnalysis(documentType);
  }
}

// ─── Gutachten Report Generation ───────────────────────────────────────────────

export async function generateReport(
  caseData: any,
  documents: any[],
  gutachtenType: GutachtenType = 'Renten'
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    return getMockReport(caseData, gutachtenType);
  }

  // Aggregate all document analyses and texts
  const docSummaries = documents
    .map(d => {
      const analysis = d.analysis;
      const preview = (d.text || '').substring(0, 800);
      return `--- ${d.type}: ${d.name} ---\n${preview}${analysis ? `\n[KI-Analyse: ${analysis.summary}]` : ''}`;
    })
    .join('\n\n');

  const prompt = `Erstelle ein professionelles medizinisches Gutachten nach deutschem Standard.

Gutachtentyp: ${gutachtenType}-Gutachten
Patient: ${caseData.patient}
Fall-ID: ${caseData.id}
Auftraggeber/Versicherer: ${caseData.insurer}
Erstellungsdatum: ${new Date().toLocaleDateString('de-DE')}

Vorliegende Unterlagen:
${docSummaries.substring(0, 5000)}

Erstelle das Gutachten EXAKT in folgender Struktur (alle Abschnitte auf Deutsch):

# MEDIZINISCHES GUTACHTEN
## Gutachtentyp: ${gutachtenType}-Gutachten

---

## 1. Anamnese (Vorgeschichte)
[Aus den Unterlagen extrahierte Vorgeschichte des Patienten, chronologisch]

## 2. Aktenbefund / Unterlagensichtung
[Auflistung und Bewertung der vorliegenden Dokumente, Vollständigkeit, Qualität]

## 3. Klinische Untersuchung
[PLATZHALTER — Dieser Abschnitt ist bei der persönlichen Untersuchung auszufüllen]
- Allgemeinzustand:
- Gangbild:
- Wirbelsäule (HWS/BWS/LWS):
- Gelenke:
- Neurologischer Status:
- Neutral-Null-Messung:

## 4. Bildgebende Diagnostik
[Beschreibung der vorliegenden Bildgebungsbefunde: MRT, CT, Röntgen, Sonographie]

## 5. Beurteilung / Zusammenfassung
[Medizinische Beurteilung: Diagnosen mit ICD-10, Kausalität, MdE-Einschätzung falls relevant]

## 6. Beantwortung der Beweisfragen
[Für ${gutachtenType}-Gutachten typische Beweisfragen beantworten]

---
Gutachter: Dr. med. [Name]
Fachgebiet: Orthopädie und Unfallchirurgie
Datum: ${new Date().toLocaleDateString('de-DE')}
Unterschrift: ___________________________`;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Gutachten Assistent'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [
          { role: 'system', content: ORTHO_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    const data = await response.json();
    return data.choices[0]?.message?.content || getMockReport(caseData, gutachtenType);
  } catch (error) {
    console.error('[deepseek] generateReport error:', error);
    return getMockReport(caseData, gutachtenType);
  }
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

function getMockAnalysis(documentType: string): AnalysisResult {
  return {
    patientInfo: {
      name: 'Max Mustermann',
      age: '52 Jahre',
      diagnosis: 'Chronische Lumbalgie bei Bandscheibenprotrusion L4/L5',
      icdCodes: ['M54.4', 'M51.1'],
    },
    summary:
      'Der Patient stellt sich mit chronischen Lumbalgien vor. Die klinische Untersuchung zeigt degenerative Veränderungen der LWS. MRT-Befunde bestätigen Bandscheibenprotrusion L4/L5 mit leichter Neuroforamenstenose.',
    recommendations: [
      'Aktuelle MRT-Aufnahmen (< 6 Monate) anfordern',
      'Neutral-Null-Messung der LWS dokumentieren',
      'Physiotherapie-Verlaufsdokumentation anfordern',
      'Neurologischen Status erheben (Reflexe, Sensibilität)',
    ],
    issues: [
      'Medikation sollte auf Konsistenz mit Diagnose geprüft werden',
      'Behandlungsverlauf für die letzten 12 Monate unvollständig',
    ],
    orthopedicFindings: {
      romImpairments: [
        'LWS-Flexion auf ca. 60° eingeschränkt (Norm: 80–90°)',
        'LWS-Extension auf ca. 15° eingeschränkt (Norm: 30°)',
      ],
      imagingFindings: [
        'Bandscheibenprotrusion L4/L5 mit leichter Neuroforamenstenose',
        'Spondylarthrose L3–S1',
      ],
      causalityAssessment: 'Degenerative Veränderungen — kein eindeutiger Trauma-Kausalzusammenhang erkennbar',
      mdeRelevance: 'MdE ca. 10–20% je nach funktioneller Einschränkung (vorläufige Einschätzung)',
    },
    flags: [
      'HINWEIS: ICD-10 Codes sollten im Befundbericht explizit angegeben werden',
      'HINWEIS: Demo-Modus — keine echten Patientendaten verwenden',
    ],
    confidence: 0.72,
  };
}

function getMockReport(caseData: any, gutachtenType: GutachtenType): string {
  const today = new Date().toLocaleDateString('de-DE');
  return `# MEDIZINISCHES GUTACHTEN
## Gutachtentyp: ${gutachtenType}-Gutachten

---

**Auftraggeber:** ${caseData.insurer || 'Versicherung'}
**Auftragsdatum:** ${today}
**Gutachten-ID:** ${caseData.id}
**Patient:** ${caseData.patient}

---

## 1. Anamnese (Vorgeschichte)

Der Patient wurde zur gutachterlichen Untersuchung vorgestellt. Aus den vorliegenden Unterlagen ergibt sich folgende Vorgeschichte: Chronische Beschwerden im Bereich der Wirbelsäule mit progredienter Symptomatik. Bisherige konservative Therapiemaßnahmen wurden durchgeführt.

## 2. Aktenbefund / Unterlagensichtung

Folgende Unterlagen wurden gesichtet und bewertet:
- Vorliegende Befundberichte wurden geprüft
- Bildgebende Diagnostik wurde ausgewertet
- Therapieberichte wurden berücksichtigt

**Vollständigkeit:** Die Unterlagen sind für eine abschließende Beurteilung ${caseData.status === 'completed' ? 'ausreichend' : 'noch nicht vollständig'}.

## 3. Klinische Untersuchung

*[PLATZHALTER — Dieser Abschnitt ist bei der persönlichen Untersuchung auszufüllen]*

- **Allgemeinzustand:** 
- **Gangbild:** 
- **Wirbelsäule (HWS/BWS/LWS):** 
- **Gelenke:** 
- **Neurologischer Status:** 
- **Neutral-Null-Messung:** 

## 4. Bildgebende Diagnostik

Vorliegende Bildgebungsbefunde wurden ausgewertet. Degenerative Veränderungen wurden dokumentiert. Aktuelle Aufnahmen (< 12 Monate) sind für eine abschließende Beurteilung erforderlich.

## 5. Beurteilung / Zusammenfassung

Nach Auswertung der vorliegenden Unterlagen und unter Vorbehalt der noch ausstehenden klinischen Untersuchung ergibt sich folgende Beurteilung:

**Diagnosen (ICD-10):**
- Chronische Beschwerdesymptomatik (vorläufig)

**Kausalität:** Abschließende Kausalitätsbeurteilung nach persönlicher Untersuchung.

**MdE-Einschätzung:** Vorläufige Einschätzung nach Aktenlage — abschließende Beurteilung nach Untersuchung.

## 6. Beantwortung der Beweisfragen

**Für ${gutachtenType}-Gutachten:**

1. *Liegt eine relevante Gesundheitsbeeinträchtigung vor?*
   → Ja, auf Basis der vorliegenden Unterlagen bestehen behandlungsbedürftige Beschwerden.

2. *Ist die Kausalität nachgewiesen?*
   → Abschließende Beurteilung nach klinischer Untersuchung.

3. *Welche Funktionseinschränkungen bestehen?*
   → Funktionseinschränkungen dokumentiert — Ausmaß nach Untersuchung zu präzisieren.

---

**Gutachter:** Dr. med. [Name einsetzen]
**Fachgebiet:** Orthopädie und Unfallchirurgie
**Datum:** ${today}
**Unterschrift:** ___________________________

---
*Hinweis: Dieses Gutachten wurde im Demo-Modus erstellt. Bitte keine echten Patientendaten verwenden.*`;
}
