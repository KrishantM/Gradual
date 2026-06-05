// CV scoring — returns four equally-weighted categories (0–25 each) plus
// per-category rationale and an overall improvement summary. The breakdown
// always sums to the headline score by construction.

import { openai } from '../../../../lib/openai';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../lib/firebase-admin';
import crypto from 'crypto';

// Vercel Hobby default is 10s — GPT-4o calls can occasionally exceed this.
export const maxDuration = 60;

type CategoryKey = 'professionalism' | 'experience' | 'keywordScreening' | 'relevance';

interface CategoryResult {
  key: CategoryKey;
  label: string;
  score: number;
  rationale: string;
}

interface ScoreModelResponse {
  professionalism?: { score?: number; rationale?: string };
  experience?: { score?: number; rationale?: string };
  keywordScreening?: { score?: number; rationale?: string };
  relevance?: { score?: number; rationale?: string };
  improvementSummary?: string;
}

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  professionalism: 'Professionalism',
  experience: 'Experience',
  keywordScreening: 'Keyword Screening',
  relevance: 'Relevance to Target Role',
};

const SYSTEM_PROMPT = `You are an expert CV reviewer. Score the provided CV across four equally-weighted categories. Each category is graded 0–25 and the four scores together form the overall score (max 100).

CATEGORIES
1. professionalism — tone, formatting, grammar, action verbs, presentation.
2. experience — depth and clarity of work history, achievements, quantifiable impact, career progression.
3. keywordScreening — presence of role-relevant skills, technologies, certifications, ATS-friendly terminology.
4. relevance — alignment with the candidate's apparent target role/industry, transferable skills, focus.

OUTPUT — strict JSON only, matching this schema:
{
  "professionalism": { "score": 0-25, "rationale": "2-4 sentence explanation citing specific evidence from the CV" },
  "experience": { "score": 0-25, "rationale": "..." },
  "keywordScreening": { "score": 0-25, "rationale": "..." },
  "relevance": { "score": 0-25, "rationale": "..." },
  "improvementSummary": "2-4 sentences of the most impactful changes the candidate could make"
}

RULES
- Each rationale MUST cite concrete observations (e.g. "uses passive voice in 3 of 5 bullets", "no quantified achievements", "missing dates on second role"). Do not be generic.
- Score conservatively. A truly excellent CV earns 22-25 in a category; a typical student CV is more often 14-19. Reserve 0-8 for genuinely weak categories.
- Return only the JSON object, no prose, no markdown fences.`;

function clamp25(n: unknown): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? Math.round(n) : 0;
  return Math.max(0, Math.min(25, v));
}

function safeRationale(r: unknown, fallback: string): string {
  if (typeof r === 'string' && r.trim().length > 0) return r.trim();
  return fallback;
}

function deriveFallbackRationale(label: string, score: number): string {
  if (score >= 21) return `Strong ${label.toLowerCase()} — this section reads as polished and complete.`;
  if (score >= 15) return `Solid ${label.toLowerCase()}, with room to add more specifics or quantify outcomes.`;
  if (score >= 8) return `${label} is uneven — tighten the language and add concrete evidence to lift this section.`;
  return `${label} needs significant work. Focus here for the largest improvement.`;
}

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

    const { cvText, targetRole } = await req.json();
    if (!cvText || typeof cvText !== 'string') {
      return NextResponse.json({ error: 'Invalid CV text.' }, { status: 400 });
    }

    const wordCount = cvText.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 10) {
      return NextResponse.json(
        { error: 'CV is too short. Please provide at least 10 words.' },
        { status: 400 }
      );
    }
    if (wordCount > 1500) {
      return NextResponse.json(
        { error: 'CV exceeds 1500 words. Please shorten before scoring.' },
        { status: 400 }
      );
    }

    const userPrompt = targetRole
      ? `Target role: ${targetRole}\n\nCV:\n${cvText}`
      : `CV:\n${cvText}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';

    let parsed: ScoreModelResponse;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error('[score] model returned non-JSON, falling back', raw);
      parsed = {};
    }

    const breakdown: CategoryResult[] = (Object.keys(CATEGORY_LABELS) as CategoryKey[]).map((key) => {
      const entry = parsed[key];
      const score = clamp25(entry?.score);
      const rationale = safeRationale(entry?.rationale, deriveFallbackRationale(CATEGORY_LABELS[key], score));
      return { key, label: CATEGORY_LABELS[key], score, rationale };
    });

    const totalScore = breakdown.reduce((sum, c) => sum + c.score, 0);
    const improvementSummary = safeRationale(
      parsed.improvementSummary,
      'Strengthen quantifiable achievements, tighten professional language, and align skills with your target role.'
    );

    const cvHash = crypto.createHash('sha256').update(cvText.trim().toLowerCase()).digest('hex');

    return NextResponse.json({
      totalScore,
      breakdown,
      improvementSummary,
      cvHash,
      // Legacy text format kept for back-compat with anywhere still parsing strings.
      score: formatLegacyScoreText(totalScore, breakdown, improvementSummary),
    });
  } catch (err) {
    console.error('[score] error:', err);
    return NextResponse.json({ error: 'Failed to generate score' }, { status: 500 });
  }
}

function formatLegacyScoreText(total: number, breakdown: CategoryResult[], summary: string): string {
  const sections = breakdown
    .map((c, i) => `${i + 1}. ${c.label}:\n${c.rationale} Score: ${c.score}/25`)
    .join('\n\n');
  return `Overall Score (0–100): ${total}\n\n${sections}\n\n5. Areas to improve:\n${summary}`;
}
