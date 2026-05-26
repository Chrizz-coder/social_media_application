import DataLoader from 'dataloader';
import { User } from '../models/User';
import { Like } from '../models/Like';
import { ReelLike } from '../models/ReelLike';
import { Bookmark } from '../models/Bookmark';
import { Reel } from '../models/Reel';
import { Conversation } from '../models/Conversation';
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

/**
 * Batch-check whether a viewer has liked a set of reels.
 * Key format: "userId:reelId"
 */
async function batchLoadReelLikes(keys: readonly string[]): Promise<boolean[]> {
  const pairs = keys.map((k) => {
    const [userId, reelId] = k.split(':');
    return { userId, reelId };
  });

  const userIds = [...new Set(pairs.map((p) => p.userId))];
  const reelIds = pairs.map((p) => p.reelId);

  const likes = await ReelLike.find({
    user: { $in: userIds },
    reel: { $in: reelIds },
  }).lean();

  const likedSet = new Set(likes.map((l: any) => `${String(l.user)}:${String(l.reel)}`));
  return keys.map((k) => likedSet.has(k));
}

/**
 * Batch-check whether a viewer has bookmarked a set of items (post or reel).
 * Key format: "userId:itemId"
 * Checks both post and reel bookmark fields.
 */
async function batchLoadBookmarks(keys: readonly string[]): Promise<boolean[]> {
  const pairs = keys.map((k) => {
    const [userId, itemId] = k.split(':');
    return { userId, itemId };
  });

  const userIds = [...new Set(pairs.map((p) => p.userId))];
  const itemIds = pairs.map((p) => p.itemId);

  const bookmarks = await Bookmark.find({
    user: { $in: userIds },
    $or: [
      { post: { $in: itemIds } },
      { reel: { $in: itemIds } },
    ],
  }).lean();

  const bookmarkedSet = new Set(
    bookmarks.map((b: any) => {
      const itemId = b.post ? String(b.post) : String(b.reel);
      return `${String(b.user)}:${itemId}`;
    })
  );

  return keys.map((k) => bookmarkedSet.has(k));
}

/**
 * Batch-load reels by MongoDB _id.
 */
async function batchLoadReels(ids: readonly string[]): Promise<(any | Error)[]> {
  const reels = await Reel.find({ _id: { $in: ids as string[] } }).lean();
  const map = new Map(reels.map((r) => [String(r._id), r]));
  return ids.map((id) => map.get(String(id)) ?? new Error(`Reel not found: ${id}`));
}

/**
 * Batch-load conversations by MongoDB _id.
 */
async function batchLoadConversations(ids: readonly string[]): Promise<(any | Error)[]> {
  const convos = await Conversation.find({ _id: { $in: ids as string[] } }).lean();
  const map = new Map(convos.map((c) => [String(c._id), c]));
  return ids.map((id) => map.get(String(id)) ?? new Error(`Conversation not found: ${id}`));
}

export type Loaders = {
  userLoader: DataLoader<string, IUser>;
  isLikedLoader: DataLoader<string, boolean>;
  reelLikeLoader: DataLoader<string, boolean>;
  bookmarkLoader: DataLoader<string, boolean>;
  reelLoader: DataLoader<string, any>;
  conversationLoader: DataLoader<string, any>;
};

export function createLoaders(): Loaders {
  return {
    userLoader:          new DataLoader<string, IUser>(batchLoadUsers),
    isLikedLoader:       new DataLoader<string, boolean>(batchLoadIsLiked),
    reelLikeLoader:      new DataLoader<string, boolean>(batchLoadReelLikes),
    bookmarkLoader:      new DataLoader<string, boolean>(batchLoadBookmarks),
    reelLoader:          new DataLoader<string, any>(batchLoadReels),
    conversationLoader:  new DataLoader<string, any>(batchLoadConversations),
  };
}
