/**
 * classifyDocument.ts
 * Content-based document classification for German medical documents.
 * Falls back to filename-based classification if content is unavailable.
 * Includes orthopedic-specific document types.
 */

export type DocumentType =
  | 'Befundbericht'
  | 'Arztbrief'
  | 'Operationsbericht'
  | 'Reha-Bericht'
  | 'Therapiebericht'
  | 'Diagnoseliste'
  | 'Medikationsplan'
  | 'Bildgebung'
  | 'Röntgenbefund'
  | 'Beweglichkeitsmessung'
  | 'Wirbelsäulenstatus'
  | 'Laborbefunde'
  | 'Einwilligung'
  | 'Physiotherapie-Verlauf'
  | 'Sonstiges';

interface ClassificationRule {
  type: DocumentType;
  // Keywords to match in filename (lowercase)
  filenameKeywords: string[];
  // Keywords to match in content (lowercase)
  contentKeywords: string[];
  // Minimum number of content keywords that must match
  contentThreshold: number;
}

const CLASSIFICATION_RULES: ClassificationRule[] = [
  {
    type: 'Operationsbericht',
    filenameKeywords: ['op', 'operation', 'operationsbericht', 'op-bericht', 'chirurgie'],
    contentKeywords: ['operationsbericht', 'operateur', 'schnitt', 'naht', 'anästhesie', 'intraoperativ', 'op-protokoll', 'präparation', 'blutstillung'],
    contentThreshold: 2,
  },
  {
    type: 'Reha-Bericht',
    filenameKeywords: ['reha', 'rehabilitation', 'reha-bericht', 'entlassung'],
    contentKeywords: ['rehabilitation', 'reha-maßnahme', 'entlassungsbericht', 'reha-klinik', 'belastbarkeit', 'wiedereingliederung', 'reha-ziel'],
    contentThreshold: 2,
  },
  {
    type: 'Arztbrief',
    filenameKeywords: ['arztbrief', 'arzt-brief', 'konsil', 'überweisung', 'einweisung'],
    contentKeywords: ['sehr geehrte', 'kollegin', 'kollege', 'arztbrief', 'überweisung', 'konsiliarbericht', 'mit freundlichen grüßen'],
    contentThreshold: 2,
  },
  {
    type: 'Röntgenbefund',
    filenameKeywords: ['röntgen', 'roentgen', 'xray', 'x-ray', 'radiologie', 'radiologisch'],
    contentKeywords: ['röntgenbefund', 'röntgenaufnahme', 'radiologisch', 'knochenstruktur', 'fraktur', 'osteoporose', 'knochendichte', 'skelett'],
    contentThreshold: 2,
  },
  {
    type: 'Beweglichkeitsmessung',
    filenameKeywords: ['rom', 'beweglich', 'neutral-null', 'bewegungsausmaß', 'gelenkbeweglichkeit'],
    contentKeywords: ['neutral-null', 'bewegungsausmaß', 'flexion', 'extension', 'abduktion', 'adduktion', 'rotation', 'beweglichkeit', 'gelenkfunktion', 'grad'],
    contentThreshold: 3,
  },
  {
    type: 'Wirbelsäulenstatus',
    filenameKeywords: ['wirbelsäule', 'ws', 'hws', 'lws', 'bws', 'spine'],
    contentKeywords: ['wirbelsäule', 'lendenwirbel', 'halswirbel', 'brustwirbel', 'bandscheibe', 'stenose', 'spondylose', 'skoliose', 'kyphose', 'lordose'],
    contentThreshold: 2,
  },
  {
    type: 'Physiotherapie-Verlauf',
    filenameKeywords: ['physio', 'physiotherapie', 'krankengymnastik', 'kg', 'verlauf'],
    contentKeywords: ['physiotherapie', 'krankengymnastik', 'übungstherapie', 'mobilisation', 'behandlungseinheit', 'therapieverlauf', 'übungsprogramm'],
    contentThreshold: 2,
  },
  {
    type: 'Bildgebung',
    filenameKeywords: ['mrt', 'ct', 'bild', 'scan', 'sonographie', 'ultraschall', 'szintigraphie'],
    contentKeywords: ['mrt', 'kernspintomographie', 'computertomographie', 'ct-befund', 'sonographie', 'bildgebung', 'befund der bildgebung'],
    contentThreshold: 2,
  },
  {
    type: 'Therapiebericht',
    filenameKeywords: ['therapie', 'treatment', 'behandlung', 'verlauf'],
    contentKeywords: ['therapiebericht', 'behandlungsverlauf', 'therapie', 'behandlung', 'medikamentöse therapie', 'konservative therapie'],
    contentThreshold: 2,
  },
  {
    type: 'Befundbericht',
    filenameKeywords: ['befund', 'bericht', 'arzt', 'klinisch'],
    contentKeywords: ['befundbericht', 'klinische untersuchung', 'anamnese', 'diagnose', 'befund', 'untersuchungsbefund'],
    contentThreshold: 2,
  },
  {
    type: 'Diagnoseliste',
    filenameKeywords: ['diagnos', 'icd', 'diagnose'],
    contentKeywords: ['diagnose', 'icd-10', 'hauptdiagnose', 'nebendiagnose', 'diagnosen', 'icd'],
    contentThreshold: 2,
  },
  {
    type: 'Medikationsplan',
    filenameKeywords: ['medik', 'rezept', 'medication', 'medikament', 'arzneimittel'],
    contentKeywords: ['medikationsplan', 'arzneimittel', 'dosierung', 'wirkstoff', 'tablette', 'mg', 'einnahme'],
    contentThreshold: 3,
  },
  {
    type: 'Laborbefunde',
    filenameKeywords: ['labor', 'blut', 'lab', 'serum', 'urin'],
    contentKeywords: ['laborwerte', 'blutbild', 'serologie', 'hämoglobin', 'leukozyten', 'crp', 'bsr', 'laborergebnis'],
    contentThreshold: 2,
  },
  {
    type: 'Einwilligung',
    filenameKeywords: ['einwill', 'consent', 'datenschutz', 'einverständnis'],
    contentKeywords: ['einwilligung', 'einverständnis', 'datenschutz', 'ich erkläre mich einverstanden', 'aufklärung'],
    contentThreshold: 2,
  },
];

