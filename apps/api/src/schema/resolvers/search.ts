import { User } from '../../models/User';
import { Post } from '../../models/Post';
import type { IUser, IPost } from '@social/types';

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const SearchQueries = {
  async search(
    _: unknown,
    { query, limit }: { query: string; limit?: number | null }
  ) {
    const take = Math.min(limit ?? 10, 20);
    if (!query.trim()) return { users: [], posts: [] };

    const escaped = escapeRegExp(query.trim());
    const userRegex = new RegExp(escaped, 'i');

    const [users, posts] = await Promise.all([
      User.find({
        $or: [
          { username: { $regex: userRegex } },
          { displayName: { $regex: userRegex } }
        ]
      })
        .sort({ username: 1 })
        .limit(take)
        .lean<IUser[]>(),

      Post.find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(take)
        .lean<IPost[]>(),
    ]);

    return { users, posts };
  },
};
