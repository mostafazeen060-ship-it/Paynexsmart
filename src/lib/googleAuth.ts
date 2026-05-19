import type { User } from '@/types';
import { generateId } from './utils';
import { logLogin } from './auditLog';
import { getStoredUsers, saveUsers, setCurrentUser } from './auth';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * NOTE: VITE_GOOGLE_CLIENT_SECRET must NEVER be placed in frontend code.
 * The Implicit Flow (response_type=token) does not require a client secret.
 * Keep secrets server-side only.
 */

const GOOGLE_REDIRECT_URI = `${window.location.origin}/auth/google/callback`;

if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('YOUR_CLIENT_ID')) {
  console.warn('⚠️ Google OAuth Client ID not configured. See .env.example');
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
}

/**
 * Categorised OAuth error codes for better UX messaging.
 */
export type OAuthErrorCode =
  | 'not_configured'
  | 'popup_closed'
  | 'access_denied'
  | 'csrf_mismatch'
  | 'session_expired'
  | 'no_token'
  | 'invalid_token'
  | 'network_error'
  | 'unknown';

export interface OAuthError {
  code: OAuthErrorCode;
  message: string;
  messageAr: string;
}

function classifyGoogleError(googleErrorParam: string | null): OAuthError {
  switch (googleErrorParam) {
    case 'access_denied':
      return {
        code: 'popup_closed',
        message: 'Login cancelled — you closed the Google popup.',
        messageAr: 'تم إلغاء تسجيل الدخول — أغلقت نافذة Google.',
      };
    case 'invalid_request':
    case 'unauthorized_client':
      return {
        code: 'not_configured',
        message: 'OAuth configuration error. Check your Client ID.',
        messageAr: 'خطأ في إعداد OAuth — تحقق من Client ID.',
      };
    default:
      return {
        code: 'unknown',
        message: `Google error: ${googleErrorParam}`,
        messageAr: `خطأ من Google: ${googleErrorParam}`,
      };
  }
}

/**
 * Initiate Google OAuth login using Implicit Flow.
 * Safe for frontend-only deployment — no client secret needed.
 */
export function initiateGoogleLogin(): void {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('YOUR_CLIENT_ID')) {
    throw new Error('Google OAuth not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.');
  }

  const state = generateRandomState();
  const scope = 'openid email profile';

  sessionStorage.setItem('google_oauth_state', state);
  sessionStorage.setItem('google_oauth_timestamp', Date.now().toString());

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'token',
    scope,
    state,
    prompt: 'consent',
  });

  console.log('🔐 Initiating Google OAuth Implicit Flow...');
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

/**
 * Handle Google OAuth callback.
 * Supports Implicit Flow (token in URL hash).
 */
