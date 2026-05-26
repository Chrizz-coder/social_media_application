import { makeExecutableSchema } from '@graphql-tools/schema';
import { GraphQLScalarType, Kind, GraphQLError } from 'graphql';
import { typeDefs } from './typeDefs';
import { QueryResolvers } from './resolvers/query';
import { MutationResolvers } from './resolvers/mutation';
import { UserResolvers } from './resolvers/user';
import { PostResolvers } from './resolvers/post';
import { CommentResolvers } from './resolvers/comment';
import { FollowMutations, FollowQueries } from './resolvers/follow';
import { LikeMutations } from './resolvers/like';
import {
  NotificationQueries,
  NotificationMutations,
  NotificationSubscriptions,
  NotificationResolvers,
} from './resolvers/notification';
import { SearchQueries } from './resolvers/search';
import { StoryQueries, StoryMutations, StoryResolvers, StoryGroupResolvers } from './resolvers/story';
import { HashtagQueries, HashtagResolvers } from './resolvers/hashtag';
import { BookmarkQueries, BookmarkMutations, BookmarkPostFieldResolvers } from './resolvers/bookmark';
import { ExploreQueries } from './resolvers/explore';
import { AdminMutations } from './resolvers/admin';
import { DMQueries, DMMutations, MessageResolvers, ConversationResolvers } from './resolvers/dm';
import { ReelQueries, ReelMutations, ReelFieldResolvers } from './resolvers/reel';
import { AnalyticsQueries, PostAnalyticsResolvers } from './resolvers/analytics';
import { pubsub, EVENTS } from '../pubsub';
import { Conversation } from '../models/Conversation';
import { Follow } from '../models/Follow';
import type { Context } from '../context';

/** Custom Date scalar — serialises as ISO string. */
const DateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'ISO-8601 date-time string',
  serialize(value: unknown) {
    if (value instanceof Date) return value.toISOString();
    return String(value);
  },
  parseValue(value: unknown) {
    return new Date(value as string | number);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) return new Date(ast.value);
    return null;
  },
});

/**
 * withFilter helper — wraps an asyncIterator to only yield events
 * that pass the filter function. Compatible with graphql-subscriptions PubSub.
 */
function withFilter(
  iteratorFn: (...args: any[]) => AsyncIterator<any>,
  filterFn: (payload: any, variables: any, context: any) => boolean | Promise<boolean>
) {
  return (...args: any[]) => {
    const iterator = iteratorFn(...args);
    const [, variables, context] = args;

    return {
      async next(): Promise<IteratorResult<any>> {
        while (true) {
          const result = await iterator.next();
          if (result.done) return result;
          const passes = await filterFn(result.value, variables, context);
          if (passes) return result;
        }
      },
      return: iterator.return?.bind(iterator),
      throw: iterator.throw?.bind(iterator),
      [Symbol.asyncIterator]() {
        return this;
      },
    };
  };
}

const resolvers = {
  Date: DateScalar,

  Query: {
    ...QueryResolvers,
    ...FollowQueries,
    ...NotificationQueries,
    ...SearchQueries,
    ...StoryQueries,
    ...HashtagQueries,
    ...BookmarkQueries,
    ...ExploreQueries,
    ...DMQueries,
    ...ReelQueries,
    ...AnalyticsQueries,
  },

  Mutation: {
    ...MutationResolvers,
    ...FollowMutations,
    ...LikeMutations,
    ...NotificationMutations,
    ...StoryMutations,
    ...BookmarkMutations,
    ...AdminMutations,
    ...DMMutations,
    ...ReelMutations,
  },

  Subscription: {
    ...NotificationSubscriptions,

    postAdded: {
      subscribe: () => pubsub.asyncIterator([EVENTS.POST_ADDED]),
    },

    newMessage: {
      subscribe: withFilter(
        (_: unknown, { conversationId }: { conversationId: string }) =>
          pubsub.asyncIterator([`NEW_MESSAGE:${conversationId}`]),
        async (payload: any, variables: { conversationId: string }, context: Context) => {
          // Auth required
          if (!context.viewer) return false;

          // Verify viewer is a participant in the conversation
          const convo = await Conversation.findById(variables.conversationId).lean();
          if (!convo) return false;

          const isParticipant = (convo as any).participants.some(
            (p: any) => String(p) === String(context.viewer!._id)
          );
          return isParticipant;
        }
      ),
    },

    newStory: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([EVENTS.NEW_STORY]),
        async (payload: any, _variables: unknown, context: Context) => {
          // Auth required
          if (!context.viewer) return false;

          // Only push to viewers who follow the story author
          const storyGroup = payload.newStory;
          if (!storyGroup) return false;

          const authorId = String(storyGroup.user);
          const viewerId = String(context.viewer._id);

          // Always show own stories
          if (authorId === viewerId) return true;

          // Check if viewer follows the author
          const followExists = await Follow.exists({
            follower: context.viewer._id,
            following: authorId,
          });

          return !!followExists;
        }
      ),
    },
  },

  User:           UserResolvers,
  Post:           { ...PostResolvers, ...BookmarkPostFieldResolvers },
  Comment:        CommentResolvers,
  Notification:   NotificationResolvers,
  Story:          StoryResolvers,
  StoryGroup:     StoryGroupResolvers,
  Hashtag:        HashtagResolvers,
  Message:        MessageResolvers,
  Conversation:   ConversationResolvers,
  Reel:           ReelFieldResolvers,
  PostAnalytics:  PostAnalyticsResolvers,
};

export const schema = makeExecutableSchema({ typeDefs, resolvers });
