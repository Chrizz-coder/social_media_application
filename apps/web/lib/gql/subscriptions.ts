import { gql } from "@apollo/client";
import { NOTIFICATION_FRAGMENT, POST_FRAGMENT, STORY_FRAGMENT } from "./fragments";

export const ON_NOTIFICATION_RECEIVED = gql`
  subscription OnNotificationReceived {
    notificationReceived { ...NotificationFragment }
  }
  ${NOTIFICATION_FRAGMENT}
`;

export const ON_POST_ADDED = gql`
  subscription OnPostAdded {
    postAdded { ...PostFragment }
  }
  ${POST_FRAGMENT}
`;

export const ON_NEW_MESSAGE = gql`
  subscription OnNewMessage($conversationId: ID!) {
    newMessage(conversationId: $conversationId) {
      id content mediaUrl isRead createdAt
      sender { id username displayName avatarUrl }
      conversation { id }
    }
  }
`;

export const ON_NEW_STORY = gql`
  subscription OnNewStory {
    newStory {
      user { id username displayName avatarUrl }
      hasUnviewed
      stories { ...StoryFragment }
    }
  }
  ${STORY_FRAGMENT}
`;
