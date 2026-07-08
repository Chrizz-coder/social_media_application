import { Post } from '../../models/Post';
import { Follow } from '../../models/Follow';
import { redis } from '../../redis';
import type { Context } from '../../context';
import type { IPost } from '@social/types';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const EXPLORE_CACHE_TTL = 120; // 2 minutes

function clampLimit(limit?: number | null): number {
  if (!limit || limit < 1) return DEFAULT_LIMIT;
  return Math.min(limit, MAX_LIMIT);
}

export const ExploreQueries = {
  async explore(
    _: unknown,
    { limit, cursor }: { limit?: number | null; cursor?: string | null },
    ctx: Context
  ) {
    const take = clampLimit(limit);

    if (!cursor) {
      const cacheKey = `explore:page1:${take}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    let excludeAuthorIds: string[] = [];
    if (ctx.viewer) {
      const follows = await Follow.find({ follower: ctx.viewer._id }).lean();
      excludeAuthorIds = [
        String(ctx.viewer._id),
        ...follows.map((f) => String(f.following)),
      ];
    }

    const matchFilter: Record<string, unknown> = {
      isArchived: { $ne: true },
    };
    if (excludeAuthorIds.length > 0) {
      matchFilter.author = { $nin: excludeAuthorIds };
    }
    if (cursor) {
      matchFilter._id = { $lt: cursor };
    }

    // Score: likeCount*2 + commentCount + viewCount, then createdAt as tiebreaker
    const docs = await Post.aggregate([
      { $match: matchFilter },
      {
        $addFields: {
          _score: {
            $add: [
              { $multiply: ['$likeCount', 2] },
              '$commentCount',
              '$viewCount',
            ],
          },
        },
      },
      { $sort: { _score: -1, createdAt: -1 } },
      { $limit: take + 1 },
      { $project: { _score: 0 } },
    ]);

    const hasNextPage = docs.length > take;
    const edges = hasNextPage ? docs.slice(0, take) : docs;

    const result = {
      edges,
      pageInfo: {
        hasNextPage,
        endCursor: edges.length > 0 ? String(edges[edges.length - 1]._id) : null,
      },
    };

    if (!cursor) {
      const cacheKey = `explore:page1:${take}`;
      await redis.set(cacheKey, JSON.stringify(result), 'EX', EXPLORE_CACHE_TTL);
    }

    return result;
  },
};

/**
 * Fire-and-forget view count increment.
 * Call this from the post query resolver to track views.
 */
export function incrementPostViewCount(postId: string): void {
  Post.findByIdAndUpdate(postId, { $inc: { viewCount: 1 } }).exec().catch(() => {});
}
