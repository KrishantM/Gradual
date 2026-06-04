import { NextRequest, NextResponse } from 'next/server';

// Server-side runtime — pdf-parse and mammoth need Node APIs.
export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const DOC_MIME = 'application/msword';

function detectKind(file: File): 'pdf' | 'docx' | 'unknown' {
  const name = (file.name || '').toLowerCase();
  if (file.type === PDF_MIME || name.endsWith('.pdf')) return 'pdf';
  if (file.type === DOCX_MIME || name.endsWith('.docx')) return 'docx';
  return 'unknown';
}

function cleanText(raw: string): string {
  return raw
    .replace(/\u0000/g, '')
    .replace(/[\u00A0\u2007\u202F]/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'File exceeds 10MB limit.' }, { status: 400 });
    }

    if (file.type === DOC_MIME) {
      return NextResponse.json(
        { error: 'Legacy .doc files are not supported. Please save as .docx or PDF and try again.' },
        { status: 400 }
      );
    }

    const kind = detectKind(file);
    if (kind === 'unknown') {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF or DOCX file.' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';

    if (kind === 'pdf') {
      // Import the inner module directly — pdf-parse's index.js tries to read a
      // bundled test PDF at load time, which throws ENOENT in Next.js builds.
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
      const result = await pdfParse(buffer);
      text = result.text || '';
    } else {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      text = result.value || '';
    }

    text = cleanText(text);

    if (!text) {
      return NextResponse.json(
        { error: 'Could not extract any readable text. The file may be image-based or password-protected.' },
        { status: 422 }
      );
    }

    const wordCount = text.split(/\s+/).filter(Boolean).length;

    return NextResponse.json({
      text,
      wordCount,
      fileName: file.name,
      kind,
    });
  } catch (err) {
    console.error('[extract-pdf] failed:', err);
    return NextResponse.json(
      { error: 'Failed to extract text from the uploaded file.' },
      { status: 500 }
    );
  }
}
