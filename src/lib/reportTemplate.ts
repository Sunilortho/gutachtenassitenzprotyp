/**
 * reportTemplate.ts
 * Generates a printable HTML report with proper German medical Gutachten structure.
 * Includes: Arzt header, Patient block, date, signature line.
 */

import type { GutachtenType } from './deepseek';

interface ReportTemplateOptions {
  caseData: any;
  reportMarkdown: string;
  gutachtenType: GutachtenType;
  doctorName?: string;
  practiceAddress?: string;
}

/**
 * Convert simple markdown to HTML (headings, bold, lists, horizontal rules).
 */
function markdownToHtml(md: string): string {
  return md
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul]|<\/[hul]|<hr|<p|<\/p)(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');
}

/**
 * Generate a printable HTML document for the Gutachten report.
 */
export function generatePrintableReport(options: ReportTemplateOptions): string {
  const { caseData, reportMarkdown, gutachtenType, doctorName, practiceAddress } = options;
  const today = new Date().toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const doctor = doctorName || 'Dr. med. [Name einsetzen]';
  const address = practiceAddress || 'Praxisadresse München';
  const reportHtml = markdownToHtml(reportMarkdown);

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Gutachten – ${caseData.patient} – ${caseData.id}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a1a;
      background: #fff;
      padding: 0;
    }
    .page {
      max-width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 20mm 25mm 20mm 25mm;
    }
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #1a3a6b;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .header-left h2 {
      font-size: 14pt;
      color: #1a3a6b;
      font-weight: bold;
    }
    .header-left p {
      font-size: 9pt;
      color: #555;
      margin-top: 2px;
    }
    .header-right {
      text-align: right;
      font-size: 9pt;
      color: #555;
    }
    .header-right .badge {
      display: inline-block;
      background: #1a3a6b;
      color: white;
      padding: 3px 10px;
      border-radius: 3px;
      font-size: 8pt;
      font-weight: bold;
      margin-bottom: 4px;
    }
    /* Patient block */
    .patient-block {
      background: #f4f7fb;
      border-left: 4px solid #1a3a6b;
      padding: 10px 16px;
      margin-bottom: 20px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 20px;
      font-size: 10pt;
    }
    .patient-block .label {
      color: #555;
      font-size: 9pt;
    }
    .patient-block .value {
      font-weight: bold;
      color: #1a1a1a;
    }
    /* Report content */
    .report-content h1 {
      font-size: 15pt;
      color: #1a3a6b;
      border-bottom: 1px solid #1a3a6b;
      padding-bottom: 6px;
      margin: 20px 0 12px 0;
    }
    .report-content h2 {
      font-size: 12pt;
      color: #1a3a6b;
      margin: 18px 0 8px 0;
      font-weight: bold;
    }
    .report-content h3 {
      font-size: 11pt;
      color: #333;
      margin: 14px 0 6px 0;
    }
    .report-content p {
      margin: 6px 0;
    }
    .report-content ul {
      margin: 6px 0 6px 20px;
    }
    .report-content li {
      margin: 3px 0;
    }
    .report-content hr {
      border: none;
      border-top: 1px solid #ccc;
      margin: 16px 0;
    }
    .report-content strong {
      font-weight: bold;
    }
    .report-content em {
      font-style: italic;
      color: #666;
    }
    /* Signature block */
    .signature-block {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .signature-line {
      border-top: 1px solid #333;
      padding-top: 6px;
      font-size: 9pt;
      color: #555;
      margin-top: 40px;
    }
    /* Footer */
    .footer {
      margin-top: 30px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      font-size: 8pt;
      color: #888;
      text-align: center;
    }
    /* GDPR notice */
    .gdpr-notice {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 8px 12px;
      font-size: 8pt;
      color: #856404;
      margin-bottom: 16px;
      border-radius: 4px;
    }
    @media print {
      .gdpr-notice { display: none; }
      body { padding: 0; }
      .page { padding: 15mm 20mm; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- GDPR notice (hidden on print) -->
    <div class="gdpr-notice">
      ⚠️ Demo-Modus: Bitte keine echten Patientendaten verwenden. Dieses Dokument enthält Musterdaten.
    </div>

    <!-- Header: Arzt / Praxis -->
    <div class="header">
      <div class="header-left">
        <h2>${doctor}</h2>
        <p>Facharzt für Orthopädie und Unfallchirurgie</p>
        <p>${address}</p>
      </div>
      <div class="header-right">
        <div class="badge">${gutachtenType}-Gutachten</div>
        <p>Datum: ${today}</p>
        <p>Gutachten-ID: ${caseData.id}</p>
      </div>
    </div>

    <!-- Patient block -->
    <div class="patient-block">
      <div>
        <div class="label">Patient</div>
        <div class="value">${caseData.patient}</div>
      </div>
      <div>
        <div class="label">Auftraggeber / Versicherer</div>
        <div class="value">${caseData.insurer || '—'}</div>
      </div>
      <div>
        <div class="label">Gutachtentyp</div>
        <div class="value">${gutachtenType}-Gutachten</div>
      </div>
      <div>
        <div class="label">Erstellungsdatum</div>
        <div class="value">${today}</div>
      </div>
    </div>

    <!-- Report content -->
    <div class="report-content">
      ${reportHtml}
    </div>

    <!-- Signature block -->
    <div class="signature-block">
      <div>
        <div class="signature-line">
          Ort, Datum: München, ${today}
        </div>
      </div>
      <div>
        <div class="signature-line">
          Unterschrift / Stempel: ${doctor}
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      Gutachten Assistent · ${doctor} · ${address} · Erstellt am ${today}
    </div>
  </div>
</body>
</html>`;
}
