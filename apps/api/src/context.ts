import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { User } from './models/User';
import type { IUser } from '@social/types';
import type { Loaders } from './schema/loaders';

/**
 * Full per-request context passed to every resolver.
 * `viewer` is the authenticated user (null if unauthenticated).
 * `loaders` are per-request DataLoader instances (attached in index.ts).
 */
export type Context = {
  viewer: IUser | null;
  loaders: Loaders;
};

/** Intermediate type returned by createContext (loaders are added in index.ts). */
type BaseContext = Pick<Context, 'viewer'>;

export async function createContext({
  req,
}: {
  req: Request;
}): Promise<BaseContext> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { viewer: null };
  }

  const token = authHeader.slice(7); // strip "Bearer "
  return resolveViewerFromToken(token);
}

/**
 * Resolve a viewer (IUser) from a raw JWT token string.
 * Shared by both HTTP context and WebSocket subscription context.
 */
export async function resolveViewerFromToken(
  token: string | null | undefined
): Promise<BaseContext> {
  if (!token) return { viewer: null };

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.warn('JWT_SECRET is not set — treating request as unauthenticated');
      return { viewer: null };
    }

    const decoded = jwt.verify(token, secret) as { userId: string };

    const user = await User.findById(decoded.userId).lean<IUser>();
    if (!user) return { viewer: null };

    return { viewer: user };
  } catch {
    // Invalid / expired token — not an error, just unauthenticated
    return { viewer: null };
  }
}
