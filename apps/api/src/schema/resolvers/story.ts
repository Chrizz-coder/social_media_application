import { GraphQLError } from 'graphql';
import { Story } from '../../models/Story';
import { Follow } from '../../models/Follow';
import { User } from '../../models/User';
import { pubsub, EVENTS } from '../../pubsub';
import type { Context } from '../../context';
import { CreateStoryInputSchema } from '../validators';

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

// ─── Queries ────────────────────────────────────────────────────────────────

export const StoryQueries = {
  async stories(_: unknown, __: unknown, ctx: Context) {
    const viewer = requireAuth(ctx);
    const viewerId = String(viewer._id);

    const follows = await Follow.find({ follower: viewer._id }).lean();
    const followingIds = follows.map((f) => f.following);

    const authorIds = [viewer._id, ...followingIds];
    const now = new Date();

    const activeStories = await Story.find({
      author: { $in: authorIds },
      expiresAt: { $gt: now },
    })
      .sort({ createdAt: -1 })
      .lean();

    const groupMap = new Map<string, { stories: any[]; hasUnviewed: boolean }>();

    for (const story of activeStories) {
      const authorKey = String(story.author);
      if (!groupMap.has(authorKey)) {
        groupMap.set(authorKey, { stories: [], hasUnviewed: false });
      }
      const group = groupMap.get(authorKey)!;
      group.stories.push(story);

      const viewerIds = (story.viewers || []).map((v: any) => String(v.user));
      if (!viewerIds.includes(viewerId)) {
        group.hasUnviewed = true;
      }
    }

    const groups: any[] = [];
    for (const [authorId, group] of groupMap) {
      groups.push({
        user: authorId, // will be resolved by StoryGroup.user field resolver
        stories: group.stories,
        hasUnviewed: group.hasUnviewed,
      });
    }

    groups.sort((a, b) => {
      if (a.hasUnviewed !== b.hasUnviewed) return a.hasUnviewed ? -1 : 1;
      const aLatest = a.stories[0]?.createdAt?.getTime?.() ?? 0;
      const bLatest = b.stories[0]?.createdAt?.getTime?.() ?? 0;
      return bLatest - aLatest;
    });

    return groups;
  },

  async myStory(_: unknown, __: unknown, ctx: Context) {
    const viewer = requireAuth(ctx);
    return Story.find({
      author: viewer._id,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .lean();
  },
};

// ─── Mutations ──────────────────────────────────────────────────────────────

export const StoryMutations = {
  async createStory(_: unknown, { input }: { input: unknown }, ctx: Context) {
    const viewer = requireAuth(ctx);
    const data = validate(CreateStoryInputSchema, input);

    const story = await Story.create({
      ...data,
      author: viewer._id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await User.findByIdAndUpdate(viewer._id, { $inc: { storiesCount: 1 } });

    const created = await Story.findById(story._id).lean();

    pubsub.publish(EVENTS.NEW_STORY, {
      newStory: { user: viewer._id, stories: [created], hasUnviewed: true },
    });

    return created;
  },

  async deleteStory(_: unknown, { id }: { id: string }, ctx: Context) {
    const viewer = requireAuth(ctx);
    const story = await Story.findById(id).lean();
    if (!story) {
      throw new GraphQLError('Story not found.', { extensions: { code: 'NOT_FOUND' } });
    }
    if (String(story.author) !== String(viewer._id)) {
      throw new GraphQLError('Forbidden.', { extensions: { code: 'FORBIDDEN' } });
    }

    await Story.findByIdAndDelete(id);
    await User.findByIdAndUpdate(viewer._id, { $inc: { storiesCount: -1 } });
    return true;
  },

  async viewStory(_: unknown, { id }: { id: string }, ctx: Context) {
    const viewer = requireAuth(ctx);

    await Story.findByIdAndUpdate(
      id,
      {
        $addToSet: {
          viewers: { user: viewer._id, viewedAt: new Date() },
        },
      }
    );

    return true;
  },
};

// ─── Field Resolvers ────────────────────────────────────────────────────────

export const StoryResolvers = {
  id(parent: any): string {
    return String(parent._id);
  },

  async author(parent: any, _: unknown, ctx: Context) {
    const authorRef = parent.author;
    if (typeof authorRef === 'object' && authorRef !== null && '_id' in authorRef) {
      return authorRef;
    }
    return ctx.loaders.userLoader.load(String(authorRef));
  },

  viewerCount(parent: any): number {
    return (parent.viewers || []).length;
  },

  hasViewedByMe(parent: any, _: unknown, ctx: Context): boolean {
    if (!ctx.viewer) return false;
    const viewerId = String(ctx.viewer._id);
    return (parent.viewers || []).some((v: any) => String(v.user) === viewerId);
  },
};

export const StoryGroupResolvers = {
  async user(parent: any, _: unknown, ctx: Context) {
    const userRef = parent.user;
    if (typeof userRef === 'object' && userRef !== null && '_id' in userRef) {
      return userRef;
    }
    return ctx.loaders.userLoader.load(String(userRef));
  },
};
