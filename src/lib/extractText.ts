/**
 * extractText.ts
 * Real document text extraction for PDF (pdfjs-dist) and DOCX (mammoth.js).
 * Also detects password-protected and image-only (scanned) PDFs.
 */

// ─── PDF Extraction ────────────────────────────────────────────────────────────

export interface ExtractionResult {
  text: string;
  pageCount?: number;
  warning?: string;
  error?: string;
  isPasswordProtected?: boolean;
  isScannedImage?: boolean;
}

/**
 * Extract text from a PDF file using pdfjs-dist.
 * Detects password-protected PDFs and image-only (scanned) PDFs.
 */
export async function extractPdfText(file: File): Promise<ExtractionResult> {
  try {
    // Dynamically import pdfjs-dist to avoid SSR issues
    const pdfjsLib = await import('pdfjs-dist');

    // Set the worker source — use the bundled legacy worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.mjs',
      import.meta.url
    ).toString();

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    let pdf;
    try {
      pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
    } catch (err: any) {
      // Check for password-protected PDF
      if (err?.name === 'PasswordException' || err?.message?.includes('password')) {
        return {
          text: '',
          isPasswordProtected: true,
          error: 'Dieses PDF ist passwortgeschützt und kann nicht automatisch ausgelesen werden. Bitte entsperren Sie das Dokument und laden Sie es erneut hoch.',
        };
      }
      throw err;
    }

    const pageCount = pdf.numPages;
    const textParts: string[] = [];
    let totalChars = 0;

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (pageText) {
        textParts.push(`[Seite ${pageNum}]\n${pageText}`);
        totalChars += pageText.length;
      }
    }

    const fullText = textParts.join('\n\n');

    // Heuristic: if a PDF has pages but almost no text, it's likely a scanned image PDF
    const avgCharsPerPage = pageCount > 0 ? totalChars / pageCount : 0;
    if (pageCount > 0 && avgCharsPerPage < 30) {
      return {
        text: fullText || `[Gescanntes Bild-PDF: ${file.name}]`,
        pageCount,
        isScannedImage: true,
        warning:
          'Dieses PDF scheint ein gescanntes Bild zu sein (kein maschinenlesbarer Text erkannt). ' +
          'Für eine KI-Analyse wird OCR benötigt. Die Analyse kann unvollständig sein.',
      };
    }

    return {
      text: fullText,
      pageCount,
    };
  } catch (err: any) {
    console.error('[extractPdfText] Error:', err);
    return {
      text: '',
      error: `PDF konnte nicht gelesen werden: ${err?.message || 'Unbekannter Fehler'}`,
    };
  }
}

// ─── DOCX Extraction ───────────────────────────────────────────────────────────

/**
 * Extract text from a .docx file using mammoth.js.
 */
export async function extractDocxText(file: File): Promise<ExtractionResult> {
  try {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });

    const text = result.value?.trim() || '';
    const warnings = result.messages?.filter((m: any) => m.type === 'warning') || [];

    return {
      text,
      warning: warnings.length > 0 ? `Hinweise beim Lesen: ${warnings.map((w: any) => w.message).join('; ')}` : undefined,
    };
  } catch (err: any) {
    console.error('[extractDocxText] Error:', err);
    return {
      text: '',
      error: `DOCX konnte nicht gelesen werden: ${err?.message || 'Unbekannter Fehler'}`,
    };
  }
}

// ─── Main Dispatcher ───────────────────────────────────────────────────────────

/**
 * Extract text from any supported file type.
 * Supported: .pdf, .docx, .doc, .txt and other text-based formats.
 */
export async function extractFileText(file: File): Promise<ExtractionResult> {
  const name = file.name.toLowerCase();
  const type = file.type;

  // PDF
  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    return extractPdfText(file);
  }

  // DOCX
  if (
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  ) {
    return extractDocxText(file);
  }

  // Plain text / fallback
  try {
    const text = await file.text();
    return { text };
  } catch (err: any) {
    return {
      text: '',
      error: `Datei konnte nicht gelesen werden: ${err?.message || 'Unbekannter Fehler'}`,
    };
  }
}
