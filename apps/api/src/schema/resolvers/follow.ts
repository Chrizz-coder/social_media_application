import { GraphQLError } from "graphql";
import { User } from "../../models/User";
import { Follow } from "../../models/Follow";
import { Notification } from "../../models/Notification";
import { pubsub, EVENTS } from "../../pubsub";
import type { Context } from "../../context";
import type { IUser, INotification } from "@social/types";
import {
  createFollowRelation,
  deleteFollowRelation,
} from "../../services/neo4jFollowService";

function requireAuth(ctx: Context) {
  if (!ctx.viewer) {
    throw new GraphQLError("You must be logged in.", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
  return ctx.viewer;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
function clamp(limit?: number | null) {
  if (!limit || limit < 1) return DEFAULT_LIMIT;
  return Math.min(limit, MAX_LIMIT);
}

export const FollowMutations = {
  async followUser(
    _: unknown,
    { username }: { username: string },
    ctx: Context,
  ): Promise<IUser> {
    const viewer = requireAuth(ctx);
    const target = await User.findOne({ username }).lean<IUser>();
    if (!target) {
      throw new GraphQLError("User not found.", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    if (String(target._id) === String(viewer._id)) {
      throw new GraphQLError("You cannot follow yourself.", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    try {
      await Follow.create({ follower: viewer._id, following: target._id });
      await createFollowRelation(String(viewer._id), String(target._id));
    } catch (e: any) {
      if (e.code === 11000) {
        // Already following — idempotent, return target as-is
        return User.findById(target._id).lean<IUser>() as Promise<IUser>;
      }
      throw e;
    }

    await User.findByIdAndUpdate(target._id, { $inc: { followerCount: 1 } });
    await User.findByIdAndUpdate(viewer._id, { $inc: { followingCount: 1 } });

    const notif = await Notification.create({
      recipient: target._id,
      actor: viewer._id,
      type: "follow",
    });
    const populated = await Notification.findById(notif._id)
      .populate("actor")
      .lean<INotification>();
    if (populated) {
      pubsub.publish(EVENTS.NOTIFICATION_RECEIVED, {
        notificationReceived: populated,
      });
    }

    return User.findById(target._id).lean<IUser>() as Promise<IUser>;
  },

  async unfollowUser(
    _: unknown,
    { username }: { username: string },
    ctx: Context,
  ): Promise<IUser> {
    const viewer = requireAuth(ctx);
    const target = await User.findOne({ username }).lean<IUser>();
    if (!target) {
      throw new GraphQLError("User not found.", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    const deleted = await Follow.findOneAndDelete({
      follower: viewer._id,
      following: target._id,
    });

    if (deleted) {
      await deleteFollowRelation(String(viewer._id), String(target._id));
      await User.findByIdAndUpdate(target._id, { $inc: { followerCount: -1 } });
      await User.findByIdAndUpdate(viewer._id, {
        $inc: { followingCount: -1 },
      });
    }

    return User.findById(target._id).lean<IUser>() as Promise<IUser>;
  },
};

export const FollowQueries = {
  async followers(
    _: unknown,
    {
      username,
      limit,
      cursor,
    }: { username: string; limit?: number | null; cursor?: string | null },
  ) {
    const user = await User.findOne({ username }).lean<IUser>();
    if (!user)
      return { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };

    const take = clamp(limit);
    const filter: Record<string, unknown> = { following: user._id };
    if (cursor) filter._id = { $lt: cursor };

    const docs = await Follow.find(filter)
      .sort({ _id: -1 })
      .limit(take + 1)
      .lean();
    const hasNextPage = docs.length > take;
    const edges_raw = hasNextPage ? docs.slice(0, take) : docs;
    const followerIds = edges_raw.map((d) => String(d.follower));
    const users = await User.find({ _id: { $in: followerIds } }).lean<
      IUser[]
    >();
    const uMap = new Map(users.map((u) => [String(u._id), u]));
    const edges = followerIds
      .map((id) => uMap.get(id))
      .filter(Boolean) as IUser[];

    return {
      edges,
      pageInfo: {
        hasNextPage,
        endCursor:
          edges_raw.length > 0
            ? String(edges_raw[edges_raw.length - 1]._id)
            : null,
      },
    };
  },

  async following(
    _: unknown,
    {
      username,
      limit,
      cursor,
    }: { username: string; limit?: number | null; cursor?: string | null },
  ) {
    const user = await User.findOne({ username }).lean<IUser>();
    if (!user)
      return { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };

    const take = clamp(limit);
    const filter: Record<string, unknown> = { follower: user._id };
    if (cursor) filter._id = { $lt: cursor };

    const docs = await Follow.find(filter)
      .sort({ _id: -1 })
      .limit(take + 1)
      .lean();
    const hasNextPage = docs.length > take;
    const edges_raw = hasNextPage ? docs.slice(0, take) : docs;
    const followingIds = edges_raw.map((d) => String(d.following));
    const users = await User.find({ _id: { $in: followingIds } }).lean<
      IUser[]
    >();
    const uMap = new Map(users.map((u) => [String(u._id), u]));
    const edges = followingIds
      .map((id) => uMap.get(id))
      .filter(Boolean) as IUser[];

    return {
      edges,
      pageInfo: {
        hasNextPage,
        endCursor:
          edges_raw.length > 0
            ? String(edges_raw[edges_raw.length - 1]._id)
            : null,
      },
    };
  },
};
