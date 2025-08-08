import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../lib/firebase-admin';
import { db } from '../../../../lib/firebase-admin';

interface ActionItem {
  id?: string;
  userId: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// GET - Fetch all action items for a user
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
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const userId = decodedToken.uid;
    
    // Fetch action items from Firestore
    const actionItemsRef = db.collection('actionItems');
    const snapshot = await actionItemsRef
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const actionItems: ActionItem[] = [];
    snapshot.forEach(doc => {
      actionItems.push({
        id: doc.id,
        ...doc.data()
      } as ActionItem);
    });

    return NextResponse.json({ actionItems });

  } catch (error) {
    console.error('Error fetching action items:', error);
    return NextResponse.json({ error: 'Failed to fetch action items' }, { status: 500 });
  }
}

// POST - Create a new action item
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
    const actionItemData: Omit<ActionItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = await req.json();

    // Validate required fields
    if (!actionItemData.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newActionItem: ActionItem = {
      userId,
      ...actionItemData,
      createdAt: now,
      updatedAt: now
    };

    // Add to Firestore
    const docRef = await db.collection('actionItems').add(newActionItem);
    
    return NextResponse.json({ 
      id: docRef.id,
      ...newActionItem
    });

  } catch (error) {
    console.error('Error creating action item:', error);
    return NextResponse.json({ error: 'Failed to create action item' }, { status: 500 });
  }
}

// PUT - Update an action item
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
      return NextResponse.json({ error: 'Action item ID is required' }, { status: 400 });
    }

    // Verify ownership
    const actionItemRef = db.collection('actionItems').doc(id);
    const actionItemDoc = await actionItemRef.get();
    
    if (!actionItemDoc.exists) {
      return NextResponse.json({ error: 'Action item not found' }, { status: 404 });
    }

    const actionItemData = actionItemDoc.data();
    if (actionItemData?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized - Not your action item' }, { status: 403 });
    }

    // Update the action item
    const now = new Date().toISOString();
    await actionItemRef.update({
      ...updateData,
      updatedAt: now
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating action item:', error);
    return NextResponse.json({ error: 'Failed to update action item' }, { status: 500 });
  }
}

// DELETE - Delete an action item
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
      return NextResponse.json({ error: 'Action item ID is required' }, { status: 400 });
    }

    // Verify ownership
    const actionItemRef = db.collection('actionItems').doc(id);
    const actionItemDoc = await actionItemRef.get();
    
    if (!actionItemDoc.exists) {
      return NextResponse.json({ error: 'Action item not found' }, { status: 404 });
    }

    const actionItemData = actionItemDoc.data();
    if (actionItemData?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized - Not your action item' }, { status: 403 });
    }

    // Delete the action item
    await actionItemRef.delete();

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting action item:', error);
    return NextResponse.json({ error: 'Failed to delete action item' }, { status: 500 });
  }
} 