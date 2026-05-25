import { gql } from "@apollo/client";
import { NOTIFICATION_FRAGMENT, POST_FRAGMENT } from "./fragments";

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
