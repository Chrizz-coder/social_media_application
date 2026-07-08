import { GraphQLError } from 'graphql';
import { Post } from '../../models/Post';
import { PostAnalytics } from '../../models/PostAnalytics';
import type { Context } from '../../context';
import type { IPost } from '@social/types';

function requireAuth(ctx: Context) {
  if (!ctx.viewer) {
    throw new GraphQLError('You must be logged in.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return ctx.viewer;
}

// ─── Queries ────────────────────────────────────────────────────────────────

export const AnalyticsQueries = {
  async postAnalytics(
    _: unknown,
    { postId }: { postId: string },
    ctx: Context
  ) {
    const viewer = requireAuth(ctx);

    const post = await Post.findById(postId).lean<IPost>();
    if (!post) {
      throw new GraphQLError('Post not found.', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    if (String(post.author) !== String(viewer._id)) {
      throw new GraphQLError('You can only view analytics for your own posts.', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    let analytics = await PostAnalytics.findOne({ post: postId }).lean();
    if (!analytics) {
      analytics = await PostAnalytics.create({ post: postId });
      analytics = await PostAnalytics.findById(analytics._id).lean();
    }

    return {
      ...analytics,
      // Attach the post data for the Post field resolver
      _post: post,
    };
  },
};

// ─── Field Resolvers ────────────────────────────────────────────────────────

export const PostAnalyticsResolvers = {
  async post(parent: any) {
    // If we already attached _post data in the query
    if (parent._post) return parent._post;
    return Post.findById(parent.post).lean();
  },

  impressions(parent: any): number {
    return parent.impressions ?? 0;
  },

  reach(parent: any): number {
    // Sum all daily reach counts
    const reachByDay = parent.reachByDay || [];
    return reachByDay.reduce((sum: number, day: any) => sum + (day.count || 0), 0);
  },

  saves(parent: any): number {
    return parent.saves ?? 0;
  },

  async likeCount(parent: any): Promise<number> {
    const post = await Post.findById(parent.post).lean<IPost>();
    return post?.likeCount ?? 0;
  },

  async commentCount(parent: any): Promise<number> {
    const post = await Post.findById(parent.post).lean<IPost>();
    return post?.commentCount ?? 0;
  },

  async engagementRate(parent: any): Promise<number> {
    const impressions = parent.impressions ?? 0;
    if (impressions === 0) return 0;

    const post = await Post.findById(parent.post).lean<IPost>();
    const likes = post?.likeCount ?? 0;
    const comments = post?.commentCount ?? 0;

    return ((likes + comments) / impressions) * 100;
  },

  reachByDay(parent: any) {
    return (parent.reachByDay || []).map((d: any) => ({
      date: d.date instanceof Date ? d.date.toISOString().split('T')[0] : String(d.date),
      count: d.count ?? 0,
    }));
  },

  likesByDay(parent: any) {
    return (parent.likesByDay || []).map((d: any) => ({
      date: d.date instanceof Date ? d.date.toISOString().split('T')[0] : String(d.date),
      count: d.count ?? 0,
    }));
  },

  commentsByDay(parent: any) {
    return (parent.commentsByDay || []).map((d: any) => ({
      date: d.date instanceof Date ? d.date.toISOString().split('T')[0] : String(d.date),
      count: d.count ?? 0,
    }));
  },
};

export function incrementPostImpressions(postId: string): void {
  PostAnalytics.findOneAndUpdate(
    { post: postId },
    { $inc: { impressions: 1 } },
    { upsert: true }
  )
    .exec()
    .catch(() => {});
}
