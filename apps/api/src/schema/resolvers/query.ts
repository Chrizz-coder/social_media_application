import { GraphQLError } from 'graphql';
import { User } from '../../models/User';
import { Post } from '../../models/Post';
import { Comment } from '../../models/Comment';
import { Follow } from '../../models/Follow';
import { Like } from '../../models/Like';
import type { Context } from '../../context';
import type { IUser, IPost, IComment } from '@social/types';
import { incrementPostViewCount } from './explore';
import { incrementPostImpressions } from './analytics';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function clampLimit(limit?: number | null): number {
  if (!limit || limit < 1) return DEFAULT_LIMIT;
  return Math.min(limit, MAX_LIMIT);
}

async function paginatePosts(
  filter: Record<string, unknown>,
  take: number,
  cursor?: string | null
) {
  if (cursor) filter._id = { $lt: cursor };
  const docs = await Post.find(filter).sort({ _id: -1 }).limit(take + 1).lean<IPost[]>();
  const hasNextPage = docs.length > take;
  const edges = hasNextPage ? docs.slice(0, take) : docs;
  return {
    edges,
    pageInfo: {
      hasNextPage,
      endCursor: edges.length > 0 ? String((edges[edges.length - 1] as any)._id) : null,
    },
  };
}

export const QueryResolvers = {
  me(_: unknown, __: unknown, ctx: Context): IUser | null {
    return ctx.viewer;
  },

  async user(_: unknown, { username }: { username: string }): Promise<IUser | null> {
    return User.findOne({ username }).lean<IUser>();
  },

  async post(_: unknown, { id }: { id: string }): Promise<IPost | null> {
    // Fire-and-forget view count increment
    incrementPostViewCount(id);
    // Fire-and-forget analytics impression increment
    incrementPostImpressions(id);
    return Post.findById(id).lean<IPost>();
  },

  /** Global feed — all posts, newest first */
  async posts(
    _: unknown,
    { limit, cursor }: { limit?: number | null; cursor?: string | null }
  ) {
    return paginatePosts({}, clampLimit(limit), cursor);
  },

  /** Home feed — posts from users the viewer follows */
  async feed(
    _: unknown,
    { limit, cursor }: { limit?: number | null; cursor?: string | null },
    ctx: Context
  ) {
    if (!ctx.viewer) {
      // Unauthenticated: return empty feed
      return { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };
    }
    const follows = await Follow.find({ follower: ctx.viewer._id }).lean();
    const followingIds = follows.map((f) => f.following);
    if (followingIds.length === 0) {
      return { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };
    }
    return paginatePosts({ author: { $in: followingIds } }, clampLimit(limit), cursor);
  },

  async userPosts(
    _: unknown,
    { username, limit, cursor }: { username: string; limit?: number | null; cursor?: string | null }
  ) {
    const user = await User.findOne({ username }).lean<IUser>();
    if (!user) return { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };
    return paginatePosts({ author: user._id }, clampLimit(limit), cursor);
  },

  async likedPosts(
    _: unknown,
    { username, limit, cursor }: { username: string; limit?: number | null; cursor?: string | null }
  ) {
    const user = await User.findOne({ username }).lean<IUser>();
    if (!user) return { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };

    const take = clampLimit(limit);
    const likeFilter: Record<string, unknown> = { user: user._id };
    if (cursor) likeFilter._id = { $lt: cursor };

    const likes = await Like.find(likeFilter).sort({ _id: -1 }).limit(take + 1).lean();
    const hasNextPage = likes.length > take;
    const raw = hasNextPage ? likes.slice(0, take) : likes;
    const postIds = raw.map((l) => l.post);
    const posts = await Post.find({ _id: { $in: postIds } }).lean<IPost[]>();
    const pMap = new Map(posts.map((p) => [String(p._id), p]));
    const edges = postIds.map((id) => pMap.get(String(id))).filter(Boolean) as IPost[];

    return {
      edges,
      pageInfo: {
        hasNextPage,
        endCursor: raw.length > 0 ? String(raw[raw.length - 1]._id) : null,
      },
    };
  },

  async comments(
    _: unknown,
    { postId, limit, cursor }: { postId: string; limit?: number | null; cursor?: string | null }
  ) {
    const take = clampLimit(limit);
    const filter: Record<string, unknown> = { post: postId };
    if (cursor) filter._id = { $lt: cursor };
    const docs = await Comment.find(filter).sort({ _id: -1 }).limit(take + 1).lean<IComment[]>();
    const hasNextPage = docs.length > take;
    const edges = hasNextPage ? docs.slice(0, take) : docs;
    return {
      edges,
      pageInfo: {
        hasNextPage,
        endCursor: edges.length > 0 ? String((edges[edges.length - 1] as any)._id) : null,
      },
    };
  },
};
