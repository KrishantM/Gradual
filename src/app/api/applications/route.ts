import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../lib/firebase-admin';
import { db } from '../../../../lib/firebase-admin';

interface JobApplication {
  id?: string;
  userId: string;
  company: string;
  position: string;
  jobUrl: string;
  stage: 'to_apply' | 'applied' | 'interviewing' | 'offered' | 'rejected';
  resumeUsed: string;
  applyDate: string;
  notes?: string;
  salary?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

// GET - Fetch all applications for a user
export async function GET(req: NextRequest) {
  try {
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
    console.log('Fetching applications for user:', userId);
    
    // Fetch applications from Firestore
    const applicationsRef = db.collection('applications');
    const snapshot = await applicationsRef
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const applications: JobApplication[] = [];
    snapshot.forEach(doc => {
      applications.push({
        id: doc.id,
        ...doc.data()
      } as JobApplication);
    });

    console.log(`Found ${applications.length} applications for user ${userId}`);
    return NextResponse.json({ applications });

  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch applications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Create a new application
export async function POST(req: NextRequest) {
  try {
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
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const applicationData: Omit<JobApplication, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = await req.json();

    // Validate required fields
    if (!applicationData.company || !applicationData.position || !applicationData.jobUrl) {
      return NextResponse.json({ error: 'Company, position, and job URL are required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newApplication: JobApplication = {
      userId,
      ...applicationData,
      createdAt: now,
      updatedAt: now
    };

    // Add to Firestore
    const docRef = await db.collection('applications').add(newApplication);
    
    return NextResponse.json({ 
      id: docRef.id,
      ...newApplication
    });

  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}

// PUT - Update an application
export async function PUT(req: NextRequest) {
  try {
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
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const { id, ...updateData } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    // Verify ownership
    const applicationRef = db.collection('applications').doc(id);
    const applicationDoc = await applicationRef.get();
    
    if (!applicationDoc.exists) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const applicationData = applicationDoc.data();
    if (applicationData?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized - Not your application' }, { status: 403 });
    }

    // Update the application
    const now = new Date().toISOString();
    await applicationRef.update({
      ...updateData,
      updatedAt: now
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}

// DELETE - Delete an application
export async function DELETE(req: NextRequest) {
  try {
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
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    // Verify ownership
    const applicationRef = db.collection('applications').doc(id);
    const applicationDoc = await applicationRef.get();
    
    if (!applicationDoc.exists) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const applicationData = applicationDoc.data();
    if (applicationData?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized - Not your application' }, { status: 403 });
    }

    // Delete the application
    await applicationRef.delete();

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting application:', error);
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
  }
} 