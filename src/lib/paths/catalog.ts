/**
 * Capability Paths — static catalog.
 *
 * This file is the single source of truth for available paths. To add or
 * adjust a path, edit this file. Each path is intentionally small (4–6 short
 * modules) — Phase 3 v1 prefers depth-of-integration over volume-of-content.
 */

import type { Path } from './types';

export const PATHS: Path[] = [
  {
    id: 'ai-for-consulting',
    title: 'AI for Consulting',
    tagline: 'Use AI like a top-tier analyst',
    outcome:
      'Move faster on case prep, market sizing, and client research using AI as a leverage tool — without compromising rigor.',
    category: 'ai-fluency',
    targetAudience: ['consulting', 'strategy', 'mbb', 'analyst', 'business'],
    improvesSignals: ['profile', 'applications'],
    estimatedMinutes: 90,
    modules: [
      {
        id: 'frame-the-problem',
        title: 'Frame the problem first',
        concept:
          'AI rewards clear questions. Before prompting, write down the decision your output supports, the audience, and the form of the answer (number, list, deck slide). A vague prompt gives vague work; a framed prompt gives leverage.',
        practicalAction:
          'Pick a real case or project you are working on. Write a one-paragraph problem statement using the structure: decision → audience → form.',
        miniTask:
          'Draft a problem statement for a current project and save it to your notes.',
        estimatedMinutes: 15,
      },
      {
        id: 'market-sizing-prompts',
        title: 'Market sizing with AI',
        concept:
          'Top-down and bottom-up sizing both benefit from AI as a sanity-checker, not a calculator. Use it to surface assumptions, find proxy data, and stress-test ranges — then do the math yourself.',
        practicalAction:
          'Pick a market you are curious about and run a top-down + bottom-up sizing using AI to source assumptions only.',
        miniTask:
          'Produce a 5-line sizing memo with your high/low range and the 3 assumptions that drive it.',
        estimatedMinutes: 20,
      },
      {
        id: 'structured-summaries',
        title: 'Structured client research',
        concept:
          'Consulting research is consumed in 30 seconds. Train AI to output in MECE structures: situation → complication → key insight → recommendation. The structure forces clarity.',
        practicalAction:
          'Choose a public company. Generate a one-page brief in SCQA format using AI; then edit it down by 30%.',
        miniTask:
          'Save your edited one-pager and note one thing AI got wrong.',
        estimatedMinutes: 20,
      },
      {
        id: 'avoid-hallucinations',
        title: 'Spotting hallucinations',
        concept:
          'AI confidently invents stats, dates, and quotes. Develop a habit: any number, name, or quote needs a source you can verify. Treat AI as a junior analyst who never says "I don\'t know".',
        practicalAction:
          'Take an AI output you generated this week and fact-check 5 specific claims against primary sources.',
        miniTask:
          'List the 5 claims and which were correct, wrong, or unverifiable.',
        estimatedMinutes: 15,
      },
      {
        id: 'case-interview-drill',
        title: 'AI case interview drill',
        concept:
          'AI is a tireless practice partner. Use it to run case prompts, push back on your structure, and stress-test assumptions — but always do the math by hand.',
        practicalAction:
          'Run one full case with AI as the interviewer. Ask it to grade your structure on MECE-ness, hypothesis-driven flow, and synthesis.',
        miniTask:
          'Write down the 2 weakest parts of your case and one drill to fix each.',
        estimatedMinutes: 20,
      },
    ],
  },

  {
    id: 'ai-for-marketing',
    title: 'AI for Marketing',
    tagline: 'Ship campaigns with AI as your second brain',
    outcome:
      'Run faster ideation, copy iteration, and audience research cycles — turning AI into a creative partner rather than a copy generator.',
    category: 'ai-fluency',
    targetAudience: ['marketing', 'brand', 'growth', 'content', 'social media'],
    improvesSignals: ['profile', 'applications'],
    estimatedMinutes: 80,
    modules: [
      {
        id: 'audience-personas',
        title: 'Build sharp personas',
        concept:
          'A persona is only useful if it predicts what someone clicks. Use AI to draft 3 personas, then interrogate each with "what would make them ignore us?" — that question reveals the real one.',
        practicalAction:
          'Pick a product or campaign. Generate 3 personas with AI and refine each using the ignore-test.',
        miniTask:
          'Write down the single sentence that captures each persona\'s top friction.',
        estimatedMinutes: 20,
      },
      {
        id: 'copy-iteration',
        title: 'Copy iteration loop',
        concept:
          'AI writes mediocre first drafts and surprisingly good 5th drafts. The trick is iterating: feed it the draft + a specific critique, and ask for one change at a time. Quantity beats genius.',
        practicalAction:
          'Take an existing piece of copy and run 5 rounds of targeted iteration with AI.',
        miniTask:
          'Save the v1 and v5 side-by-side with notes on what changed.',
        estimatedMinutes: 20,
      },
      {
        id: 'channel-strategy',
        title: 'Channel-specific voice',
        concept:
          'LinkedIn, TikTok, and email each reward a different rhythm. Train AI on your brand voice, then explicitly rewrite the same idea in three channel registers.',
        practicalAction:
          'Pick one campaign idea and rewrite it for LinkedIn, TikTok, and an email subject line.',
        miniTask:
          'Save all three versions plus a note on which felt most natural.',
        estimatedMinutes: 20,
      },
      {
        id: 'creative-research',
        title: 'Creative competitive research',
        concept:
          'AI can summarize and tag dozens of competitor ads in minutes. Use it to spot hooks, recurring formats, and gaps you can own — not to copy, to map.',
        practicalAction:
          'Pull 10 competitor ads or posts in your space and ask AI to tag hooks, format, and tone.',
        miniTask:
          'Identify one gap your brand can credibly own.',
        estimatedMinutes: 20,
      },
    ],
  },

  {
    id: 'cv-improvement-mastery',
    title: 'CV Improvement Mastery',
    tagline: 'Turn a generic CV into a recruiter magnet',
    outcome:
      'Materially raise your CV score by tightening structure, language, and impact — directly improving how recruiters react in their first 6 seconds.',
    category: 'job-search',
    targetAudience: ['student', 'graduate', 'early career', 'job seeker'],
    improvesSignals: ['cv', 'profile'],
    estimatedMinutes: 100,
    modules: [
      {
        id: 'cv-baseline',
        title: 'Score your baseline',
        concept:
          'You can\'t improve what you don\'t measure. Run your current CV through Gradual\'s CV Score and note the breakdown — that\'s your starting point.',
        practicalAction:
          'Upload your current CV to /cvscore and record the section scores.',
        miniTask:
          'Note your weakest section and commit to fixing it this week.',
        estimatedMinutes: 10,
      },
      {
        id: 'impact-bullets',
        title: 'Write impact bullets',
        concept:
          'Every bullet should answer: what did you do, how, and what changed? "Action verb + method + measurable result" turns a list of duties into a story of impact.',
        practicalAction:
          'Rewrite 5 bullets from your most recent role using the action+method+result formula.',
        miniTask:
          'Save the old vs new versions of all 5 bullets.',
        estimatedMinutes: 25,
      },
      {
        id: 'ruthless-editing',
        title: 'Cut ruthlessly',
        concept:
          'Most CVs are 30% too long. Recruiters skim — every word competes for attention. Cut filler verbs, hedging language, and anything that doesn\'t earn its place.',
        practicalAction:
          'Reduce your CV by 20% in word count without losing substance.',
        miniTask:
          'Note your before/after word count and what you cut.',
        estimatedMinutes: 25,
      },
      {
        id: 'tailor-per-role',
        title: 'Tailor without rewriting',
        concept:
          'Tailoring doesn\'t mean rewriting — it means leading with the bullets that matter most for this role. Reorder, don\'t reinvent.',
        practicalAction:
          'Pick a real job posting. Reorder your bullets to lead with the 3 that match the JD strongest.',
        miniTask:
          'Save the role-specific version alongside your master CV.',
        estimatedMinutes: 20,
      },
      {
        id: 'cv-rescore',
        title: 'Re-score and lock in',
        concept:
          'Improvement should be visible. Re-run Gradual\'s CV Score on your edited version and check the delta. If a section didn\'t move, it needs another pass.',
        practicalAction:
          'Upload your edited CV to /cvscore and compare to your baseline.',
        miniTask:
          'Record the new score and which section improved most.',
        estimatedMinutes: 10,
      },
    ],
  },

  {
    id: 'interview-readiness',
    title: 'Interview Readiness',
    tagline: 'Walk into any interview prepared',
    outcome:
      'Build a repeatable system for interview prep that covers behavioural, technical, and case-style questions across the formats you actually face.',
    category: 'job-search',
    targetAudience: ['job seeker', 'graduate', 'student', 'interview', 'early career'],
    improvesSignals: ['applications'],
    estimatedMinutes: 110,
    modules: [
      {
        id: 'star-stories',
        title: 'Build your STAR library',
        concept:
          'Most behavioural questions map to ~6 stories. Build them once, refine them, and recombine them. STAR = Situation, Task, Action, Result.',
        practicalAction:
          'Write 6 STAR stories covering: leadership, conflict, failure, initiative, teamwork, ambiguity.',
        miniTask:
          'Save your 6 stories as a single document for future prep.',
        estimatedMinutes: 30,
      },
      {
        id: 'company-research',
        title: 'Research that actually helps',
        concept:
          'Reading the About page is table stakes. Real prep means knowing 1 recent strategic move, 1 product detail, and 1 question you genuinely want answered.',
        practicalAction:
          'Pick a company you\'re interviewing with and complete the 1+1+1 brief.',
        miniTask:
          'Save the brief and bring the question to your next interview.',
        estimatedMinutes: 20,
      },
      {
        id: 'mock-interview',
        title: 'Run a mock with AI',
        concept:
          'AI is patient, available, and will ask follow-ups. Use it as a mock interviewer for behavioural rounds — and ask it to grade you on specificity, structure, and ownership.',
        practicalAction:
          'Run one full 30-minute behavioural mock with AI.',
        miniTask:
          'Note the 2 weakest answers and rewrite them once.',
        estimatedMinutes: 30,
      },
      {
        id: 'questions-to-ask',
        title: 'The questions you ask matter',
        concept:
          'The questions you ask at the end signal how you think. Avoid generic ("what\'s the culture?") and prepare 3 sharp questions that reveal genuine interest in the role.',
        practicalAction:
          'Draft 3 sharp questions for your next interview.',
        miniTask:
          'Save them and review the night before.',
        estimatedMinutes: 15,
      },
      {
        id: 'interview-debrief',
        title: 'Debrief every interview',
        concept:
          'You learn more from one debriefed interview than five forgotten ones. Capture: what went well, what surprised you, what to drill before next time.',
        practicalAction:
          'Run a 5-minute debrief after your next interview using the 3-prompt template.',
        miniTask:
          'Save the debrief in your interview log.',
        estimatedMinutes: 15,
      },
    ],
  },

  {
    id: 'linkedin-optimization',
    title: 'LinkedIn Optimization',
    tagline: 'Get found by recruiters and warm leads',
    outcome:
      'Rebuild your LinkedIn so the right opportunities surface to you — not the other way around. Recruiters use LinkedIn search; this path teaches you to rank.',
    category: 'job-search',
    targetAudience: ['student', 'graduate', 'job seeker', 'networking', 'early career'],
    improvesSignals: ['profile', 'applications'],
    estimatedMinutes: 75,
    modules: [
      {
        id: 'headline-hook',
        title: 'Headline hook',
        concept:
          'Your headline is the only line that follows you across the platform. Make it about positioning, not job title — what you do and who you do it for.',
        practicalAction:
          'Rewrite your LinkedIn headline using the format: [What you do] for [who you serve].',
        miniTask:
          'Save the new headline and update your LinkedIn.',
        estimatedMinutes: 10,
      },
      {
        id: 'about-section',
        title: 'About section that converts',
        concept:
          'Most About sections are autobiographies. The good ones answer: who you help, how you help them, and what to do next. Lead with the reader.',
        practicalAction:
          'Rewrite your About section using the who/how/CTA structure.',
        miniTask:
          'Update your LinkedIn About section.',
        estimatedMinutes: 20,
      },
      {
        id: 'experience-rewrite',
        title: 'Rewrite experience for skim-reading',
        concept:
          'LinkedIn is even more skimmed than a CV. Lead each role with one outcome line, then 3 bullets. White space wins.',
        practicalAction:
          'Rewrite your most recent 2 roles using the 1+3 format.',
        miniTask:
          'Update both roles on LinkedIn.',
        estimatedMinutes: 25,
      },
      {
        id: 'recruiter-keywords',
        title: 'Rank for recruiter search',
        concept:
          'Recruiters search LinkedIn with specific keywords. Make sure the 5 most important terms in your target role appear naturally across your profile.',
        practicalAction:
          'Identify 5 must-have keywords for your target role and check they appear in headline, about, and experience.',
        miniTask:
          'Save your keyword list and where each appears.',
        estimatedMinutes: 20,
      },
    ],
  },

  {
    id: 'sql-acceleration',
    title: 'SQL Acceleration',
    tagline: 'Go from copy-pasting queries to actually understanding them',
    outcome:
      'Build genuine SQL fluency for analyst, data, and product roles — enough to write queries from scratch in interviews and on the job.',
    category: 'technical',
    targetAudience: ['data', 'analyst', 'product', 'sql', 'engineering', 'finance'],
    improvesSignals: ['profile', 'applications'],
    estimatedMinutes: 120,
    modules: [
      {
        id: 'select-where',
        title: 'SELECT, WHERE, ORDER',
        concept:
          'Every query starts here. SELECT chooses columns, WHERE filters rows, ORDER sorts. Master the mental model: pick → filter → sort.',
        practicalAction:
          'Pick a free SQL playground (sqlbolt.com or db-fiddle.com) and write 5 queries against a sample table.',
        miniTask:
          'Save your 5 queries with comments explaining each.',
        estimatedMinutes: 25,
      },
      {
        id: 'joins',
        title: 'JOINs without confusion',
        concept:
          'INNER, LEFT, RIGHT, FULL — the difference is which non-matching rows survive. Draw it as Venn diagrams once and the logic clicks.',
        practicalAction:
          'Write one query using each JOIN type against the same two tables.',
        miniTask:
          'Note in plain English what each JOIN returned and why.',
        estimatedMinutes: 30,
      },
      {
        id: 'group-by-aggregates',
        title: 'GROUP BY and aggregates',
        concept:
          'GROUP BY collapses rows; aggregates summarize them. The rule: every column in SELECT is either grouped or aggregated. Get this and 80% of analyst questions become straightforward.',
        practicalAction:
          'Write 3 queries that use GROUP BY with COUNT, SUM, and AVG.',
        miniTask:
          'Save queries with the business question each answers.',
        estimatedMinutes: 25,
      },
      {
        id: 'window-functions',
        title: 'Window functions',
        concept:
          'Window functions compute across rows without collapsing them. ROW_NUMBER, RANK, and running totals are the most common — and the most-tested in interviews.',
        practicalAction:
          'Write a query using ROW_NUMBER() to find the most recent record per user.',
        miniTask:
          'Save the query with a one-line explanation.',
        estimatedMinutes: 20,
      },
      {
        id: 'sql-interview-drill',
        title: 'Interview drill',
        concept:
          'SQL interviews test pattern recognition, not memorization. Drill the 5 classic patterns: top N per group, running total, deduplication, pivot, gaps & islands.',
        practicalAction:
          'Solve one classic pattern of your choice from a free SQL interview site.',
        miniTask:
          'Save your solution and the pattern name.',
        estimatedMinutes: 20,
      },
    ],
  },

  {
    id: 'networking-outreach',
    title: 'Networking & Outreach',
    tagline: 'Send messages people actually reply to',
    outcome:
      'Build the habit of warm outreach so opportunities come from relationships, not job boards. The output is replies and coffee chats — not impressions.',
    category: 'communication',
    targetAudience: ['student', 'graduate', 'job seeker', 'networking', 'early career'],
    improvesSignals: ['applications', 'todos'],
    estimatedMinutes: 70,
    modules: [
      {
        id: 'who-to-message',
        title: 'Build a target list',
        concept:
          'Random outreach gets random results. Pick 10 people whose path you genuinely want to learn from, in companies you actually want to work at.',
        practicalAction:
          'Build a list of 10 specific people on LinkedIn with their role and one reason you chose them.',
        miniTask:
          'Save your list of 10.',
        estimatedMinutes: 20,
      },
      {
        id: 'cold-message',
        title: 'The cold message that works',
        concept:
          'Three sentences: who you are, why them specifically, what you want (a 15-min coffee chat). No generic "I admire your career" — be specific or skip them.',
        practicalAction:
          'Draft a personalised cold message for each of 5 people from your list.',
        miniTask:
          'Save the 5 drafts before sending.',
        estimatedMinutes: 25,
      },
      {
        id: 'coffee-chat',
        title: 'Run a great coffee chat',
        concept:
          'Coffee chats are not interviews. Prepare 3 questions, listen 70% of the time, and end with "is there anyone else you\'d recommend I speak to?"',
        practicalAction:
          'Prep 3 questions for your next coffee chat.',
        miniTask:
          'Save your questions in your networking log.',
        estimatedMinutes: 15,
      },
      {
        id: 'follow-up',
        title: 'Follow up like a pro',
        concept:
          'Most networking dies at follow-up. Send a thank-you note within 24 hours referencing one specific thing they said. That single habit compounds.',
        practicalAction:
          'Send a thank-you message after your next chat using the 1-specific-thing rule.',
        miniTask:
          'Save the message and add the contact to your follow-up tracker.',
        estimatedMinutes: 10,
      },
    ],
  },

  {
    id: 'ai-productivity-students',
    title: 'AI Productivity for Students',
    tagline: 'Compound your study time with AI',
    outcome:
      'Use AI as a tutor, summarizer, and accountability partner — not a homework cheat. The goal is to learn faster, not less.',
    category: 'productivity',
    targetAudience: ['student', 'undergraduate', 'university', 'study'],
    improvesSignals: ['profile', 'todos'],
    estimatedMinutes: 65,
    modules: [
      {
        id: 'ai-as-tutor',
        title: 'AI as a tutor, not an oracle',
        concept:
          'The trick is asking AI to teach you, not answer for you. Use prompts like "explain this like I\'m 12" or "ask me a question to test if I understand." Effort still matters.',
        practicalAction:
          'Pick a topic you\'re studying. Have AI quiz you with 5 questions, and explain anything you got wrong.',
        miniTask:
          'Note the topic and the questions you missed.',
        estimatedMinutes: 20,
      },
      {
        id: 'lecture-summaries',
        title: 'Turn lectures into 1-pagers',
        concept:
          'A lecture you can\'t summarize on one page is a lecture you don\'t fully understand yet. AI helps you compress, but the compression itself is the learning.',
        practicalAction:
          'Take one lecture from this week and summarize it on a single page using AI as a draft partner.',
        miniTask:
          'Save the 1-page summary.',
        estimatedMinutes: 20,
      },
      {
        id: 'spaced-repetition',
        title: 'Spaced repetition with AI',
        concept:
          'Memory is built by retrieval, not re-reading. Have AI generate flashcards from your notes, then review them daily for 10 minutes.',
        practicalAction:
          'Generate 20 flashcards from your most important course this week.',
        miniTask:
          'Save the flashcards and commit to a 10-min daily review.',
        estimatedMinutes: 15,
      },
      {
        id: 'essay-drafting',
        title: 'Essays with AI as editor',
        concept:
          'Write the first draft yourself — that\'s where the thinking happens. Then use AI to challenge structure, find weak claims, and tighten language. Never let AI write the argument.',
        practicalAction:
          'Take an existing essay draft and run it through 3 AI critique passes (structure, evidence, clarity).',
        miniTask:
          'Note the 3 biggest changes you made.',
        estimatedMinutes: 10,
      },
    ],
  },
];

/** O(1) lookup by id */
const PATH_BY_ID = new Map<string, Path>(PATHS.map((p) => [p.id, p]));

export function getPathById(id: string): Path | undefined {
  return PATH_BY_ID.get(id);
}

export function getModuleById(pathId: string, moduleId: string) {
  const path = getPathById(pathId);
  if (!path) return null;
  return path.modules.find((m) => m.id === moduleId) ?? null;
}
