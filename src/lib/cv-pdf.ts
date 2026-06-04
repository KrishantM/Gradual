// Generates an ATS-friendly, text-selectable PDF of a rewritten CV.
// Layout mirrors the on-screen StructuredCVRender component: centred header,
// uppercase accent section titles with a thin underline, role/dates rows,
// and bulleted body text. Falls back to a plain-text rendering if no
// structured CV is available.

import { jsPDF } from 'jspdf';
import type {
  StructuredCV,
  RewriteHeader,
  RewriteExperience,
  RewriteEducation,
  RewriteProject,
} from '@/components/CVRewriteDisplay';

interface GenerateOpts {
  structured?: StructuredCV;
  plainText?: string;
  fileName?: string;
}

const PAGE = { width: 210, height: 297 }; // A4 in mm
const MARGIN = { top: 18, bottom: 18, left: 18, right: 18 };
const CONTENT_WIDTH = PAGE.width - MARGIN.left - MARGIN.right;

const ACCENT: [number, number, number] = [37, 99, 235]; // --accent-blue (#2563eb)
const TEXT: [number, number, number] = [17, 24, 39]; // foreground
const TEXT_SECONDARY: [number, number, number] = [55, 65, 81];
const TEXT_MUTED: [number, number, number] = [107, 114, 128];
const BORDER_SOFT: [number, number, number] = [229, 231, 235];

const SIZES = {
  name: 22,
  title: 12,
  contact: 9,
  sectionHeader: 9.5,
  itemHeader: 11,
  itemSub: 10,
  body: 10,
  meta: 9,
};

const LINE_HEIGHT = 1.35;

class PdfBuilder {
  doc: jsPDF;
  y: number;

  constructor() {
    this.doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    this.doc.setFont('helvetica', 'normal');
    this.y = MARGIN.top;
  }

  private ensureSpace(needed: number) {
    if (this.y + needed > PAGE.height - MARGIN.bottom) {
      this.doc.addPage();
      this.y = MARGIN.top;
    }
  }

  setFont(style: 'normal' | 'bold' | 'italic', size: number) {
    this.doc.setFont('helvetica', style);
    this.doc.setFontSize(size);
  }

  setColor([r, g, b]: [number, number, number]) {
    this.doc.setTextColor(r, g, b);
  }

  setDraw([r, g, b]: [number, number, number]) {
    this.doc.setDrawColor(r, g, b);
  }

  // mm height of one line at the current font size.
  private lineHeight(size: number) {
    return (size * LINE_HEIGHT) / 2.83465;
  }

  writeWrapped(
    text: string,
    opts: {
      x?: number;
      maxWidth?: number;
      align?: 'left' | 'center' | 'right';
      size?: number;
      style?: 'normal' | 'bold' | 'italic';
      color?: [number, number, number];
      gapAfter?: number;
    } = {}
  ) {
    const x = opts.x ?? MARGIN.left;
    const maxWidth = opts.maxWidth ?? CONTENT_WIDTH;
    const size = opts.size ?? SIZES.body;
    const style = opts.style ?? 'normal';
    const color = opts.color ?? TEXT_SECONDARY;
    const align = opts.align ?? 'left';

    if (!text) return;
    this.setFont(style, size);
    this.setColor(color);

    const lines = this.doc.splitTextToSize(text, maxWidth) as string[];
    const lh = this.lineHeight(size);
    for (const line of lines) {
      this.ensureSpace(lh);
      const drawX = align === 'center' ? PAGE.width / 2 : align === 'right' ? PAGE.width - MARGIN.right : x;
      this.doc.text(line, drawX, this.y + lh * 0.78, { align });
      this.y += lh;
    }
    if (opts.gapAfter) this.y += opts.gapAfter;
  }

  hr(color: [number, number, number] = BORDER_SOFT, opacityWidth = 0.2) {
    this.ensureSpace(2);
    this.setDraw(color);
    this.doc.setLineWidth(opacityWidth);
    this.doc.line(MARGIN.left, this.y, PAGE.width - MARGIN.right, this.y);
    this.y += 1.5;
  }