/**
 * Classify a document based on its filename and optionally its text content.
 * Content-based classification takes priority over filename-based.
 */
export function classifyDocument(filename: string, content?: string): DocumentType {
  const lowerName = filename.toLowerCase();
  const lowerContent = content ? content.toLowerCase() : '';

  // Content-based classification (higher priority)
  if (lowerContent.length > 50) {
    for (const rule of CLASSIFICATION_RULES) {
      const matchCount = rule.contentKeywords.filter(kw => lowerContent.includes(kw)).length;
      if (matchCount >= rule.contentThreshold) {
        return rule.type;
      }
    }
  }

  // Filename-based fallback
  for (const rule of CLASSIFICATION_RULES) {
    if (rule.filenameKeywords.some(kw => lowerName.includes(kw))) {
      return rule.type;
    }
  }

  return 'Sonstiges';
}

/**
 * All document types available in the system.
 */
export const ALL_DOCUMENT_TYPES: DocumentType[] = [
  'Befundbericht',
  'Arztbrief',
  'Operationsbericht',
  'Reha-Bericht',
  'Therapiebericht',
  'Diagnoseliste',
  'Medikationsplan',
  'Bildgebung',
  'Röntgenbefund',
  'Beweglichkeitsmessung',
  'Wirbelsäulenstatus',
  'Laborbefunde',
  'Einwilligung',
  'Physiotherapie-Verlauf',
  'Sonstiges',
];
