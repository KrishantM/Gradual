import { openai } from '../../../../lib/openai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { cvText } = await req.json();

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
  messages: [
    {
      role: 'system',
      content: `You are an AI CV scoring assistant. Always reply in the following structure:

Overall Score (0–100): [score]

1. Professionalism:
[1–2 sentence explanation, and score out of 25]

2. Experience:
[1–2 sentence explanation, and score out of 25]

3. Keyword Screening:
[1–2 sentence explanation, and score out of 25]

4. Relevance to Target Role:
[1–2 sentence explanation, and score out of 25]

5. Areas to improve:
[1–2 sentence explanation]

Do not include any introduction or closing remarks. Evaluate the overall score based on criteria 1 - 4, with the overall score being the sum of the scores of the criteria. Do not break from this format.`,
    },
    {
      role: 'user',
      content: `Here is the CV:\n\n${cvText}`,
    },
  ],
});

    const score = response.choices[0].message?.content;
    return NextResponse.json({ score });
  } catch (err: any) {
    console.error('OpenAI API Error:', err); // Log the real error!
    return NextResponse.json({ error: 'Failed to generate score' }, { status: 500 });
  }
}
