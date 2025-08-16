import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../lib/firebase-admin';
import { db } from '../../../../../lib/firebase-admin';

// DELETE - Delete an application
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const applicationId = id;

    // Check if the application exists and belongs to the user
    const applicationRef = db.collection('applications').doc(applicationId);
    const applicationDoc = await applicationRef.get();

    if (!applicationDoc.exists) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const applicationData = applicationDoc.data();
    if (applicationData?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized - Application does not belong to user' }, { status: 403 });
    }

    // Delete the application
    await applicationRef.delete();

    console.log(`Application ${applicationId} deleted for user ${userId}`);
    return NextResponse.json({ message: 'Application deleted successfully' });

  } catch (error) {
    console.error('Error deleting application:', error);
    return NextResponse.json({ 
      error: 'Failed to delete application',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update an application
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the Firebase token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const applicationId = id;
    const updateData = await req.json();

    // Check if the application exists and belongs to the user
    const applicationRef = db.collection('applications').doc(applicationId);
    const applicationDoc = await applicationRef.get();

    if (!applicationDoc.exists) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const applicationData = applicationDoc.data();
    if (applicationData?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized - Application does not belong to user' }, { status: 403 });
    }

    // Update the application
    const now = new Date().toISOString();
    await applicationRef.update({
      ...updateData,
      updatedAt: now
    });

    console.log(`Application ${applicationId} updated for user ${userId}`);
    return NextResponse.json({ message: 'Application updated successfully' });

  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json({ 
      error: 'Failed to update application',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
