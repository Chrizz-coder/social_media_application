import { GraphQLError } from 'graphql';
import { User } from '../../models/User';
import type { Context } from '../../context';
import type { IUser } from '@social/types';

const VALID_ROLES = ['user', 'creator', 'admin'] as const;

/**
 * Require the viewer to be authenticated AND have admin role.
 * Throws UNAUTHENTICATED or FORBIDDEN as appropriate.
 */
export function requireAdmin(context: Context): void {
  if (!context.viewer) {
    throw new GraphQLError('You must be logged in.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  if ((context.viewer as any).role !== 'admin') {
    throw new GraphQLError('Admin access required.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

export const AdminMutations = {
  async verifyUser(
    _: unknown,
    { userId }: { userId: string },
    ctx: Context
  ): Promise<IUser> {
    requireAdmin(ctx);

    const user = await User.findByIdAndUpdate(
      userId,
      { isVerified: true, verifiedAt: new Date() },
      { new: true }
    ).lean<IUser>();

    if (!user) {
      throw new GraphQLError('User not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    return user;
  },

  async unverifyUser(
    _: unknown,
    { userId }: { userId: string },
    ctx: Context
  ): Promise<IUser> {
    requireAdmin(ctx);

    const user = await User.findByIdAndUpdate(
      userId,
      { isVerified: false, $unset: { verifiedAt: '' } },
      { new: true }
    ).lean<IUser>();

    if (!user) {
      throw new GraphQLError('User not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    return user;
  },

  async setUserRole(
    _: unknown,
    { userId, role }: { userId: string; role: string },
    ctx: Context
  ): Promise<IUser> {
    requireAdmin(ctx);

    if (!VALID_ROLES.includes(role as any)) {
      throw new GraphQLError(`Invalid role. Must be one of: ${VALID_ROLES.join(', ')}`, {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).lean<IUser>();

    if (!user) {
      throw new GraphQLError('User not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    return user;
  },
};
