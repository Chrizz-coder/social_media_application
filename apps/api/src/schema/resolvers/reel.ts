import { GraphQLError } from 'graphql';
import { Reel } from '../../models/Reel';
import { ReelLike } from '../../models/ReelLike';
import { Bookmark } from '../../models/Bookmark';
import { User } from '../../models/User';
import type { Context } from '../../context';
import type { IUser } from '@social/types';
import { CreateReelInputSchema } from '../validators';
import { parseHashtags, upsertHashtags, decrementHashtags } from './hashtag';

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

function validate<T>(
  schema: { safeParse(v: unknown): { success: boolean; data?: T; error?: any } },
  input: unknown
): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const fieldErrors = result.error!.flatten().fieldErrors;
    throw new GraphQLError('Validation failed.', {
      extensions: { code: 'BAD_USER_INPUT', fieldErrors },
    });
  }
  return result.data!;
}

// ─── Queries ────────────────────────────────────────────────────────────────

export const ReelQueries = {
  async reels(
    _: unknown,
    { limit, cursor }: { limit?: number | null; cursor?: string | null }
  ) {
    const take = clampLimit(limit);
    const filter: Record<string, unknown> = {};
    if (cursor) filter._id = { $lt: cursor };

    const docs = await Reel.find(filter)
      .sort({ _id: -1 })
      .limit(take + 1)
      .lean();

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

  async userReels(
    _: unknown,
    {
      username,
      limit,
      cursor,
    }: { username: string; limit?: number | null; cursor?: string | null }
  ) {
    const user = await User.findOne({ username }).lean<IUser>();
    if (!user) {
      return { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };
    }

    const take = clampLimit(limit);
    const filter: Record<string, unknown> = { author: user._id };
    if (cursor) filter._id = { $lt: cursor };

    const docs = await Reel.find(filter)
      .sort({ _id: -1 })
      .limit(take + 1)
      .lean();

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

  async reel(_: unknown, { id }: { id: string }) {
    // Fire-and-forget view count increment
    Reel.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }).exec().catch(() => {});
    return Reel.findById(id).lean();
  },
};

// ─── Mutations ──────────────────────────────────────────────────────────────

export const ReelMutations = {
  async createReel(_: unknown, { input }: { input: unknown }, ctx: Context) {
    const viewer = requireAuth(ctx);
    const data = validate(CreateReelInputSchema, input);

    // Parse hashtags from caption if present, merge with explicit hashtags
    let hashtags = data.hashtags || [];
    if (data.caption) {
      const parsedTags = parseHashtags(data.caption);
      const merged = new Set([...hashtags.map((h: string) => h.toLowerCase()), ...parsedTags]);
      hashtags = [...merged];
    }

    const reel = await Reel.create({
      ...data,
      author: viewer._id,
      hashtags,
    });

    // Upsert hashtag documents
    if (hashtags.length > 0) {
      upsertHashtags(hashtags, 'reelCount').catch(() => {});
    }

    return Reel.findById(reel._id).lean();
  },

  async deleteReel(_: unknown, { id }: { id: string }, ctx: Context) {
    const viewer = requireAuth(ctx);
    const reel = await Reel.findById(id).lean();
    if (!reel) {
      throw new GraphQLError('Reel not found.', { extensions: { code: 'NOT_FOUND' } });
    }
    if (String((reel as any).author) !== String(viewer._id)) {
      throw new GraphQLError('Forbidden.', { extensions: { code: 'FORBIDDEN' } });
    }

    await Reel.findByIdAndDelete(id);
    await ReelLike.deleteMany({ reel: id });

    // Decrement hashtag counts
    const hashtags = (reel as any).hashtags || [];
    if (hashtags.length > 0) {
      decrementHashtags(hashtags, 'reelCount').catch(() => {});
    }

    return true;
  },

  async likeReel(_: unknown, { id }: { id: string }, ctx: Context) {
    const viewer = requireAuth(ctx);
    const reel = await Reel.findById(id).lean();
    if (!reel) {
      throw new GraphQLError('Reel not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    try {
      await ReelLike.create({ user: viewer._id, reel: id });
    } catch (e: any) {
      if (e.code !== 11000) throw e; // duplicate = already liked, idempotent
    }

    await Reel.findByIdAndUpdate(id, { $inc: { likeCount: 1 } });
    return Reel.findById(id).lean();
  },

  async unlikeReel(_: unknown, { id }: { id: string }, ctx: Context) {
    const viewer = requireAuth(ctx);
    const reel = await Reel.findById(id).lean();
    if (!reel) {
      throw new GraphQLError('Reel not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    const deleted = await ReelLike.findOneAndDelete({ user: viewer._id, reel: id });
    if (deleted) {
      await Reel.findByIdAndUpdate(id, { $inc: { likeCount: -1 } });
    }

    return Reel.findById(id).lean();
  },
};

// ─── Field Resolvers ────────────────────────────────────────────────────────

export const ReelFieldResolvers = {
  id(parent: any): string {
    return String(parent._id);
  },

  async author(parent: any, _: unknown, ctx: Context) {
    const authorRef = parent.author;
    if (typeof authorRef === 'object' && authorRef !== null && '_id' in authorRef) {
      return authorRef;
    }
    return ctx.loaders.userLoader.load(String(authorRef));
  },

  async likedByMe(parent: any, _: unknown, ctx: Context): Promise<boolean> {
    if (!ctx.viewer) return false;
    const key = `${String(ctx.viewer._id)}:${String(parent._id)}`;
    return ctx.loaders.reelLikeLoader.load(key);
  },

  async bookmarkedByMe(parent: any, _: unknown, ctx: Context): Promise<boolean> {
    if (!ctx.viewer) return false;
    const key = `${String(ctx.viewer._id)}:${String(parent._id)}`;
    return ctx.loaders.bookmarkLoader.load(key);
  },
};
