import { GraphQLError } from 'graphql';
import { Conversation } from '../../models/Conversation';
import { Message } from '../../models/Message';
import { pubsub } from '../../pubsub';
import type { Context } from '../../context';
import { SendMessageInputSchema } from '../validators';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function requireAuth(ctx: Context) {
  if (!ctx.viewer) {
    throw new GraphQLError('You must be logged in.', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return ctx.viewer;
}

function clampLimit(limit?: number | null): number {
  if (!limit || limit < 1) return DEFAULT_LIMIT;
  return Math.min(limit, MAX_LIMIT);
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

/**
 * Verify the viewer is a participant in the conversation.
 * Returns the conversation document.
 */
async function verifyParticipant(conversationId: string, viewerId: string) {
  const convo = await Conversation.findById(conversationId).lean();
  if (!convo) {
    throw new GraphQLError('Conversation not found.', {
      extensions: { code: 'NOT_FOUND' },
    });
  }
  const isParticipant = (convo as any).participants.some(
    (p: any) => String(p) === viewerId
  );
  if (!isParticipant) {
    throw new GraphQLError('You are not a participant in this conversation.', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  return convo;
}

// ─── Queries ────────────────────────────────────────────────────────────────

export const DMQueries = {
  async conversations(_: unknown, __: unknown, ctx: Context) {
    const viewer = requireAuth(ctx);

    const convos = await Conversation.find({
      participants: viewer._id,
    })
      .sort({ lastMessageAt: -1 })
      .populate('participants')
      .populate('lastMessage')
      .lean();

    // Compute unreadCount for each conversation
    const viewerId = String(viewer._id);
    const convoIds = convos.map((c: any) => c._id);

    // Aggregate unread counts in one query
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          conversation: { $in: convoIds },
          sender: { $ne: viewer._id },
          'readBy.user': { $ne: viewer._id },
        },
      },
      {
        $group: {
          _id: '$conversation',
          count: { $sum: 1 },
        },
      },
    ]);

    const unreadMap = new Map(
      unreadCounts.map((u: any) => [String(u._id), u.count])
    );

    return convos.map((c: any) => ({
      ...c,
      unreadCount: unreadMap.get(String(c._id)) || 0,
    }));
  },

  async conversation(
    _: unknown,
    { id }: { id: string },
    ctx: Context
  ) {
    const viewer = requireAuth(ctx);
    const viewerId = String(viewer._id);

    const convo = await Conversation.findById(id)
      .populate('participants')
      .lean();

    if (!convo) {
      throw new GraphQLError('Conversation not found.', {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    const isParticipant = (convo as any).participants.some(
      (p: any) => String(p._id || p) === viewerId
    );
    if (!isParticipant) {
      throw new GraphQLError('You are not a participant in this conversation.', {
        extensions: { code: 'FORBIDDEN' },
      });
    }

    return { ...convo, unreadCount: 0 }; // unreadCount resolved at field level if needed
  },

  async messages(
    _: unknown,
    {
      conversationId,
      limit,
      cursor,
    }: { conversationId: string; limit?: number | null; cursor?: string | null },
    ctx: Context
  ) {
    const viewer = requireAuth(ctx);
    await verifyParticipant(conversationId, String(viewer._id));

    const take = clampLimit(limit);
    const filter: Record<string, unknown> = { conversation: conversationId };
    if (cursor) filter._id = { $lt: cursor };

    const docs = await Message.find(filter)
      .sort({ _id: -1 })
      .limit(take + 1)
      .lean();

    const hasNextPage = docs.length > take;
    const edges = hasNextPage ? docs.slice(0, take) : docs;

    return {
      edges,
      pageInfo: {
        hasNextPage,
        endCursor:
          edges.length > 0 ? String((edges[edges.length - 1] as any)._id) : null,
      },
    };
  },
};

// ─── Mutations ──────────────────────────────────────────────────────────────

export const DMMutations = {
  async createOrGetConversation(
    _: unknown,
    { userId }: { userId: string },
    ctx: Context
  ) {
    const viewer = requireAuth(ctx);
    const viewerId = String(viewer._id);

    if (viewerId === userId) {
      throw new GraphQLError('Cannot create a conversation with yourself.', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    // Sort participant IDs so the $all match is order-independent
    const participantIds = [viewer._id, userId].sort((a, b) =>
      String(a).localeCompare(String(b))
    );

    // Find existing conversation
    let convo = await Conversation.findOne({
      participants: { $all: participantIds, $size: 2 },
    })
      .populate('participants')
      .lean();

    if (convo) {
      return { ...convo, unreadCount: 0 };
    }

    // Create new conversation
    const newConvo = await Conversation.create({
      participants: participantIds,
    });

    const populated = await Conversation.findById(newConvo._id)
      .populate('participants')
      .lean();

    return { ...populated, unreadCount: 0 };
  },

  async sendMessage(
    _: unknown,
    { input }: { input: unknown },
    ctx: Context
  ) {
    const viewer = requireAuth(ctx);
    const data = validate(SendMessageInputSchema, input);

    await verifyParticipant(data.conversationId, String(viewer._id));

    const message = await Message.create({
      conversation: data.conversationId,
      sender: viewer._id,
      content: data.content,
      mediaUrl: data.mediaUrl || undefined,
      mediaType: data.mediaType || undefined,
      readBy: [{ user: viewer._id, readAt: new Date() }],
    });

    // Update conversation's lastMessage and lastMessageAt
    await Conversation.findByIdAndUpdate(data.conversationId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
    });

    const populated = await Message.findById(message._id)
      .populate('sender')
      .lean();

    // Publish for real-time subscription
    pubsub.publish(`NEW_MESSAGE:${data.conversationId}`, {
      newMessage: populated,
    });

    return populated;
  },

  async markConversationRead(
    _: unknown,
    { conversationId }: { conversationId: string },
    ctx: Context
  ) {
    const viewer = requireAuth(ctx);
    await verifyParticipant(conversationId, String(viewer._id));

    // Bulk update: add viewer to readBy on all unread messages
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: viewer._id },
        'readBy.user': { $ne: viewer._id },
      },
      {
        $addToSet: {
          readBy: { user: viewer._id, readAt: new Date() },
        },
      }
    );

    return true;
  },
};

// ─── Field Resolvers ────────────────────────────────────────────────────────

export const MessageResolvers = {
  id(parent: any): string {
    return String(parent._id);
  },

  async sender(parent: any, _: unknown, ctx: Context) {
    const senderRef = parent.sender;
    if (typeof senderRef === 'object' && senderRef !== null && '_id' in senderRef) {
      return senderRef;
    }
    return ctx.loaders.userLoader.load(String(senderRef));
  },

  async conversation(parent: any, _: unknown, ctx: Context) {
    const convoRef = parent.conversation;
    if (typeof convoRef === 'object' && convoRef !== null && '_id' in convoRef) {
      return convoRef;
    }
    return ctx.loaders.conversationLoader.load(String(convoRef));
  },

  isRead(parent: any, _: unknown, ctx: Context): boolean {
    if (!ctx.viewer) return false;
    const viewerId = String(ctx.viewer._id);
    return (parent.readBy || []).some((r: any) => String(r.user) === viewerId);
  },
};

export const ConversationResolvers = {
  id(parent: any): string {
    return String(parent._id);
  },

  async participants(parent: any, _: unknown, ctx: Context) {
    const parts = parent.participants || [];
    // If already populated (objects with _id), return as-is
    if (parts.length > 0 && typeof parts[0] === 'object' && parts[0]._id) {
      return parts;
    }
    // Otherwise batch-load
    return Promise.all(
      parts.map((p: any) => ctx.loaders.userLoader.load(String(p)))
    );
  },

  async lastMessage(parent: any) {
    if (!parent.lastMessage) return null;
    if (typeof parent.lastMessage === 'object' && parent.lastMessage._id) {
      return parent.lastMessage;
    }
    return Message.findById(parent.lastMessage).lean();
  },

  unreadCount(parent: any): number {
    // Already computed in the query resolver
    return parent.unreadCount ?? 0;
  },
};
