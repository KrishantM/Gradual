import { NextRequest, NextResponse } from 'next/server';
import MailerLite from '@mailerlite/mailerlite-nodejs';
import { db } from '../../../../lib/firebase-admin';

const mailerlite = new MailerLite({
  api_key: process.env.MAILERLITE_API_KEY!,
});

// Enhanced rate limiting with better IP detection
const rateLimitMap = new Map<string, { count: number; resetTime: number; blocked: boolean }>();

function getClientIP(request: NextRequest): string {
  // Try multiple headers for IP detection
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip',
    'x-forwarded',
    'forwarded-for',
    'forwarded'
  ];
  
  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // Extract first IP from comma-separated list
      const ip = value.split(',')[0].trim();
      if (ip && ip !== 'unknown') {
        return ip;
      }
    }
  }
  
  return 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5; // 5 requests per 15 minutes

  const record = rateLimitMap.get(ip);
  
  // If IP is blocked, check if block period has expired
  if (record?.blocked && now > record.resetTime) {
    rateLimitMap.delete(ip);
  }
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs, blocked: false });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  if (record.blocked) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  if (record.count >= maxRequests) {
    // Block the IP for the remaining time
    record.blocked = true;
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}

export async function POST(request: NextRequest) {
  try {
    // Enhanced rate limiting
    const clientIP = getClientIP(request);
    const rateLimit = checkRateLimit(clientIP);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString()
          }
        }
      );
    }

    const { name, email } = await request.json();
    const normalizedEmail = email.trim().toLowerCase();

    // Enhanced input validation
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    if (!email.includes('@') || email.length < 5) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    if (name.length < 2) {
      return NextResponse.json(
        { error: 'Please provide a valid name' },
        { status: 400 }
      );
    }

    // Check for duplicate in Firestore using server-side admin SDK
    const waitlistRef = db.collection('waitlist');
    const snapshot = await waitlistRef.where('email', '==', normalizedEmail).get();

    if (!snapshot.empty) {
      return NextResponse.json(
        { error: "You're already on the waitlist. We'll be in touch soon!" },
        { status: 400 }
      );
    }

    // Save to Firestore using server-side admin SDK
    await waitlistRef.add({
      name,
      email: normalizedEmail,
      displayName: `${name} (${normalizedEmail})`,
      submittedAt: new Date().toISOString(),
      ip: clientIP, // Store IP for monitoring
    });

    // Add to MailerLite audience
    try {
      const groupId = process.env.MAILERLITE_WAITLIST_GROUP_ID || '161492505912673451';
      
      await mailerlite.subscribers.createOrUpdate({
        email: normalizedEmail,
        fields: {
          name: name,
        },
        groups: [groupId],
        status: 'active',
      });
      console.log(`Successfully added ${normalizedEmail} to MailerLite waitlist group`);
    } catch (mailerliteError) {
      console.error('MailerLite error:', mailerliteError);
      // Don't fail the entire request if MailerLite fails
    }

    return NextResponse.json({ 
      success: true,
      message: 'Successfully joined the waitlist!'
    });

  } catch (error) {
    console.error('Error during waitlist submission:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
} 