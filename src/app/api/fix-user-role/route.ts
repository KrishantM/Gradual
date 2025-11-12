import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../lib/firebase-admin';
import { db } from '../../../../lib/firebase-admin';

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
    
    const { newRole } = await req.json();
    
    if (!newRole || !['student', 'recruiter'].includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    
    // Check if user document exists
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      // Create user document if it doesn't exist
      await db.collection('users').doc(uid).set({
        email: decodedToken.email,
        role: newRole,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      // Update existing user document
      await db.collection('users').doc(uid).update({
        role: newRole,
        updatedAt: new Date()
      });
    }
    
    // If setting as recruiter, also check if recruiter document exists
    if (newRole === 'recruiter') {
      const recruiterDoc = await db.collection('recruiters').doc(uid).get();
      if (!recruiterDoc.exists) {
        // Create basic recruiter document
        await db.collection('recruiters').doc(uid).set({
          uid: uid,
          email: decodedToken.email,
          role: 'recruiter',
          createdAt: new Date(),
          updatedAt: new Date(),
          companyName: '',
          companySize: 'small',
          industry: '',
          fullName: '',
          jobTitle: '',
          department: '',
          subscriptionTier: 'free',
          subscriptionStatus: 'trial',
          maxStudentViews: 10,
          currentStudentViews: 0,
          canViewCVScores: true,
          canViewFullProfiles: false,
          canContactStudents: false,
          canExportData: false,
          canCreateShortlists: false,
          canAccessAnalytics: false,
          totalLogins: 0,
          profileViewsToday: 0,
          profileViewsThisMonth: 0,
          isVerified: false
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `User role updated to ${newRole}`,
      userDocExists: userDoc.exists,
      recruiterDocExists: newRole === 'recruiter' ? await db.collection('recruiters').doc(uid).get().then(doc => doc.exists) : false
    });
    
  } catch (error: any) {
    console.error('Fix user role error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
