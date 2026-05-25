import type { IComment, IUser, IPost } from '@social/types';
import type { Loaders } from '../loaders';
import { Post } from '../../models/Post';

type CommentContext = { loaders: Loaders };

/**
 * Field resolvers for the Comment type.
 */
export const CommentResolvers = {
  id(parent: IComment): string {
    return String((parent as any)._id);
  },

  async author(parent: IComment, _: unknown, ctx: CommentContext): Promise<IUser> {
    const authorRef = parent.author;
    if (typeof authorRef === 'object' && authorRef !== null && '_id' in (authorRef as any)) {
      return authorRef as IUser;
    }
    return ctx.loaders.userLoader.load(String(authorRef));
  },

  async post(parent: IComment): Promise<IPost | null> {
    const postRef = parent.post;
    // If already populated
    if (typeof postRef === 'object' && postRef !== null && '_id' in (postRef as any)) {
      return postRef as unknown as IPost;
    }
    return Post.findById(postRef).lean<IPost>();
  },
};
