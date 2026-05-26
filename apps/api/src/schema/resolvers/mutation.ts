import { GraphQLError } from 'graphql';
import { Post } from '../../models/Post';
import { Comment } from '../../models/Comment';
import { Notification } from '../../models/Notification';
import { Follow } from '../../models/Follow';
import { User } from '../../models/User';
import { pubsub, EVENTS } from '../../pubsub';
import type { Context } from '../../context';
import type { IPost, IComment, INotification } from '@social/types';
import {
  CreatePostInputSchema,
  UpdatePostInputSchema,
  CreateCommentInputSchema,
} from '../validators';
import { parseHashtags, upsertHashtags, decrementHashtags } from './hashtag';

function requireAuth(ctx: Context) {
  if (!ctx.viewer) {
    throw new GraphQLError('You must be logged in.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return ctx.viewer;
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

export const MutationResolvers = {
  async updateProfile(
    _: unknown,
    { input }: { input: { displayName?: string; bio?: string; avatarUrl?: string } },
    ctx: Context
  ) {
    const viewer = requireAuth(ctx);
    const update: Record<string, unknown> = {};
    if (input.displayName !== undefined) update.displayName = input.displayName;
    if (input.bio         !== undefined) update.bio         = input.bio;
    if (input.avatarUrl   !== undefined) update.avatarUrl   = input.avatarUrl;
    return User.findByIdAndUpdate(viewer._id, update, { new: true }).lean();
  },

  async createPost(_: unknown, { input }: { input: unknown }, ctx: Context): Promise<IPost> {
    const viewer = requireAuth(ctx);
    const data = validate(CreatePostInputSchema, input);

    // Extract hashtags from content
    const hashtags = parseHashtags(data.content);

    const post = await Post.create({ ...data, author: viewer._id, hashtags });

    // Upsert hashtag documents
    if (hashtags.length > 0) {
      upsertHashtags(hashtags, 'postCount').catch(() => {});
    }

    const populated = await Post.findById(post._id).populate('author').lean<IPost>();

    // Publish to live-feed subscribers
    pubsub.publish(EVENTS.POST_ADDED, { postAdded: populated });

    return populated!;
  },

  async updatePost(
    _: unknown,
    { id, input }: { id: string; input: unknown },
    ctx: Context
  ): Promise<IPost> {
    const viewer = requireAuth(ctx);
    const data = validate(UpdatePostInputSchema, input);

    const post = await Post.findById(id).lean<IPost>();
    if (!post) throw new GraphQLError('Post not found.', { extensions: { code: 'NOT_FOUND' } });
    if (String(post.author) !== String(viewer._id))
      throw new GraphQLError('Forbidden.', { extensions: { code: 'FORBIDDEN' } });

    const update: Record<string, unknown> = {};
    if (data.content  !== undefined) update.content  = data.content;
    if (data.imageUrl !== undefined) update.imageUrl = data.imageUrl;

    return Post.findByIdAndUpdate(id, update, { new: true })
      .populate('author')
      .lean<IPost>() as Promise<IPost>;
  },

  async deletePost(_: unknown, { id }: { id: string }, ctx: Context): Promise<boolean> {
    const viewer = requireAuth(ctx);
    const post = await Post.findById(id).lean<IPost>();
    if (!post) throw new GraphQLError('Post not found.', { extensions: { code: 'NOT_FOUND' } });
    if (String(post.author) !== String(viewer._id))
      throw new GraphQLError('Forbidden.', { extensions: { code: 'FORBIDDEN' } });

    await Post.findByIdAndDelete(id);
    await Comment.deleteMany({ post: id });

    // Decrement hashtag counts
    const hashtags = (post as any).hashtags || [];
    if (hashtags.length > 0) {
      decrementHashtags(hashtags, 'postCount').catch(() => {});
    }

    return true;
  },

  async archivePost(_: unknown, { id }: { id: string }, ctx: Context): Promise<boolean> {
    const viewer = requireAuth(ctx);
    const post = await Post.findById(id).lean<IPost>();
    if (!post) throw new GraphQLError('Post not found.', { extensions: { code: 'NOT_FOUND' } });
    if (String(post.author) !== String(viewer._id))
      throw new GraphQLError('Forbidden.', { extensions: { code: 'FORBIDDEN' } });

    await Post.findByIdAndUpdate(id, { isArchived: true });
    return true;
  },

  async createComment(
    _: unknown,
    { input }: { input: unknown },
    ctx: Context
  ): Promise<IComment> {
    const viewer = requireAuth(ctx);
    const data = validate(CreateCommentInputSchema, input);

    const post = await Post.findById(data.postId).lean<IPost>();
    if (!post) throw new GraphQLError('Post not found.', { extensions: { code: 'NOT_FOUND' } });

    const comment = await Comment.create({
      post:    data.postId,
      author:  viewer._id,
      content: data.content,
    });
    await Post.findByIdAndUpdate(data.postId, { $inc: { commentCount: 1 } });

    // Notify post author (skip self-comment)
    const authorId = String((post as any).author);
    if (authorId !== String(viewer._id)) {
      const notif = await Notification.create({
        recipient: authorId,
        actor:     viewer._id,
        type:      'comment',
        post:      data.postId,
      });
      const populated = await Notification.findById(notif._id)
        .populate('actor').populate('post').lean<INotification>();
      if (populated) {
        pubsub.publish(EVENTS.NOTIFICATION_RECEIVED, { notificationReceived: populated });
      }
    }

    return Comment.findById(comment._id)
      .populate('author').populate('post')
      .lean<IComment>() as Promise<IComment>;
  },

  async deleteComment(_: unknown, { id }: { id: string }, ctx: Context): Promise<boolean> {
    const viewer = requireAuth(ctx);
    const comment = await Comment.findById(id).lean<IComment>();
    if (!comment) throw new GraphQLError('Comment not found.', { extensions: { code: 'NOT_FOUND' } });
    if (String(comment.author) !== String(viewer._id))
      throw new GraphQLError('Forbidden.', { extensions: { code: 'FORBIDDEN' } });

    await Comment.findByIdAndDelete(id);
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });
    return true;
  },
};
