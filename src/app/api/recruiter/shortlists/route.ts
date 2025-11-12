import { NextRequest, NextResponse } from 'next/server';
import { RecruiterAuthService } from '@/lib/recruiter-auth';
import { db } from '../../../../../lib/firebase-admin';
// Using admin SDK methods directly

export async function GET(req: NextRequest) {
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
    
    // Check permissions
    if (!recruiterResult.permissions.canCreateShortlists) {
      return NextResponse.json({ error: 'Feature not available in your subscription tier' }, { status: 403 });
    }
    
    // Get shortlists for this recruiter
    const shortlistsSnap = await db.collection('recruiterShortlists')
      .where('recruiterId', '==', recruiterResult.recruiter.uid)
      .get();
    
    const shortlists = shortlistsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({
      shortlists: shortlists
    });
    
  } catch (error: any) {
    console.error('Get shortlists error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

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
    
    // Check permissions
    if (!recruiterResult.permissions.canCreateShortlists) {
      return NextResponse.json({ error: 'Feature not available in your subscription tier' }, { status: 403 });
    }
    
    const { name, studentIds } = await req.json();
    
    if (!name || !studentIds || !Array.isArray(studentIds)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    
    // Check shortlist limit
    const existingShortlists = await db.collection('recruiterShortlists')
      .where('recruiterId', '==', recruiterResult.recruiter.uid)
      .get();
    
    if (existingShortlists.size >= recruiterResult.permissions.maxShortlists) {
      return NextResponse.json({ error: 'Shortlist limit exceeded' }, { status: 400 });
    }
    
    // Check students per shortlist limit
    if (studentIds.length > recruiterResult.permissions.maxStudentsPerShortlist) {
      return NextResponse.json({ error: 'Student limit per shortlist exceeded' }, { status: 400 });
    }
    
    // Create shortlist
    const shortlistData = {
      recruiterId: recruiterResult.recruiter.uid,
      name: name,
      studentIds: studentIds,
      createdAt: new Date(),
      updatedAt: new Date(),
      isShared: false
    };
    
    const docRef = await db.collection('recruiterShortlists').add(shortlistData);
    
    return NextResponse.json({
      id: docRef.id,
      ...shortlistData
    });
    
  } catch (error: any) {
    console.error('Create shortlist error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
