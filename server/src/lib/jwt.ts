import jwt from 'jsonwebtoken';
import { env } from '../env';

export interface AuthTokenPayload {
  sub: string; // user id
  email: string;
  role: string;
}

const EXPIRES_IN = '7d';

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: EXPIRES_IN });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
}
