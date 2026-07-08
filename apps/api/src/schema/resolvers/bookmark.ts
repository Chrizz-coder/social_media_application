import { GraphQLError } from 'graphql';
import { Bookmark } from '../../models/Bookmark';
import { Post } from '../../models/Post';
import { Reel } from '../../models/Reel';
import { User } from '../../models/User';
import type { Context } from '../../context';
import type { IPost } from '@social/types';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function requireAuth(ctx: Context) {
  if (!ctx.viewer) {
    throw new GraphQLError('You must be logged in.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return ctx.viewer;
}

function clampLimit(limit?: number | null): number {
  if (!limit || limit < 1) return DEFAULT_LIMIT;
  return Math.min(limit, MAX_LIMIT);
}

// ─── Queries ────────────────────────────────────────────────────────────────

export const BookmarkQueries = {
  async bookmarks(
    _: unknown,
    { limit, cursor }: { limit?: number | null; cursor?: string | null },
    ctx: Context
  ) {
    const viewer = requireAuth(ctx);
    const take = clampLimit(limit);

    const filter: Record<string, unknown> = {
      user: viewer._id,
      post: { $ne: null }, // only post bookmarks for PostConnection
    };
    if (cursor) filter._id = { $lt: cursor };

    const bookmarks = await Bookmark.find(filter)
      .sort({ _id: -1 })
      .limit(take + 1)
      .lean();

    const hasNextPage = bookmarks.length > take;
    const raw = hasNextPage ? bookmarks.slice(0, take) : bookmarks;

    const postIds = raw.map((b) => b.post).filter(Boolean);
    const posts = await Post.find({
      _id: { $in: postIds },
      isArchived: { $ne: true },
    }).lean<IPost[]>();

    const postMap = new Map(posts.map((p) => [String(p._id), p]));
    const edges = postIds
      .map((id) => postMap.get(String(id)))
      .filter(Boolean) as IPost[];

    return {
      edges,
      pageInfo: {
        hasNextPage,
        endCursor: raw.length > 0 ? String(raw[raw.length - 1]._id) : null,
      },
    };
  },
};

// ─── Mutations ──────────────────────────────────────────────────────────────

export const BookmarkMutations = {
  async bookmarkPost(
    _: unknown,
    { postId }: { postId: string },
    ctx: Context
  ): Promise<boolean> {
    const viewer = requireAuth(ctx);
    const post = await Post.findById(postId).lean();
    if (!post) {
      throw new GraphQLError('Post not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    try {
      await Bookmark.create({ user: viewer._id, post: postId });
      await Post.findByIdAndUpdate(postId, { $inc: { bookmarkCount: 1 } });
      await User.findByIdAndUpdate(viewer._id, { $inc: { bookmarksCount: 1 } });
    } catch (e: any) {
      if (e.code !== 11000) throw e; // duplicate = already bookmarked, idempotent
    }

    return true;
  },

  async unbookmarkPost(
    _: unknown,
    { postId }: { postId: string },
    ctx: Context
  ): Promise<boolean> {
    const viewer = requireAuth(ctx);

    const deleted = await Bookmark.findOneAndDelete({
      user: viewer._id,
      post: postId,
    });

    if (deleted) {
      await Post.findByIdAndUpdate(postId, {
        $inc: { bookmarkCount: -1 },
        $max: { bookmarkCount: 0 },
      });
      await User.findByIdAndUpdate(viewer._id, {
        $inc: { bookmarksCount: -1 },
        $max: { bookmarksCount: 0 },
      });
    }

    return true;
  },

  async bookmarkReel(
    _: unknown,
    { reelId }: { reelId: string },
    ctx: Context
  ): Promise<boolean> {
    const viewer = requireAuth(ctx);
    const reel = await Reel.findById(reelId).lean();
    if (!reel) {
      throw new GraphQLError('Reel not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    try {
      await Bookmark.create({ user: viewer._id, reel: reelId });
      await User.findByIdAndUpdate(viewer._id, { $inc: { bookmarksCount: 1 } });
    } catch (e: any) {
      if (e.code !== 11000) throw e;
    }

    return true;
  },

  async unbookmarkReel(
    _: unknown,
    { reelId }: { reelId: string },
    ctx: Context
  ): Promise<boolean> {
    const viewer = requireAuth(ctx);

    const deleted = await Bookmark.findOneAndDelete({
      user: viewer._id,
      reel: reelId,
    });

    if (deleted) {
      await User.findByIdAndUpdate(viewer._id, {
        $inc: { bookmarksCount: -1 },
        $max: { bookmarksCount: 0 },
      });
    }

    return true;
  },
};

// ─── Post field resolver extension ──────────────────────────────────────────

export const BookmarkPostFieldResolvers = {
  async bookmarkedByMe(parent: any, _: unknown, ctx: Context): Promise<boolean> {
    if (!ctx.viewer) return false;
    const exists = await Bookmark.exists({
      user: ctx.viewer._id,
      post: parent._id,
    });
    return !!exists;
  },
};
