import { gql } from "@apollo/client";

export const USER_FRAGMENT = gql`
  fragment UserFragment on User {
    id
    username
    displayName
    bio
    avatarUrl
    followerCount
    followingCount
    isFollowedByMe
    createdAt
  }
`;

export const POST_FRAGMENT = gql`
  fragment PostFragment on Post {
    id
    content
    imageUrl
    likeCount
    commentCount
    likedByMe
    bookmarkedByMe
    bookmarkCount
    hashtags
    createdAt
    author {
      id
      username
      displayName
      avatarUrl
      isVerified
    }
  }
`;

export const STORY_FRAGMENT = gql`
  fragment StoryFragment on Story {
    id
    mediaUrl
    mediaType
    caption
    viewerCount
    hasViewedByMe
    expiresAt
    createdAt
    author {
      id
      username
      displayName
      avatarUrl
    }
  }
`;

export const HASHTAG_FRAGMENT = gql`
  fragment HashtagFragment on Hashtag {
    id
    name
    postCount
    totalCount
  }
`;

export const COMMENT_FRAGMENT = gql`
  fragment CommentFragment on Comment {
    id
    content
    createdAt
    author {
      id
      username
      displayName
      avatarUrl
    }
  }
`;

export const NOTIFICATION_FRAGMENT = gql`
  fragment NotificationFragment on Notification {
    id
    type
    read
    createdAt
    actor {
      id
      username
      displayName
      avatarUrl
    }
    post {
      id
      content
    }
  }
`;
