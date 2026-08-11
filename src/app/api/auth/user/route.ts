export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name } = body as { email: string; name?: string };

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json({
        success: true,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
        },
      });
    }

    // Create new user with fallback handling if created concurrently
    try {
      const newUser = await db.user.create({
        data: {
          email: normalizedEmail,
          name: name || null,
        },
      });

      return NextResponse.json({
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
      });
    } catch {
      const fallbackUser = await db.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (fallbackUser) {
        return NextResponse.json({
          success: true,
          user: {
            id: fallbackUser.id,
            email: fallbackUser.email,
            name: fallbackUser.name,
          },
        });
      }
      throw new Error('User creation conflict');
    }
  } catch (error) {
    console.error('Error creating/getting user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}
