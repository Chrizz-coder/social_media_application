import { User } from '../../models/User';
import { Post } from '../../models/Post';
import type { IUser, IPost } from '@social/types';

export const SearchQueries = {
  async search(
    _: unknown,
    { query, limit }: { query: string; limit?: number | null }
  ) {
    const take = Math.min(limit ?? 10, 20);
    if (!query.trim()) return { users: [], posts: [] };

    const [users, posts] = await Promise.all([
      User.find(
        { $text: { $search: query } },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
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
