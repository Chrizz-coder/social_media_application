import { gql } from "@apollo/client";
import {
  USER_FRAGMENT,
  POST_FRAGMENT,
  COMMENT_FRAGMENT,
  NOTIFICATION_FRAGMENT,
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
