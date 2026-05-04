/**
 * GET /api/recruiter/access
 *
 * Returns whether the calling user can access recruiter features. Avoids
 * leaking the recruiter profile itself — only the access decision + a
 * minimal "viewer" object the dashboard header can render.
 */

import { NextRequest, NextResponse } from 'next/server';
import { resolveRecruiterAccessFromToken } from '@/lib/recruiter/access';
import { db } from '../../../../../lib/firebase-admin';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  const { uid, email, access } = await resolveRecruiterAccessFromToken(token);

  // Build a safe "viewer" payload for header rendering. Only fields that
  // belong to the recruiter themselves — never anything else.
  let viewer: {
    fullName: string;
    companyName: string;
    jobTitle: string;
    subscriptionTier: string;
  } | null = null;

  if (uid && access.hasAccess) {
    try {
      const snap = await db.collection('recruiters').doc(uid).get();
      const data = snap.exists ? snap.data() : null;
      if (data) {
        viewer = {
          fullName: typeof data.fullName === 'string' ? data.fullName : '',
          companyName: typeof data.companyName === 'string' ? data.companyName : '',
          jobTitle: typeof data.jobTitle === 'string' ? data.jobTitle : '',
          subscriptionTier:
            typeof data.subscriptionTier === 'string'
              ? data.subscriptionTier
              : access.isDemo
              ? 'demo'
              : 'free',
        };
      } else if (access.isDemo) {
        // Demo bypass without a recruiter doc — show a synthetic profile.
        viewer = {
          fullName: 'Demo Recruiter',
          companyName: 'Gradual',
          jobTitle: 'Founder',
          subscriptionTier: 'demo',
        };
      }
    } catch (e) {
      console.error('[GET /api/recruiter/access] viewer load failed', e);
    }
  }

  return NextResponse.json(
    { access, viewer, email },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