  // Section title — uppercase tracked text in accent colour with a thin
  // accent underline; matches the on-screen layout.
  sectionHeader(title: string) {
    this.ensureSpace(10);
    this.y += 2;
    this.setFont('bold', SIZES.sectionHeader);
    this.setColor(ACCENT);
    const upper = title.toUpperCase();
    this.doc.text(upper, MARGIN.left, this.y + 3);
    this.y += 5;
    this.setDraw([ACCENT[0], ACCENT[1], ACCENT[2]]);
    this.doc.setLineWidth(0.25);
    this.doc.line(MARGIN.left, this.y, PAGE.width - MARGIN.right, this.y);
    this.y += 3;
  }

  // Two-column row: left text (role/qualification + organisation/institution)
  // and right-aligned date range.
  itemRow(left: { primary: string; secondary?: string }, dates?: string) {
    const lh = this.lineHeight(SIZES.itemHeader);
    this.ensureSpace(lh + this.lineHeight(SIZES.itemSub) + 1);

    // Right-aligned dates first so left wrap budget is correct.
    const datesWidth = dates ? this.doc.getTextWidth(dates) + 2 : 0;
    const leftMaxWidth = CONTENT_WIDTH - datesWidth - 2;

    if (dates) {
      this.setFont('normal', SIZES.meta);
      this.setColor(TEXT_MUTED);
      this.doc.text(dates, PAGE.width - MARGIN.right, this.y + lh * 0.78, { align: 'right' });
    }

    // Primary line (role / qualification).
    this.setFont('bold', SIZES.itemHeader);
    this.setColor(TEXT);
    const primaryLines = this.doc.splitTextToSize(left.primary, leftMaxWidth) as string[];
    this.doc.text(primaryLines[0] ?? '', MARGIN.left, this.y + lh * 0.78);
    this.y += lh;
    for (let i = 1; i < primaryLines.length; i++) {
      this.ensureSpace(lh);
      this.doc.text(primaryLines[i], MARGIN.left, this.y + lh * 0.78);
      this.y += lh;
    }

    if (left.secondary) {
      this.writeWrapped(left.secondary, {
        size: SIZES.itemSub,
        color: TEXT_SECONDARY,
        style: 'normal',
      });
    }
  }

  bullets(items: string[]) {
    if (!items.length) return;
    this.y += 1;
    const indent = 4;
    const lh = this.lineHeight(SIZES.body);
    for (const raw of items) {
      const text = raw.trim();
      if (!text) continue;
      this.ensureSpace(lh);
      // bullet glyph in accent
      this.setFont('bold', SIZES.body);
      this.setColor(ACCENT);
      this.doc.text('•', MARGIN.left + 1, this.y + lh * 0.78);
      // body text wrapped
      this.setFont('normal', SIZES.body);
      this.setColor(TEXT_SECONDARY);
      const wrapped = this.doc.splitTextToSize(text, CONTENT_WIDTH - indent) as string[];
      for (let i = 0; i < wrapped.length; i++) {
        if (i > 0) this.ensureSpace(lh);
        this.doc.text(wrapped[i], MARGIN.left + indent, this.y + lh * 0.78);
        this.y += lh;
      }
    }
  }

  spacer(mm: number) {
    this.y += mm;
  }
}

function dateRange(start?: string, end?: string): string {
  if (!start && !end) return '';
  if (start && end) return `${start} – ${end}`;
  return start || end || '';
}

function renderHeader(b: PdfBuilder, header: RewriteHeader) {
  if (header.name) {
    b.writeWrapped(header.name, {
      size: SIZES.name,
      style: 'bold',
      color: TEXT,
      align: 'center',
    });
  }
  if (header.title) {
    b.writeWrapped(header.title, {
      size: SIZES.title,
      style: 'normal',
      color: ACCENT,
      align: 'center',
    });
  }

  const contactBits = [header.email, header.phone, header.location].filter(Boolean) as string[];
  const linkBits = (header.links ?? [])
    .map((l) => (l.url ? `${l.label}: ${l.url}` : l.label))
    .filter(Boolean);
  const allBits = [...contactBits, ...linkBits];
  if (allBits.length) {
    b.spacer(1);
    b.writeWrapped(allBits.join('  ·  '), {
      size: SIZES.contact,
      color: TEXT_MUTED,
      align: 'center',
    });
  }

  b.spacer(2);
  b.hr(BORDER_SOFT, 0.2);
  b.spacer(1);
}

