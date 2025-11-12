import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../lib/firebase-admin';
import { db } from '../../../../../lib/firebase-admin';

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase token
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;
    
    const profileData = await req.json();
    
    // Validate required fields
    if (!profileData.companyName || !profileData.fullName || !profileData.jobTitle || !profileData.department || !profileData.industry) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Update the recruiter profile
    await db.collection('recruiters').doc(uid).update({
      ...profileData,
      updatedAt: new Date(),
      isVerified: true,
      verificationMethod: 'manual',
      verificationDate: new Date()
    });
    
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    });
    
  } catch (error: any) {
    console.error('Update recruiter profile error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
