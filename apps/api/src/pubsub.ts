import { PubSub } from 'graphql-subscriptions';

export const EVENTS = {
  NOTIFICATION_RECEIVED: 'NOTIFICATION_RECEIVED',
  POST_ADDED: 'POST_ADDED',
  NEW_STORY: 'NEW_STORY',
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const pubsub = new PubSub() as InstanceType<typeof PubSub> & {
  asyncIterator<T>(triggers: string | string[]): AsyncIterator<T>;
};
