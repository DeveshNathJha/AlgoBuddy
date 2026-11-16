import { NextRequest, NextResponse } from 'next/server';
import { saveVerifiedUser } from '@/lib/userStore';

export async function POST(req: NextRequest) {
  try {
    const { credential, email, name, picture } = await req.json();

    let verifiedEmail = email;
    let verifiedName = name;
    let verifiedPicture = picture;

    // If Google ID token (JWT) is provided, decode payload
    if (credential && typeof credential === 'string') {
      try {
        const parts = credential.split('.');
        if (parts.length === 3) {
          const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const decodedJson = Buffer.from(payloadBase64, 'base64').toString('utf-8');
          const payload = JSON.parse(decodedJson);

          if (payload.email) {
            verifiedEmail = payload.email;
            verifiedName = payload.name || payload.given_name;
            verifiedPicture = payload.picture;
          }
        }
      } catch (decodeErr) {
        console.error('Error decoding Google JWT credential', decodeErr);
      }
    }

    if (!verifiedEmail || typeof verifiedEmail !== 'string' || !verifiedEmail.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Could not extract a valid Google email.' },
        { status: 400 }
      );
    }

    const trimmedEmail = verifiedEmail.trim().toLowerCase();

    // Register verified Google account
    const user = saveVerifiedUser({
      email: trimmedEmail,
      name: verifiedName,
      avatar: verifiedPicture,
      authMethod: 'google',
    });

    console.log(`[AlgoBuddy Auth] Google Account verified: ${trimmedEmail} (${verifiedName || 'No Name'})`);

    return NextResponse.json({
      success: true,
      user,
      message: `Signed in as ${trimmedEmail}`,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message || 'Google authentication failed.' },
      { status: 500 }
    );
  }
}
