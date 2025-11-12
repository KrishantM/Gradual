import { NextRequest, NextResponse } from 'next/server';
import { RecruiterAuthService } from '@/lib/recruiter-auth';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    const result = await RecruiterAuthService.verifyRecruiter(token);
    
    if (!result) {
      return NextResponse.json({ error: 'Not authorized as recruiter' }, { status: 403 });
    }
    
    return NextResponse.json({
      recruiter: result.recruiter,
      permissions: result.permissions
    });
    
  } catch (error: any) {
    console.error('Recruiter verification error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

