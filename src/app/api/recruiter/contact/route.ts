import { NextRequest, NextResponse } from 'next/server';
import { RecruiterAuthService } from '@/lib/recruiter-auth';
import { db } from '../../../../../lib/firebase-admin';
// Using admin SDK methods directly

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
    if (!recruiterResult.permissions.canContactStudents) {
      return NextResponse.json({ error: 'Feature not available in your subscription tier' }, { status: 403 });
    }
    
    const { studentId, message, contactMethod } = await req.json();
    
    if (!studentId || !message || !contactMethod) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    
    // Verify student exists and allows recruiter contact
    const studentSnap = await db.collection('users').doc(studentId).get();
    
    if (!studentSnap.exists()) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    
    const studentData = studentSnap.data();
    
    // Check if student allows recruiter contact
    if (studentData.allowRecruiterContact === false) {
      return NextResponse.json({ error: 'Student has disabled recruiter contact' }, { status: 403 });
    }
    
    // Check rate limits
    const canContact = await RecruiterAuthService.checkRateLimit(recruiterResult.recruiter.uid, 'contact_student');
    if (!canContact) {
      return NextResponse.json({ error: 'Contact limit exceeded' }, { status: 429 });
    }
    
    // Create contact record
    const contactData = {
      recruiterId: recruiterResult.recruiter.uid,
      studentId: studentId,
      message: message,
      contactMethod: contactMethod,
      status: 'pending',
      createdAt: new Date(),
      recruiterName: recruiterResult.recruiter.fullName,
      recruiterCompany: recruiterResult.recruiter.companyName
    };
    
    const docRef = await db.collection('recruiterContacts').add(contactData);
    
    // Update recruiter activity
    await RecruiterAuthService.updateRecruiterActivity(recruiterResult.recruiter.uid, 'contact_student');
    
    // TODO: Send email notification to student
    // This would integrate with your email service
    
    return NextResponse.json({
      id: docRef.id,
      ...contactData
    });
    
  } catch (error: any) {
    console.error('Contact student error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