export async function handleGoogleCallback(
  accessToken: string,
  state: string,
  googleErrorParam?: string | null,
): Promise<{ user: User; error?: string; oauthError?: OAuthError } | { user: null; error: string; oauthError?: OAuthError }> {
  try {
    // Handle explicit Google errors (e.g. user cancelled popup)
    if (googleErrorParam) {
      const oauthError = classifyGoogleError(googleErrorParam);
      console.warn(`⚠️ Google OAuth error [${oauthError.code}]:`, oauthError.message);
      return { user: null, error: oauthError.messageAr, oauthError };
    }

    // Verify CSRF state parameter
    const savedState = sessionStorage.getItem('google_oauth_state');
    if (!savedState || state !== savedState) {
      const err: OAuthError = {
        code: 'csrf_mismatch',
        message: 'State mismatch — possible CSRF attack. Please try logging in again.',
        messageAr: 'فشل التحقق الأمني (CSRF) — يرجى إعادة المحاولة.',
      };
      console.error('❌', err.message);
      return { user: null, error: err.messageAr, oauthError: err };
    }

    // Check session expiry (15 min window)
    const timestamp = parseInt(sessionStorage.getItem('google_oauth_timestamp') || '0');
    if (Date.now() - timestamp > 15 * 60 * 1000) {
      const err: OAuthError = {
        code: 'session_expired',
        message: 'OAuth session expired (>15 min). Please try again.',
        messageAr: 'انتهت صلاحية الجلسة — يرجى إعادة تسجيل الدخول.',
      };
      console.error('❌', err.message);
      return { user: null, error: err.messageAr, oauthError: err };
    }

    // Cleanup session storage
    sessionStorage.removeItem('google_oauth_state');
    sessionStorage.removeItem('google_oauth_timestamp');

    if (!accessToken) {
      const err: OAuthError = {
        code: 'no_token',
        message: 'No access token received from Google.',
        messageAr: 'لم يتم استلام التوكين من Google.',
      };
      console.error('❌', err.message);
      return { user: null, error: err.messageAr, oauthError: err };
    }

    console.log('🔄 Fetching user profile from Google...');
    const userInfo = await getUserInfoFromGoogle(accessToken);
    if (!userInfo) {
      const err: OAuthError = {
        code: 'invalid_token',
        message: 'Token rejected by Google — it may be expired or invalid.',
        messageAr: 'رفض Google التوكين — قد يكون منتهي الصلاحية.',
      };
      console.error('❌', err.message);
      return { user: null, error: err.messageAr, oauthError: err };
    }

    if (!userInfo.email_verified) {
      const err: OAuthError = {
        code: 'invalid_token',
        message: 'Google account email is not verified.',
        messageAr: 'البريد الإلكتروني لحساب Google غير مفعّل.',
      };
      return { user: null, error: err.messageAr, oauthError: err };
    }

    // Create or update user in local storage
    let user = getGoogleUserFromStorage(userInfo.id);
    if (!user) {
      console.log('✅ Creating new Google user:', userInfo.email);
      user = createGoogleUser(userInfo);
    } else {
      console.log('✅ Updating existing Google user:', userInfo.email);
      user = {
        ...user,
        email: userInfo.email,
        name: userInfo.name,
        avatar: userInfo.picture,
        updatedAt: new Date().toISOString(),
      };
      updateUserInStorage(user);
    }

    setCurrentUser(user);
    logLogin(user.id, user.name, 'customer', true);

    console.log('✅ Google login successful:', user.email);
    return { user };
  } catch (error) {
    const isNetworkError =
      error instanceof TypeError && error.message.includes('fetch');
    const err: OAuthError = {
      code: isNetworkError ? 'network_error' : 'unknown',
      message: error instanceof Error ? error.message : 'Google login failed.',
      messageAr: isNetworkError
        ? 'خطأ في الشبكة — تأكد من اتصالك بالإنترنت.'
        : 'فشل تسجيل الدخول بـ Google — يرجى المحاولة مرة أخرى.',
    };
    console.error('❌ Google callback error:', err.message);
    return { user: null, error: err.messageAr, oauthError: err };
  }
}

async function getUserInfoFromGoogle(accessToken: string): Promise<GoogleUserInfo | null> {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      console.error('❌ Google userinfo API returned:', response.status, response.statusText);
      return null;
    }
    return await response.json() as GoogleUserInfo;
  } catch (error) {
    console.error('❌ Network error fetching Google user info:', error);
    return null;
  }
}

function createGoogleUser(googleInfo: GoogleUserInfo): User {
  const user: User = {
    id: `google-${googleInfo.id}`,
    name: googleInfo.name || 'Google User',
    email: googleInfo.email,
    role: 'customer',
    isActive: true,
    googleId: googleInfo.id,
    avatar: googleInfo.picture,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const users = getStoredUsers();
  saveUsers([...users, user]);
  return user;
}

function getGoogleUserFromStorage(googleId: string): User | undefined {
  return getStoredUsers().find(u => u.googleId === googleId);
}

function updateUserInStorage(user: User): void {
  const users = getStoredUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index !== -1) {
    users[index] = user;
    saveUsers(users);
  }
}

function generateRandomState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function getGoogleRedirectUri(): string {
  return GOOGLE_REDIRECT_URI;
}

export function isGoogleOAuthConfigured(): boolean {
  return !!(GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('YOUR_CLIENT_ID'));
}
