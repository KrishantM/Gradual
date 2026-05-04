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
        lessons: [
          {
            heading: 'Why framing beats fancy prompts',
            body:
              'Most consultants treat AI like a search engine: type a question, scan the answer, copy the bits that look right. That is fine for trivia. It fails for real work.\n\nThe analyst who gets 5x leverage out of AI does the opposite. They spend the first two minutes of a task writing the problem down — in their own words — before they touch the AI. That preparation is the entire skill.\n\nWhy does this matter? Because AI does not push back on bad inputs. Ask a vague question and you get a confident, vague answer. The framing step is your only quality control before the model amplifies whatever you give it.',
            bullets: [
              'A clear frame lets you spot a wrong answer in seconds.',
              'A clear frame lets you re-prompt with one targeted change instead of starting over.',
              'A clear frame lets you reuse the same setup across 10 sub-questions in the same engagement.',
            ],
          },
          {
            heading: 'The Decision · Audience · Form structure',
            body:
              'Every output exists to support a decision someone needs to make. Your job is to name that decision before you ask AI for anything. The structure has three parts.\n\nDecision is the choice your work informs. "Should we enter the Vietnam market?" is a decision. "Tell me about Vietnam" is not.\n\nAudience is who reads the output. The same insight written for a managing partner versus a junior team gets framed completely differently — different vocabulary, different level of nuance, different willingness to give caveats.\n\nForm is the shape of the answer. A two-by-two matrix? A 5-bullet exec summary? A single number? Specifying form forces you to know what "done" looks like.',
            callout: {
              label: 'Memorize this',
              text: 'Before any prompt: "I am helping [audience] decide [decision], and I need the answer as [form]."',
            },
          },
          {
            heading: 'Worked example — sizing a market',
            body:
              'Bad framing: "How big is the EV charging market in Australia?"\n\nThe AI will spit out a wall of numbers. Some will be made up. You will spend 20 minutes triangulating.\n\nGood framing: "I am helping a private equity client decide whether to invest $50M in an Australian EV charging operator over the next 12 months. They want a 5-bullet brief on the size of the addressable market, the 2 biggest growth drivers, and the 2 biggest risks. Numbers should be ranges, not point estimates."\n\nNotice what the second prompt does. It tells AI: who is reading (PE client), what they will decide (whether to invest $50M), what form to use (5-bullet brief), and what level of confidence is appropriate (ranges, not point estimates). The output collapses from 800 words of slop to 5 lines you can put in a deck.',
            bullets: [
              'Decision named: invest $50M in 12 months.',
              'Audience named: private equity client.',
              'Form named: 5-bullet brief, ranges over points.',
            ],
          },
          {
            heading: 'When framing is hard',
            body:
              'If you cannot write the frame, that is a signal. It means you do not yet know what the work is for.\n\nThat is the moment to stop and clarify with whoever asked. A 5-minute conversation with the person you are delivering to — what is this for? what are you going to do with it? — will save you 5 hours of producing the wrong thing beautifully.',
            callout: {
              label: 'Anti-pattern',
              text: 'Sending the AI a wall of context "to be safe". Context that is not anchored to a decision is noise that the model will dutifully reflect back at you.',
            },
          },
        ],
        keyTakeaways: [
          'Always write your frame before you write your prompt.',
          'A frame names: the decision, the audience, and the form of the answer.',
          'If you cannot write the frame, you do not yet know what the work is for — go ask.',
          'Reuse one well-built frame across many sub-prompts on the same engagement.',
        ],
        quiz: [
          {
            id: 'q1',
            prompt: 'Your team is preparing a board paper on whether to acquire a competitor. Which of these is the strongest "frame" before prompting AI?',
            options: [
              {
                text: 'Tell me everything about [competitor name].',
                isCorrect: false,
                explanation:
                  'This is a search query, not a frame. There is no decision named, no audience, and no form. AI will produce a generic profile that may or may not address what the board needs to decide.',
              },
              {
                text: 'I am helping our board decide whether to acquire [competitor] this quarter. They want a 1-page memo: 3 strategic reasons for, 3 reasons against, and one bet-the-house risk. Numbers should be directional.',
                isCorrect: true,
                explanation:
                  'This names the decision (acquire this quarter), the audience (board), and the form (1-page memo with specific structure and confidence level). AI now has everything it needs to be useful.',
              },
              {
                text: 'Summarise [competitor] and tell me if we should buy them.',
                isCorrect: false,
                explanation:
                  'This sounds direct but skips the audience and form. It also offloads the actual decision to the AI, which is the opposite of what good framing does — framing keeps the decision with you.',
              },
              {
                text: 'Give me a SWOT on [competitor].',
                isCorrect: false,
                explanation:
                  'A SWOT is a form, but with no decision or audience the model defaults to a generic 4-quadrant filler. Without context it will not know which strengths actually threaten you.',
              },
            ],
            hint: 'Look for the prompt that names a decision, an audience, AND a form.',
          },
          {
            id: 'q2',
            prompt: 'You sit down to frame a question for AI but realise you cannot finish the sentence "I am helping ___ decide ___". What is the right next step?',
            options: [
              {
                text: 'Prompt anyway with as much context as you have — the AI can fill in the gaps.',
                isCorrect: false,
                explanation:
                  'AI will not flag the gap; it will produce confident output anchored to whatever it inferred. You will then build downstream work on a wrong assumption.',
              },
              {
                text: 'Pause and ask the person who briefed you what the output is actually for.',
                isCorrect: true,
                explanation:
                  'A 5-minute clarifying conversation is almost always cheaper than producing the wrong thing in detail. Inability to frame is diagnostic — it tells you the brief itself is unclear.',
              },
              {
                text: 'Skip the framing step — it slows you down on tight deadlines.',
                isCorrect: false,
                explanation:
                  'Tight deadlines make framing more important, not less. The cost of redoing work is highest when time is short.',
              },
              {
                text: 'Pick the most likely decision and frame to that — you can revise later.',
                isCorrect: false,
                explanation:
                  'Guessing the decision risks producing work the stakeholder does not want. The cost of clarifying is small; the cost of being wrong about the decision is high.',
              },
            ],
            hint: 'Inability to frame is information about the brief, not about you.',
          },
          {
            id: 'q3',
            prompt: 'Which part of the Decision · Audience · Form structure is most often skipped — and most damaging when missing?',
            options: [
              {
                text: 'Decision — without it, the output has no anchor and the AI defaults to encyclopaedic.',
                isCorrect: true,
                explanation:
                  'Decision is the part most analysts skip because it requires thinking. Without it, output drifts toward "everything I know about this topic" — which is exactly what consulting clients pay you to filter out.',
              },
              {
                text: 'Audience — but most outputs end up in slide form anyway.',
                isCorrect: false,
                explanation:
                  'Audience matters, but slide form is itself a form choice — and naming the audience usually shapes the form too. The bigger problem is the missing decision.',
              },
              {
                text: 'Form — AI usually picks a reasonable structure on its own.',
                isCorrect: false,
                explanation:
                  'Form does default to "essay-shaped paragraphs" if unspecified, which is rarely what consultants need. But form is the easiest to retrofit; a missing decision is the harder failure mode.',
              },
              {
                text: 'They are equally important — there is no "most damaging".',
                isCorrect: false,
                explanation:
                  'In practice, the decision is the part that most analysts skip and the one whose absence does the most damage. The other two are usually inferable; the decision is not.',
              },
            ],
          },
        ],
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
        lessons: [
          {
            heading: 'Why analysts size markets at all',
            body:
              'Market sizing is the consultant\'s stress test. It tells you whether a strategy is even arithmetically possible. A "huge opportunity" that turns out to be a $40M total addressable market is a different conversation from one that\'s $4B.\n\nThe value of the exercise is rarely the final number. It\'s the assumptions you surface along the way: how many users, how often they buy, at what price, and how that grows. Those assumptions become the levers your client cares about. AI is uniquely good at helping you surface them quickly — and uniquely bad at calculating them reliably.',
            bullets: [
              'A sizing memo is judged on transparency of assumptions, not precision of the answer.',
              'A wrong assumption you can defend beats a right answer you cannot.',
              'Two methods that agree (top-down + bottom-up) is the strongest signal you can deliver.',
            ],
          },
          {
            heading: 'Top-down vs bottom-up — when to use each',
            body:
              'Top-down starts from a published total (e.g. global retail spend) and slices down to your segment. Fast, but error compounds with each multiplication. Use when you need a rough order of magnitude in 10 minutes.\n\nBottom-up starts from a unit (one customer, one transaction) and multiplies up. Slower, but each step is auditable. Use when the answer must withstand a senior partner\'s scrutiny.\n\nThe gold standard is to do both and reconcile the gap. If they\'re within 2x, you have a defensible range. If they\'re 10x apart, one of your assumptions is wrong — and finding which one is the actual insight.',
            callout: {
              label: 'Rule of thumb',
              text: 'Top-down for screen-out decisions ("is this worth investigating?"). Bottom-up for invest-in decisions ("how much should we deploy?").',
            },
          },
          {
            heading: 'AI\'s real job: sourcing assumptions',
            body:
              'Do not ask AI "how big is the X market in country Y." It will hallucinate a number with three decimal places of confidence.\n\nInstead, ask it to populate a single assumption in a model you\'ve built. "What proportion of New Zealand households have an EV today, and what range of estimates have you seen across credible sources?" Now AI is doing what it\'s good at — surveying the public discourse — and you\'re doing what you\'re good at — choosing which estimate to anchor on and stress-testing it.\n\nThe pattern: you build the structure, AI fills the cells, you sanity-check each cell, then you do the multiplication yourself.',
            bullets: [
              'Bad: "How big is the EV charger market in NZ?" → unverifiable single number.',
              'Good: "What ranges have credible sources published for NZ EV penetration in 2025?" → comparable estimates you can choose between.',
              'Better: "Give me three independent ways to triangulate NZ EV penetration." → forces AI to source from different angles.',
            ],
          },
          {
            heading: 'Worked example — sizing AU EV charging',
            body:
              'Say a PE client wants to know: how big is the public EV charger market in Australia?\n\nTop-down (4 minutes): AU vehicle fleet ≈ 20M. EV penetration ≈ 1.5% (2025) → 300k EVs. ~10% need public charging weekly. Avg session ≈ $15. → ~$23M/yr in session revenue. Stress-test the 1.5%: AI surfaces a range of 1.2-1.8%, so the answer is $18-28M.\n\nBottom-up (8 minutes): ~3,500 public chargers in AU. Avg utilisation 4 sessions/day. 365 days. $15/session. → $77M/yr in session revenue. Wait — that\'s 3x my top-down. Reconcile: utilisation is probably lower than 4/day (AI sources suggest 1.5-2). At 2 sessions/day → $38M.\n\nNow you have a defensible range: $20-40M/yr. The interesting bit is not the number — it\'s the discovery that "average utilisation per charger" is the variable that drives the answer most. That\'s what the client should ask about.',
            callout: {
              label: 'The output the partner wants',
              text: 'Range, not point. Three sentences max. The single assumption that, if wrong by 20%, would change the answer most. That last sentence is the deliverable.',
            },
          },
        ],
        keyTakeaways: [
          'Sizing is a stress test for assumptions, not an exercise in precision.',
          'Top-down for screen-out decisions; bottom-up for invest-in decisions; both for confidence.',
          'AI\'s job is to source ranges of assumptions; your job is to choose, multiply, and stress-test.',
          'Always identify the single most sensitive assumption — that\'s the real insight.',
        ],
        quiz: [
          {
            id: 'q1',
            prompt: 'Your top-down sizing returns $20M and your bottom-up returns $200M for the same market. What\'s the right next step?',
            options: [
              {
                text: 'Average them and use $110M as your point estimate.',
                isCorrect: false,
                explanation:
                  'Averaging two methods that disagree by 10x just hides the disagreement. The 10x gap is information — it tells you one of your assumptions is materially wrong.',
              },
              {
                text: 'Trace the dominant assumption in each method and find which one is off — that gap is the insight.',
                isCorrect: true,
                explanation:
                  'Right. A 10x divergence almost always traces to a single bad assumption (e.g. utilisation rate, addressable share, average price). Finding it is more valuable than the final number.',
              },
              {
                text: 'Pick the method you trust more and discard the other.',
                isCorrect: false,
                explanation:
                  'You lose the cross-check. The whole point of doing both is reconciliation; discarding one defeats the purpose.',
              },
              {
                text: 'Re-prompt AI to give a third estimate as a tiebreaker.',
                isCorrect: false,
                explanation:
                  'AI is not a tiebreaker — its estimate is correlated with whatever\'s in your prompt. The reconciliation has to come from you.',
              },
            ],
            hint: 'Big gaps between methods are diagnostic, not noise.',
          },
          {
            id: 'q2',
            prompt: 'Which prompt extracts the most useful information from AI for a sizing exercise?',
            options: [
              {
                text: '"What is the size of the US online tutoring market?"',
                isCorrect: false,
                explanation:
                  'A single-number prompt produces a single hallucinated number. You can\'t verify it and you don\'t learn the assumptions behind it.',
              },
              {
                text: '"Give me three independent triangulations of US online tutoring market size with the assumptions each relies on."',
                isCorrect: true,
                explanation:
                  'This forces AI to expose multiple paths to the answer with their assumptions visible — exactly what you can sanity-check and use as inputs to your own model.',
              },
              {
                text: '"Tell me everything about the US tutoring industry."',
                isCorrect: false,
                explanation:
                  'A wall of context with no structure. You\'ll get a generic summary that doesn\'t map to a sizing model.',
              },
              {
                text: '"Summarise the top three Frost & Sullivan reports on tutoring."',
                isCorrect: false,
                explanation:
                  'AI cannot reliably retrieve specific paywalled reports — it will fabricate plausible-sounding summaries of reports that may not exist or whose contents it doesn\'t have.',
              },
            ],
          },
          {
            id: 'q3',
            prompt: 'You\'ve produced a sizing answer of "$1.7B". Your partner pushes back and asks "why $1.7B?" What\'s the strongest answer?',
            options: [
              {
                text: '"It\'s the consensus across three sources I checked."',
                isCorrect: false,
                explanation:
                  '"Consensus" sounds robust but obscures the underlying logic. The partner wants to know why the number, not who else agrees.',
              },
              {
                text: '"$1.4B-$2.1B based on top-down + bottom-up. The single most sensitive variable is X — if it\'s 20% lower, the answer drops to $1.1B."',
                isCorrect: true,
                explanation:
                  'This shows: a range (admits uncertainty), two methods (cross-checked), and the dominant lever (so the partner can question what matters). All three are what makes a sizing memo defensible.',
              },
              {
                text: '"That\'s what AI returned when I asked it."',
                isCorrect: false,
                explanation:
                  'Naming AI as your source is the fastest way to lose credibility in a partner conversation. AI is not an authority — it\'s a research assistant whose work you own.',
              },
              {
                text: '"It comes from a Statista report, so it\'s reliable."',
                isCorrect: false,
                explanation:
                  'Single-source reliance is fragile. Even if Statista\'s number is correct for last year, the partner can ask "what changed?" and you have nothing to fall back on.',
              },
            ],
            hint: 'Defensibility comes from showing your reasoning, not citing your source.',
          },
        ],
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
        lessons: [
          {
            heading: 'How partners actually read your work',
            body:
              'A senior partner spends 30 seconds with your brief before a client meeting. They read the title, the first sentence, and the headers. If those three things tell them what to do, they\'ll skim the rest. If not, they\'ll either ignore it or — worse — show up to the meeting with the wrong frame.\n\nThis is not a problem of effort. Most analyst briefs fail because they\'re organised chronologically (here\'s what I learned, in the order I learned it) instead of by importance. Structured frameworks fix this by forcing the most useful sentence to the top.',
            bullets: [
              'A reader who only sees the first sentence should still take away your main message.',
              'A reader who sees only the headers should know your full argument.',
              'A reader who reads everything should see the supporting evidence — but they\'re the minority.',
            ],
          },
          {
            heading: 'SCQA — the workhorse structure',
            body:
              'SCQA stands for Situation, Complication, Question, Answer. It\'s the dominant narrative structure in management consulting because it mirrors how decisions actually get made.\n\nSituation: the stable backdrop the reader already accepts. ("The client operates 200 stores across ANZ.")\n\nComplication: what changed or what\'s threatening the situation. ("Same-store sales have declined 8% over 18 months while category growth was +3%.")\n\nQuestion: the implicit question the complication raises. ("Why are we losing share, and how do we recover?")\n\nAnswer: your view. ("Three-quarters of the loss traces to one product category; turn it around within 6 months or exit it.")\n\nThe answer goes first in the document — readers don\'t want suspense. The S-C-Q is the supporting context.',
            callout: {
              label: 'Common mistake',
              text: 'Writing the SCQA in order (S→C→Q→A) in the document. The structure is for *thinking*; the document leads with the A and uses S/C/Q to back it up.',
            },
          },
          {
            heading: 'Pyramid principle in 60 seconds',
            body:
              'Barbara Minto\'s pyramid principle says: lead with your conclusion, then group supporting points into 2-4 mutually exclusive categories, then provide evidence under each.\n\nThis is the structure behind every well-written exec memo and every consulting slide. The pyramid is "what" you say first, "why" three reasons supporting it, and "evidence" under each reason.\n\nThe MECE rule (Mutually Exclusive, Collectively Exhaustive) is what makes the pyramid robust. Your reasons can\'t overlap and they have to cover the space. AI is good at proposing pyramid groupings but tends to overlap categories — your job is to enforce MECE.',
            bullets: [
              'Top of pyramid: a single sentence answer.',
              'Middle: 3 reasons (occasionally 2 or 4) — never 5+.',
              'Bottom: data, examples, quotes — pick the strongest, drop the rest.',
            ],
          },
          {
            heading: 'The 30% cut rule',
            body:
              'AI-generated briefs are always 30% too long. The model hedges, repeats, and adds throat-clearing transitions. The cut is non-negotiable: re-read your draft and remove every sentence that doesn\'t advance the argument.\n\nMost easy cuts: "It is important to note that...", "On the other hand...", "In conclusion...", and any sentence that summarises the previous paragraph. After the cut, your brief should feel almost too terse — that\'s the right calibration for a senior reader.\n\nThe ruthless test: if you removed any single sentence, would the reader miss something material? If no, cut it.',
            callout: {
              label: 'Mantra',
              text: 'A consulting brief is not a school essay. Length is a cost, not a virtue.',
            },
          },
        ],
        keyTakeaways: [
          'Lead with the answer; SCQA structures the support, not the document order.',
          'The pyramid principle: one conclusion → 3 MECE reasons → evidence under each.',
          'AI drafts are always ~30% too long — cut hedges, transitions, and self-summaries.',
          'Optimise for the 30-second skim, not the careful read.',
        ],
        quiz: [
          {
            id: 'q1',
            prompt: 'You\'ve drafted a one-page brief. The first sentence reads: "There are several factors to consider when evaluating the client\'s situation." What\'s the issue?',
            options: [
              {
                text: 'It\'s too informal — needs to sound more professional.',
                isCorrect: false,
                explanation:
                  'Tone isn\'t the problem. The sentence is professional but conveys nothing.',
              },
              {
                text: 'It buries the answer — the first sentence should state your view, not introduce that you have one.',
                isCorrect: true,
                explanation:
                  'A reader who only reads the first sentence should learn what you think. "There are several factors" tells them you have factors but doesn\'t tell them which way you came down.',
              },
              {
                text: 'It\'s missing data — needs a specific number.',
                isCorrect: false,
                explanation:
                  'The lead doesn\'t need a number; it needs a position. A specific number can support your view, but it can\'t replace it.',
              },
              {
                text: 'It uses passive voice.',
                isCorrect: false,
                explanation:
                  'Voice is a stylistic concern; the structural problem is more fundamental — the sentence carries no information.',
              },
            ],
            hint: 'Imagine the reader stops after one sentence. What do they walk away knowing?',
          },
          {
            id: 'q2',
            prompt: 'Which set of three supporting reasons is properly MECE for "We should exit Category X"?',
            options: [
              {
                text: '(1) Margins are declining. (2) Customer retention is poor. (3) Profitability is shrinking.',
                isCorrect: false,
                explanation:
                  'Not mutually exclusive — declining margins and shrinking profitability are nearly the same point. Two of the three reasons overlap.',
              },
              {
                text: '(1) The category is structurally unprofitable. (2) Capital reallocated to Y earns 3x more. (3) Exit cost is recoverable within 18 months.',
                isCorrect: true,
                explanation:
                  'Mutually exclusive (no overlap) and collectively exhaustive for an exit decision (current state, opportunity cost, transition cost). This is a clean pyramid.',
              },
              {
                text: '(1) It\'s the right thing to do. (2) Competitors have already exited. (3) The board wants to see action.',
                isCorrect: false,
                explanation:
                  '"It\'s the right thing" is not a reason — it\'s a restatement. The other two are downstream observations, not the underlying drivers.',
              },
              {
                text: '(1) Sales are down. (2) Marketing isn\'t working. (3) The market is changing.',
                isCorrect: false,
                explanation:
                  'These overlap (sales-down likely is the market changing) and are too vague to support an exit recommendation.',
              },
            ],
          },
          {
            id: 'q3',
            prompt: 'You finish a draft and your word count is 600 words. The brief is meant to be one page (~400 words). What\'s the right cut strategy?',
            options: [
              {
                text: 'Cut a paragraph from each section proportionally.',
                isCorrect: false,
                explanation:
                  'Proportional cuts preserve weak content; you\'ll lose strong content alongside it. Cuts should be targeted at the weakest material, not spread evenly.',
              },
              {
                text: 'Read each sentence and ask: would removing this sentence cost the reader something material? Cut anything that fails.',
                isCorrect: true,
                explanation:
                  'This is the right test. Hedges, transitions, and self-summaries always fail it. Real content survives. The cut is targeted, not proportional.',
              },
              {
                text: 'Shorten every paragraph by combining sentences.',
                isCorrect: false,
                explanation:
                  'Combining sentences adds clauses and usually makes the prose harder to skim. The goal is fewer ideas, not denser ones.',
              },
              {
                text: 'Move the weakest section to an appendix.',
                isCorrect: false,
                explanation:
                  'If a section is weak enough to move to an appendix, it\'s usually weak enough to delete. Appendices are graveyards.',
              },
            ],
            hint: 'Cuts are about which sentences earn their place — not about uniform reduction.',
          },
        ],
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
        lessons: [
          {
            heading: 'The confidence trap',
            body:
              'The single most dangerous thing about AI is that it sounds equally confident whether it\'s right or wrong. There\'s no rising intonation, no "I think", no flicker of uncertainty. A made-up statistic about Vietnamese coffee exports reads identically to a real one.\n\nThis is a calibration problem your reader will never solve for you. If you let one fabricated number into a deck and it lands in front of a partner, the cost isn\'t just that one slide — it\'s your credibility on every other claim you make. Reputations in consulting are built and destroyed on this single skill.',
            bullets: [
              'AI never says "I don\'t know" unless explicitly forced.',
              'The hallucination rate is highest exactly where you can\'t double-check easily — niche markets, recent events, specific people.',
              'A wrong number in a deck is worse than a missing one — readers can\'t tell the difference, but the partner can.',
            ],
          },
          {
            heading: 'The four kinds of hallucination',
            body:
              'Numbers: revenue figures, market sizes, growth rates. Most common and most dangerous because they\'re easy to plug into a model that compounds the error.\n\nNames: people, products, companies, papers. AI will invent a "Stanford 2023 study by Chen et al" that does not exist. The made-up paper will sound exactly like a real one.\n\nQuotes: AI fabricates plausible quotes from CEOs, regulators, and academics. Even when the person exists, the quote is often invented.\n\nDates: when an event happened, when a regulation came in, when a product launched. AI conflates timelines, especially for recent events near its training cutoff.\n\nKnowing the four categories helps you scan an output: any cell in a deck that contains one of these four needs verification before it ships.',
            callout: {
              label: 'High-risk pattern',
              text: 'A specific number with a citation that sounds real ("according to McKinsey, 73% of...") is the hallucination pattern most likely to slip through review. Verify by clicking through to the actual document.',
            },
          },
          {
            heading: 'The verification habit',
            body:
              'Before any AI output leaves your hands, scan it for the four hallucination categories and verify each instance. The rule: every claim that has a number, a named person, a quote, or a date must trace to a source you can open.\n\n"AI told me" is not a source. "Bing search confirms it" is weak — you might be confirming the same hallucination back to itself if AI-generated content has indexed.\n\nThe gold standard: a primary source — the company\'s own report, the regulator\'s own filing, the original paper. Secondary sources (news articles, blog posts) are acceptable for context but should not anchor a claim that matters.',
            bullets: [
              'Numbers → company filings, regulator data, official statistics.',
              'Names of papers/people → click through to the actual paper or institutional bio.',
              'Quotes → find the original interview/press release/transcript.',
              'Dates → cross-check against at least one primary source.',
            ],
          },
          {
            heading: 'Forcing AI to admit uncertainty',
            body:
              'You can change AI\'s default behaviour with one prompt: "For each claim that includes a number, name, or quote, add a confidence rating (high/medium/low) and a note on whether you can cite a real source for it."\n\nThis prompt is not magic — AI will still hallucinate — but it makes the hallucinations easier to spot. Anything marked "low confidence" is something you should either remove or independently verify. Anything marked "high confidence" still needs a spot-check, but the spot-check rate can drop from 100% to ~30%.\n\nA second prompt that helps: "If you\'re uncertain, write \'unverified\' instead of inventing a value." Combined, these two prompts cut your hallucination exposure by a large margin.',
            callout: {
              label: 'Prompt to memorise',
              text: '"For every numeric claim or named source, mark it with confidence high/medium/low and tell me if you can cite a real verifiable source. If you can\'t, write \'unverified\' rather than guess."',
            },
          },
        ],
        keyTakeaways: [
          'AI sounds equally confident whether right or wrong — calibrate yourself, the model won\'t.',
          'Four hallucination categories to scan: numbers, names, quotes, dates.',
          'Every claim that ships needs a primary source you can open — secondary sources only as context.',
          'Force confidence ratings in the prompt to make hallucinations easier to spot.',
        ],
        quiz: [
          {
            id: 'q1',
            prompt: 'AI tells you "according to a 2024 McKinsey study, 67% of executives plan to increase AI spending in 2025." Which is the right next move?',
            options: [
              {
                text: 'Use the claim — McKinsey is a credible source.',
                isCorrect: false,
                explanation:
                  'You haven\'t verified the study exists. AI fabricates plausible-sounding McKinsey citations frequently because the model has seen the format thousands of times.',
              },
              {
                text: 'Click through to McKinsey\'s actual website and find the report — only use the claim if you can open the source.',
                isCorrect: true,
                explanation:
                  'Right. The "from a real institution" pattern is the most dangerous hallucination because it bypasses your skepticism. Treat it as unverified until you\'ve seen the document yourself.',
              },
              {
                text: 'Re-prompt AI to confirm the study is real.',
                isCorrect: false,
                explanation:
                  'AI will confidently confirm a hallucinated study. Re-prompting cannot detect a fabrication because the same training data produced the original error.',
              },
              {
                text: 'Use the claim but soften it: "research suggests..."',
                isCorrect: false,
                explanation:
                  'Hedging language doesn\'t make a fabrication acceptable — it just makes it harder to attribute to you. If the study doesn\'t exist, citing it (softly or not) is a credibility error.',
              },
            ],
            hint: 'A specific number plus a real-sounding citation is the most common hallucination pattern.',
          },
          {
            id: 'q2',
            prompt: 'Which type of claim should make you most paranoid about hallucinations?',
            options: [
              {
                text: 'A widely-known fact like "the US population is ~330M".',
                isCorrect: false,
                explanation:
                  'Common, stable facts are the lowest-risk category. They appear in AI training data thousands of times and are usually correct.',
              },
              {
                text: 'A specific number from a niche or recent topic — e.g. "Vietnam\'s 2024 EV charger growth rate was 47%".',
                isCorrect: true,
                explanation:
                  'Right. Niche or recent topics are exactly where AI training data is thinnest, where verification is hardest, and where confident hallucinations are most common.',
              },
              {
                text: 'An opinion or recommendation.',
                isCorrect: false,
                explanation:
                  'Opinions can be debated but aren\'t hallucinations in the same sense — they\'re positions, not facts. The hallucination problem is about facts.',
              },
              {
                text: 'A definition of a common business term.',
                isCorrect: false,
                explanation:
                  'Definitions are usually well-represented in training data and are easy to cross-check. Lower risk.',
              },
            ],
          },
          {
            id: 'q3',
            prompt: 'You\'ve added "mark each numeric claim with confidence and cite a source" to your prompt. AI returns several claims marked "low confidence". What should you do?',
            options: [
              {
                text: 'Remove them — low confidence claims aren\'t worth verifying.',
                isCorrect: false,
                explanation:
                  'Low-confidence claims are sometimes the most interesting ones in your output. The right move is to verify, not delete.',
              },
              {
                text: 'Verify each one against a primary source; replace with "unverified" or remove if you can\'t verify.',
                isCorrect: true,
                explanation:
                  'Right. The confidence flag is a triage tool — it tells you where to focus your verification effort. Low-confidence flags get checked; if they don\'t survive verification, they don\'t ship.',
              },
              {
                text: 'Use them but add a footnote saying "low confidence per AI".',
                isCorrect: false,
                explanation:
                  'Citing AI\'s self-assessed confidence is not a real source. If you\'re shipping a claim, the reader needs to be able to trust it; "AI said it was low-confidence" doesn\'t meet that bar.',
              },
              {
                text: 'Re-prompt AI to upgrade them to high confidence.',
                isCorrect: false,
                explanation:
                  'AI will happily upgrade them with no new evidence. The confidence rating is only useful if you treat it as a triage signal, not a target to optimise.',
              },
            ],
            hint: 'Confidence flags are a triage tool — they tell you where to look harder, not what to delete.',
          },
        ],
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
        lessons: [
          {
            heading: 'Why AI beats a study buddy',
            body:
              'Case practice has historically been bottlenecked by partners. You need someone to throw cases at you, push back when your structure is weak, and do it again tomorrow. Most students get 5-10 mock cases over months — far below the 30-50 needed to build real fluency.\n\nAI removes that bottleneck. It doesn\'t get tired, doesn\'t get bored, and doesn\'t tell you "good job" out of politeness. It will run case after case, push on weak structure, and grade you on the dimensions that actually matter. The honest comparison: an AI mock is ~70% as useful as a strong human mock, but you can do 10 of them in a week.',
            bullets: [
              'AI is patient — you can ask the same clarifying question 5 times without judgment.',
              'AI can drill specific weak spots (sizing, segmentation, synthesis) without running a full case.',
              'AI will push back on lazy structure if you tell it to — most friends won\'t.',
            ],
          },
          {
            heading: 'The role-play prompt that works',
            body:
              'A bad mock prompt: "Give me a case." You\'ll get a generic textbook case with no edge.\n\nA good mock prompt sets the role, the level, the case type, and the grading bar:\n\n"You\'re a McKinsey EM running a 30-min interview with me, a 2nd-year MBA. Throw me a profitability case in airline cargo. Ask one question at a time. Push back when my structure overlaps or skips a branch. At the end grade me on: (1) MECE structure, (2) hypothesis-driven flow, (3) synthesis under time pressure. Be specific and harsh."\n\nNotice what this does. It pins down the interviewer\'s persona (you can\'t grade if you don\'t know the bar). It pins the case type. It commits AI to one-question-at-a-time pacing instead of dumping the case at once. And it pre-commits the grading dimensions so the feedback isn\'t generic praise.',
            callout: {
              label: 'Why "harsh" matters',
              text: 'AI\'s default tone is supportive. For practice that improves you, you need to override it — explicit prompting for harsh, specific, critical feedback gets dramatically better mocks.',
            },
          },
          {
            heading: 'Math by hand — non-negotiable',
            body:
              'You can have AI ask the case, push back on structure, and grade your synthesis. You cannot have AI do the math.\n\nFirst, real interviews are timed and you don\'t have a calculator. If you\'ve let AI do mental math for you in practice, you\'ll choke on the real thing. Second, the math itself is a structure check — if you can\'t back-of-envelope the answer, your structure was wrong.\n\nThe rule: when AI gives you data, write it on paper, do the arithmetic by hand, then check your answer. When you\'re wrong by 2x, that\'s a calibration drill — figure out where the error came from before moving on.',
            bullets: [
              'Number sense is a learned skill, not a talent — drill mental arithmetic 5 minutes a day.',
              'Common ratios to memorise: 365 days/yr, 52 weeks, ~250 working days. These end up in 80% of cases.',
              'When numbers are ugly, round aggressively — interviewers reward "directional" over "precise".',
            ],
          },
          {
            heading: 'Grading the grading',
            body:
              'AI\'s grade isn\'t always right. It tends to over-praise structure (because most candidates are scared to commit) and under-flag synthesis (because synthesis is hard to evaluate without a partner\'s instinct).\n\nDevelop your own checklist alongside AI\'s. After each case, score yourself on:\n\n1. Did I commit to a hypothesis in the first 90 seconds, or did I float?\n2. Were my branches MECE or did they overlap?\n3. Did my final synthesis answer the question, or did I summarise what I\'d said?\n4. Did I do the math correctly under time pressure?\n\nCompare your self-score to AI\'s. The dimensions where you agree are reliable signal. Where you disagree, lean toward the harsher of the two — improvement is on the harsh side.',
            callout: {
              label: 'Drill smartly',
              text: 'Don\'t do another full case if a sub-skill is broken. If sizing is the weakness, drill 5 sizings in 30 minutes. If synthesis is, drill 5 conclusions on cases you\'ve already worked. Targeted reps beat fresh full cases.',
            },
          },
        ],
        keyTakeaways: [
          'AI removes the practice partner bottleneck — 10 mocks/week is now achievable.',
          'Your prompt sets the bar: persona, case type, pacing, and grading dimensions all matter.',
          'Math is non-negotiable by hand — interviews don\'t have calculators.',
          'Grade yourself alongside AI; lean toward the harsher of the two scores.',
        ],
        quiz: [
          {
            id: 'q1',
            prompt: 'You\'ve done 8 AI mocks this week and feel sharper, but in a real interview you blanked on basic mental math. What\'s the most likely cause?',
            options: [
              {
                text: 'Real-interview nerves — practise more cases until your confidence is high enough.',
                isCorrect: false,
                explanation:
                  'Nerves matter, but the specific failure (mental math) points to a skill gap, not a confidence gap. Doing more cases without changing how you practise won\'t fix it.',
              },
              {
                text: 'You let AI or a calculator do the math during practice — drill mental arithmetic separately and do all case math by hand.',
                isCorrect: true,
                explanation:
                  'Right. Mental math is a separable skill that decays without practice. If your AI mocks let you offload the arithmetic, the muscle never develops. Add daily 5-min mental-math drills and force yourself to do all case math by hand.',
              },
              {
                text: 'Bad luck — different interviewers test different skills.',
                isCorrect: false,
                explanation:
                  'Mental math comes up in nearly every quantitative case. If you blanked, it\'s a skill gap that will recur, not a one-off.',
              },
              {
                text: 'AI cases aren\'t realistic — switch to human mocks.',
                isCorrect: false,
                explanation:
                  'AI mocks are realistic enough — the issue isn\'t the case quality, it\'s how you used the practice. Switching format won\'t fix the underlying habit.',
              },
            ],
          },
          {
            id: 'q2',
            prompt: 'Which mock prompt produces the most useful practice session?',
            options: [
              {
                text: '"Give me a case to practise."',
                isCorrect: false,
                explanation:
                  'Generic prompt → generic case → unfocused feedback. You won\'t know what level the case is pitched at or what dimensions you\'re being graded on.',
              },
              {
                text: '"Run a profitability case at MBB final-round level. Ask one question at a time, push back when my structure overlaps, and at the end grade me harshly on MECE, hypothesis-driven flow, and synthesis."',
                isCorrect: true,
                explanation:
                  'Right. This prompt sets the level (MBB final), the type (profitability), the pacing (one question at a time), and the grading dimensions (with "harshly" overriding AI\'s default politeness). All four matter.',
              },
              {
                text: '"Pretend you\'re a senior partner and ask me a hard case."',
                isCorrect: false,
                explanation:
                  '"Hard" is too vague. AI doesn\'t know what hard means without dimensions. You\'ll get a case but no structured feedback.',
              },
              {
                text: '"Throw me 5 cases in a row and at the end tell me which one I did best on."',
                isCorrect: false,
                explanation:
                  'Volume without focused feedback is low-value. You\'ll do 5 cases shallowly instead of one case with deep feedback that actually moves your skill.',
              },
            ],
            hint: 'A useful prompt pins the persona, case type, pacing, and grading dimensions.',
          },
          {
            id: 'q3',
            prompt: 'AI grades your case 8/10 on structure but you suspect you actually had two overlapping branches. What\'s the right interpretation?',
            options: [
              {
                text: 'Trust AI\'s grade — it has more pattern data than you.',
                isCorrect: false,
                explanation:
                  'AI tends to over-grade structure because most candidates are scared to commit. If you have a specific concern about overlap, your instinct is more reliable than AI\'s default.',
              },
              {
                text: 'Lean toward your harsher self-assessment — practise where the score is lower.',
                isCorrect: true,
                explanation:
                  'Right. The improvement is on the harsh side. If you suspect a problem, the cost of over-correcting is small (you practise tighter MECE); the cost of under-correcting is big (you ship overlapping branches in real interviews).',
              },
              {
                text: 'Average the two scores.',
                isCorrect: false,
                explanation:
                  'Averaging dilutes useful signal. If you\'ve identified a specific weakness, ignore the higher score and drill the weakness.',
              },
              {
                text: 'Run another mock to break the tie.',
                isCorrect: false,
                explanation:
                  'Another full case won\'t isolate the structure issue. Better to drill MECE structures specifically — sketch 5 different cases\' first-level branches without doing the math.',
              },
            ],
          },
        ],
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
        lessons: [
          {
            heading: 'Why a baseline is non-negotiable',
            body:
              'Most people who improve their CV do it by feel. They tweak a bullet, ask a friend, swap fonts. Three weeks later they cannot tell you whether the new version is actually better — only that it is different.\n\nThe shortest path to a real improvement is to measure first. A baseline gives you two things: a number to beat, and a section to focus on. Without those two things you will spend hours editing the parts of your CV that already work, and ignoring the parts that are dragging you down.',
            bullets: [
              'A baseline turns "my CV needs work" into "my impact bullets are weak".',
              'A baseline lets you show your supervisor or career advisor a delta, not just a story.',
              'A baseline takes ~5 minutes; rewriting blindly takes ~5 hours.',
            ],
          },
          {
            heading: 'How Gradual scores a CV',
            body:
              'Gradual scores your CV out of 100 across several sections that recruiters consistently flag in research. Each section is independent — you can have strong impact bullets and weak structure, or vice versa.\n\nThe score is not magic; it is a heuristic. Treat it like a doctor\'s thermometer: a useful first reading that tells you where to look harder. The breakdown matters more than the headline number.',
            bullets: [
              'Structure & layout — clarity of sections and visual hierarchy.',
              'Impact bullets — verb + method + measurable result.',
              'Tailoring signals — keyword and skill alignment to your target roles.',
              'Concision — words that earn their place vs filler.',
            ],
            callout: {
              label: 'What the score is not',
              text: 'It is not the recruiter\'s opinion. It is a structured proxy for the patterns recruiters tend to react to. Use it directionally; do not optimise the number at the expense of substance.',
            },
          },
          {
            heading: 'How to read your baseline',
            body:
              'When your score comes back, resist the urge to react to the headline. Look at the breakdown. The lowest-scoring section is your highest-leverage edit — it is where one hour of work returns the most points.\n\nWrite down: your overall score, the lowest-scoring section, and one specific reason that section is weak. That note becomes your contract for this path. Every subsequent module ladders back to fixing it.',
            callout: {
              label: 'Common pattern',
              text: 'Most students score lowest on impact bullets — duties without outcomes. If that is you, the next module will close most of the gap.',
            },
          },
        ],
        keyTakeaways: [
          'Measure first, edit second — the baseline tells you where to focus.',
          'The section breakdown matters more than the headline number.',
          'Pick the lowest section and commit to one specific fix this week.',
          'Re-score after edits to confirm the change actually moved the metric.',
        ],
        quiz: [
          {
            id: 'q1',
            prompt: 'You score 62 overall. Structure: 80. Impact bullets: 45. Tailoring: 70. Concision: 65. Where should you spend your editing hour?',
            options: [
              {
                text: 'Structure — it\'s already strong, so polishing it is fastest.',
                isCorrect: false,
                explanation:
                  'Polishing what is already strong is low-leverage. You can only get ~20 more points there, and you will get diminishing returns the higher you go.',
              },
              {
                text: 'Impact bullets — the lowest section is where one hour of work returns the most points.',
                isCorrect: true,
                explanation:
                  'Correct. Impact bullets at 45 has the most room to move, and rewriting bullets is a high-leverage edit. One hour here can lift your overall score by 5-10 points.',
              },
              {
                text: 'A bit of all four — spread the effort evenly.',
                isCorrect: false,
                explanation:
                  'Spreading effort means small improvements everywhere and a meaningful improvement nowhere. Recruiters notice gaps, not averages.',
              },
              {
                text: 'Concision, because cutting words is fastest.',
                isCorrect: false,
                explanation:
                  'Concision is a real lever, but at 65 it is mid-range. Impact bullets at 45 is both lower-scoring and a bigger drag on the overall score.',
              },
            ],
            hint: 'The lowest section has the most room to move.',
          },
          {
            id: 'q2',
            prompt: 'Your friend says "your CV looks great, just send it". You haven\'t scored it. What does that feedback tell you?',
            options: [
              {
                text: 'It is reliable — friends are good proxies for recruiters.',
                isCorrect: false,
                explanation:
                  'Friends pattern-match on whether your CV looks like other CVs they have seen. Recruiters pattern-match on signal density. The two are not the same.',
              },
              {
                text: 'It is a useful sanity check but not a baseline.',
                isCorrect: true,
                explanation:
                  'A friend\'s read confirms the CV is not catastrophically broken. It does not tell you which section is dragging you down. Treat it as a sanity check, then run the actual baseline.',
              },
              {
                text: 'It means you can skip this module — your CV is already strong.',
                isCorrect: false,
                explanation:
                  'You cannot skip what you have not measured. "Looks great" does not tell you whether your impact bullets are weak or your tailoring is missing.',
              },
              {
                text: 'It is meaningless — only recruiters can judge a CV.',
                isCorrect: false,
                explanation:
                  'Friends can spot obvious issues like typos and bad layout. The point is that they cannot tell you what is invisible to them — like which section is weakest.',
              },
            ],
          },
          {
            id: 'q3',
            prompt: 'You score 71. After edits you re-score and get 73. What is the most useful interpretation?',
            options: [
              {
                text: 'A clear improvement — keep going.',
                isCorrect: false,
                explanation:
                  'Two points is within the noise band of any heuristic score. It is not a clear signal that anything actually changed.',
              },
              {
                text: 'Likely no real change — the section breakdown is the better tell.',
                isCorrect: true,
                explanation:
                  'Two points is roughly noise. The section breakdown will show you whether the section you edited actually moved. If it did not, the edit did not land.',
              },
              {
                text: 'A regression — your edits made the CV worse.',
                isCorrect: false,
                explanation:
                  'Two points up is not a regression. It is also not a clear improvement — which is the actual lesson here.',
              },
              {
                text: 'You should aim for at least 95 — anything less is not competitive.',
                isCorrect: false,
                explanation:
                  '95+ is rarely necessary for the roles most early-career applicants target. Optimising the number past a certain point is vanity, not strategy.',
              },
            ],
            hint: 'Watch the section that you edited, not just the headline.',
          },
        ],
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
        lessons: [
          {
            heading: 'Duties vs impact — the difference recruiters see',
            body:
              'Most CV bullets describe what you were responsible for. "Managed social media for the brand." "Helped organise events." "Worked on a team of 5 engineers." These are duties — they tell the recruiter what you were assigned to do, but nothing about whether you were any good at it.\n\nImpact bullets describe what changed because you were there. "Grew Instagram engagement 47% in 4 months by launching a weekly long-form post format." Same job — but now the recruiter knows you actually moved a number, knows how, and knows roughly how long it took. That single shift is what separates the CVs that get callbacks from the ones that don\'t.',
            bullets: [
              'A duty bullet says you showed up. An impact bullet says you delivered.',
              'A recruiter scanning 100 CVs notices impact bullets in 3 seconds — duty bullets in 0.',
              'Impact bullets compound: 4-5 strong ones make a junior CV look senior.',
            ],
          },
          {
            heading: 'The action + method + result formula',
            body:
              'Every strong bullet has three parts. Action is the verb — what you actually did. Method is how you did it — the specific approach, tool, or insight that made you not interchangeable. Result is what changed because of you, ideally with a number.\n\nAction: "Launched..." (not "was responsible for launching"). Strong verbs: built, launched, redesigned, automated, negotiated, analysed, led, prototyped. Avoid: managed, helped, supported, contributed, worked on.\n\nMethod: a specific tool, framework, or insight. "Using SQL window functions" beats "using data". "By switching from email to in-app notifications" beats "via better communication".\n\nResult: a number you can defend. "+47% engagement". "$120k cost saved". "Cut load time from 6s to 1.2s". When you don\'t have a number, give a direction and scale: "doubled the team\'s release cadence".',
            callout: {
              label: 'Memorise the structure',
              text: '[Strong verb] + [specific method] + [measurable result]. Every bullet, every time.',
            },
          },
          {
            heading: 'Where the numbers come from',
            body:
              'The number-one objection students raise is: "I don\'t have numbers from my role." You almost always do — you just haven\'t looked.\n\nFour places to find them: (1) anything that grew or shrank — followers, sales, sign-ups, errors, cycle time. (2) anything that scaled — number of users, events, students, customers reached. (3) anything you saved — hours, dollars, headcount. (4) anything that compared — your performance vs. baseline, vs. peers, vs. last year.\n\nIf the metric truly doesn\'t exist, estimate honestly. "Reduced onboarding time by ~30% (from 3 weeks to 2)" is fine even if the 30% is a back-of-envelope. Recruiters will not subpoena you. What they will reject: bullets with no numbers and no scale at all.',
            bullets: [
              'Numbers don\'t need to be precise — directional with scale is enough.',
              'Estimate honestly when exact data isn\'t available; mark it as approximate.',
              'If you really can\'t quantify, name the audience size: "...to a team of 12 PMs", "...across 4 retail sites".',
            ],
          },
          {
            heading: 'The before/after rewrite',
            body:
              'Take a real bullet. Rewrite it three ways. The discipline of doing this once per role is what trains the muscle.\n\nBefore: "Was part of the team that launched the new mobile app."\n\nIteration 1 (action verb): "Helped launch new mobile app." → still weak; "helped" undoes the verb.\n\nIteration 2 (action + method): "Built the onboarding flow for our new mobile app using a 3-screen wizard pattern." → better; specific contribution and method.\n\nIteration 3 (action + method + result): "Built the onboarding flow for our new mobile app using a 3-screen wizard pattern, lifting Day-1 retention from 31% to 48%." → strong. Recruiter now knows what you did, how, and that it worked.\n\nDo this rewrite for every bullet on your CV. Most will follow the same pattern: you have the action, you can dig up the method, you can find or estimate the result. Do not skip the result step — it\'s where 80% of the value is.',
            callout: {
              label: 'Anti-pattern',
              text: '"Helped", "assisted", "contributed to", "was part of" — these verbs cap your bullet at duty-level. Replace with whatever you specifically did, even if it\'s small.',
            },
          },
        ],
        keyTakeaways: [
          'Duty bullets describe what you were assigned; impact bullets describe what changed.',
          'Every bullet: strong verb + specific method + measurable result.',
          'You almost always have numbers — they hide in growth, scale, savings, and comparisons.',
          'Avoid weak verbs (helped, supported, worked on) — they cap your bullet at duty-level.',
        ],
        quiz: [
          {
            id: 'q1',
            prompt: 'Which is the strongest impact bullet for an internship?',
            options: [
              {
                text: 'Was responsible for the customer onboarding email sequence.',
                isCorrect: false,
                explanation:
                  'Pure duty bullet. "Was responsible for" is the weakest possible verb — it tells the reader nothing about what you did or whether it worked.',
              },
              {
                text: 'Rewrote the customer onboarding email sequence by switching from a 7-email drip to a 3-email "trigger and prompt" format, lifting open rates from 22% to 38% over 8 weeks.',
                isCorrect: true,
                explanation:
                  'Right. Action verb (Rewrote), specific method (3-email trigger and prompt), measurable result (open rate +16pp), and time scale (8 weeks). Recruiter now has a complete picture in one line.',
              },
              {
                text: 'Helped improve the customer onboarding emails to drive better engagement.',
                isCorrect: false,
                explanation:
                  '"Helped" caps the bullet, "improve" is vague, and "drive better engagement" has no number. Reads like you weren\'t actually accountable for an outcome.',
              },
              {
                text: 'Worked on email marketing as part of a 5-person team.',
                isCorrect: false,
                explanation:
                  'Tells the recruiter you were on a team but nothing about your specific contribution or its result. Almost worse than no bullet — it suggests you can\'t articulate your own impact.',
              },
            ],
            hint: 'Look for: action verb + specific method + measurable result.',
          },
          {
            id: 'q2',
            prompt: 'You can\'t find an exact number for the impact of one of your projects. What\'s the right move?',
            options: [
              {
                text: 'Leave the bullet as a duty bullet and move on.',
                isCorrect: false,
                explanation:
                  'A duty bullet is the worst outcome — it competes with every other duty bullet on every CV and says nothing distinctive about you.',
              },
              {
                text: 'Estimate honestly with a directional number and a scale anchor — "reduced onboarding time by ~30%, from 3 weeks to 2".',
                isCorrect: true,
                explanation:
                  'Right. An honest estimate with scale is much stronger than no number. The scale (3→2 weeks) anchors the percentage so it\'s defensible if asked.',
              },
              {
                text: 'Make up a precise-sounding number to look impressive.',
                isCorrect: false,
                explanation:
                  'Never. Recruiters can ask about specific numbers in interviews, and inventing one ruins the whole CV. Estimate honestly or use a different angle.',
              },
              {
                text: 'Use a generic phrase like "significantly improved performance".',
                isCorrect: false,
                explanation:
                  '"Significantly" with no number is a tell that you\'re hiding something. Recruiters discount the claim entirely.',
              },
            ],
          },
          {
            id: 'q3',
            prompt: 'Your bullet reads: "Worked with the data team on a project to improve query speed." What\'s the highest-leverage single fix?',
            options: [
              {
                text: 'Replace "Worked with" with "Collaborated with".',
                isCorrect: false,
                explanation:
                  '"Collaborated" is just a longer way to say "worked with". Same problem; doesn\'t add specificity or impact.',
              },
              {
                text: 'Replace the verb and add a method + result: "Cut query speed 4x by adding compound indexes to the 3 most-queried tables."',
                isCorrect: true,
                explanation:
                  'Right. The single biggest leverage is moving from passive participation to specific contribution + measurable result. The fix touches all three components of a strong bullet.',
              },
              {
                text: 'Add the team size: "Worked with the 8-person data team..."',
                isCorrect: false,
                explanation:
                  'Team size doesn\'t describe your contribution. The bullet still tells the reader nothing about what you did or whether it worked.',
              },
              {
                text: 'Add the duration: "Spent 3 months working with the data team..."',
                isCorrect: false,
                explanation:
                  'Time spent without outcome is anti-impact — it suggests you took 3 months to do something unspecified. Outcome is what matters.',
              },
            ],
            hint: 'The biggest gap in this bullet is the missing result. Filling it changes everything.',
          },
        ],
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
        lessons: [
          {
            heading: 'The 6-second rule',
            body:
              'Multiple eye-tracking studies have found the same thing: recruiters spend 6-8 seconds on a CV before deciding to read more or move on. That\'s not their fault — they\'re looking at hundreds of CVs per role. It\'s the constraint you\'re writing for.\n\nIn 6 seconds, the only words that get read are the ones the eye lands on. White space helps. Bold helps. Short bullets help. Long paragraphs and dense pages? They get skimmed past entirely. Length is not a virtue — every extra word competes for the same 6-second budget.',
            bullets: [
              'A 1-page CV with 250 strong words beats a 2-page CV with 600 mediocre words.',
              'Every sentence that doesn\'t earn its place dilutes every sentence that does.',
              'White space is part of the design — leave it intentionally.',
            ],
          },
          {
            heading: 'The four kinds of waste',
            body:
              'Most CVs have the same four kinds of fluff. Cutting them is mechanical once you can spot the pattern.\n\n1. Hedge words: "responsible for", "involved in", "helped with", "assisted in", "participated in". Replace with the actual verb of what you did.\n\n2. Stuffing adjectives: "successfully delivered", "effectively managed", "strongly contributed". Successful and effective are assumed — if it wasn\'t successful, why is it on your CV?\n\n3. Throat-clearing introductions: "In this role, I had the opportunity to...", "My responsibilities included...", "During my time at...". Cut to the action.\n\n4. Self-evident context: "in a fast-paced environment", "in a team setting", "in a professional capacity". Every job is in a fast-paced environment. Every team job is in a team setting.',
            callout: {
              label: 'Spot the pattern',
              text: 'If you removed the word, would the bullet lose meaning? If no — cut it. Apply ruthlessly: "successfully" almost always fails this test.',
            },
          },
          {
            heading: 'Sentence-level surgery',
            body:
              'Once obvious fluff is gone, take a second pass at the structure of each line.\n\nReplace nouns with verbs: "Responsible for the management of inventory" → "Managed inventory." Verbs are stronger than gerunds.\n\nMerge or kill weak bullets: if two bullets describe the same thing in slightly different ways, keep the stronger one. If a bullet is a setup for the next one, merge them.\n\nLead with the result: instead of "Built X using Y, achieving Z", try "Achieved Z by building X with Y" when Z is the headline. The eye lands on the first word of every bullet — make it the strongest word.\n\nCut whole bullets that don\'t add new signal. A bullet that says "Took initiative on team projects" tells the recruiter nothing they didn\'t already assume. Delete.',
            bullets: [
              'Verbs > gerunds: "Managed" beats "Was responsible for the management of".',
              'Two weak bullets that say similar things → one stronger bullet.',
              'Lead with whichever element is the strongest signal — usually the result.',
            ],
          },
          {
            heading: 'When to cut vs when to expand',
            body:
              'Cutting is the dominant move, but a few sections deserve more space, not less.\n\nExpand on: your strongest impact bullets, the most relevant role for the job you\'re targeting, projects with quantified outcomes. These are your selling points — give them room to breathe.\n\nCut hard: jobs more than 5-7 years old (unless directly relevant), responsibilities at the same level as your current role (the recruiter assumes them), generic skill sections that read like buzzword soup ("Microsoft Office, communication, teamwork").\n\nThe overall ratio that works for most early-career CVs: 60% experience, 20% education + projects, 10% skills, 10% summary or objective. If your skills section is 30% of the page, you\'re hiding behind keywords instead of showing impact.',
            callout: {
              label: 'Final test',
              text: 'Read your CV out loud. Anywhere your voice slows or you have to re-read — cut or rewrite. The eye does what the voice does.',
            },
          },
        ],
        keyTakeaways: [
          'Recruiters spend 6 seconds — every word competes for that budget.',
          'Four kinds of waste: hedge words, stuffing adjectives, throat-clearing, self-evident context.',
          'Verbs beat gerunds; merge weak overlapping bullets; lead with the strongest signal.',
          'Cut hard on old roles and skill soup; expand on impact bullets that sell you.',
        ],
        quiz: [
          {
            id: 'q1',
            prompt: 'Which of these bullets has the most cuttable fluff?',
            options: [
              {
                text: 'Launched A/B testing framework, raising checkout conversion from 2.1% to 3.4% over Q3.',
                isCorrect: false,
                explanation:
                  'This is tight — every word earns its place. Action verb, specific method, measurable result, time anchor.',
              },
              {
                text: 'Successfully helped to launch a comprehensive A/B testing framework which contributed to improving conversion in a fast-paced environment.',
                isCorrect: true,
                explanation:
                  'Right. "Successfully", "helped to", "comprehensive", "contributed to improving", and "fast-paced environment" are all fluff. Cutting them yields the bullet from option A.',
              },
              {
                text: 'Built A/B testing framework — checkout conversion: 2.1% → 3.4%.',
                isCorrect: false,
                explanation:
                  'Concise, but a touch terse and missing the time scale. Less wasteful than option B, but the cleanest version is option A.',
              },
              {
                text: 'Drove $400k incremental revenue by launching new A/B testing pipeline.',
                isCorrect: false,
                explanation:
                  'Tight bullet — different angle (revenue first) but no fluff. Stronger than B by a wide margin.',
              },
            ],
            hint: 'Look for stacked hedge words and self-evident context.',
          },
          {
            id: 'q2',
            prompt: 'Your CV is 1.5 pages and you want it on 1. Which cut should you make first?',
            options: [
              {
                text: 'Shrink the font from 11pt to 9pt.',
                isCorrect: false,
                explanation:
                  'Smaller fonts make the CV harder to skim — directly fighting the 6-second rule. The fix is fewer words, not smaller words.',
              },
              {
                text: 'Cut your oldest role and any duplicate-level responsibilities; trim hedge words across remaining bullets.',
                isCorrect: true,
                explanation:
                  'Right. Old roles below your current level are the highest-leverage cut — they take space without adding signal. Hedge-word cuts compound across the page.',
              },
              {
                text: 'Reduce margins to half an inch.',
                isCorrect: false,
                explanation:
                  'Tight margins look amateurish and reduce skim-ability. White space is part of the design.',
              },
              {
                text: 'Move the Education section to two columns to save vertical space.',
                isCorrect: false,
                explanation:
                  'Two-column layouts often break in ATS parsers and look cluttered. Layout tricks are a poor substitute for cutting words.',
              },
            ],
          },
          {
            id: 'q3',
            prompt: 'Why does "Successfully managed a team of 5 in a fast-paced environment" fail the cuts test?',
            options: [
              {
                text: 'It mentions team size, which is not relevant.',
                isCorrect: false,
                explanation:
                  'Team size is fine — it\'s scale information that adds context. The problem is elsewhere.',
              },
              {
                text: '"Successfully" and "fast-paced environment" are assumed; cutting them produces "Managed a team of 5".',
                isCorrect: true,
                explanation:
                  'Right. "Successfully" assumes its opposite ("unsuccessfully managed" wouldn\'t be on a CV). "Fast-paced environment" applies to every job. Both fail the "would removing this lose meaning?" test.',
              },
              {
                text: '"Managed" is too weak a verb — it should be "led".',
                isCorrect: false,
                explanation:
                  '"Managed" is fine for a management role. Substituting "led" doesn\'t fix the actual fluff problem.',
              },
              {
                text: 'It needs a result to be useful.',
                isCorrect: false,
                explanation:
                  'A result would help, but the question was about cuts — the existing words include obvious cuttable filler regardless of whether you also add a result.',
              },
            ],
            hint: 'Apply the test: would removing the word lose meaning?',
          },
        ],
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
        lessons: [
          {
            heading: 'Why most "tailoring" is a waste of time',
            body:
              'When career advisors say "tailor your CV for every application", most students hear: rewrite the CV from scratch each time. That\'s the wrong interpretation, and it\'s the reason most students stop tailoring after their fifth application.\n\nThe right interpretation: your CV already contains your real experience. Tailoring is about which parts of that experience the recruiter sees first. The first 3 bullets a recruiter reads decide whether they keep going. So tailoring is mostly an ordering problem — not a content problem. Reorder, don\'t reinvent.',
            bullets: [
              'You have one master CV with your strongest material — that\'s the source.',
              'For each application, you reorder so the most-relevant 3 bullets lead.',
              'Reordering takes 5 minutes; rewriting takes 60 — and the rewrite usually weakens the work.',
            ],
          },
          {
            heading: 'Read the JD like an analyst',
            body:
              'A job description is a checklist of what the recruiter is hiring for, in priority order. The first 3 bullets in the "responsibilities" or "requirements" section are usually the make-or-break ones; the last 3 are nice-to-haves.\n\nGo through the JD and highlight: (1) the hard skills named (e.g. SQL, Python, Salesforce), (2) the verbs used to describe the role (build, lead, analyse, design), (3) the outcomes the team is hiring for (revenue growth, faster releases, retention).\n\nNow look at your master CV. For each highlighted item, ask: do I have a bullet that demonstrates it? If yes, that bullet should move toward the top of its section. If you have a strong bullet for a hard skill that\'s not surfaced in your top 3, you\'re leaving conversion on the table.',
            callout: {
              label: 'Quick test',
              text: 'After tailoring, scan the top 3 bullets in your most recent role. They should map directly to the top 3 items in the JD. If they don\'t, reorder again.',
            },
          },
          {
            heading: 'Three legitimate small rewrites',
            body:
              'Reordering covers most of the tailoring you need. But three small rewrite moves are worth doing per application:\n\n1. Swap the keyword. If the JD says "data pipelines" and your bullet says "ETL workflows", change "ETL workflows" to "data pipelines" — it\'s the same thing, but ATS systems and recruiters scan for the JD\'s exact phrase.\n\n2. Foreground the relevant outcome. If your bullet has multiple results ("...lifting both retention and revenue..."), and the JD emphasises retention, lead with retention.\n\n3. Tighten the headline. Some students keep a brief headline above their experience section ("Product analyst with 3 years in B2B SaaS"). Adjust this one line to match the level and domain in the JD ("Product analyst with 3 years in B2B SaaS, focused on retention and onboarding").\n\nThese three moves take 5 minutes total. They don\'t change your underlying experience — they just align the surface to what the recruiter is looking for.',
            bullets: [
              'Swap synonyms to match the JD\'s exact terms (especially for ATS).',
              'Foreground the result the JD cares about most.',
              'Tighten your headline to match level and domain.',
            ],
          },
          {
            heading: 'When NOT to apply',
            body:
              'A useful side-effect of tailoring: if you can\'t easily match the JD with your top 3 bullets, you\'re probably underqualified — or the role isn\'t actually what you want.\n\nIf you find yourself stretching, manufacturing matches, or wishing you had different experience, treat it as a signal. Either find a related role that\'s a better fit, or build the missing skill before applying. Stretching is rarely worth it: the recruiter sees through forced matches in seconds, and a rejection on a stretch role costs you the same effort as a rejection on a fit role.\n\nThe goal of tailoring isn\'t to make any CV fit any job — it\'s to surface fit when fit exists. If fit doesn\'t exist, tailoring won\'t fix it.',
            callout: {
              label: 'Heuristic',
              text: 'If tailoring takes more than 15 minutes, the role is probably wrong for you right now. Save your effort for the next one.',
            },
          },
        ],
        keyTakeaways: [
          'Tailoring is mostly reordering — not rewriting. 5 minutes per application, not 60.',
          'Read the JD like an analyst: top 3 items decide the fit; reorder your bullets to match.',
          'Three small rewrites are worth it: synonym swaps, foregrounded outcomes, headline alignment.',
          'If tailoring takes more than 15 minutes, the role is probably wrong for you.',
        ],
        quiz: [
          {
            id: 'q1',
            prompt: 'You\'re applying to a "Growth Analyst" role that emphasises SQL, retention metrics, and experimentation. Your master CV has a strong bullet on retention experiments using SQL — but it\'s the 4th bullet in your most recent role. What\'s the right move?',
            options: [
              {
                text: 'Leave it where it is — recruiters read the whole CV anyway.',
                isCorrect: false,
                explanation:
                  'Recruiters skim in 6 seconds. A 4th-position bullet rarely gets read. The position determines whether the strongest evidence is seen.',
              },
              {
                text: 'Move it to position 1 — the first bullet a recruiter reads should be the one that maps most directly to the JD.',
                isCorrect: true,
                explanation:
                  'Right. Reordering is the highest-leverage tailoring move. The recruiter\'s eye lands on the first bullet of your most recent role; that\'s the position your strongest evidence belongs in.',
              },
              {
                text: 'Rewrite it from scratch to use even more JD keywords.',
                isCorrect: false,
                explanation:
                  'Rewriting from scratch is high-effort and usually produces a weaker bullet. The bullet is already strong; surface it.',
              },
              {
                text: 'Add it to your skills section as well, for redundancy.',
                isCorrect: false,
                explanation:
                  'Skills sections are read shallowly. Repeating doesn\'t help — surfacing the bullet to position 1 does.',
              },
            ],
            hint: 'Position determines visibility — the strongest bullet belongs first.',
          },
          {
            id: 'q2',
            prompt: 'A JD says "experience building data pipelines". Your CV bullet says "designed and maintained ETL workflows". What\'s the cleanest tailoring move?',
            options: [
              {
                text: 'Leave it — they mean the same thing, the recruiter will know.',
                isCorrect: false,
                explanation:
                  'They mean the same thing technically, but ATS systems and skim-reading recruiters often scan for the exact phrase. Mismatched terms can cost you the surface match.',
              },
              {
                text: 'Swap "ETL workflows" for "data pipelines" — same content, JD-matching language.',
                isCorrect: true,
                explanation:
                  'Right. A synonym swap is a 5-second change that aligns your CV with the JD\'s vocabulary. Honest because the work is the same, effective because both ATS and skimming recruiters now register the match.',
              },
              {
                text: 'Add a separate bullet using "data pipelines" so both terms appear.',
                isCorrect: false,
                explanation:
                  'Two bullets describing the same work waste space and dilute the rest of your CV. The single bullet, with the matching term, is stronger.',
              },
              {
                text: 'Replace ETL workflows with a bullet about a different project.',
                isCorrect: false,
                explanation:
                  'You\'d be deleting strong evidence to add weaker evidence. The synonym swap preserves your content while fixing the language.',
              },
            ],
          },
          {
            id: 'q3',
            prompt: 'You\'ve been tailoring for 30 minutes and still can\'t match more than 2 of 5 JD requirements with strong bullets. What does that signal?',
            options: [
              {
                text: 'Keep going — more time will surface a match.',
                isCorrect: false,
                explanation:
                  'If 30 minutes hasn\'t produced fit, more time won\'t. The fit problem is content, not effort.',
              },
              {
                text: 'You\'re likely underqualified or this role is the wrong fit — apply selectively or build the missing skill first.',
                isCorrect: true,
                explanation:
                  'Right. Tailoring is for surfacing fit that exists. If fit doesn\'t exist, tailoring is the wrong tool — better to find a better-fit role or invest in closing the skill gap.',
              },
              {
                text: 'Manufacture experience by stretching what you\'ve done.',
                isCorrect: false,
                explanation:
                  'Stretching is the path most students fall into. Recruiters see through forced matches; rejections on stretches cost the same as rejections on fits, and they hurt your confidence more.',
              },
              {
                text: 'Apply anyway — recruiters reject 90% of CVs regardless.',
                isCorrect: false,
                explanation:
                  'Even if true on average, applying when you\'re a poor fit consumes time you could spend on better-fit roles. Selectivity compounds — fit-roles convert dramatically better.',
              },
            ],
            hint: 'Tailoring effort is diagnostic — if it\'s taking too long, the underlying fit is wrong.',
          },
        ],
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
        lessons: [
          {
            heading: 'Why measuring twice matters',
            body:
              'You\'ve done the work — rewritten bullets, cut waste, tailored for a target role. The temptation now is to start sending. Don\'t. Re-scoring takes 5 minutes and tells you whether the work actually landed.\n\nMost edits feel better than they actually are. You\'re close to the material; you\'ve been staring at it for an hour; small changes feel like big improvements. The score breakdown is your independent check — it didn\'t see the effort, only the output. If the section you targeted didn\'t move, the edit didn\'t land. Better to discover that now than after 50 rejections.',
            bullets: [
              'Re-scoring is the only objective check that the edits actually worked.',
              'Self-perception of improvement is unreliable — the section breakdown isn\'t.',
              'Five minutes of measurement saves weeks of unproductive applications.',
            ],
          },
          {
            heading: 'Reading the delta',
            body:
              'When the new score comes back, compare against your baseline by section, not headline.\n\nIf the section you targeted moved up: good signal. The edits landed. Move on.\n\nIf the section you targeted didn\'t move: the edit didn\'t land. Two common causes — (1) you fixed the wrong thing inside the section (e.g. you cut waste but didn\'t add results); (2) the score weighs something you didn\'t address.\n\nIf a section you didn\'t target dropped: rare, but worth checking. Often this is a sign that your edits to one section accidentally weakened another (e.g. cutting bullets dropped your tailoring score because you removed a relevant one).\n\nIf the headline moved 5+ points: the work landed broadly. Lock in and move to the application phase.',
            callout: {
              label: 'Common pattern',
              text: 'A 2-point change is noise. A 5-point change is signal. A 10-point change means a section was genuinely weak and is now genuinely strong.',
            },
          },
          {
            heading: 'When to do a second pass',
            body:
              'If a target section didn\'t move, do a focused second pass — but don\'t restart the whole CV.\n\nGo back to the Module 1 baseline reading. The lowest section there is the one that needed work. Pull up just that section and the rubric for it. Ask: what specifically does the score punish, and which of those specifics are present in my section?\n\nFor impact bullets that didn\'t move: count how many of your bullets have all three elements (action verb + method + result). If fewer than 80% have all three, that\'s the gap. For tailoring that didn\'t move: re-read the JD, then re-read your top 3 bullets, and check whether they map line-by-line. For concision: get a fresh pair of eyes (a friend, AI, or yourself after a 24-hour break) — your own concision blind spots are usually fixed by distance.',
            bullets: [
              'Don\'t restart — focus the second pass only on the section that didn\'t move.',
              'Re-read the rubric for that section; check your bullets against it line by line.',
              'For concision, distance helps — wait a day before another pass.',
            ],
          },
          {
            heading: 'Locking in and moving forward',
            body:
              'Once your CV scores in the band you\'re aiming for and the section breakdown is balanced, stop editing. Diminishing returns kick in fast — going from 70 to 80 takes hours; going from 85 to 90 can take days for marginal gains.\n\nWhat to do once locked in: (1) save a clean master copy. (2) save 1-2 role-specific tailored versions for the JDs you\'re actively applying to. (3) set a reminder to re-score quarterly — not because the CV degrades, but because your experience grows and the CV needs to grow with it.\n\nThe ongoing habit: every time you finish a meaningful project or land a measurable result, add a draft bullet to a "raw bullets" doc. When you re-score quarterly, polish those drafts and integrate. This is how a CV stays current without ever needing a full rewrite again.',
            callout: {
              label: 'Diminishing returns',
              text: 'Going from a low score to a competitive score is high-leverage. Going from competitive to elite is usually vanity. Spend the marginal hour on applications, not on the score.',
            },
          },
        ],
        keyTakeaways: [
          'Re-scoring is the objective check on whether your edits actually landed.',
          'Compare deltas section-by-section — the headline can mask uneven changes.',
          'If a target section didn\'t move, do a focused second pass, don\'t restart.',
          'Once you\'re in the competitive band, lock in — diminishing returns kick in fast.',
        ],
        quiz: [
          {
            id: 'q1',
            prompt: 'You re-score after editing and see the headline moved from 65 to 72, but Impact Bullets (the section you targeted) only moved from 50 to 53. What\'s the right interpretation?',
            options: [
              {
                text: 'Great result — the headline moved 7 points.',
                isCorrect: false,
                explanation:
                  'The headline moved because other sections improved as a side-effect — not because your targeted section actually got fixed. Impact Bullets is still 53/100, which is the real problem.',
              },
              {
                text: 'The targeted edit didn\'t land — the section breakdown shows Impact Bullets is still weak. Do a focused second pass.',
                isCorrect: true,
                explanation:
                  'Right. A 3-point move on the targeted section is noise. The section is still weak; the edits you made didn\'t address what the score actually rewards. Diagnose what\'s missing (likely results) and pass again.',
              },
              {
                text: 'Stop editing — you\'re close to a competitive headline.',
                isCorrect: false,
                explanation:
                  '72 is below most competitive bands, and the underlying weakness (Impact Bullets at 53) will still drag you down in human review. Stopping now wastes the work you\'ve started.',
              },
              {
                text: 'Switch to editing a different section to push the headline higher.',
                isCorrect: false,
                explanation:
                  'Abandoning a section before fixing it leaves a known weakness in the CV. Better to finish the job on Impact Bullets than to compensate by polishing elsewhere.',
              },
            ],
            hint: 'Section breakdown matters more than headline.',
          },
          {
            id: 'q2',
            prompt: 'Your Impact Bullets section moved from 50 to 75. You\'re re-reading your bullets and most have action+method+result. Which is the right next step?',
            options: [
              {
                text: 'Push for a 90+ on this section before stopping.',
                isCorrect: false,
                explanation:
                  'Diminishing returns. Going from 75 to 90 in this section is much harder than going from 50 to 75 — and the marginal value to a recruiter is small. Better to spend that time elsewhere.',
              },
              {
                text: 'Lock in this section and check whether other sections (Tailoring, Concision) need a pass.',
                isCorrect: true,
                explanation:
                  'Right. 75 is competitive. The next-highest leverage is whichever section is still weakest. Look at the breakdown again, pick the next-lowest, and apply the same focused approach.',
              },
              {
                text: 'Move on and start applying — this is good enough.',
                isCorrect: false,
                explanation:
                  'You\'ve fixed one section. If others are still weak, the overall CV will still under-perform. Quick scan of the breakdown takes 30 seconds and tells you whether the rest is in the competitive band too.',
              },
              {
                text: 'Re-score in a week to see if the change persists.',
                isCorrect: false,
                explanation:
                  'The score doesn\'t drift — it scores the document you give it. Waiting adds no information.',
              },
            ],
          },
          {
            id: 'q3',
            prompt: 'You\'ve hit 88 overall and every section is in the 80s. You\'ve been editing for 3 hours total. What\'s the right move?',
            options: [
              {
                text: 'Keep editing — you can probably push to 95.',
                isCorrect: false,
                explanation:
                  'Diminishing returns. The marginal hour is much better spent on applications, networking, or interview prep than on extracting the last 5 points from the CV.',
              },
              {
                text: 'Lock in, save your master + tailored versions, and move on to applications.',
                isCorrect: true,
                explanation:
                  'Right. 88 is competitive in nearly every market. The optimisation past this point is vanity, not strategy. Spend the next hour on the next step in the funnel.',
              },
              {
                text: 'Get 5 friends to review it before locking in.',
                isCorrect: false,
                explanation:
                  '5 reviewers will give you 5 conflicting opinions, most reflecting their own biases. One trusted reviewer is fine; 5 is decision-paralysis.',
              },
              {
                text: 'Wait a week and re-edit with fresh eyes.',
                isCorrect: false,
                explanation:
                  'A week of delay costs you a week of applications. If the CV is in the competitive band, ship it and refine quarterly.',
              },
            ],
            hint: 'Past a certain point, the bottleneck moves elsewhere — applications, interviews, networking.',
          },
        ],
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
        lessons: [
          {
            heading: 'Why a library beats winging it',
            body:
              'Behavioural questions follow a predictable pattern. "Tell me about a time you led a team." "Describe a time you handled conflict." "Walk me through a failure." There are roughly 30 standard variants, and they all probe one of about 6 underlying themes.\n\nThe candidate who walks in cold, hoping to remember a relevant story under pressure, almost always tells a weaker version than the candidate who has 6 prepared stories ready to deploy. The prepared candidate isn\'t reading from a script — they\'ve done the work to identify their best material, refine it, and know which story to use for which question. That preparation looks like fluency in the room.',
            bullets: [
              '6 stories, well-crafted, can answer 80% of behavioural questions you\'ll face.',
              'Preparation isn\'t scripting — it\'s knowing your strongest material so you don\'t freeze.',
              'The same story can serve multiple themes; the framing changes, the events don\'t.',
            ],
          },
          {
            heading: 'STAR — what each letter actually means',
            body:
              'Situation: the context. Where, when, what was happening. Keep it short — 2 sentences max. Most candidates over-invest here and run out of time before getting to the action.\n\nTask: what specifically was your responsibility. The hand-off from Situation. "I was asked to..." or "My job was to...". One sentence.\n\nAction: what YOU did. This is the heart of the story. 60-70% of your time should be here. Use "I", not "we" — the interviewer wants to know your contribution, not your team\'s. Be specific about decisions you made and why.\n\nResult: what changed because of you. With a number when possible. Even a directional number ("response time dropped from days to hours") is stronger than no number.\n\nThe ratio that works: ~10% Situation, ~10% Task, ~70% Action, ~10% Result. Most candidates do 50/30/15/5 — and wonder why they get follow-up questions about what they actually did.',
            callout: {
              label: 'The "I" rule',
              text: 'In behavioural answers, every "we" should be challenged: did I do this, or did the team do this? The interviewer is hiring you, not your team.',
            },
          },
          {
            heading: 'The 6 themes to cover',
            body:
              'Build one strong story for each of these six themes. Each story should be roughly 90 seconds when told well.\n\n1. Leadership — a time you led without formal authority, or stepped up when no one else did.\n2. Conflict — a disagreement with a colleague or stakeholder that you navigated to a constructive outcome.\n3. Failure — something that didn\'t go to plan and what you learned. (Most candidates skip the "what I learned" — that\'s the whole point.)\n4. Initiative — something you started without being asked because you saw the need.\n5. Teamwork — a time you contributed meaningfully to a team\'s outcome, especially when collaboration was hard.\n6. Ambiguity — a situation with unclear direction where you defined the path forward.\n\nFor each, pick the strongest example you have. If you have 3 candidates for "leadership", pick the one with the best Result. If you have 0 for "ambiguity", that\'s a gap — find an example, even a small one, and develop it.',
            bullets: [
              '6 stories cover ~80% of behavioural questions.',
              'Pick examples with the strongest Result for each theme.',
              'Gaps (themes you can\'t fill) are signals about experience to seek out.',
            ],
          },
          {
            heading: 'Refining and recombining',
            body:
              'A first-draft STAR story is usually too long, too vague on Action, and too light on Result. Rehearse each one out loud and time yourself — if it\'s over 2 minutes, it\'s too long. If under 60 seconds, you\'re probably skipping detail.\n\nThe magic of a good library: stories recombine across themes. Your "leadership" story might also work for "ambiguity" if reframed. The conflict you navigated might also be a "communication" story. Once your 6 are solid, run a mental drill: for each common interview question, which 1-2 of my stories could answer it? You\'ll find most stories cover 2-3 questions each.\n\nWrite each story in a single document. Title each one ("Leadership: the offsite project"), then write the STAR underneath. Reread before every interview. The repetition isn\'t lazy — it\'s how the stories become natural in the room.',
            callout: {
              label: 'The 90-second test',
              text: 'Time yourself. Each story should run 90 seconds, give or take. Under 60 = thin. Over 120 = bloated. The discipline of timing trains pacing.',
            },
          },
        ],
        keyTakeaways: [
          '6 well-built stories cover ~80% of behavioural questions.',
          'STAR ratio: ~70% should be the Action — what YOU specifically did.',
          'Replace "we" with "I" — the interviewer is hiring you, not the team.',
          'Stories recombine across themes when reframed; one library serves many questions.',
        ],
        quiz: [
          {
            id: 'q1',
            prompt: 'In a 90-second STAR answer, what\'s the right time allocation?',
            options: [
              {
                text: '30s Situation, 30s Task, 20s Action, 10s Result.',
                isCorrect: false,
                explanation:
                  'This is the most common mistake — over-investing in setup. The interviewer doesn\'t need a full backstory; they need to know what YOU did and what changed.',
              },
              {
                text: '10s Situation, 10s Task, 60s Action, 10s Result.',
                isCorrect: true,
                explanation:
                  'Right. The Action is the centre of the answer — it\'s where the interviewer learns about you. Setup should be quick; outcome should be specific.',
              },
              {
                text: 'Equal time for each section.',
                isCorrect: false,
                explanation:
                  'Equal weight is never right. Action is the disproportionate focus; the others are supports.',
              },
              {
                text: 'Skip Situation entirely and start with Action.',
                isCorrect: false,
                explanation:
                  'A small amount of context (10 seconds) helps the interviewer follow. Skipping it entirely makes the Action hard to interpret.',
              },
            ],
            hint: 'The interviewer is hiring you for what you did, not for the situation you happened to be in.',
          },
          {
            id: 'q2',
            prompt: 'You\'re asked "tell me about a time you led a team". Your answer is full of "we did X, we decided Y, we shipped Z". The interviewer asks a follow-up about your specific contribution. What does that signal?',
            options: [
              {
                text: 'They\'re testing whether you can handle pressure.',
                isCorrect: false,
                explanation:
                  'It\'s less adversarial than that. They couldn\'t tell from your answer what you specifically did, so they\'re asking — and your answer didn\'t do its job.',
              },
              {
                text: 'They couldn\'t tell what you actually did — your "we" language hid your contribution.',
                isCorrect: true,
                explanation:
                  'Right. "We" is the most common STAR failure mode. The follow-up is the interviewer trying to extract the answer your story should have already given. Best fix: rebuild the answer with "I" verbs leading each sentence.',
              },
              {
                text: 'They\'re curious about the team dynamics.',
                isCorrect: false,
                explanation:
                  '"Tell me about your specific contribution" is rarely about team dynamics — it\'s a direct request for what you did, which the original answer should have made clear.',
              },
              {
                text: 'They\'re checking if you can give credit to others.',
                isCorrect: false,
                explanation:
                  'Credit-sharing is fine, but the interviewer is hiring you. They need to know your contribution; "we" makes that invisible.',
              },
            ],
          },
          {
            id: 'q3',
            prompt: 'You have 5 candidates for your "failure" story. Which one is the strongest?',
            options: [
              {
                text: 'A small project I worked on once that went mildly off-track.',
                isCorrect: false,
                explanation:
                  'Too small. Interviewers want to see how you handle real failure — minor setbacks don\'t reveal much.',
              },
              {
                text: 'A major project I led that missed its goal — but I can clearly articulate why, what I changed, and the result of that change.',
                isCorrect: true,
                explanation:
                  'Right. The strongest failure story is one with stakes (real failure), reflection (you understood why), and growth (you changed something). The "what I learned and applied" is more important than the failure itself.',
              },
              {
                text: 'A failure that wasn\'t really my fault but happened in a project I was on.',
                isCorrect: false,
                explanation:
                  'Telling a failure story without ownership reads as deflection. Interviewers are listening for "I did X, it didn\'t work, here\'s why and what I learned" — not "here\'s what someone else got wrong".',
              },
              {
                text: 'A failure where I tried hard and circumstances were against me.',
                isCorrect: false,
                explanation:
                  'External-circumstance stories don\'t demonstrate self-awareness or growth. Interviewers will lose interest fast.',
              },
            ],
            hint: 'A great failure story is really a learning story — the failure is the setup.',
          },
        ],
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
        lessons: [
          {
            heading: 'What "did your research" actually means',
            body:
              'Every interviewer has heard candidates list the company\'s mission statement back at them. It\'s table stakes — necessary but not impressive. The candidates who stand out demonstrate research that suggests genuine curiosity: they know about a recent product release, a strategic shift, or a public conversation the company is part of.\n\nThis matters for two reasons. First, it signals you actually want to work HERE, not just somewhere. Second, it shapes the conversation: an interviewer who hears you reference their Q3 product launch will ask you about it, and you\'ll have a richer conversation than the candidate who got the same generic questions everyone else got.',
            bullets: [
              'Mission and values are table stakes — knowing them gets you past the bar, not above it.',
              'Specific, recent knowledge signals real interest and shapes the conversation in your favour.',
              'Research is a forcing function — if you can\'t do it, you probably don\'t want the job that much.',
            ],
          },
          {
            heading: 'The 1+1+1 brief',
            body:
              'Before any interview, complete this in 20 minutes:\n\n1 recent strategic move. Look for a press release, blog post, or news article from the last 6 months. Have they launched something, acquired someone, restructured, raised, expanded? Pick the one that most affects the team you\'re interviewing for. Be ready to say one sentence about it and ask one question about how it affects the role.\n\n1 product detail. Use the product if you can. If it\'s consumer, sign up. If it\'s B2B, watch a demo or read the docs. Pick one specific thing about how it works (a UX choice, a feature you didn\'t expect, a flow that surprised you). Be ready to reference it.\n\n1 question you genuinely want answered. Not a generic one ("what\'s the culture like"), but a sharp, specific one that reveals you\'ve thought. Examples: "Your Q3 launch shifted toward enterprise — how is that changing what your IC engineers work on?" "I noticed your onboarding flow asks for X before Y — was that a deliberate choice?"\n\nThese three artifacts together signal preparation that 90% of candidates won\'t match.',
            callout: {
              label: 'The brief in one sentence',
              text: 'You should be able to walk into the interview and say: "I read about [strategic move], I tried out [product detail], and I\'m curious about [question]."',
            },
          },
          {
            heading: 'Where to find the signal',
            body:
              'Most candidates Google "[company name]" and read the first three results — the homepage, Wikipedia, and a Crunchbase page. None of those tell you what\'s actually happening at the company.\n\nBetter sources, in priority order:\n\n- The company\'s own blog or engineering blog (the latter especially for technical roles).\n- Their Twitter/LinkedIn for the past month — what are they posting about?\n- Recent podcast appearances by their CEO or relevant team leads.\n- Their public job descriptions across teams — gives you a sense of where the company is investing.\n- For public companies: the most recent earnings call transcript (free on most investor relations pages).\n- For private companies: TechCrunch, The Information, or industry newsletters in their space.\n\n20 minutes across these sources will give you 3-4 specific things you can reference. That\'s more than enough for one interview.',
            bullets: [
              'Skip Wikipedia and Crunchbase — they\'re table stakes summaries, not signal.',
              'Go to the source: company blog, social, leader podcasts, earnings calls.',
              '20 focused minutes beats 2 hours of unfocused Googling.',
            ],
          },
          {
            heading: 'Bringing the research into the room',
            body:
              'Research only matters if you deploy it. The natural moments are:\n\nWhen they ask "why this company?" — this is the gift question. Most candidates answer with values. You answer with a specific recent move: "I read about your launch of X last quarter and the way it shifted your strategy toward Y. That\'s the kind of bet I want to be part of, and I think this team is where the work happens."\n\nWhen the conversation lulls or they say "any questions?" — bring out the question you prepared. The quality of your questions is one of the strongest signals you give them. A specific, well-researched question moves you up in their ranking dramatically.\n\nWhen they ask about the product — reference the specific detail you noticed. "When I tried the onboarding flow, I noticed X — I\'d be curious to know the design thinking behind that." Now you\'re having a real conversation.\n\nThe rule: never bring up research as trivia ("did you know your CEO once worked at...?"). Always tie it to what you want to do, what you\'re curious about, or what shape of work the role involves.',
            callout: {
              label: 'Anti-pattern',
              text: 'Don\'t recite facts. "I see you raised $50M last year and have 200 employees" is creepy if it\'s untied to a real question. Research signals interest only when it\'s connected to something you actually care about.',
            },
          },
        ],
        keyTakeaways: [
          'Mission/values knowledge is table stakes; specific recent knowledge is what stands out.',
          '1+1+1 brief: one strategic move, one product detail, one sharp question.',
          'Source from the company\'s own blog, social, podcasts, and earnings calls — not Wikipedia.',
          'Deploy research as conversation hooks, not as trivia recitation.',
        ],
        quiz: [
          {
            id: 'q1',
            prompt: 'You\'re asked "Why our company?" in an interview. Which answer signals the strongest research?',
            options: [
              {
                text: '"Your mission to democratise access to education really resonates with me."',
                isCorrect: false,
                explanation:
                  'Mission-statement language is table stakes. The interviewer has heard this exact answer 50 times this month. It signals you read the homepage — nothing more.',
              },
              {
                text: '"I read about your shift toward B2B last quarter and the way you re-architected the product to support enterprise — that kind of mid-stage pivot is the work I want to do."',
                isCorrect: true,
                explanation:
                  'Right. This signals specific recent knowledge, ties it to what you want to do, and gives the interviewer a hook to discuss real strategy. It separates you from the 90% who say "your mission resonates".',
              },
              {
                text: '"You\'re a great company in a growing space."',
                isCorrect: false,
                explanation:
                  'Generic, no signal of research. Could be said about any company in any space.',
              },
              {
                text: '"You raised a Series B last year and your headcount is around 200."',
                isCorrect: false,
                explanation:
                  'Reciting facts without tying them to interest reads as creepy or transactional. Research signals interest only when connected to what you want to do or learn.',
              },
            ],
            hint: 'Look for: specific recent move + tied to what you want to do.',
          },
          {
            id: 'q2',
            prompt: 'You have 20 minutes to research a company before an interview. What\'s the most useful single source?',
            options: [
              {
                text: 'Their Wikipedia page.',
                isCorrect: false,
                explanation:
                  'Wikipedia is a summary written by outsiders, often outdated and missing the details that matter most. Low-leverage source.',
              },
              {
                text: 'The company\'s own blog (or engineering blog for technical roles) — recent posts.',
                isCorrect: true,
                explanation:
                  'Right. Their own blog tells you what they choose to publicly say about themselves: launches, strategy shifts, technical decisions, hiring priorities. Highest signal density per minute.',
              },
              {
                text: 'A list of "interview questions asked at [company]" on Glassdoor.',
                isCorrect: false,
                explanation:
                  'Useful for knowing what to expect, but doesn\'t help you signal interest in the company itself. Better as a separate prep step, not as your main source.',
              },
              {
                text: 'A 30-minute podcast featuring their CEO from 6 months ago.',
                isCorrect: false,
                explanation:
                  'High quality source, but takes most of your 20-minute budget. Better to scan their blog quickly and supplement with a short podcast clip if you have time.',
              },
            ],
          },
          {
            id: 'q3',
            prompt: 'At the end of the interview, the manager asks "any questions for me?" Which question signals the strongest research?',
            options: [
              {
                text: '"What\'s the culture like here?"',
                isCorrect: false,
                explanation:
                  'The most common end-of-interview question. Signals zero research. The interviewer will give a stock answer.',
              },
              {
                text: '"Your Q3 launch shifted strategy toward enterprise — how is that changing what your IC engineers actually work on day-to-day?"',
                isCorrect: true,
                explanation:
                  'Right. This question demonstrates specific knowledge of the strategic move, ties it directly to the role you\'re interviewing for, and gets you a substantive answer. It\'s also the kind of question that makes the interviewer remember you.',
              },
              {
                text: '"What\'s your management style?"',
                isCorrect: false,
                explanation:
                  'Common but generic. Better than "culture", but doesn\'t signal that you\'ve thought specifically about this company or this role.',
              },
              {
                text: '"What does success look like in the first 90 days?"',
                isCorrect: false,
                explanation:
                  'Solid question — but generic enough that it doesn\'t signal research. Useful as a follow-up question, not as your strongest one.',
              },
            ],
            hint: 'A research-signalling question is specific to this company and ties to the role.',
          },
        ],
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
        lessons: [
          {
            heading: 'Why mocks beat reviewing notes',
            body:
              'Reading your STAR stories and saying "I know these" is not the same as performing them under pressure. Interviews are a verbal medium — the gap between knowing your story and telling it well is the gap a mock closes.\n\nAI is a great mock partner because it\'s available, patient, and will ask the kind of probing follow-ups a real interviewer asks. It will challenge your "we" language, push for specifics, and ask "what would you do differently?" The first time you face these in a real interview, you should already have the muscle.',
            bullets: [
              'Knowing the answer ≠ delivering the answer under time pressure.',
              'AI mocks let you do 5x more reps than you\'d ever get from human practice.',
              'The follow-up question is usually where weak answers fail — drill it specifically.',
            ],
          },
          {
            heading: 'The mock setup that works',
            body:
              'A bad prompt: "Run a behavioural mock with me."\n\nA good prompt sets the role, the level, the company type, and the grading dimensions:\n\n"You\'re a hiring manager at a mid-stage tech company interviewing me for a [role title] position. Run a 30-min behavioural interview. Ask 5-6 questions covering leadership, conflict, failure, ambiguity, and ownership. After my answer, ask one probing follow-up before moving on. At the end grade me on: (1) specificity (was the Action concrete or vague?), (2) ownership ("I" vs "we" usage), (3) structure (clear STAR arc), (4) reflection (did I learn from the experience?). Be harsh — I want feedback that improves me, not feedback that flatters me."\n\nNotice what this does. It pins the role and level. It commits AI to follow-ups, which is where the real test happens. It pre-commits the grading dimensions so the feedback isn\'t generic. And it overrides AI\'s default supportive tone with "harsh" — without that, AI will tell you everything was great.',
            callout: {
              label: 'The follow-up matters',
              text: 'Real interviewers don\'t just nod and move on — they probe. Your mock has to do the same. Without follow-ups, you\'re practising surface answers, not depth.',
            },
          },
          {
            heading: 'What to do with the feedback',
            body:
              'AI will give you a critique at the end. Don\'t just read it and move on — that wastes the rep.\n\nFor each weak answer, do three things:\n\n1. Identify the specific failure mode. Was it "we" instead of "I"? Was it too much Situation, not enough Action? Was the Result missing? Each failure mode has a different fix.\n\n2. Rewrite the answer once, in your head or on paper. Not the whole story — just the part that failed. If your Action was vague, rewrite ONLY the Action with specific decisions and details.\n\n3. Run another mock the next day with the same question. See if the rewrite holds up under pressure. If it does, the fix landed. If not, the fix wasn\'t deep enough.\n\nThis loop — mock → critique → targeted rewrite → mock again — is how interview skill compounds. Doing 3 mocks with this loop beats doing 10 mocks without it.',
            bullets: [
              'Identify the specific failure mode (vague Action, missing Result, "we" overuse).',
              'Rewrite only the part that failed, not the whole answer.',
              'Re-test the rewrite in a follow-up mock — that\'s how the fix locks in.',
            ],
          },
          {
            heading: 'When AI mocks fall short',
            body:
              'AI mocks are 70% as useful as great human mocks. Where they fall short matters to know:\n\n- AI doesn\'t read non-verbals. It can\'t tell you that your voice trailed off, that you hesitated for 4 seconds, that your eye contact was inconsistent. Pair AI mocks with at least one human mock or a recorded video session for the non-verbal layer.\n\n- AI defaults to nice. Even with "harsh" prompting, AI tends to under-flag weak answers compared to a real partner who\'s seen many candidates. Cross-check the grading by self-scoring — if you suspect an answer was weak, trust your suspicion over AI\'s "good job".\n\n- AI doesn\'t know your industry deeply. For function-specific behavioural questions (especially in tech, finance, consulting), some questions have industry-specific evaluation criteria AI may miss. For your highest-stakes interviews, get one mock with someone who\'s been on the other side of that table.\n\nUse AI for volume and pattern. Use humans for calibration and non-verbals.',
            callout: {
              label: 'The 70% rule',
              text: 'AI mocks are 70% as useful as great human mocks — but you can do 10x more of them. The volume usually wins, with a human session every 5-10 reps for calibration.',
            },
          },
        ],
        keyTakeaways: [
          'A mock prompt should pin the role, level, follow-up behaviour, and grading dimensions.',
          'Override AI\'s default niceness with "be harsh" — without it, the feedback is useless.',
          'After feedback, do a targeted rewrite of the weak part, then re-test in a follow-up mock.',
          'Use AI for volume; pair with one human mock or recorded session for non-verbals.',
        ],
        quiz: [
          {
            id: 'q1',
            prompt: 'You finish a 30-minute AI mock and the feedback says "great answers, just be a bit more specific". What should you do?',
            options: [
              {
                text: 'Take it at face value — minor tweaks for specificity.',
                isCorrect: false,
                explanation:
                  '"Great answers, just be a bit more specific" is AI\'s default polite hedge. It almost certainly means at least one of your answers had a real specificity problem that wasn\'t flagged.',
              },
              {
                text: 'Re-prompt AI to be harsher and identify the SINGLE weakest answer with concrete diagnostics, then drill that one.',
                isCorrect: true,
                explanation:
                  'Right. AI\'s default is to flatter. Forcing it to single out the weakest answer with diagnostics extracts the real signal. The drill on that one weakness is where the improvement happens.',
              },
              {
                text: 'Ignore the feedback and move on to the next mock.',
                isCorrect: false,
                explanation:
                  'A mock without targeted improvement work is mostly wasted. You did the rep; you might as well extract the learning.',
              },
              {
                text: 'Get a friend to grade the same mock.',
                isCorrect: false,
                explanation:
                  'Friends don\'t have transcripts. Better to extract sharper feedback from AI directly by re-prompting harsher.',
              },
            ],
            hint: 'AI defaults to flattery — the right move is to force sharper diagnostics, not to accept the soft answer.',
          },
          {
            id: 'q2',
            prompt: 'Which mock prompt produces the most useful practice session?',
            options: [
              {
                text: '"Ask me 10 behavioural questions in a row."',
                isCorrect: false,
                explanation:
                  'Volume without follow-ups misses the point. Real interviews have follow-ups, and that\'s where weak answers fail. Without them you\'re practising surface answers.',
              },
              {
                text: '"You\'re a hiring manager at a mid-stage tech company. Run a 30-min behavioural interview with 5-6 questions across STAR themes, ask one probing follow-up after each, then grade me harshly on specificity, ownership, structure, and reflection."',
                isCorrect: true,
                explanation:
                  'Right. This sets the persona, the format, the follow-up behaviour, the grading dimensions, and overrides default niceness. All four matter.',
              },
              {
                text: '"Just chat with me about my work experience."',
                isCorrect: false,
                explanation:
                  '"Chat" is too low-stakes. You won\'t get the pressure or the structure of a real interview, and the feedback will be vague.',
              },
              {
                text: '"Pretend you\'re my friend interviewing me."',
                isCorrect: false,
                explanation:
                  'Wrong frame. A friend won\'t push back. You want adversarial pressure that mimics a real hiring manager.',
              },
            ],
          },
          {
            id: 'q3',
            prompt: 'After 3 AI mocks, your grades on "specificity" are improving but your grades on "ownership" (using "I" not "we") are stuck. What\'s the right next step?',
            options: [
              {
                text: 'Do more mocks until ownership improves naturally.',
                isCorrect: false,
                explanation:
                  'Stuck dimensions don\'t fix themselves through volume. They need targeted drilling — a different intervention.',
              },
              {
                text: 'Do a focused drill: take your 6 STAR stories and rewrite each one replacing every "we" with the specific "I" verb that names your contribution.',
                isCorrect: true,
                explanation:
                  'Right. The "we" habit is deeply ingrained for most candidates. A focused offline rewrite — not under interview pressure — is what locks in the new pattern. Then take it back into mocks to test.',
              },
              {
                text: 'Switch interviewers — try a human mock instead.',
                isCorrect: false,
                explanation:
                  'Switching format won\'t fix a habit. The "we" pattern will follow you into human mocks too. Fix the pattern first, then test in any format.',
              },
              {
                text: 'Lower your standards — "we" is fine in most interviews.',
                isCorrect: false,
                explanation:
                  'It\'s not. "We" is the most common reason interviewers ask follow-up questions about your contribution. Fix it before it costs you a real interview.',
              },
            ],
            hint: 'A stuck dimension calls for a targeted drill, not more reps of the same thing.',
          },
        ],
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
        lessons: [
          {
            heading: 'Why this question matters more than you think',
            body: 'Most candidates treat "any questions for us?" as a formality. Interviewers treat it as a final signal. The questions you ask reveal what you care about, how you think about work, and whether you\'ve actually done your homework. A weak question can undo a strong interview; a sharp one can salvage a shaky one.',
            bullets: [
              'Default questions ("What\'s the culture like?") signal you didn\'t prepare',
              'Sharp questions show you\'re evaluating them as much as they\'re evaluating you',
              'This is the easiest place in the interview to differentiate yourself',
            ],
          },
          {
            heading: 'The three categories of strong questions',
            body: 'Build your three questions across three categories so you cover the spectrum: role specifics, team/manager dynamics, and forward-looking strategy. This shows you think about work at multiple altitudes.',
            bullets: [
              'Role specifics: "What does success in this role look like 90 days in?"',
              'Team dynamics: "How does the team handle disagreement on technical decisions?"',
              'Forward strategy: "Where do you see this team\'s priorities shifting in the next year?"',
            ],
            callout: {
                label: 'Remember',
                text: 'The best questions reference something specific from the conversation or your research — proves you were actually listening.',
              },
          },
          {
            heading: 'Questions to never ask',
            body: 'Some questions actively damage your candidacy. Avoid anything you could Google in 30 seconds, anything that sounds like you\'re negotiating before the offer, and anything that signals you\'re already mentally checked out.',
            bullets: [
              '"What does the company do?" — Google homework should be done',
              '"What\'s the salary range?" — wait until offer stage unless they raise it',
              '"How much vacation time do you offer?" — sounds like you\'re focused on time off',
              '"Will I have to work overtime?" — sounds like you\'re anticipating hating it',
            ],
          },
          {
            heading: 'Reading the response',
            body: 'The answer to your question is data about the company. If they fumble "what does success look like in 90 days?", that team probably doesn\'t have clear expectations. If they light up, you have a manager who actually thinks about ramp. Use their answer to recalibrate whether you actually want this job.',
            callout: {
                label: 'Remember',
                text: 'You are evaluating them. Don\'t lose that frame just because you want the offer.',
              },
          },
        ],
        keyTakeaways: [
          'Generic questions ("what\'s the culture?") signal lack of preparation — avoid them',
          'Prepare 3 questions: one role-specific, one team-dynamic, one strategic',
          'Reference something they said or something specific about the company',
          'Their answers are data — use them to evaluate whether to accept',
        ],
        quiz: [
          {
            id: 'q1',
            prompt:
              'Which of these is the strongest end-of-interview question?',
            options: [
              {
                text: '"What is the company culture like?"',
                isCorrect: false,
                explanation: 'Generic — every candidate asks this. Reveals nothing about how you think.',
              },
              {
                text: '"What would success look like for someone in this role 90 days in?"',
                isCorrect: true,
                explanation: 'Specific, role-focused, and signals you\'re thinking about delivering, not just landing the job.',
              },
              {
                text: '"What does the company do?"',
                isCorrect: false,
                explanation: 'Catastrophic — proves you didn\'t do basic research. Likely disqualifying.',
              },
              {
                text: '"How much time off do you offer?"',
                isCorrect: false,
                explanation: 'Wait until offer stage. Asking now signals priorities that hurt your candidacy.',
              },
            ],
            hint: 'The best questions are specific and about doing the job, not perks.',
          },
          {
            id: 'q2',
            prompt:
              'You\'ve prepared three questions but the interviewer answered two of them mid-conversation. What do you do?',
            options: [
              {
                text: 'Ask them anyway so you have three to ask',
                isCorrect: false,
                explanation: 'Asking something they already answered signals you weren\'t listening — worse than asking nothing.',
              },
              {
                text: 'Acknowledge they covered those, then ask the remaining one and a fresh follow-up sparked by something they said',
                isCorrect: true,
                explanation: 'Shows you were listening and can think on your feet — both highly valued signals.',
              },
              {
                text: 'Say "no questions, I think we\'ve covered everything"',
                isCorrect: false,
                explanation: 'Wastes the chance to differentiate. Prepared candidates always have something to ask.',
              },
              {
                text: 'Ask about salary since the role-fit questions are answered',
                isCorrect: false,
                explanation: 'Salary at this stage shifts the dynamic before they\'ve decided to make an offer. Don\'t do it.',
              },
            ],
          },
          {
            id: 'q3',
            prompt:
              'Why does asking sharp questions matter beyond just looking smart?',
            options: [
              {
                text: 'It\'s a formality — interviewers don\'t actually weight it',
                isCorrect: false,
                explanation: 'Wrong — many interviewers explicitly note candidate questions in their feedback.',
              },
              {
                text: 'The interviewer\'s answers give you data to evaluate whether you actually want the job',
                isCorrect: true,
                explanation: 'Exactly. The conversation is two-way. Their answers reveal team health, manager quality, and clarity of expectations.',
              },
              {
                text: 'It fills time so the interview hits its scheduled length',
                isCorrect: false,
                explanation: 'Length isn\'t the goal. Insight is.',
              },
              {
                text: 'It signals you want the job badly',
                isCorrect: false,
                explanation: 'Eagerness without substance can read as desperation. Sharp questions signal evaluation, not eagerness.',
              },
            ],
          },
        ],
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
        lessons: [
          {
            heading: 'Why most candidates skip the debrief',
            body: 'After an interview, you want to either celebrate or forget. Both reactions feel earned. Both cost you the most valuable signal you\'ll get this week: what actually happened in the room. Memory degrades fast — within 24 hours you\'ve lost half the specifics, within a week most of it is gone.',
            bullets: [
              'Adrenaline crashes wipe specifics — write them down within 30 minutes',
              'Without a debrief, you make the same mistakes round after round',
              'Five interviews without debriefs teaches you less than one with',
            ],
          },
          {
            heading: 'The 3-prompt template',
            body: 'Keep it short or you won\'t do it. Three prompts, five minutes total. The discipline is in doing it consistently, not in writing essays.',
            bullets: [
              '"What went well?" — answers/moments where you felt sharp',
              '"What surprised me?" — questions you didn\'t expect, dynamics you misread',
              '"What do I drill before next time?" — concrete, specific, action-oriented',
            ],
            callout: {
                label: 'Remember',
                text: 'Surprises are gold. They mark the gap between your model of the interview and reality — that\'s where the next breakthrough lives.',
              },
          },
          {
            heading: 'Patterns emerge across debriefs',
            body: 'Single debriefs are useful. The full power comes after 3–5. Read them back-to-back and patterns jump out: a question you keep stumbling on, a story that never quite lands, a type of company that consistently asks something you haven\'t prepared for.',
            bullets: [
              'Recurring stumble = next week\'s drill priority',
              'Recurring strength = your interview anchor — lean on it harder',
              'Recurring surprise = you\'re reading the company type wrong',
            ],
          },
          {
            heading: 'Acting on the debrief',
            body: 'Debriefs without action are just journaling. End each debrief with one specific thing you\'ll do before the next interview — drill that question type, rewrite that story, research that industry quirk. One concrete action per debrief, done before the next interview, compounds fast.',
            callout: {
                label: 'Remember',
                text: 'If you can\'t name one specific drill from the debrief, push yourself harder. There\'s always something.',
              },
          },
        ],
        keyTakeaways: [
          'Run the debrief within 30 minutes — memory degrades fast',
          'Three prompts: what went well, what surprised, what to drill',
          'Surprises mark the gap between your model and reality — pay attention',
          'Each debrief ends with one concrete drill before the next interview',
        ],
        quiz: [
          {
            id: 'q1',
            prompt:
              'When should you ideally write your interview debrief?',
            options: [
              {
                text: 'A few days later, once you\'ve had time to reflect',
                isCorrect: false,
                explanation: 'Memory degrades fast — within 24 hours you\'ve lost half the specifics. A few days kills most of the signal.',
              },
              {
                text: 'Within 30 minutes of leaving the interview',
                isCorrect: true,
                explanation: 'Right — adrenaline crashes wipe specifics. Capture while it\'s vivid, even if just rough notes.',
              },
              {
                text: 'After you find out whether you got the job',
                isCorrect: false,
                explanation: 'Outcome bias contaminates the debrief. If you got it, everything seems fine; if you didn\'t, everything seems broken. Debrief independent of result.',
              },
              {
                text: 'Only if the interview went badly',
                isCorrect: false,
                explanation: 'Wrong — strong interviews teach you what to repeat. Skipping debriefs on good interviews leaves you unable to reproduce success.',
              },
            ],
            hint: 'Memory works against you — capture early.',
          },
          {
            id: 'q2',
            prompt:
              'Why is "what surprised me?" a key prompt in the debrief?',
            options: [
              {
                text: 'It feels good to remember unusual moments',
                isCorrect: false,
                explanation: 'Not the point. Debriefs are diagnostic, not nostalgic.',
              },
              {
                text: 'Surprises mark the gap between your model of the interview and reality',
                isCorrect: true,
                explanation: 'Exactly — surprises are diagnostic. They show where your prep had blind spots, which is exactly where the next gain lives.',
              },
              {
                text: 'It helps you tell better stories about the interview later',
                isCorrect: false,
                explanation: 'The debrief is for you, not for retelling.',
              },
              {
                text: 'Recruiters ask about surprising moments in subsequent rounds',
                isCorrect: false,
                explanation: 'They don\'t. The prompt is an internal diagnostic tool.',
              },
            ],
          },
          {
            id: 'q3',
            prompt:
              'You\'ve done 5 debriefs. The same prompt — "tell me about a time you led without authority" — has stumped you 4 of 5 times. What does this signal?',
            options: [
              {
                text: 'Bad luck — interviewers happen to ask it',
                isCorrect: false,
                explanation: 'Four of five is not luck — it\'s a pattern. And it\'s a pattern in your prep, not theirs.',
              },
              {
                text: 'It\'s a recurring stumble — make this your top drill priority before the next interview',
                isCorrect: true,
                explanation: 'Right — recurring stumbles are the highest-leverage drills. Pre-write a STAR story for this exact prompt now.',
              },
              {
                text: 'You should mention this stumble in your next interview to seem self-aware',
                isCorrect: false,
                explanation: 'Don\'t pre-flag weaknesses. Fix the gap quietly, don\'t announce it.',
              },
              {
                text: 'Avoid companies that ask leadership questions',
                isCorrect: false,
                explanation: 'Avoiding the question doesn\'t fix the gap. Drilling it does.',
              },
            ],
          },
        ],
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
        lessons: [
          {
            heading: 'Why your headline does most of the work',
            body: 'Your headline shows up everywhere on LinkedIn — in search results, comments, connection requests, recruiter searches. It\'s the one piece of text that follows you across every surface. If it just says "Student at University of Auckland" or "Marketing Coordinator at Acme", you\'ve given recruiters and connections nothing to grab onto.',
            bullets: [
              'Headline appears in every search result, every comment, every notification',
              'Recruiters skim headlines before clicking — yours is your first filter',
              'Default ("Student at X") is identical to thousands of others — invisible',
            ],
            callout: {
                label: 'Remember',
                text: 'A headline is positioning, not biography. It answers "why should someone pause on you?", not "what is your current title?".',
              },
          },
          {
            heading: 'The positioning formula',
            body: 'Use [what you do] + [who you serve] + [proof or specific niche]. This forces specificity. "Marketing Coordinator" tells me nothing. "Helping early-stage SaaS teams build content engines that actually convert" tells me everything.',
            bullets: [
              '[What you do]: action verb + outcome — "building", "shipping", "advising"',
              '[Who you serve]: specific audience — "early-career engineers", "B2B founders"',
              '[Proof or niche]: a sharpener — "AWS certified", "ex-McKinsey", "MSc Data Science"',
            ],
          },
          {
            heading: 'For students and early career — the angle problem',
            body: 'You don\'t have years of experience to lead with. That\'s fine — your headline becomes about direction. "Engineering student building toward a career in fintech infrastructure" beats "Engineering student" by an order of magnitude. Direction is positioning even before the work exists.',
            bullets: [
              'State the destination, not just the current step',
              'Use "building toward", "studying", "exploring" + a clear specific area',
              'Reference any concrete signal — research, projects, internships, certifications',
            ],
          },
          {
            heading: 'Test your headline',
            body: 'Read it back aloud. Two questions: (1) Could anyone in your cohort say the exact same thing? (2) Would a stranger know within 5 seconds whether they\'re your audience? If "yes" to (1) or "no" to (2), rewrite.',
            callout: {
                label: 'Remember',
                text: 'Specificity feels riskier. It is also why specific headlines outperform generic ones 10:1 in recruiter searches.',
              },
          },
        ],
        keyTakeaways: [
          'Your headline appears everywhere — treat it as your highest-leverage line',
          'Use [what you do] + [who you serve] + [proof/niche] structure',
          'For students: state direction, not just current title',
          'If anyone in your cohort could write the same headline, it\'s too generic',
        ],
        quiz: [
          {
            id: 'q1',
            prompt:
              'Which of these is the strongest LinkedIn headline for a final-year computer science student aiming at fintech?',
            options: [
              {
                text: 'Computer Science Student | University of Auckland',
                isCorrect: false,
                explanation: 'Generic — interchangeable with thousands of other students. Gives a recruiter nothing.',
              },
              {
                text: 'Final-year CS student building toward fintech infrastructure | Built 2 trading bot prototypes',
                isCorrect: true,
                explanation: 'Specific direction, specific niche, concrete proof signal. A fintech recruiter pauses on this.',
              },
              {
                text: 'Aspiring Software Engineer 🚀 Open to opportunities! 💻',
                isCorrect: false,
                explanation: 'Vague aspiration plus emojis signal performative rather than substantive. "Open to opportunities" is the lowest-signal phrase on LinkedIn.',
              },
              {
                text: 'Student. Coder. Dreamer.',
                isCorrect: false,
                explanation: 'Says nothing. Recruiters can\'t search for "dreamer".',
              },
            ],
            hint: 'Specific direction beats generic title.',
          },
          {
            id: 'q2',
            prompt:
              'Why does the headline matter more than other LinkedIn fields for recruiter discovery?',
            options: [
              {
                text: 'Headlines are weighted highest in LinkedIn\'s search algorithm',
                isCorrect: false,
                explanation: 'Partly true but not the main reason — LinkedIn\'s algorithm is opaque and changes.',
              },
              {
                text: 'It appears in every search result, comment, notification, and connection request — it\'s the line that travels with you everywhere',
                isCorrect: true,
                explanation: 'Right — ubiquity is the headline\'s real superpower. Most surfaces show only headline + name, so it does the heaviest filtering work.',
              },
              {
                text: 'Recruiters can\'t see the rest of your profile until they connect',
                isCorrect: false,
                explanation: 'False — most profile data is publicly visible.',
              },
              {
                text: 'It\'s the only field LinkedIn lets you customize',
                isCorrect: false,
                explanation: 'False — you can customize most fields. Headline is just the one that travels furthest.',
              },
            ],
          },
          {
            id: 'q3',
            prompt:
              'You read your draft headline aloud. Which test signals it needs a rewrite?',
            options: [
              {
                text: 'It mentions a specific industry or niche',
                isCorrect: false,
                explanation: 'Specificity is good — that\'s the goal.',
              },
              {
                text: 'Anyone else in your cohort could write the exact same headline',
                isCorrect: true,
                explanation: 'Right — interchangeability is the failure mode. If 100 peers could copy your headline verbatim, it\'s doing no positioning work.',
              },
              {
                text: 'It\'s shorter than 100 characters',
                isCorrect: false,
                explanation: 'Length isn\'t the issue. Specificity is.',
              },
              {
                text: 'It includes a proof signal like a certification',
                isCorrect: false,
                explanation: 'Proof signals strengthen headlines, not weaken them.',
              },
            ],
          },
        ],
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
        lessons: [
          {
            heading: 'The autobiography trap',
            body: 'Default About sections read like a chronological story: "I grew up in X, studied Y, got passionate about Z, currently I work at W." Every recruiter has skipped this 1000 times. The reader doesn\'t care about your origin — they care about whether you can solve their problem. Lead with them, not with you.',
            bullets: [
              'Recruiters spend ~10 seconds on the About section if your headline hooked them',
              'They\'re scanning for "can this person do the job?", not "who is this person?"',
              'Chronological autobiographies bury the signal under filler',
            ],
          },
          {
            heading: 'The who/how/CTA structure',
            body: 'Three short paragraphs, in this order: who you help, how you help them, and what to do next. This forces you to write for the reader instead of about yourself.',
            bullets: [
              'Paragraph 1 (Who): "I work with [audience] who [problem they have]." — 2 sentences max',
              'Paragraph 2 (How): your approach, your edge, your concrete proof — 3-4 sentences',
              'Paragraph 3 (CTA): one specific action — "If you\'re hiring for X, message me here."',
            ],
            callout: {
                label: 'Remember',
                text: 'The CTA is non-negotiable. Most profiles end with vague vibes. End yours with a clear next step and you\'ll convert 5x more recruiter messages.',
              },
          },
          {
            heading: 'For students — adapting the structure',
            body: 'You can\'t say "I help SaaS companies do X" if you haven\'t done it yet. Reframe paragraph 1 as the problem space you\'re moving into. "I\'m heading into product management because I keep finding myself building tools to fix gaps my friends complain about" tells me more than three semesters of coursework.',
            bullets: [
              'Anchor in the problem space, not the job title',
              'Use specific concrete proof: a project, a research paper, an internship moment',
              'Your CTA can be "open to graduate roles in X" — but specify X precisely',
            ],
          },
          {
            heading: 'Format for skim-reading',
            body: 'Use line breaks. LinkedIn renders no markdown but will respect newlines. A wall of text is invisible. Three short paragraphs separated by blank lines, with one specific number or proof signal in the middle paragraph, will outperform an essay 10:1.',
            callout: {
                label: 'Remember',
                text: 'Aim for 600–1200 characters. Long enough to show substance, short enough to read in 30 seconds.',
              },
          },
        ],
        keyTakeaways: [
          'Lead with the reader\'s problem, not your origin story',
          'Structure: who you help → how you help → what to do next',
          'End with a specific CTA — vague endings convert poorly',
          'Use line breaks; aim for 600–1200 characters total',
        ],
        quiz: [
          {
            id: 'q1',
            prompt:
              'You\'re writing your About section. Which opening paragraph is strongest?',
            options: [
              {
                text: '"Born in Wellington, I always had a passion for building things. My journey took me to..."',
                isCorrect: false,
                explanation: 'Classic autobiography trap. Recruiters skim this and bounce.',
              },
              {
                text: '"I work with early-stage SaaS founders who can\'t figure out why their content isn\'t converting. Most have great products but messy positioning."',
                isCorrect: true,
                explanation: 'Leads with the reader\'s problem. A founder reading this immediately knows whether you\'re relevant.',
              },
              {
                text: '"Driven, passionate, results-oriented marketing professional with a track record of success."',
                isCorrect: false,
                explanation: 'Pure buzzwords with no concrete signal. Could describe anyone.',
              },
              {
                text: '"Currently looking for new opportunities! Open to relocate. Available immediately."',
                isCorrect: false,
                explanation: 'Telegraphs job-seeking desperation without giving recruiters anything to grab onto.',
              },
            ],
            hint: 'Lead with the reader, not yourself.',
          },
          {
            id: 'q2',
            prompt:
              'Why is a CTA at the end of the About section critical?',
            options: [
              {
                text: 'LinkedIn\'s algorithm boosts profiles with CTAs',
                isCorrect: false,
                explanation: 'Not how the algorithm works.',
              },
              {
                text: 'It tells recruiters exactly what to do next, removing friction from initiating contact',
                isCorrect: true,
                explanation: 'Right — recruiters who are ~70% sure won\'t reach out without a clear opening. A CTA gives permission and direction.',
              },
              {
                text: 'It\'s required by LinkedIn\'s profile completeness score',
                isCorrect: false,
                explanation: 'Not required.',
              },
              {
                text: 'It signals you\'re desperately looking for a job',
                isCorrect: false,
                explanation: 'Wrong framing — a confident CTA signals openness, not desperation.',
              },
            ],
          },
          {
            id: 'q3',
            prompt:
              'You\'re a final-year engineering student with no full-time experience yet. How should you adapt the who/how/CTA structure?',
            options: [
              {
                text: 'Skip the structure — students should write a chronological story',
                isCorrect: false,
                explanation: 'Wrong — students benefit even more from this structure because they need to compensate for thin experience.',
              },
              {
                text: 'Anchor paragraph 1 in the problem space you\'re moving into, with specific concrete proof in paragraph 2',
                isCorrect: true,
                explanation: 'Right — direction-as-positioning, anchored with one concrete signal (project, paper, internship).',
              },
              {
                text: 'Just say "open to opportunities" and list courses',
                isCorrect: false,
                explanation: 'Lowest-signal phrase on LinkedIn paired with the lowest-signal section type.',
              },
              {
                text: 'Pretend you have experience by exaggerating projects',
                isCorrect: false,
                explanation: 'No — recruiters spot this instantly. Lean into honest direction with concrete proof.',
              },
            ],
          },
        ],
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
        lessons: [
          {
            heading: 'LinkedIn is skimmed harder than your CV',
            body: 'On a CV, the reader has at least decided to open a document. On LinkedIn, they\'re scrolling. Every role section competes with the next role, the next profile, the next notification. Dense paragraphs lose. White space and one strong outcome line wins the scroll.',
            bullets: [
              'Average time per LinkedIn role section: 4-6 seconds',
              'Walls of text get scrolled past — outcome lines stop the scroll',
              'White space is a feature, not wasted space',
            ],
          },
          {
            heading: 'The 1+3 format',
            body: 'For each role: lead with one outcome line that summarises the most impactful thing you did. Then 3 bullets, each with a concrete result. That\'s it. Don\'t list every responsibility — list the moments that matter.',
            bullets: [
              'Outcome line: "Rebuilt the onboarding flow — cut drop-off from 42% to 18% in 3 months"',
              'Bullet 1: a hard metric or named project',
              'Bullet 2: a cross-functional or scope signal',
              'Bullet 3: a skill or tool you owned',
            ],
            callout: {
                label: 'Remember',
                text: '4 lines per role beats 12 lines per role. If something doesn\'t earn its place against your top 3 bullets, cut it.',
              },
          },
          {
            heading: 'Outcome lines beat responsibility lines',
            body: '"Responsible for managing client relationships" is what the job description said. "Managed a portfolio of 12 enterprise clients, retained 11 through a major pricing change" is what you did. The second answers the only question recruiters care about: did you actually deliver?',
            bullets: [
              'Responsibility: what you were asked to do',
              'Outcome: what actually happened because you did it',
              'Outcome lines need a number, a name, or a verb of impact',
            ],
          },
          {
            heading: 'For internships and short stints',
            body: 'Don\'t skip 1+3 just because the role was 3 months. Even a short internship has one moment worth highlighting. Pick the moment, write the outcome line, and keep bullets tight. A well-formatted internship beats a sprawling description of a long job.',
            callout: {
                label: 'Remember',
                text: 'Length doesn\'t equal credibility. Specificity does.',
              },
          },
        ],
        keyTakeaways: [
          'LinkedIn is skim-read — white space and outcome lines win',
          'Use 1 outcome line + 3 bullets per role, not paragraphs',
          'Outcomes beat responsibilities: numbers, names, impact verbs',
          'Even short internships deserve the 1+3 treatment',
        ],
        quiz: [
          {
            id: 'q1',
            prompt:
              'Which of these is a strong opening outcome line for a recent role?',
            options: [
              {
                text: '"Worked on various projects across the marketing team"',
                isCorrect: false,
                explanation: 'Vague — no specifics, no impact, no signal. Could describe anyone.',
              },
              {
                text: '"Owned the launch of a 6-product holiday campaign that delivered $1.2M in revenue across November–December"',
                isCorrect: true,
                explanation: 'Concrete scope, specific timeframe, hard number. Recruiter\'s scroll stops here.',
              },
              {
                text: '"Responsible for marketing duties as assigned"',
                isCorrect: false,
                explanation: 'Pure responsibility-language with zero outcome signal.',
              },
              {
                text: '"Passionate marketer making things happen"',
                isCorrect: false,
                explanation: 'Buzzwords. Not what you did, just adjectives about yourself.',
              },
            ],
            hint: 'Outcome lines need numbers, names, or specific scope.',
          },
          {
            id: 'q2',
            prompt:
              'Why does the 1+3 format work better than dense paragraphs for LinkedIn experience sections?',
            options: [
              {
                text: 'Recruiters skim — white space and concrete bullets stop the scroll, paragraphs get bypassed',
                isCorrect: true,
                explanation: 'Right — average time per role section is 4-6 seconds. The format that wins is the one that makes scanning trivial.',
              },
              {
                text: 'LinkedIn\'s algorithm penalises paragraphs',
                isCorrect: false,
                explanation: 'Not really how the algorithm works.',
              },
              {
                text: 'LinkedIn truncates anything over 200 characters',
                isCorrect: false,
                explanation: 'False — LinkedIn allows long descriptions.',
              },
              {
                text: 'Dense paragraphs trigger the spam filter',
                isCorrect: false,
                explanation: 'No spam filter on profile content.',
              },
            ],
          },
          {
            id: 'q3',
            prompt:
              'You did a 3-month internship 18 months ago. Should you bother applying the 1+3 format to it?',
            options: [
              {
                text: 'No — short internships should just be a job title and dates',
                isCorrect: false,
                explanation: 'Wrong — the 1+3 format makes short stints punch above their weight.',
              },
              {
                text: 'Yes — pick the single most impactful moment and structure it the same way',
                isCorrect: true,
                explanation: 'Right — even short roles have one signal moment. Specificity beats length, always.',
              },
              {
                text: 'Yes, but only if you have nothing else to fill the section',
                isCorrect: false,
                explanation: 'Apply the format whether or not you have other roles. It scales down well.',
              },
              {
                text: 'No — focus only on long-term roles for credibility',
                isCorrect: false,
                explanation: 'Length doesn\'t equal credibility. Concrete specifics do.',
              },
            ],
          },
        ],
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
        lessons: [
          {
            heading: 'How recruiters actually find candidates',
            body: 'Most recruiters don\'t scroll through profiles randomly — they search LinkedIn Recruiter (or the basic search) using specific Boolean queries. Something like ("product manager" AND "B2B SaaS" AND "fintech") AND (NOT "intern"). If your profile doesn\'t contain those exact phrases, you don\'t appear. You can be the perfect candidate and still be invisible.',
            bullets: [
              'Recruiter search is the dominant discovery surface for senior roles',
              'Boolean queries match exact phrases — synonyms don\'t help',
              'Ranking favours profiles where keywords appear in headline + experience',
            ],
            callout: {
                label: 'Remember',
                text: 'Search ranking is a search problem, not a writing problem. Frequency and placement matter as much as quality.',
              },
          },
          {
            heading: 'Finding the 5 keywords that matter',
            body: 'Open 10 job descriptions for the role you want. Note every term that appears in 5 or more of them. The top 5 by frequency are your must-haves. Don\'t guess — let the job descriptions tell you what the market searches for.',
            bullets: [
              'Pull 10 real job postings — not aspirational, the ones you\'d actually apply to',
              'Track frequency: which words appear in at least half',
              'Distinguish role keywords ("product manager") from skill keywords ("SQL", "Figma")',
              'Pick 5: typically 1-2 role terms, 2-3 skill terms, 0-1 industry term',
            ],
          },
          {
            heading: 'Placement matters more than density',
            body: 'Each of your 5 keywords should appear in your headline, About, and at least one experience bullet. That\'s 3 placements per keyword minimum. LinkedIn\'s ranking weights headline highest, then About, then experience. Stuffing keywords 10 times in one section helps less than placing them 3 times across sections.',
            bullets: [
              'Headline: 1-2 of your 5 keywords (the highest-priority ones)',
              'About: all 5 mentioned naturally',
              'Experience: each keyword anchored to a real outcome bullet',
            ],
          },
          {
            heading: 'Don\'t keyword-stuff',
            body: 'Profiles that read like keyword soup ("results-oriented Product Manager skilled in Product Management for Product Companies") are a turnoff and won\'t convert recruiters once they click. Keywords have to appear naturally inside real outcomes. The goal is "appear in search" + "convert when clicked", not just "appear in search".',
            callout: {
                label: 'Remember',
                text: 'If you can\'t say the sentence out loud without cringing, rewrite it.',
              },
          },
        ],
        keyTakeaways: [
          'Recruiters use exact-phrase searches — your profile must contain the literal terms',
          'Source your 5 keywords from real job postings, not guesses',
          'Place each keyword in headline (top 1-2), About, and an experience bullet',
          'Naturalness matters — keyword soup hurts conversion when recruiters do click',
        ],
        quiz: [
          {
            id: 'q1',
            prompt:
              'You want to rank for "data analyst" roles. What\'s the right way to identify the 5 keywords that matter?',
            options: [
              {
                text: 'Brainstorm what you think recruiters search for',
                isCorrect: false,
                explanation: 'Guessing wastes time. The market tells you what to use — let the data speak.',
              },
              {
                text: 'Pull 10 real job postings for data analyst roles you\'d apply to and track which terms appear in 5+ of them',
                isCorrect: true,
                explanation: 'Right — this is how you reverse-engineer the market\'s actual search vocabulary.',
              },
              {
                text: 'Use whatever keywords your peers have on their profiles',
                isCorrect: false,
                explanation: 'Peer profiles may be optimised for the wrong things. Job descriptions are the source of truth.',
              },
              {
                text: 'Use LinkedIn\'s suggested skills',
                isCorrect: false,
                explanation: 'Suggested skills are a starting point but not calibrated to your specific target role.',
              },
            ],
            hint: 'Source from real job postings, not intuition.',
          },
          {
            id: 'q2',
            prompt:
              'Why doesn\'t LinkedIn\'s algorithm care about synonyms?',
            options: [
              {
                text: 'It does — synonyms rank just as well as exact matches',
                isCorrect: false,
                explanation: 'False. Recruiter Boolean searches match exact phrases.',
              },
              {
                text: 'Recruiter searches use Boolean exact-phrase matching, so "product manager" and "PM" rank differently',
                isCorrect: true,
                explanation: 'Right — that\'s why placement of the literal target keywords is critical.',
              },
              {
                text: 'LinkedIn\'s algorithm is anti-synonym',
                isCorrect: false,
                explanation: 'No such thing. The constraint is the recruiter search syntax, not LinkedIn ranking.',
              },
              {
                text: 'Synonyms confuse the AI ranking model',
                isCorrect: false,
                explanation: 'There\'s no AI doing the matching here — it\'s straightforward keyword search.',
              },
            ],
          },
          {
            id: 'q3',
            prompt:
              'A friend has stuffed "Marketing" into their About section 12 times to rank higher. They\'re not getting more recruiter messages. Why?',
            options: [
              {
                text: 'LinkedIn detects keyword stuffing and downranks the profile',
                isCorrect: false,
                explanation: 'Stuffing might lower ranking slightly but the bigger problem is conversion.',
              },
              {
                text: 'Keyword stuffing may help recruiters find them but the unnatural copy kills conversion when recruiters actually click through',
                isCorrect: true,
                explanation: 'Exactly — appearing in search is half the battle. Converting once a recruiter clicks is the other half. Stuffing wins one and loses the other.',
              },
              {
                text: 'They need 15 mentions, not 12',
                isCorrect: false,
                explanation: 'Density past a low threshold has diminishing returns. Distribution and naturalness beat raw frequency.',
              },
              {
                text: 'Recruiters don\'t look at About sections',
                isCorrect: false,
                explanation: 'They do — it\'s the second-most-read section after the headline.',
              },
            ],
          },
        ],
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
        lessons: [
          {
            heading: 'The mental model: pick, filter, sort',
            body: 'Every SQL query, no matter how complex, can be broken down into three core operations: pick the columns you want (SELECT), filter the rows you care about (WHERE), and sort the result (ORDER BY). Once this mental model clicks, you\'ll see it everywhere — even inside 50-line queries with subqueries and joins.',
            bullets: [
              'SELECT — which columns do I want to see?',
              'FROM — which table holds those columns?',
              'WHERE — which rows survive the filter?',
              'ORDER BY — in what order do I display them?',
            ],
            callout: {
                label: 'Remember',
                text: 'Read SQL queries in execution order: FROM → WHERE → SELECT → ORDER BY. This is different from the order you write them. Knowing this prevents most beginner confusion.',
              },
          },
          {
            heading: 'Writing your first real query',
            body: 'Start simple. Given a table called `customers` with columns (id, name, country, created_at, lifetime_value), let\'s write the query for "show me the names and lifetime values of customers in the UK, ordered by highest spender first."',
            bullets: [
              'SELECT name, lifetime_value',
              'FROM customers',
              'WHERE country = \'UK\'',
              'ORDER BY lifetime_value DESC;',
            ],
            callout: {
                label: 'Remember',
                text: 'String literals use single quotes (\'UK\'), not double quotes. Double quotes are for column names in some dialects.',
              },
          },
          {
            heading: 'WHERE — the operators that matter',
            body: 'Most filtering you\'ll do uses a small set of operators. Master these and you\'ll handle 90% of queries: =, !=, <, >, <=, >=, IN (list), BETWEEN x AND y, LIKE \'pattern%\', IS NULL, IS NOT NULL.',
            bullets: [
              '`country IN (\'UK\', \'NZ\', \'AU\')` — value matches one of a list',
              '`created_at BETWEEN \'2025-01-01\' AND \'2025-12-31\'` — inclusive range',
              '`name LIKE \'A%\'` — pattern match (% is any string, _ is any single char)',
              '`email IS NULL` — must use IS, not = (NULL doesn\'t equal anything, including itself)',
            ],
          },
          {
            heading: 'Common beginner traps',
            body: 'Three mistakes show up constantly. Catch them now and you\'ll save hours of debugging later.',
            bullets: [
              'Using = NULL instead of IS NULL — silently returns no rows, no error',
              'Using AND/OR without parentheses around mixed conditions: `WHERE a AND b OR c` is parsed as `(a AND b) OR c`',
              'Forgetting that string comparisons can be case-sensitive in some databases',
            ],
            callout: {
                label: 'Remember',
                text: 'When a query returns 0 rows unexpectedly, suspect NULL handling first.',
              },
          },
        ],
        keyTakeaways: [
          'Mental model: pick (SELECT) → filter (WHERE) → sort (ORDER BY)',
          'Execution order is FROM → WHERE → SELECT → ORDER BY, not write order',
          'Master =, IN, BETWEEN, LIKE, IS NULL — they cover most filtering',
          'Always use IS NULL / IS NOT NULL, never = NULL',
        ],
        quiz: [
          {
            id: 'q1',
            prompt:
              'You have a table `orders(id, customer_id, amount, status)`. You want all completed orders over $100, sorted highest to lowest. Which query is correct?',
            options: [
              {
                text: 'SELECT * FROM orders WHERE status = \'completed\' AND amount > 100 ORDER BY amount DESC;',
                isCorrect: true,
                explanation: 'Correct — filters on both conditions and orders descending.',
              },
              {
                text: 'SELECT * FROM orders WHERE status = "completed" AND amount > 100 ORDER BY amount;',
                isCorrect: false,
                explanation: 'Two issues: double quotes around \'completed\' (use single quotes for strings) and ORDER BY defaults to ASC, not DESC.',
              },
              {
                text: 'SELECT * FROM orders ORDER BY amount DESC WHERE status = \'completed\' AND amount > 100;',
                isCorrect: false,
                explanation: 'Wrong syntax order — WHERE must come before ORDER BY.',
              },
              {
                text: 'SELECT * FROM orders WHERE status = \'completed\' OR amount > 100 ORDER BY amount DESC;',
                isCorrect: false,
                explanation: 'Uses OR instead of AND — would also return uncompleted orders over $100.',
              },
            ],
            hint: 'Both filters need to apply (AND), and you need explicit DESC for highest first.',
          },
          {
            id: 'q2',
            prompt:
              'You write `SELECT * FROM users WHERE phone = NULL;` and get 0 rows back, even though many users have null phones. Why?',
            options: [
              {
                text: 'The query is correct — there must be no null phones',
                isCorrect: false,
                explanation: 'No — the query has a subtle bug.',
              },
              {
                text: 'NULL doesn\'t equal anything (including itself) — you must use `IS NULL` instead of `= NULL`',
                isCorrect: true,
                explanation: 'Right — this is one of the most common SQL traps. NULL means "unknown", and `unknown = unknown` evaluates to NULL, which is treated as false.',
              },
              {
                text: 'NULL has to be written in lowercase',
                isCorrect: false,
                explanation: 'False — SQL is generally case-insensitive for keywords.',
              },
              {
                text: 'You need to add quotes: WHERE phone = \'NULL\'',
                isCorrect: false,
                explanation: 'That would search for the literal string "NULL", not actual null values.',
              },
            ],
          },
          {
            id: 'q3',
            prompt:
              'Which clause does SQL evaluate first when running a query?',
            options: [
              {
                text: 'SELECT — because it\'s written first',
                isCorrect: false,
                explanation: 'Common misconception. Write order is not execution order.',
              },
              {
                text: 'FROM — the database has to know which rows exist before filtering or selecting columns',
                isCorrect: true,
                explanation: 'Right — execution order is FROM → WHERE → SELECT → ORDER BY. Knowing this clears up most confusion about why aliases sometimes don\'t work in WHERE.',
              },
              {
                text: 'WHERE — filters always happen first',
                isCorrect: false,
                explanation: 'WHERE comes after FROM — you can\'t filter rows that haven\'t been loaded yet.',
              },
              {
                text: 'ORDER BY — sorting happens before everything else',
                isCorrect: false,
                explanation: 'ORDER BY is last — there\'s nothing to sort until the result set exists.',
              },
            ],
          },
        ],
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
        lessons: [
          {
            heading: 'Why JOINs trip people up',
            body: 'JOINs combine data from two tables. The confusion isn\'t about how to write them — it\'s about predicting what comes back. The whole game is: which rows survive when there isn\'t a match? Once you have that mental model, every JOIN type becomes obvious.',
            bullets: [
              'INNER JOIN: only rows that match in BOTH tables',
              'LEFT JOIN: all rows from the left table, plus matches from the right',
              'RIGHT JOIN: all rows from the right table, plus matches from the left',
              'FULL OUTER JOIN: all rows from both, matched where possible',
            ],
            callout: {
                label: 'Remember',
                text: 'In practice, ~80% of real-world JOINs are INNER or LEFT. Master those two cold and the rest fall in place.',
              },
          },
          {
            heading: 'Worked example: customers and orders',
            body: 'Say you have `customers(id, name)` with 5 rows and `orders(id, customer_id, amount)` with 8 rows. Two customers have never placed an order. One order has a customer_id that doesn\'t exist in customers (data quality issue).',
            bullets: [
              'INNER JOIN customers c ON c.id = orders.customer_id → orders that have a customer (7 rows)',
              'LEFT JOIN orders ON c.id = orders.customer_id → all customers, including the 2 with no orders (those show NULL for amount)',
              'RIGHT JOIN orders ON c.id = orders.customer_id → all orders, including the orphan order (shows NULL for name)',
              'FULL OUTER JOIN → all customers + all orders, with NULLs wherever there\'s no match',
            ],
          },
          {
            heading: 'The ON clause is doing the work',
            body: 'The JOIN type tells you what to do with non-matches. The ON clause defines what counts as a match in the first place. Get the ON wrong and your JOIN type doesn\'t matter — you\'ll get nonsense.',
            bullets: [
              '`ON c.id = o.customer_id` — match by customer ID (the right key)',
              '`ON c.name = o.customer_name` — match by name (fragile, breaks with typos)',
              '`ON c.id = o.customer_id AND o.status = \'paid\'` — match + filter combined',
              'When the JOIN returns way too many rows, suspect a bad ON clause first',
            ],
            callout: {
                label: 'Remember',
                text: 'A JOIN without a proper ON clause becomes a CROSS JOIN — every row in A paired with every row in B. With 1000-row tables, that\'s a million rows. Don\'t do this by accident.',
              },
          },
          {
            heading: 'When to use which JOIN',
            body: 'Pick by the question you\'re answering. "Show me only customers who have ordered" → INNER. "Show me all customers, with their orders if any" → LEFT. "Show me all orders, even orphaned ones" → RIGHT (or just swap the table order and use LEFT).',
            bullets: [
              'INNER: when missing data should disappear',
              'LEFT: when the left side is the source of truth and you want everyone',
              'FULL: rarely needed in practice, but useful for data quality audits',
            ],
          },
        ],
        keyTakeaways: [
          'JOIN type controls what happens to non-matching rows',
          'INNER and LEFT cover ~80% of real queries — master these first',
          'The ON clause defines what counts as a match — wrong ON = nonsense result',
          'Never write a JOIN without an ON clause unless you genuinely want a cross product',
        ],
        quiz: [
          {
            id: 'q1',
            prompt:
              'You want a list of all customers and how much they\'ve spent — including customers who have never placed an order (their total should show as 0 or NULL). Which JOIN do you use?',
            options: [
              {
                text: 'INNER JOIN — only show customers with orders',
                isCorrect: false,
                explanation: 'Wrong — INNER would drop the customers who haven\'t ordered, which is exactly what you wanted to keep.',
              },
              {
                text: 'LEFT JOIN customers to orders — keeps all customers, fills NULL for ones without orders',
                isCorrect: true,
                explanation: 'Right. Customers is the left table, you want all of them, and orders fills in matches where they exist.',
              },
              {
                text: 'RIGHT JOIN customers to orders',
                isCorrect: false,
                explanation: 'RIGHT would keep all orders and drop customers without any — opposite of what you want.',
              },
              {
                text: 'CROSS JOIN — pair every customer with every order',
                isCorrect: false,
                explanation: 'CROSS JOIN produces a Cartesian product — totally wrong here and would explode your row count.',
              },
            ],
            hint: 'You want EVERY customer, with order data joined where it exists.',
          },
          {
            id: 'q2',
            prompt:
              'A coworker writes `SELECT * FROM users JOIN orders;` and the result has millions of rows even though both tables have only thousands. What happened?',
            options: [
              {
                text: 'The database is broken',
                isCorrect: false,
                explanation: 'No — the database is doing exactly what was asked.',
              },
              {
                text: 'They forgot the ON clause, so it\'s effectively a CROSS JOIN — every user paired with every order',
                isCorrect: true,
                explanation: 'Right. Without ON, it\'s a Cartesian product. 1000 users × 5000 orders = 5 million rows.',
              },
              {
                text: 'JOIN without specifying type defaults to FULL OUTER',
                isCorrect: false,
                explanation: 'False — JOIN defaults to INNER in most databases, but without an ON clause, you get a cross product.',
              },
              {
                text: 'They need to add SELECT DISTINCT',
                isCorrect: false,
                explanation: 'DISTINCT would mask the symptom but not fix the missing ON clause.',
              },
            ],
          },
          {
            id: 'q3',
            prompt:
              'You\'re joining `users` and `orders` and want only paid orders for users in the UK. Where should the country filter go?',
            options: [
              {
                text: 'In the ON clause: ON u.id = o.user_id AND u.country = \'UK\'',
                isCorrect: false,
                explanation: 'Works for INNER JOIN but if you ever switch to LEFT JOIN, the behavior changes subtly. Country is a row filter, not a match condition — put it in WHERE.',
              },
              {
                text: 'In the WHERE clause, after the JOIN — keep ON for match conditions only',
                isCorrect: true,
                explanation: 'Right — the convention is ON for "what counts as a match" and WHERE for "which result rows to keep". Cleaner, more predictable, and behaves the same across JOIN types.',
              },
              {
                text: 'It doesn\'t matter where it goes',
                isCorrect: false,
                explanation: 'It does matter for LEFT/RIGHT JOINs — placing a filter in ON vs WHERE produces different results.',
              },
              {
                text: 'In a HAVING clause',
                isCorrect: false,
                explanation: 'HAVING is for filtering aggregated groups, not row-level filters.',
              },
            ],
          },
        ],
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
        lessons: [
          {
            heading: 'The mental model: collapse and summarise',
            body: 'GROUP BY answers questions of the form "for each X, what\'s the [count/sum/avg] of Y?" — for each customer, total spend. For each month, count of orders. For each region, average order value. The pattern is always the same: you collapse many rows into one row per group, and aggregate functions tell you what to do with the collapsed values.',
            bullets: [
              'COUNT(*) — number of rows in the group',
              'COUNT(column) — number of non-null values in the group',
              'SUM(column) — total of the group',
              'AVG(column) — average of the group',
              'MIN(column) / MAX(column) — smallest / largest in the group',
            ],
            callout: {
                label: 'Remember',
                text: '"For each ___, ___" is the verbal pattern. If you can phrase your question this way, GROUP BY is the answer.',
              },
          },
          {
            heading: 'The cardinal rule',
            body: 'Every column in SELECT must either appear in GROUP BY or be inside an aggregate function. Break this rule and the query either errors or returns garbage depending on the database. The reason is logical: if you\'re collapsing 100 rows into 1 group, what value would `customer_email` show? It only makes sense to show it if it\'s the same for every row in the group (i.e., grouped) or aggregated somehow.',
            bullets: [
              '✅ SELECT region, COUNT(*) FROM users GROUP BY region',
              '✅ SELECT region, AVG(age), MAX(age) FROM users GROUP BY region',
              '❌ SELECT region, age FROM users GROUP BY region — `age` not grouped or aggregated',
              '✅ SELECT region, AVG(age) FROM users GROUP BY region — fixed by aggregating age',
            ],
          },
          {
            heading: 'WHERE vs HAVING',
            body: 'WHERE filters rows BEFORE aggregation. HAVING filters groups AFTER aggregation. Knowing which to use depends on what you\'re filtering on.',
            bullets: [
              '`WHERE region = \'UK\'` — filter rows before grouping (fast, uses indexes)',
              '`HAVING COUNT(*) > 10` — filter groups after aggregation (must be HAVING because the aggregate doesn\'t exist yet at WHERE time)',
              'Rule of thumb: if your filter uses an aggregate function, it goes in HAVING; otherwise WHERE',
            ],
            callout: {
                label: 'Remember',
                text: 'Putting `COUNT(*) > 10` in WHERE will error. Putting `region = \'UK\'` in HAVING works but is slower than putting it in WHERE.',
              },
          },
          {
            heading: 'A worked analyst question',
            body: '"Show regions with more than 100 customers, and their average lifetime value, ordered by highest LTV first." This combines everything.',
            bullets: [
              'SELECT region, COUNT(*) AS customer_count, AVG(lifetime_value) AS avg_ltv',
              'FROM customers',
              'WHERE active = TRUE',
              'GROUP BY region',
              'HAVING COUNT(*) > 100',
              'ORDER BY avg_ltv DESC;',
            ],
          },
        ],
        keyTakeaways: [
          'GROUP BY = "for each X, ___" — collapses rows into one per group',
          'Every SELECT column must be grouped or aggregated — no exceptions',
          'WHERE filters rows pre-aggregation; HAVING filters groups post-aggregation',
          'COUNT, SUM, AVG, MIN, MAX cover most analyst questions',
        ],
        quiz: [
          {
            id: 'q1',
            prompt:
              'Which query correctly answers "how many customers do we have in each country?"',
            options: [
              {
                text: 'SELECT country, COUNT(*) FROM customers GROUP BY country;',
                isCorrect: true,
                explanation: 'Right — collapses rows by country, COUNT(*) gives the row count per group.',
              },
              {
                text: 'SELECT country, name, COUNT(*) FROM customers GROUP BY country;',
                isCorrect: false,
                explanation: 'Breaks the cardinal rule — `name` is in SELECT but not grouped or aggregated. Errors in most databases.',
              },
              {
                text: 'SELECT COUNT(country) FROM customers;',
                isCorrect: false,
                explanation: 'Returns one number — total countries with non-null values, not a per-country breakdown.',
              },
              {
                text: 'SELECT country, COUNT(*) FROM customers;',
                isCorrect: false,
                explanation: 'Missing GROUP BY — would error or behave unpredictably.',
              },
            ],
            hint: 'Every column must be grouped or aggregated.',
          },
          {
            id: 'q2',
            prompt:
              'You write `WHERE COUNT(*) > 5` and get an error. What\'s the fix?',
            options: [
              {
                text: 'Change WHERE to HAVING — aggregates can only be filtered after grouping, which WHERE happens before',
                isCorrect: true,
                explanation: 'Right — execution order is FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY. The aggregate doesn\'t exist at WHERE time.',
              },
              {
                text: 'Add COUNT(*) to the SELECT list',
                isCorrect: false,
                explanation: 'That changes what\'s shown but doesn\'t fix the WHERE error.',
              },
              {
                text: 'Wrap COUNT in parentheses: WHERE (COUNT(*)) > 5',
                isCorrect: false,
                explanation: 'Parentheses don\'t change the fundamental issue — aggregates aren\'t allowed in WHERE.',
              },
              {
                text: 'Change to WHERE COUNT > 5 (drop the parens)',
                isCorrect: false,
                explanation: 'Still aggregates in WHERE — same error.',
              },
            ],
          },
          {
            id: 'q3',
            prompt:
              'What\'s the difference between COUNT(*) and COUNT(email)?',
            options: [
              {
                text: 'They\'re identical',
                isCorrect: false,
                explanation: 'Subtle but important difference — they treat NULLs differently.',
              },
              {
                text: 'COUNT(*) counts all rows; COUNT(email) counts only rows where email is not NULL',
                isCorrect: true,
                explanation: 'Right — this is one of those small details that catches people on tests and at work. Use COUNT(*) for "how many rows", COUNT(column) for "how many non-null values in this column".',
              },
              {
                text: 'COUNT(*) is faster than COUNT(email)',
                isCorrect: false,
                explanation: 'Performance is similar in most cases — the meaningful difference is NULL handling.',
              },
              {
                text: 'COUNT(email) errors if any email is NULL',
                isCorrect: false,
                explanation: 'It doesn\'t error — it just skips the NULL rows.',
              },
            ],
          },
        ],
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
        lessons: [
          {
            heading: 'GROUP BY collapses; window functions don\'t',
            body: 'GROUP BY rolls many rows into one per group — you lose row-level detail. Window functions compute the same kind of summaries (rank, running total, average over group) but keep every original row intact, with the computed value attached. This sounds small but unlocks an entire class of queries that GROUP BY can\'t express.',
            bullets: [
              'GROUP BY: 100 rows → 5 grouped rows',
              'Window function: 100 rows → 100 rows, each with a computed group value',
              'Whenever you need "give me each row plus a comparison to its group", reach for windows',
            ],
            callout: {
                label: 'Remember',
                text: 'If a question contains "for each X show Y AND the rank/total/average", it almost always wants a window function.',
              },
          },
          {
            heading: 'The OVER clause and PARTITION BY',
            body: 'Window functions are recognizable by the `OVER (...)` clause. Inside OVER, `PARTITION BY` defines the groups, and `ORDER BY` controls ordering within each group (used by ranking and running totals).',
            bullets: [
              '`SUM(amount) OVER (PARTITION BY customer_id)` — total per customer attached to each row',
              '`ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC)` — row 1 = most recent, etc.',
              '`AVG(score) OVER ()` — empty OVER = running across all rows, no partitioning',
            ],
          },
          {
            heading: 'The "most recent record per user" pattern',
            body: 'This is the single most common interview window function question. Use ROW_NUMBER() with PARTITION BY user, ORDER BY date DESC, then filter to row_number = 1.',
            bullets: [
              'WITH ranked AS (',
              '  SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn',
              '  FROM events',
              ')',
              'SELECT * FROM ranked WHERE rn = 1;',
            ],
            callout: {
                label: 'Remember',
                text: 'You can\'t reference `rn` directly in WHERE in the same query — that\'s why we wrap it in a CTE (or subquery). Window functions are calculated AFTER WHERE in the execution order.',
              },
          },
          {
            heading: 'ROW_NUMBER vs RANK vs DENSE_RANK',
            body: 'Three ranking functions exist and they behave differently when there are ties. Pick by what your question wants.',
            bullets: [
              'ROW_NUMBER: 1, 2, 3, 4 — always sequential, even with ties (tie-breaking is arbitrary)',
              'RANK: 1, 2, 2, 4 — same rank for ties, then a gap',
              'DENSE_RANK: 1, 2, 2, 3 — same rank for ties, no gap',
              'Most "top N per group" questions want ROW_NUMBER unless ties matter',
            ],
          },
        ],
        keyTakeaways: [
          'Window functions = group-level math without losing row-level detail',
          'OVER (PARTITION BY ... ORDER BY ...) is the core syntax to memorise',
          'Top-N-per-group: ROW_NUMBER + CTE + filter on rn — interview classic',
          'ROW_NUMBER vs RANK vs DENSE_RANK differ on tie handling — pick deliberately',
        ],
        quiz: [
          {
            id: 'q1',
            prompt:
              'Which scenario is best solved with a window function rather than GROUP BY?',
            options: [
              {
                text: '"Total revenue per region" — one row per region',
                isCorrect: false,
                explanation: 'Classic GROUP BY territory — you want collapsed rows.',
              },
              {
                text: '"For each order, show its amount AND the average order amount for that customer" — one row per order with extra context',
                isCorrect: true,
                explanation: 'Right — you need every order row preserved AND a per-customer aggregate. GROUP BY would collapse the orders, killing detail.',
              },
              {
                text: '"How many users we have" — one number',
                isCorrect: false,
                explanation: 'Simple aggregate — no need for windows.',
              },
              {
                text: '"Filter to orders over $100" — same row count, just filtered',
                isCorrect: false,
                explanation: 'Filtering is a WHERE clause, not a window function.',
              },
            ],
            hint: 'Need every row preserved + a group-level value? That\'s windows.',
          },
          {
            id: 'q2',
            prompt:
              'You write `SELECT user_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn FROM events WHERE rn = 1;` and get an error. Why?',
            options: [
              {
                text: 'Window functions are calculated after WHERE — you can\'t filter on `rn` in the same query. Wrap in a CTE or subquery first.',
                isCorrect: true,
                explanation: 'Right — execution order: FROM → WHERE → GROUP BY → window functions → SELECT. The alias `rn` doesn\'t exist at WHERE time.',
              },
              {
                text: 'PARTITION BY only works with SUM, not ROW_NUMBER',
                isCorrect: false,
                explanation: 'False — PARTITION BY works with all window functions.',
              },
              {
                text: 'You need to add GROUP BY user_id',
                isCorrect: false,
                explanation: 'GROUP BY would collapse rows — defeats the purpose of using a window function.',
              },
              {
                text: 'ROW_NUMBER doesn\'t accept ORDER BY',
                isCorrect: false,
                explanation: 'It does — ROW_NUMBER specifically requires ORDER BY to be deterministic.',
              },
            ],
          },
          {
            id: 'q3',
            prompt:
              'You\'re ranking employees by salary and there\'s a 3-way tie at $80k. What\'s the difference in output between ROW_NUMBER, RANK, and DENSE_RANK?',
            options: [
              {
                text: 'They all output identical rankings — 1, 2, 3',
                isCorrect: false,
                explanation: 'They differ on tie handling — that\'s the whole point of having three.',
              },
              {
                text: 'ROW_NUMBER: 1,2,3 (arbitrary tie break) | RANK: 1,1,1,4 (skips to 4 after tie) | DENSE_RANK: 1,1,1,2 (no skip)',
                isCorrect: true,
                explanation: 'Right — ROW_NUMBER force-ranks even ties, RANK leaves gaps, DENSE_RANK doesn\'t. Pick based on whether ties should share a rank and whether gaps matter.',
              },
              {
                text: 'ROW_NUMBER and RANK are identical; DENSE_RANK is the only different one',
                isCorrect: false,
                explanation: 'False — ROW_NUMBER never ties, RANK does and skips, DENSE_RANK ties but doesn\'t skip.',
              },
              {
                text: 'They behave the same unless you specify NULLS LAST',
                isCorrect: false,
                explanation: 'NULLS LAST only affects null handling, not tie behavior.',
              },
            ],
          },
        ],
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
        lessons: [
          {
            heading: 'SQL interviews test pattern recognition',
            body: 'Most candidates approach SQL interviews like a memorisation exercise. The good ones recognise patterns. Almost every interview SQL question maps to one of about five canonical shapes. Once you can name the pattern in 30 seconds, you can write the query in 5 minutes.',
            bullets: [
              'Top N per group — most recent order per customer, top 3 by sales per region',
              'Running total — cumulative revenue, balances over time',
              'Deduplication — collapse near-duplicate rows by some criteria',
              'Pivot — turn rows into columns (months across, metrics down)',
              'Gaps and islands — find consecutive sequences, breaks in activity',
            ],
            callout: {
                label: 'Remember',
                text: 'In an interview, your first 30 seconds should be naming the pattern out loud. "This is a top-N-per-group problem — I\'ll use ROW_NUMBER with a CTE."',
              },
          },
          {
            heading: 'Pattern 1: Top N per group',
            body: 'You\'ve seen this in the window functions module. The cookbook: ROW_NUMBER() OVER (PARTITION BY group_col ORDER BY rank_col DESC) inside a CTE, then filter to rn <= N.',
            bullets: [
              'WITH ranked AS (',
              '  SELECT *, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC) AS rn',
              '  FROM orders)',
              'SELECT * FROM ranked WHERE rn <= 3;',
              'For ties that matter, swap ROW_NUMBER for RANK or DENSE_RANK',
            ],
          },
          {
            heading: 'Pattern 2: Running total',
            body: 'Cumulative sums over a sequence. The trick is the OVER clause with ORDER BY but no explicit window frame — the default frame for SUM with ORDER BY is "from start to current row".',
            bullets: [
              'SELECT order_date, amount,',
              '       SUM(amount) OVER (ORDER BY order_date) AS running_total',
              'FROM orders;',
              'Add PARTITION BY customer_id to get per-customer running totals',
              'Beware: SUM(...) OVER (PARTITION BY x) without ORDER BY gives the total for the partition, not running',
            ],
          },
          {
            heading: 'Patterns 3-5: deduplication, pivot, gaps & islands',
            body: 'Quick mental hooks for the remaining three so you can identify them on sight in an interview.',
            bullets: [
              'Deduplication: ROW_NUMBER over a key, keep rn=1 — same shape as top-N-per-group',
              'Pivot: CASE WHEN inside SUM — `SUM(CASE WHEN month=\'Jan\' THEN amount END) AS jan_total` per group',
              'Gaps & islands: subtract ROW_NUMBER from a date sequence — equal differences = same island',
              'Trust the pattern: if the question describes "consecutive days a user logged in", that\'s gaps-and-islands',
            ],
            callout: {
                label: 'Remember',
                text: 'Don\'t try to invent solutions in real time. Recognise the pattern, recall the cookbook, adapt the variable names.',
              },
          },
        ],
        keyTakeaways: [
          'Interview SQL = pattern recognition; almost everything maps to one of 5 patterns',
          'Top-N-per-group: ROW_NUMBER + CTE + filter on rn',
          'Running total: SUM(x) OVER (ORDER BY date) — frame defaults to start-to-current',
          'Name the pattern out loud in your first 30 seconds — buys thinking time and signals confidence',
        ],
        quiz: [
          {
            id: 'q1',
            prompt:
              'Interviewer: "Find the 2 most recent orders per customer." What pattern is this?',
            options: [
              {
                text: 'Running total',
                isCorrect: false,
                explanation: 'Running totals are about cumulative sums over time, not picking top rows per group.',
              },
              {
                text: 'Top N per group — use ROW_NUMBER with PARTITION BY customer, ORDER BY date DESC, filter rn <= 2',
                isCorrect: true,
                explanation: 'Right — classic top-N-per-group. The phrasing "N per group" is your trigger.',
              },
              {
                text: 'Pivot',
                isCorrect: false,
                explanation: 'Pivot reshapes rows into columns — different goal entirely.',
              },
              {
                text: 'Gaps and islands',
                isCorrect: false,
                explanation: 'That pattern finds consecutive sequences. Not what\'s being asked.',
              },
            ],
            hint: 'The phrasing "N per group" should trigger one specific pattern.',
          },
          {
            id: 'q2',
            prompt:
              'You\'re asked to compute cumulative revenue by date. Which is correct?',
            options: [
              {
                text: 'SELECT date, SUM(amount) OVER (ORDER BY date) AS running_total FROM orders;',
                isCorrect: true,
                explanation: 'Right — SUM with ORDER BY in OVER defaults to "from start of partition to current row", which is the running total.',
              },
              {
                text: 'SELECT date, SUM(amount) FROM orders GROUP BY date ORDER BY date;',
                isCorrect: false,
                explanation: 'This gives the daily total, not the running total. You need windows here, not GROUP BY.',
              },
              {
                text: 'SELECT date, SUM(amount) OVER (PARTITION BY date) AS running_total FROM orders;',
                isCorrect: false,
                explanation: 'PARTITION BY date with no ORDER BY gives total per date — same as GROUP BY in effect, not running.',
              },
              {
                text: 'SELECT date, RUNNING_SUM(amount) FROM orders;',
                isCorrect: false,
                explanation: 'RUNNING_SUM isn\'t a SQL function. The pattern is SUM with the right OVER clause.',
              },
            ],
          },
          {
            id: 'q3',
            prompt:
              'Why does naming the pattern out loud at the start of an SQL interview help?',
            options: [
              {
                text: 'It buys thinking time and signals you\'ve seen this shape before — both are positive signals to interviewers',
                isCorrect: true,
                explanation: 'Right — interviewers want to see structured thinking. Naming the pattern shows you\'re not winging it, and the verbalisation gives you 10-15 seconds of grace before you start writing.',
              },
              {
                text: 'It\'s required by the interview rubric',
                isCorrect: false,
                explanation: 'Not formally required, but pragmatically very effective.',
              },
              {
                text: 'Some interviewers will give you the answer if you name the pattern',
                isCorrect: false,
                explanation: 'They won\'t — but they\'ll trust you more, and a confident interviewer is more forgiving of small mistakes.',
              },
              {
                text: 'It\'s only useful if you can\'t solve the problem',
                isCorrect: false,
                explanation: 'It\'s useful even when you can solve it — naming patterns is a senior-level signal.',
              },
            ],
          },
        ],
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
