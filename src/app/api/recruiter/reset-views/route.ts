import { NextRequest, NextResponse } from 'next/server';
import { RecruiterAuthService } from '@/lib/recruiter-auth';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify recruiter
    const recruiterResult = await RecruiterAuthService.verifyRecruiter(token);
    if (!recruiterResult) {
      return NextResponse.json({ error: 'Not authorized as recruiter' }, { status: 403 });
    }
    
    // Reset daily views
    await RecruiterAuthService.resetDailyViews(recruiterResult.recruiter.uid);
    
    return NextResponse.json({
      success: true,
      message: 'Daily views reset successfully'
    });
    
  } catch (error: any) {
    console.error('Reset views error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
