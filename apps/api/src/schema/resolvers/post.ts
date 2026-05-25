import type { IPost, IUser } from '@social/types';
import type { Loaders } from '../loaders';
import type { Context } from '../../context';

type PostContext = { loaders: Loaders; viewer: IUser | null };

/**
 * Field resolvers for the Post type.
 * Uses DataLoaders to prevent N+1 queries.
 */
export const PostResolvers = {
  id(parent: IPost): string {
    return String((parent as any)._id);
  },

  async author(parent: IPost, _: unknown, ctx: PostContext): Promise<IUser> {
    const authorRef = parent.author;
    if (typeof authorRef === 'object' && authorRef !== null && '_id' in (authorRef as any)) {
      return authorRef as IUser;
    }
    return ctx.loaders.userLoader.load(String(authorRef));
  },

  async likedByMe(parent: IPost, _: unknown, ctx: Context): Promise<boolean> {
    if (!ctx.viewer) return false;
    const key = `${String(ctx.viewer._id)}:${String((parent as any)._id)}`;
    return ctx.loaders.isLikedLoader.load(key);
  },
};
