import crypto from 'crypto';
import jwt from 'jsonwebtoken';

// Auth utilities - using Node.js crypto instead of argon2 for Windows compatibility
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, hashPart] = hash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hashPart === verifyHash;
}

// JWT utilities for QR code signatures
export function signTableLink(venueId: string, tableId: string, tableToken: string): string {
  const secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
  const payload = {
    venueId,
    tableId,
    tableToken,
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
  };
  
  return jwt.sign(payload, secret);
}

export function verifyTableLink(token: string): { venueId: string; tableId: string; tableToken: string } | null {
  try {
    const secret = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
    const payload = jwt.verify(token, secret) as any;
    
    return {
      venueId: payload.venueId,
      tableId: payload.tableId,
      tableToken: payload.tableToken,
    };
  } catch (error) {
    return null;
  }
}

// Role-based access control
export const ROLES = {
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export function hasPermission(userRole: Role, requiredRole: Role): boolean {
  const roleHierarchy = {
    [ROLES.OWNER]: 3,
    [ROLES.MANAGER]: 2,
    [ROLES.STAFF]: 1,
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// Session types
export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  venueId: string;
  role: Role;
}

export interface SessionData {
  user: SessionUser;
  venueId: string;
}
