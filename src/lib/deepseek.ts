// Deep Seek AI integration
const DEEP_SEEK_API_KEY = import.meta.env.VITE_DEEP_SEEK_API_KEY || '';
const DEEP_SEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export interface AnalysisResult {
  patientInfo: {
    name: string;
    age: string;
    diagnosis: string;
  };
  summary: string;
  recommendations: string[];
  issues: string[];
  confidence: number;
}

export async function analyzeDocument(
  documentText: string, 
  documentType: string
): Promise<AnalysisResult> {
  if (!DEEP_SEEK_API_KEY) {
    // Return mock data if no API key
    return getMockAnalysis(documentType);
  }

  const prompt = `Du bist ein medizinischer Gutachter-Assistent. Analysiere das folgende Dokument und Extrahiere relevante Informationen für ein medizinisches Gutachten.

Dokumenttyp: ${documentType}

Dokumentinhalt:
${documentText}

Antworte im folgenden JSON-Format:
{
  "patientInfo": {
    "name": "Patientenname",
    "age": "Alter",
    "diagnosis": "Hauptdiagnose"
  },
  "summary": "Zusammenfassung des Dokuments in 2-3 Sätzen",
  "recommendations": ["Empfehlung 1", "Empfehlung 2", "Empfehlung 3"],
  "issues": ["Problem 1", "Problem 2"],
  "confidence": 0.85
}`;

  try {
    const response = await fetch(DEEP_SEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEP_SEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Du bist ein erfahrener medizinischer Gutachter. Antworte immer im geforderten JSON-Format.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return getMockAnalysis(documentType);
  } catch (error) {
    console.error('Deep Seek API error:', error);
    return getMockAnalysis(documentType);
  }
}

function getMockAnalysis(documentType: string): AnalysisResult {
  const mockData: Record<string, AnalysisResult> = {
    default: {
      patientInfo: {
        name: 'Max Mustermann',
        age: '45 Jahre',
        diagnosis: 'Chronische Rückenschmerzen'
      },
      summary: 'Der Patient stellt sich mit chronischen Rückenschmerzen vor. Die klinische Untersuchung zeigt degenerative Veränderungen der Lendenwirbelsäule. MRTbefunde bestätigen Bandscheibenvorwölbungen.',
      recommendations: [
        'Physiotherapie empfohlen (2x wöchentlich für 6 Wochen)',
        'Schmerzmedikation: Ibuprofen 600mg bei Bedarf',
        'Bewegungsoptimierung und Ergonomie am Arbeitsplatz',
        'Kontroll-MRT in 3 Monaten'
      ],
      issues: [
        'Medikation sollte überprüft werden',
        'Arbeitsunfähigkeitsbescheinigung erforderlich'
      ],
      confidence: 0.87
    }
  };
  return mockData.default;
}

export async function generateReport(
  caseData: any,
  documents: any[]
): Promise<string> {
  if (!DEEP_SEEK_API_KEY) {
    return getMockReport(caseData);
  }

  const prompt = `Erstelle ein medizinisches Gutachten für folgenden Fall:

Patient: ${caseData.patient}
Fall-ID: ${caseData.id}
Typ: ${caseData.type}
Versicherer: ${caseData.insurer}

Dokumente: ${documents.map(d => d.name).join(', ')}

Erstelle ein professionelles Gutachten mit:
1. Einleitung und Auftragsbeschreibung
2. Befunde
3. Beurteilung
4. Zusammenfassung und Empfehlungen

Antworte auf Deutsch.`;

  try {
    const response = await fetch(DEEP_SEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEP_SEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Du bist ein erfahrener medizinischer Gutachter. Erstelle professionelle medizinische Gutachten auf Deutsch.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 3000
      })
    });

    const data = await response.json();
    return data.choices[0]?.message?.content || getMockReport(caseData);
  } catch (error) {
    console.error('Report generation error:', error);
    return getMockReport(caseData);
  }
}

function getMockReport(caseData: any): string {
  return `
# Medizinisches Gutachten

## 1. Einleitung
Auftraggeber: ${caseData.insurer || 'Versicherung'}
Auftragsdatum: ${new Date().toLocaleDateString('de-DE')}
Gutachten-ID: ${caseData.id}

## 2. Befunde
Der Patient wurde klinisch untersucht. Die Diagnose lautet: Chronische Schmerzsymptomatik.

## 3. Beurteilung
Nach Auswertung der vorliegenden Unterlagen und klinischer Untersuchung bestehen folgende Einschätzungen:
- Die vorliegende Erkrankung ist behandlungsbedürftig
- Arbeitsunfähigkeit besteht derzeit für ${caseData.type === 'Rehabilitation' ? '4 Wochen' : '2 Wochen'}
- Prognose: voraussichtlich vollständige Genesung

## 4. Zusammenfassung und Empfehlungen
- Fortführung der Schmerztherapie
- Physiotherapie wird empfohlen
- Kontrolluntersuchung in 4 Wochen
- Arbeitsplatzadaptierung erforderlich

---
Gutachter: Dr. med. Assistent
Datum: ${new Date().toLocaleDateString('de-DE')}
`;
}
