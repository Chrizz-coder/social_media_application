import { GraphQLError } from 'graphql';
import { withFilter } from 'graphql-subscriptions';
import { Notification } from '../../models/Notification';
import { pubsub, EVENTS } from '../../pubsub';
import type { Context } from '../../context';
import type { INotification } from '@social/types';

function requireAuth(ctx: Context) {
  if (!ctx.viewer) {
    throw new GraphQLError('You must be logged in.', {
      extensions: { code: 'UNAUTHENTICATED' },
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

export const NotificationQueries = {
  async notifications(
    _: unknown,
    { limit, cursor }: { limit?: number | null; cursor?: string | null },
    ctx: Context
  ) {
    const viewer = requireAuth(ctx);
    const take = clamp(limit);
    const filter: Record<string, unknown> = { recipient: viewer._id };
    if (cursor) filter._id = { $lt: cursor };

    const [docs, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ _id: -1 })
        .limit(take + 1)
        .populate('actor')
        .populate('post')
        .lean<INotification[]>(),
      Notification.countDocuments({ recipient: viewer._id, read: false }),
    ]);

    const hasNextPage = docs.length > take;
    const edges = hasNextPage ? docs.slice(0, take) : docs;

    return {
      edges,
      pageInfo: {
        hasNextPage,
        endCursor: edges.length > 0 ? String((edges[edges.length - 1] as any)._id) : null,
      },
      unreadCount,
    };
  },
};

export const NotificationMutations = {
  async markNotificationsRead(_: unknown, __: unknown, ctx: Context): Promise<boolean> {
    const viewer = requireAuth(ctx);
    await Notification.updateMany({ recipient: viewer._id, read: false }, { read: true });
    return true;
  },
};

export const NotificationSubscriptions = {
  notificationReceived: {
    subscribe: withFilter(
      () => pubsub.asyncIterator([EVENTS.NOTIFICATION_RECEIVED]),
      (
        payload: { notificationReceived: INotification } | undefined,
        _args: unknown,
        ctx: Context | undefined
      ) => {
        if (!payload || !ctx?.viewer) return false;
        return String(payload.notificationReceived.recipient) === String(ctx.viewer._id);
      }
    ),
  },
};

export const NotificationResolvers = {
  id(parent: INotification): string {
    return String((parent as any)._id);
  },
  type(parent: INotification): string {
    return parent.type.toUpperCase();
  },
};