function renderExperience(b: PdfBuilder, items: RewriteExperience[]) {
  if (!items.length) return;
  b.sectionHeader('Experience');
  items.forEach((e, i) => {
    b.itemRow(
      {
        primary: e.role || '',
        secondary: [e.organization, e.location].filter(Boolean).join(' · '),
      },
      dateRange(e.startDate, e.endDate)
    );
    b.bullets(e.bullets || []);
    if (i < items.length - 1) b.spacer(2.5);
  });
  b.spacer(1);
}

function renderEducation(b: PdfBuilder, items: RewriteEducation[]) {
  if (!items.length) return;
  b.sectionHeader('Education');
  items.forEach((e, i) => {
    b.itemRow(
      {
        primary: e.qualification || '',
        secondary: [e.institution, e.location].filter(Boolean).join(' · '),
      },
      dateRange(e.startDate, e.endDate)
    );
    if (e.details && e.details.length > 0) b.bullets(e.details);
    if (i < items.length - 1) b.spacer(2.5);
  });
  b.spacer(1);
}

function renderSkills(b: PdfBuilder, groups: { category: string; items: string[] }[]) {
  if (!groups.length) return;
  b.sectionHeader('Skills');
  for (const g of groups) {
    if (!g.items.length) continue;
    b.writeWrapped(`${g.category}: `, {
      size: SIZES.body,
      style: 'bold',
      color: TEXT,
    });
    // Move the cursor back up to overlay the items on the same trailing line is
    // brittle in jsPDF; instead, write items on the next line indented.
    b.writeWrapped(g.items.join(', '), {
      size: SIZES.body,
      color: TEXT_SECONDARY,
    });
    b.spacer(1.2);
  }
  b.spacer(0.5);
}

function renderProjects(b: PdfBuilder, items: RewriteProject[]) {
  if (!items.length) return;
  b.sectionHeader('Projects');
  items.forEach((p, i) => {
    const primary = p.role ? `${p.name} — ${p.role}` : p.name;
    b.itemRow({ primary });
    b.bullets(p.bullets || []);
    if (i < items.length - 1) b.spacer(2.5);
  });
  b.spacer(1);
}

function renderList(b: PdfBuilder, title: string, items: string[]) {
  if (!items.length) return;
  b.sectionHeader(title);
  b.bullets(items);
  b.spacer(1);
}

function renderPlainText(b: PdfBuilder, text: string) {
  b.writeWrapped(text, { size: SIZES.body, color: TEXT_SECONDARY });
}

function buildFromStructured(b: PdfBuilder, cv: StructuredCV) {
  renderHeader(b, cv.header);

  if (cv.summary) {
    b.sectionHeader('Professional Summary');
    b.writeWrapped(cv.summary, { size: SIZES.body, color: TEXT_SECONDARY });
    b.spacer(2);
  }

  renderExperience(b, cv.experience);
  renderEducation(b, cv.education);
  renderSkills(b, cv.skills);
  if (cv.projects && cv.projects.length) renderProjects(b, cv.projects);
  if (cv.certifications && cv.certifications.length) renderList(b, 'Certifications', cv.certifications);
  if (cv.awards && cv.awards.length) renderList(b, 'Awards', cv.awards);
}

function buildFilename(cv?: StructuredCV, fallback = 'rewritten-cv'): string {
  const name = cv?.header?.name?.trim();
  if (!name) return `${fallback}.pdf`;
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || fallback}-cv.pdf`;
}

export function generateCVPdf({ structured, plainText, fileName }: GenerateOpts): {
  blob: Blob;
  fileName: string;
} {
  const builder = new PdfBuilder();

  if (structured && (structured.header.name || structured.experience.length || structured.summary)) {
    buildFromStructured(builder, structured);
  } else if (plainText && plainText.trim()) {
    renderPlainText(builder, plainText);
  } else {
    builder.writeWrapped('No CV content available.', { size: SIZES.body });
  }

  const blob = builder.doc.output('blob');
  return {
    blob,
    fileName: fileName ?? buildFilename(structured),
  };
}

export function downloadCVPdf(opts: GenerateOpts) {
  const { blob, fileName } = generateCVPdf(opts);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
