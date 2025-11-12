import { NextRequest, NextResponse } from 'next/server';
import { RecruiterAuthService } from '@/lib/recruiter-auth';
import { auth } from '../../../../../lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase token
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;
    
    const { email, role, ...recruiterData } = await req.json();
    
    if (role !== 'recruiter') {
      return NextResponse.json({ error: 'Invalid role for recruiter profile creation' }, { status: 400 });
    }
    
    // Create recruiter profile
    const recruiterProfile = await RecruiterAuthService.createRecruiterProfile(
      uid,
      email,
      recruiterData
    );
    
    return NextResponse.json({
      success: true,
      recruiter: recruiterProfile
    });
    
  } catch (error: any) {
    console.error('Create recruiter profile error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
