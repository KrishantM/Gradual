// CV rewrite — returns a structured CV (header, summary, experience, etc.)
// alongside the change log and improvement summary so the UI can render the
// document with proper typography rather than as a plain text blob.

import { openai } from '../../../../lib/openai';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../lib/firebase-admin';

// Rewrites are long-form — give GPT-4o headroom past Vercel Hobby's 10s default.
export const maxDuration = 60;

interface RewriteExperienceItem {
  role: string;
  organization: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  bullets: string[];
}

interface RewriteEducationItem {
  qualification: string;
  institution: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  details?: string[];
}

interface RewriteProjectItem {
  name: string;
  role?: string;
  bullets: string[];
}

interface RewriteHeader {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  links?: { label: string; url?: string }[];
}

interface StructuredCV {
  header: RewriteHeader;
  summary: string;
  experience: RewriteExperienceItem[];
  education: RewriteEducationItem[];
  skills: { category: string; items: string[] }[];
  projects?: RewriteProjectItem[];
  certifications?: string[];
  awards?: string[];
}

interface RewriteResponse {
  structured: StructuredCV;
  plainText: string;
  changesMade: string[];
  improvementSummary: string;
}

const SYSTEM_PROMPT = `You are an expert CV writer. Rewrite the provided CV to be more impactful and ATS-friendly while preserving every fact. Use action verbs, quantify achievements, tighten language, and align tone with the target role if provided.

Return ONLY a JSON object matching this schema (omit optional fields if not present in the source CV):

{
  "structured": {
    "header": {
      "name": string,
      "title": string,                    // optional headline / target role
      "email": string,
      "phone": string,
      "location": string,
      "links": [{ "label": string, "url": string }]
    },
    "summary": string,                    // 2-4 sentence professional summary
    "experience": [
      {
        "role": string,
        "organization": string,
        "location": string,
        "startDate": string,              // e.g. "Mar 2023"
        "endDate": string,                // e.g. "Present" or "Jul 2024"
        "bullets": [string, ...]          // 3-5 achievement-driven bullets per role
      }
    ],
    "education": [
      {
        "qualification": string,          // e.g. "BSc Computer Science"
        "institution": string,
        "location": string,
        "startDate": string,
        "endDate": string,
        "details": [string]               // GPA, honours, relevant coursework
      }
    ],
    "skills": [
      { "category": string, "items": [string, ...] }
    ],
    "projects": [
      { "name": string, "role": string, "bullets": [string] }
    ],
    "certifications": [string],
    "awards": [string]
  },
  "plainText": string,                    // a clean monospace-friendly fallback rendering of the CV
  "changesMade": [string, ...],           // 4-8 concrete edits you made
  "improvementSummary": string            // 2-3 sentences on the impact of these changes
}

Rules:
- Preserve every factual claim from the original CV. Do not invent dates, roles, employers, or metrics.
- If a metric isn't present in the source, do NOT fabricate one — instead rewrite for clarity and impact.
- Each experience bullet should start with a strong action verb.
- Keep section bullets concise (≤ 25 words each).
- Return strictly valid JSON, no markdown fences.`;

const FALLBACK_RESPONSE: RewriteResponse = {
  structured: {
    header: {},
    summary: '',
    experience: [],
    education: [],
    skills: [],
  },
  plainText: '',
  changesMade: [],
  improvementSummary: '',
};

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      await auth.verifyIdToken(authHeader.split('Bearer ')[1]);
    } catch {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const { cvText, targetRole, scoreFeedback } = await req.json();
    if (!cvText || typeof cvText !== 'string') {
      return NextResponse.json({ error: 'Invalid CV text.' }, { status: 400 });
    }

    const wordCount = cvText.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 10) {
      return NextResponse.json({ error: 'CV is too short to rewrite.' }, { status: 400 });
    }
    if (wordCount > 1500) {
      return NextResponse.json({ error: 'CV exceeds 1500 words.' }, { status: 400 });
    }

    const userPrompt = [
      `Original CV:\n${cvText}`,
      targetRole ? `Target role: ${targetRole}` : null,
      scoreFeedback ? `Areas the candidate's previous score flagged:\n${scoreFeedback}` : null,
    ]
      .filter(Boolean)
      .join('\n\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';

    let parsed: Partial<RewriteResponse> = {};
    try {
      parsed = JSON.parse(raw) as Partial<RewriteResponse>;
    } catch {
      console.error('[cv-rewrite] model returned non-JSON', raw);
    }

    const structured = sanitizeStructured(parsed.structured);
    const plainText =
      typeof parsed.plainText === 'string' && parsed.plainText.trim()
        ? parsed.plainText.trim()
        : structuredToPlainText(structured);

    const changesMade = Array.isArray(parsed.changesMade)
      ? parsed.changesMade.filter((c): c is string => typeof c === 'string' && !!c.trim()).slice(0, 12)
      : [];

    const improvementSummary =
      typeof parsed.improvementSummary === 'string' && parsed.improvementSummary.trim()
        ? parsed.improvementSummary.trim()
        : 'The CV has been rewritten with stronger action verbs, tightened language, and clearer structure.';

    const response: RewriteResponse = {
      structured,
      plainText,
      changesMade: changesMade.length > 0 ? changesMade : ['Tightened language and improved bullet structure.'],
      improvementSummary,
    };

    // Maintain back-compat with existing callers expecting `.sections.rewrittenCV`
    return NextResponse.json({
      ...response,
      sections: {
        rewrittenCV: plainText,
        changesMade: response.changesMade.map((c) => `• ${c}`).join('\n'),
        improvementSummary: response.improvementSummary,
      },
    });
  } catch (err) {
    console.error('[cv-rewrite] error:', err);
    return NextResponse.json(
      { ...FALLBACK_RESPONSE, error: 'Failed to generate CV rewrite' },
      { status: 500 }
    );
  }
}

