import { Hashtag } from '../../models/Hashtag';
import { redis } from '../../redis';

const TRENDING_CACHE_KEY = 'trending_hashtags';
const TRENDING_TTL = 300; // 5 minutes

/**
 * Extract #hashtag patterns from a content string.
 * Lowercases, deduplicates, and returns clean array.
 */
export function parseHashtags(content: string): string[] {
  const matches = content.match(/#(\w+)/g);
  if (!matches) return [];
  const unique = new Set(matches.map((m) => m.slice(1).toLowerCase()));
  return [...unique];
}

/**
 * Upsert hashtag documents for a list of hashtag names.
 * Increments the specified count field by 1 for each hashtag.
 */
export async function upsertHashtags(
  names: string[],
  countField: 'postCount' | 'reelCount' | 'storyCount'
): Promise<void> {
  if (names.length === 0) return;
  const ops = names.map((name) => ({
    updateOne: {
      filter: { name: name.toLowerCase() },
      update: { $inc: { [countField]: 1 } },
      upsert: true,
    },
  }));
  await Hashtag.bulkWrite(ops);
}

/**
 * Decrement hashtag counts for a list of hashtag names.
 */
export async function decrementHashtags(
  names: string[],
  countField: 'postCount' | 'reelCount' | 'storyCount'
): Promise<void> {
  if (names.length === 0) return;
  const ops = names.map((name) => ({
    updateOne: {
      filter: { name: name.toLowerCase() },
      update: { $inc: { [countField]: -1 } },
    },
  }));
  await Hashtag.bulkWrite(ops);
}

// ─── Queries ────────────────────────────────────────────────────────────────

export const HashtagQueries = {
  async hashtag(_: unknown, { name }: { name: string }) {
    return Hashtag.findOne({ name: name.toLowerCase() }).lean();
  },

  async trendingHashtags(_: unknown, { limit }: { limit?: number | null }) {
    const take = Math.min(limit ?? 10, 30);

    // Try cache first
    const cached = await redis.get(TRENDING_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return parsed.slice(0, take);
    }

    // Aggregate: sort by total count (postCount + reelCount)
    const hashtags = await Hashtag.aggregate([
      {
        $addFields: {
          totalCount: { $add: ['$postCount', '$reelCount'] },
        },
      },
      { $sort: { totalCount: -1 } },
      { $limit: 30 }, // cache more than needed
    ]);

    // Cache for 5 minutes
    await redis.set(TRENDING_CACHE_KEY, JSON.stringify(hashtags), 'EX', TRENDING_TTL);

    return hashtags.slice(0, take);
  },

  async searchHashtags(
    _: unknown,
    { query, limit }: { query: string; limit?: number | null }
  ) {
    const take = Math.min(limit ?? 8, 30);
    if (!query.trim()) return [];

    // Escape regex special chars for safety
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    return Hashtag.aggregate([
      { $match: { name: { $regex: new RegExp(escaped, 'i') } } },
      {
        $addFields: {
          totalCount: { $add: ['$postCount', '$reelCount'] },
        },
      },
      { $sort: { totalCount: -1 } },
      { $limit: take },
    ]);
  },
};

// ─── Field Resolvers ────────────────────────────────────────────────────────

export const HashtagResolvers = {
  id(parent: any): string {
    return String(parent._id);
  },

  totalCount(parent: any): number {
    return (parent.postCount ?? 0) + (parent.reelCount ?? 0);
  },
};
