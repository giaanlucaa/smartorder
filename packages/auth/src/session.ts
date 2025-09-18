import { cookies } from 'next/headers';
import { SessionData, SessionUser } from './index';

const SESSION_COOKIE_NAME = 'smartorder-session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-session-secret-change-in-production';

export async function createSession(sessionData: SessionData): Promise<void> {
  const cookieStore = await cookies();
  
  // In production, you'd want to encrypt this cookie
  const sessionCookie = Buffer.from(JSON.stringify(sessionData)).toString('base64');
  
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function getSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    
    if (!sessionCookie) {
      return null;
    }
    
    const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());
    return sessionData;
  } catch (error) {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireAuth(): Promise<SessionData> {
  const session = await getSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }
  
  return session;
}

export async function requireRole(requiredRole: string): Promise<SessionData> {
  const session = await requireAuth();
  
  const roleHierarchy = {
    OWNER: 3,
    MANAGER: 2,
    STAFF: 1,
  };
  
  const userRoleLevel = roleHierarchy[session.user.role as keyof typeof roleHierarchy] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
  
  if (userRoleLevel < requiredRoleLevel) {
    throw new Error('Insufficient permissions');
  }
  
  return session;
}
