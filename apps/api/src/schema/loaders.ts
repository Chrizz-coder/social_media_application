import DataLoader from 'dataloader';
import { User } from '../models/User';
import { Like } from '../models/Like';
import type { IUser } from '@social/types';

/**
 * Batch-load users by MongoDB _id — prevents N+1 on author fields.
 * Returns results in the same order as input IDs.
 */
async function batchLoadUsers(ids: readonly string[]): Promise<(IUser | Error)[]> {
  const users = await User.find({ _id: { $in: ids as string[] } }).lean<IUser[]>();
  const map = new Map<string, IUser>(users.map((u) => [String(u._id), u]));
  return ids.map((id) => map.get(String(id)) ?? new Error(`User not found: ${id}`));
}

/**
 * Batch-check whether a viewer has liked a set of posts.
 * Key format: "userId:postId"
 */
async function batchLoadIsLiked(keys: readonly string[]): Promise<boolean[]> {
  // keys are "userId:postId"
  const pairs = keys.map((k) => {
    const [userId, postId] = k.split(':');
    return { userId, postId };
  });

  // Get all unique userIds (in practice usually 1 per request)
  const userIds = [...new Set(pairs.map((p) => p.userId))];
  const postIds = pairs.map((p) => p.postId);

  const likes = await Like.find({
    user: { $in: userIds },
    post: { $in: postIds },
  }).lean();

  const likedSet = new Set(likes.map((l) => `${String(l.user)}:${String(l.post)}`));
  return keys.map((k) => likedSet.has(k));
}

export type Loaders = {
  userLoader: DataLoader<string, IUser>;
  isLikedLoader: DataLoader<string, boolean>;
};

export function createLoaders(): Loaders {
  return {
    userLoader:   new DataLoader<string, IUser>(batchLoadUsers),
    isLikedLoader: new DataLoader<string, boolean>(batchLoadIsLiked),
  };
}
