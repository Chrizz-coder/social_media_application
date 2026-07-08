import { gql } from "@apollo/client";
import {
  USER_FRAGMENT,
  POST_FRAGMENT,
  COMMENT_FRAGMENT,
  NOTIFICATION_FRAGMENT,
  STORY_FRAGMENT,
  HASHTAG_FRAGMENT,
} from "./fragments";

export const GET_ME = gql`
  query GetMe {
    me { ...UserFragment }
  }
  ${USER_FRAGMENT}
`;

export const GET_FEED = gql`
  query GetFeed($limit: Int, $cursor: String) {
    feed(limit: $limit, cursor: $cursor) {
      edges { ...PostFragment }
      pageInfo { hasNextPage endCursor }
    }
  }
  ${POST_FRAGMENT}
`;

export const GET_POSTS = gql`
  query GetPosts($limit: Int, $cursor: String) {
    posts(limit: $limit, cursor: $cursor) {
      edges { ...PostFragment }
      pageInfo { hasNextPage endCursor }
    }
  }
  ${POST_FRAGMENT}
`;

export const GET_USER = gql`
  query GetUser($username: String!) {
    user(username: $username) { ...UserFragment }
  }
  ${USER_FRAGMENT}
`;

export const GET_USER_POSTS = gql`
  query GetUserPosts($username: String!, $limit: Int, $cursor: String) {
    userPosts(username: $username, limit: $limit, cursor: $cursor) {
      edges { ...PostFragment }
      pageInfo { hasNextPage endCursor }
    }
  }
  ${POST_FRAGMENT}
`;

export const GET_LIKED_POSTS = gql`
  query GetLikedPosts($username: String!, $limit: Int, $cursor: String) {
    likedPosts(username: $username, limit: $limit, cursor: $cursor) {
      edges { ...PostFragment }
      pageInfo { hasNextPage endCursor }
    }
  }
  ${POST_FRAGMENT}
`;

export const GET_POST = gql`
  query GetPost($id: ID!) {
    post(id: $id) { ...PostFragment }
  }
  ${POST_FRAGMENT}
`;

export const GET_COMMENTS = gql`
  query GetComments($postId: ID!, $limit: Int, $cursor: String) {
    comments(postId: $postId, limit: $limit, cursor: $cursor) {
      edges { ...CommentFragment }
      pageInfo { hasNextPage endCursor }
    }
  }
  ${COMMENT_FRAGMENT}
`;

export const GET_FOLLOWERS = gql`
  query GetFollowers($username: String!, $limit: Int, $cursor: String) {
    followers(username: $username, limit: $limit, cursor: $cursor) {
      edges { ...UserFragment }
      pageInfo { hasNextPage endCursor }
    }
  }
  ${USER_FRAGMENT}
`;

export const GET_FOLLOWING = gql`
  query GetFollowing($username: String!, $limit: Int, $cursor: String) {
    following(username: $username, limit: $limit, cursor: $cursor) {
      edges { ...UserFragment }
      pageInfo { hasNextPage endCursor }
    }
  }
  ${USER_FRAGMENT}
`;

export const GET_NOTIFICATIONS = gql`
  query GetNotifications($limit: Int, $cursor: String) {
    notifications(limit: $limit, cursor: $cursor) {
      edges { ...NotificationFragment }
      pageInfo { hasNextPage endCursor }
      unreadCount
    }
  }
  ${NOTIFICATION_FRAGMENT}
`;

export const SEARCH = gql`
  query Search($query: String!, $limit: Int) {
    search(query: $query, limit: $limit) {
      users { ...UserFragment }
      posts { ...PostFragment }
    }
  }
  ${USER_FRAGMENT}
  ${POST_FRAGMENT}
`;

export const GET_STORIES = gql`
  query GetStories {
    stories {
      user { id username displayName avatarUrl }
      hasUnviewed
      stories { ...StoryFragment }
    }
  }
  ${STORY_FRAGMENT}
`;

export const GET_MY_STORY = gql`
  query GetMyStory {
    myStory { ...StoryFragment }
  }
  ${STORY_FRAGMENT}
`;

export const GET_BOOKMARKS = gql`
  query GetBookmarks($limit: Int, $cursor: String) {
    bookmarks(limit: $limit, cursor: $cursor) {
      edges { ...PostFragment }
      pageInfo { hasNextPage endCursor }
    }
  }
  ${POST_FRAGMENT}
`;

export const GET_EXPLORE = gql`
  query GetExplore($limit: Int, $cursor: String) {
    explore(limit: $limit, cursor: $cursor) {
      edges { ...PostFragment }
      pageInfo { hasNextPage endCursor }
    }
  }
  ${POST_FRAGMENT}
`;

export const GET_HASHTAG = gql`
  query GetHashtag($name: String!) {
    hashtag(name: $name) { ...HashtagFragment }
  }
  ${HASHTAG_FRAGMENT}
`;

export const GET_TRENDING_HASHTAGS = gql`
  query GetTrendingHashtags($limit: Int) {
    trendingHashtags(limit: $limit) { ...HashtagFragment }
  }
  ${HASHTAG_FRAGMENT}
`;

export const SEARCH_HASHTAGS = gql`
  query SearchHashtags($query: String!, $limit: Int) {
    searchHashtags(query: $query, limit: $limit) {
      id
      name
      totalCount
    }
  }
`;

// ── DMs ─────────────────────────────────────────────────────────────────────
export const GET_CONVERSATIONS = gql`
  query GetConversations {
    conversations {
      id
      lastMessageAt
      unreadCount
      participants { id username displayName avatarUrl }
      lastMessage { id content createdAt sender { id } }
    }
  }
`;

export const GET_MESSAGES = gql`
  query GetMessages($conversationId: ID!, $limit: Int, $cursor: String) {
    messages(conversationId: $conversationId, limit: $limit, cursor: $cursor) {
      edges {
        id content mediaUrl mediaType isRead createdAt
        sender { id username displayName avatarUrl }
        conversation { id }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

// ── Reels ───────────────────────────────────────────────────────────────────
export const GET_REELS = gql`
  query GetReels($limit: Int, $cursor: String) {
    reels(limit: $limit, cursor: $cursor) {
      edges {
        id videoUrl thumbnailUrl caption duration likeCount commentCount viewCount
        hashtags likedByMe bookmarkedByMe createdAt
        author { id username displayName avatarUrl isVerified isFollowedByMe }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export const GET_USER_REELS = gql`
  query GetUserReels($username: String!, $limit: Int, $cursor: String) {
    userReels(username: $username, limit: $limit, cursor: $cursor) {
      edges {
        id videoUrl thumbnailUrl caption duration likeCount commentCount viewCount
        hashtags likedByMe bookmarkedByMe createdAt
        author { id username displayName avatarUrl }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

// ── Analytics ───────────────────────────────────────────────────────────────
export const GET_POST_ANALYTICS = gql`
  query GetPostAnalytics($postId: ID!) {
    postAnalytics(postId: $postId) {
      impressions reach saves engagementRate likeCount commentCount
      reachByDay   { date count }
      likesByDay   { date count }
      commentsByDay { date count }
      post { id content imageUrl createdAt author { username displayName } }
    }
  }
`;

export const GET_SUGGESTED_USERS = gql`
  query GetSuggestedUsers($limit: Int) {
    suggestedUsers(limit: $limit) {
      id
      username
      displayName
      avatarUrl
      isFollowedByMe
    }
  }
`;
