import { gql } from 'graphql-tag';

export const typeDefs = gql`
  scalar Date

  # ─── Core Types ────────────────────────────────────────────────────────────

  type User {
    id: ID!
    email: String!
    username: String!
    displayName: String!
    bio: String
    avatarUrl: String
    followerCount: Int!
    followingCount: Int!
    isFollowedByMe: Boolean!
    createdAt: Date!
  }

  type Post {
    id: ID!
    author: User!
    content: String!
    imageUrl: String
    likeCount: Int!
    commentCount: Int!
    likedByMe: Boolean!
    createdAt: Date!
  }

  type Comment {
    id: ID!
    post: Post!
    author: User!
    content: String!
    createdAt: Date!
  }

  type AuthPayload {
    user: User!
  }

  # ─── Notification ──────────────────────────────────────────────────────────

  enum NotificationType {
    FOLLOW
    LIKE
    COMMENT
  }

  type Notification {
    id: ID!
    type: NotificationType!
    actor: User!
    post: Post
    read: Boolean!
    createdAt: Date!
  }

  # ─── Connection / Pagination ──────────────────────────────────────────────

  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }

  type PostConnection {
    edges: [Post!]!
    pageInfo: PageInfo!
  }

  type CommentConnection {
    edges: [Comment!]!
    pageInfo: PageInfo!
  }

  type UserConnection {
    edges: [User!]!
    pageInfo: PageInfo!
  }

  type NotificationConnection {
    edges: [Notification!]!
    pageInfo: PageInfo!
    unreadCount: Int!
  }

  type SearchResult {
    users: [User!]!
    posts: [Post!]!
  }

  # ─── Queries ──────────────────────────────────────────────────────────────

  type Query {
    me: User
    user(username: String!): User
    post(id: ID!): Post
    feed(limit: Int, cursor: String): PostConnection!
    posts(limit: Int, cursor: String): PostConnection!
    userPosts(username: String!, limit: Int, cursor: String): PostConnection!
    likedPosts(username: String!, limit: Int, cursor: String): PostConnection!
    comments(postId: ID!, limit: Int, cursor: String): CommentConnection!
    followers(username: String!, limit: Int, cursor: String): UserConnection!
    following(username: String!, limit: Int, cursor: String): UserConnection!
    notifications(limit: Int, cursor: String): NotificationConnection!
    search(query: String!, limit: Int): SearchResult!
  }

  # ─── Mutations ────────────────────────────────────────────────────────────

  type Mutation {
    # Posts
    createPost(input: CreatePostInput!): Post!
    updatePost(id: ID!, input: UpdatePostInput!): Post!
    deletePost(id: ID!): Boolean!
    # Comments
    createComment(input: CreateCommentInput!): Comment!
    deleteComment(id: ID!): Boolean!
    # Social
    followUser(username: String!): User!
    unfollowUser(username: String!): User!
    likePost(postId: ID!): Post!
    unlikePost(postId: ID!): Post!
    # Notifications
    markNotificationsRead: Boolean!
  }

  # ─── Subscriptions ────────────────────────────────────────────────────────

  type Subscription {
    notificationReceived: Notification!
    postAdded: Post!
  }

  # ─── Inputs ───────────────────────────────────────────────────────────────

  input CreatePostInput {
    content: String!
    imageUrl: String
  }

  input UpdatePostInput {
    content: String
    imageUrl: String
  }

  input CreateCommentInput {
    postId: ID!
    content: String!
  }
`;
