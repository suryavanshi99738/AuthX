export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body as { userId: string };

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Create session with 24-hour expiry
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const session = await db.session.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      session: {
        token: session.token,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find session by token
    const session = await db.session.findUnique({
      where: { token },
    });

    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' });
    }

    // Check if expired
    if (new Date() > session.expiresAt) {
      // Clean up expired session
      await db.session.delete({ where: { id: session.id } });
      return NextResponse.json({ success: false, error: 'Session expired' });
    }

    return NextResponse.json({
      success: true,
      userId: session.userId,
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body as { token: string };

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    // Delete session by token
    await db.session.deleteMany({
      where: { token },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
