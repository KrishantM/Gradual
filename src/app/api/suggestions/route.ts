import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth, db } from '../../../../lib/firebase-admin';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify the Firebase token and use the verified uid for any writes.
    let verifiedUid: string;
    try {
      const decodedToken = await auth.verifyIdToken(token);
      verifiedUid = decodedToken.uid;
    } catch {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const {
      degree,
      gpa,
      gpaScale,
      interests,
      fullName,
      university,
      city,
      country,
      age,
      preferredIndustries,
      portfolioLinks,
      bio,
      cvText
    } = await req.json();

    // Validate required fields
    if (!degree || !gpa || !interests) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate normalized GPA percentage for better context
    const calculateGPAPercentage = (gpaValue: number, scale: string) => {
      if (scale === '100') return Math.round(gpaValue);
      const maxScale = parseFloat(scale) || 4.0;
      const percentage = (gpaValue / maxScale) * 100;
      return Math.round(Math.min(percentage, 100));
    };

    const gpaPercentage = calculateGPAPercentage(parseFloat(gpa), gpaScale || '4.0');
    const gpaContext = gpaScale ? `${gpa} out of ${gpaScale} (${gpaPercentage}% performance level)` : gpa;

    // Build comprehensive profile context
    const locationContext = city && country ? `Location: ${city}, ${country}` : '';
    const ageContext = age ? `Age: ${age} years old` : '';
    const industryContext = preferredIndustries ? `Preferred Industries: ${preferredIndustries}` : '';
    const portfolioContext = portfolioLinks ? `Portfolio/Links: ${portfolioLinks}` : '';
    const bioContext = bio ? `Background: ${bio}` : '';
    const cvContext = cvText ? `CV Summary: ${cvText.substring(0, 500)}${cvText.length > 500 ? '...' : ''}` : '';

    // Analyze career stage based on age and academic status
    const careerStage = age ? 
      (parseInt(age) < 22 ? 'Student/Early Career' : 
       parseInt(age) < 25 ? 'Recent Graduate' : 
       parseInt(age) < 30 ? 'Early Professional' : 
       parseInt(age) < 35 ? 'Mid-Career Professional' : 'Experienced Professional') : 'Student';

    const academicPerformance = gpaPercentage >= 85 ? 'Excellent' : 
                               gpaPercentage >= 70 ? 'Good' : 
                               gpaPercentage >= 50 ? 'Average' : 'Below Average';

    const prompt = `You are an expert career advisor AI. Based on the following comprehensive user profile, provide 5 highly specific, actionable career-building suggestions tailored to this individual's unique situation. Each suggestion should be structured as:

[One line title:]
[2-3 sentence description with specific actions, resources, or recommendations]

Profile Information:
- Name: ${fullName || 'Not provided'}
- University: ${university || 'Not provided'}
- Degree: ${degree}
- GPA: ${gpaContext}
- Interests: ${interests}
${locationContext ? `- ${locationContext}` : ''}
${ageContext ? `- ${ageContext}` : ''}
${industryContext ? `- ${industryContext}` : ''}
${portfolioContext ? `- ${portfolioContext}` : ''}
${bioContext ? `- ${bioContext}` : ''}
${cvContext ? `- ${cvContext}` : ''}

Career Analysis:
- Career Stage: ${careerStage}
- Academic Performance: ${academicPerformance} (${gpaPercentage}%)
- Geographic Market: ${city}, ${country}

Guidelines for suggestions:
1. Consider their academic performance level (${gpaPercentage}%) when recommending competitive vs. accessible opportunities
2. Factor in their location (${city}, ${country}) for local opportunities and visa considerations
3. Leverage their specific interests and preferred industries for targeted advice
4. Consider their age and experience level for appropriate career stage recommendations
5. Use their portfolio/links to suggest relevant networking or skill-building opportunities
6. Incorporate their background/bio for personalized motivation and context
7. Reference their CV content for specific skill gaps or strengths to address
8. Account for their career stage (${careerStage}) in recommendation complexity and timeline

Make suggestions that are:
- Specific to their profile (not generic advice)
- Actionable with clear next steps
- Realistic for their academic performance level
- Relevant to their location and industry preferences
- Appropriate for their career stage and background
- Time-sensitive and prioritized by impact

Respond only with the formatted list. Remove formatting such as asterisks or bullet points.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { 
          role: 'system', 
          content: `You are an expert career advisor with deep knowledge of global job markets, industry trends, and career development strategies. You specialize in providing highly personalized, actionable career advice based on comprehensive user profiles.

Your expertise includes:
- Academic performance analysis and appropriate opportunity matching
- Geographic considerations (visa requirements, local markets, remote opportunities)
- Industry-specific career paths and skill development
- Age-appropriate career stage recommendations
- Portfolio and networking strategy development
- CV analysis and skill gap identification

Always provide specific, actionable advice with clear next steps, resources, or recommendations. Focus on realistic opportunities that match the user's academic performance, location, and career stage.` 
        },
        { role: 'user', content: prompt },
      ],
    });

    const suggestionsText = response.choices[0].message?.content || '';
    const suggestions = suggestionsText.split(/\n{2,}/).filter(line => line.trim() !== '');

    // Save to Firestore using the verified uid from the auth token, never a body field.
    const ref = db.collection('suggestions').doc(verifiedUid);
    await ref.set({
      suggestions: suggestions.join('\n\n'),
      updatedAt: new Date(),
    });

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error('OpenAI Suggestion Error:', err);
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
} 