import { makeExecutableSchema } from '@graphql-tools/schema';
import { GraphQLScalarType, Kind } from 'graphql';
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
import { pubsub, EVENTS } from '../pubsub';

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
  },

  Mutation: {
    ...MutationResolvers,
    ...FollowMutations,
    ...LikeMutations,
    ...NotificationMutations,
    ...StoryMutations,
    ...BookmarkMutations,
    ...AdminMutations,
  },

  Subscription: {
    ...NotificationSubscriptions,
    postAdded: {
      subscribe: () => pubsub.asyncIterator([EVENTS.POST_ADDED]),
    },
    newMessage: {
      subscribe: (_: unknown, { conversationId }: { conversationId: string }) =>
        pubsub.asyncIterator([`NEW_MESSAGE:${conversationId}`]),
    },
    newStory: {
      subscribe: () => pubsub.asyncIterator([EVENTS.NEW_STORY]),
    },
  },

  User:         UserResolvers,
  Post:         { ...PostResolvers, ...BookmarkPostFieldResolvers },
  Comment:      CommentResolvers,
  Notification: NotificationResolvers,
  Story:        StoryResolvers,
  StoryGroup:   StoryGroupResolvers,
  Hashtag:      HashtagResolvers,
};

export const schema = makeExecutableSchema({ typeDefs, resolvers });
