import { isSessionConfigured } from './session';

export interface SignInMethods {
  google: boolean;
  email: boolean;
}

/** Sign-in methods that will actually work on this deployment. Never exposes secret values. */
export function getSignInMethods(): SignInMethods {
  if (!isSessionConfigured()) return { google: false, email: false };
  return {
    google: Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID),
    // Without Resend, codes can only be shown on screen, which is allowed in local development only.
    email: Boolean(process.env.RESEND_API_KEY) || process.env.NODE_ENV !== 'production',
  };
}
