import { Follow } from '../../models/Follow';
import type { IUser } from '@social/types';
import type { Context } from '../../context';

/**
 * Field resolvers for the User type.
 */
export const UserResolvers = {
  id(parent: IUser): string {
    return String((parent as any)._id);
  },

  followerCount(parent: IUser): number {
    return parent.followerCount ?? 0;
  },

  followingCount(parent: IUser): number {
    return parent.followingCount ?? 0;
  },

  async isFollowedByMe(parent: IUser, _: unknown, ctx: Context): Promise<boolean> {
    if (!ctx.viewer) return false;
    const exists = await Follow.exists({
      follower:  ctx.viewer._id,
      following: (parent as any)._id,
    });
    return !!exists;
  },
};