function sanitizeStructured(input: unknown): StructuredCV {
  const fallback: StructuredCV = {
    header: {},
    summary: '',
    experience: [],
    education: [],
    skills: [],
  };

  if (!input || typeof input !== 'object') return fallback;
  const s = input as Partial<StructuredCV>;

  const header: RewriteHeader = s.header && typeof s.header === 'object' ? {
    name: stringOr(s.header.name),
    title: stringOr(s.header.title),
    email: stringOr(s.header.email),
    phone: stringOr(s.header.phone),
    location: stringOr(s.header.location),
    links: Array.isArray(s.header.links)
      ? s.header.links
          .filter((l): l is { label: string; url?: string } =>
            !!l && typeof l === 'object' && typeof (l as { label?: unknown }).label === 'string'
          )
          .map((l) => ({ label: l.label, url: stringOr(l.url) }))
      : undefined,
  } : {};

  return {
    header,
    summary: typeof s.summary === 'string' ? s.summary.trim() : '',
    experience: Array.isArray(s.experience)
      ? s.experience.map((e) => ({
          role: stringOr(e?.role) ?? '',
          organization: stringOr(e?.organization) ?? '',
          location: stringOr(e?.location),
          startDate: stringOr(e?.startDate),
          endDate: stringOr(e?.endDate),
          bullets: Array.isArray(e?.bullets) ? e.bullets.filter((b: unknown): b is string => typeof b === 'string') : [],
        }))
      : [],
    education: Array.isArray(s.education)
      ? s.education.map((e) => ({
          qualification: stringOr(e?.qualification) ?? '',
          institution: stringOr(e?.institution) ?? '',
          location: stringOr(e?.location),
          startDate: stringOr(e?.startDate),
          endDate: stringOr(e?.endDate),
          details: Array.isArray(e?.details) ? e.details.filter((d: unknown): d is string => typeof d === 'string') : undefined,
        }))
      : [],
    skills: Array.isArray(s.skills)
      ? s.skills.map((g) => ({
          category: stringOr(g?.category) ?? 'Skills',
          items: Array.isArray(g?.items) ? g.items.filter((i: unknown): i is string => typeof i === 'string') : [],
        }))
      : [],
    projects: Array.isArray(s.projects)
      ? s.projects.map((p) => ({
          name: stringOr(p?.name) ?? '',
          role: stringOr(p?.role),
          bullets: Array.isArray(p?.bullets) ? p.bullets.filter((b: unknown): b is string => typeof b === 'string') : [],
        }))
      : undefined,
    certifications: Array.isArray(s.certifications)
      ? s.certifications.filter((c): c is string => typeof c === 'string')
      : undefined,
    awards: Array.isArray(s.awards)
      ? s.awards.filter((a): a is string => typeof a === 'string')
      : undefined,
  };
}

function stringOr(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function structuredToPlainText(cv: StructuredCV): string {
  const parts: string[] = [];

  const headerLines: string[] = [];
  if (cv.header.name) headerLines.push(cv.header.name);
  if (cv.header.title) headerLines.push(cv.header.title);
  const contactBits = [cv.header.email, cv.header.phone, cv.header.location].filter(Boolean);
  if (contactBits.length) headerLines.push(contactBits.join(' · '));
  if (cv.header.links?.length) headerLines.push(cv.header.links.map((l) => `${l.label}: ${l.url ?? ''}`).join(' · '));
  if (headerLines.length) parts.push(headerLines.join('\n'));

  if (cv.summary) parts.push(`SUMMARY\n${cv.summary}`);

  if (cv.experience.length) {
    const block = cv.experience
      .map((e) => {
        const dates = [e.startDate, e.endDate].filter(Boolean).join(' – ');
        const head = `${e.role} — ${e.organization}${e.location ? `, ${e.location}` : ''}${dates ? ` (${dates})` : ''}`;
        return [head, ...e.bullets.map((b) => `  • ${b}`)].join('\n');
      })
      .join('\n\n');
    parts.push(`EXPERIENCE\n${block}`);
  }

  if (cv.education.length) {
    const block = cv.education
      .map((e) => {
        const dates = [e.startDate, e.endDate].filter(Boolean).join(' – ');
        const head = `${e.qualification} — ${e.institution}${e.location ? `, ${e.location}` : ''}${dates ? ` (${dates})` : ''}`;
        const details = e.details?.map((d) => `  • ${d}`).join('\n');
        return details ? `${head}\n${details}` : head;
      })
      .join('\n\n');
    parts.push(`EDUCATION\n${block}`);
  }

  if (cv.skills.length) {
    const block = cv.skills.map((g) => `${g.category}: ${g.items.join(', ')}`).join('\n');
    parts.push(`SKILLS\n${block}`);
  }

  if (cv.projects?.length) {
    const block = cv.projects
      .map((p) => [`${p.name}${p.role ? ` — ${p.role}` : ''}`, ...p.bullets.map((b) => `  • ${b}`)].join('\n'))
      .join('\n\n');
    parts.push(`PROJECTS\n${block}`);
  }

  if (cv.certifications?.length) parts.push(`CERTIFICATIONS\n${cv.certifications.map((c) => `• ${c}`).join('\n')}`);
  if (cv.awards?.length) parts.push(`AWARDS\n${cv.awards.map((a) => `• ${a}`).join('\n')}`);

  return parts.join('\n\n');
}
