import { GraphQLError } from 'graphql';
import { Post } from '../../models/Post';
import { Like } from '../../models/Like';
import { Notification } from '../../models/Notification';
import { pubsub, EVENTS } from '../../pubsub';
import type { Context } from '../../context';
import type { IPost, INotification } from '@social/types';

function requireAuth(ctx: Context) {
  if (!ctx.viewer) {
    throw new GraphQLError('You must be logged in.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return ctx.viewer;
}

export const LikeMutations = {
  async likePost(
    _: unknown,
    { postId }: { postId: string },
    ctx: Context
  ): Promise<IPost> {
    const viewer = requireAuth(ctx);
    const post = await Post.findById(postId).lean<IPost>();
    if (!post) {
      throw new GraphQLError('Post not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    try {
      await Like.create({ user: viewer._id, post: postId });
    } catch (e: any) {
      if (e.code !== 11000) throw e; // duplicate = already liked, idempotent
    }

    await Post.findByIdAndUpdate(postId, { $inc: { likeCount: 1 } });

    // Notify the post author (skip self-like)
    const authorId = String((post as any).author);
    if (authorId !== String(viewer._id)) {
      const notif = await Notification.create({
        recipient: authorId,
        actor:     viewer._id,
        type:      'like',
        post:      postId,
      });
      const populated = await Notification.findById(notif._id)
        .populate('actor')
        .populate('post')
        .lean<INotification>();
      if (populated) {
        pubsub.publish(EVENTS.NOTIFICATION_RECEIVED, { notificationReceived: populated });
      }
    }

    return Post.findById(postId).populate('author').lean<IPost>() as Promise<IPost>;
  },

  async unlikePost(
    _: unknown,
    { postId }: { postId: string },
    ctx: Context
  ): Promise<IPost> {
    const viewer = requireAuth(ctx);
    const post = await Post.findById(postId).lean<IPost>();
    if (!post) {
      throw new GraphQLError('Post not found.', { extensions: { code: 'NOT_FOUND' } });
    }

    const deleted = await Like.findOneAndDelete({ user: viewer._id, post: postId });
    if (deleted) {
      await Post.findByIdAndUpdate(postId, { $inc: { likeCount: -1 } });
    }

    return Post.findById(postId).populate('author').lean<IPost>() as Promise<IPost>;
  },
};
