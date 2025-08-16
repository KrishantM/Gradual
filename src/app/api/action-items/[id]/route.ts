import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../lib/firebase-admin';
import { db } from '../../../../../lib/firebase-admin';

// DELETE - Delete an action item
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
    const actionItemId = id;

    // Check if the action item exists and belongs to the user
    const actionItemRef = db.collection('actionItems').doc(actionItemId);
    const actionItemDoc = await actionItemRef.get();

    if (!actionItemDoc.exists) {
      return NextResponse.json({ error: 'Action item not found' }, { status: 404 });
    }

    const actionItemData = actionItemDoc.data();
    if (actionItemData?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized - Action item does not belong to user' }, { status: 403 });
    }

    // Delete the action item
    await actionItemRef.delete();

    console.log(`Action item ${actionItemId} deleted for user ${userId}`);
    return NextResponse.json({ message: 'Action item deleted successfully' });

  } catch (error) {
    console.error('Error deleting action item:', error);
    return NextResponse.json({ 
      error: 'Failed to delete action item',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Update an action item
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
    const actionItemId = id;
    const updateData = await req.json();

    // Check if the action item exists and belongs to the user
    const actionItemRef = db.collection('actionItems').doc(actionItemId);
    const actionItemDoc = await actionItemRef.get();

    if (!actionItemDoc.exists) {
      return NextResponse.json({ error: 'Action item not found' }, { status: 404 });
    }

    const actionItemData = actionItemDoc.data();
    if (actionItemData?.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized - Action item does not belong to user' }, { status: 403 });
    }

    // Update the action item
    await actionItemRef.update(updateData);

    console.log(`Action item ${actionItemId} updated for user ${userId}`);
    return NextResponse.json({ message: 'Action item updated successfully' });

  } catch (error) {
    console.error('Error updating action item:', error);
    return NextResponse.json({ 
      error: 'Failed to update action item',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
