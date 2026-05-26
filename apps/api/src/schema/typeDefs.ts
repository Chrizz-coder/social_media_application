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
    isVerified: Boolean!
    role: String!
    bookmarksCount: Int!
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
    hashtags: [String!]!
    bookmarkCount: Int!
    viewCount: Int!
    bookmarkedByMe: Boolean!
    isArchived: Boolean!
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

  # ─── Stories ───────────────────────────────────────────────────────────────

  type Story {
    id: ID!
    author: User!
    mediaUrl: String!
    mediaType: String!
    caption: String
    viewerCount: Int!
    hasViewedByMe: Boolean!
    expiresAt: Date!
    createdAt: Date!
  }

  type StoryGroup {
    user: User!
    stories: [Story!]!
    hasUnviewed: Boolean!
  }

  # ─── Reels ────────────────────────────────────────────────────────────────

  type Reel {
    id: ID!
    author: User!
    videoUrl: String!
    thumbnailUrl: String
    caption: String
    duration: Int!
    likeCount: Int!
    commentCount: Int!
    viewCount: Int!
    hashtags: [String!]!
    likedByMe: Boolean!
    bookmarkedByMe: Boolean!
    createdAt: Date!
  }

  type ReelConnection {
    edges: [Reel!]!
    pageInfo: PageInfo!
  }

  # ─── Hashtags ─────────────────────────────────────────────────────────────

  type Hashtag {
    id: ID!
    name: String!
    postCount: Int!
    reelCount: Int!
    totalCount: Int!
  }

  # ─── Messaging ────────────────────────────────────────────────────────────

  type Conversation {
    id: ID!
    participants: [User!]!
    lastMessage: Message
    lastMessageAt: Date
    unreadCount: Int!
  }

  type Message {
    id: ID!
    conversation: Conversation!
    sender: User!
    content: String!
    mediaUrl: String
    mediaType: String
    isRead: Boolean!
    createdAt: Date!
  }

  type MessageConnection {
    edges: [Message!]!
    pageInfo: PageInfo!
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

    # Stories
    stories: [StoryGroup!]!
    myStory: [Story!]!

    # Reels
    reels(limit: Int, cursor: String): ReelConnection!
    userReels(username: String!, limit: Int, cursor: String): ReelConnection!
    reel(id: ID!): Reel

    # Messaging
    conversations: [Conversation!]!
    conversation(id: ID!): Conversation
    messages(conversationId: ID!, limit: Int, cursor: String): MessageConnection!

    # Bookmarks
    bookmarks(limit: Int, cursor: String): PostConnection!

    # Discovery
    hashtag(name: String!): Hashtag
    trendingHashtags(limit: Int): [Hashtag!]!
    explore(limit: Int, cursor: String): PostConnection!
    searchHashtags(query: String!, limit: Int): [Hashtag!]!
  }

  # ─── Mutations ────────────────────────────────────────────────────────────

  type Mutation {
    # Posts
    createPost(input: CreatePostInput!): Post!
    updatePost(id: ID!, input: UpdatePostInput!): Post!
    deletePost(id: ID!): Boolean!
    archivePost(id: ID!): Boolean!
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

    # Stories
    createStory(input: CreateStoryInput!): Story!
    deleteStory(id: ID!): Boolean!
    viewStory(id: ID!): Boolean!

    # Reels
    createReel(input: CreateReelInput!): Reel!
    deleteReel(id: ID!): Boolean!
    likeReel(id: ID!): Reel!
    unlikeReel(id: ID!): Reel!

    # Bookmarks
    bookmarkPost(postId: ID!): Boolean!
    unbookmarkPost(postId: ID!): Boolean!
    bookmarkReel(reelId: ID!): Boolean!
    unbookmarkReel(reelId: ID!): Boolean!

    # Messaging
    sendMessage(input: SendMessageInput!): Message!
    markConversationRead(conversationId: ID!): Boolean!
    createOrGetConversation(userId: ID!): Conversation!

    # Admin
    verifyUser(userId: ID!): User!
    unverifyUser(userId: ID!): User!
    setUserRole(userId: ID!, role: String!): User!
  }

  # ─── Subscriptions ────────────────────────────────────────────────────────

  type Subscription {
    notificationReceived: Notification!
    postAdded: Post!
    newMessage(conversationId: ID!): Message!
    newStory: StoryGroup!
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

  input CreateStoryInput {
    mediaUrl: String!
    mediaType: String!
    caption: String
  }

  input CreateReelInput {
    videoUrl: String!
    thumbnailUrl: String
    caption: String
    duration: Int!
    hashtags: [String!]
  }

  input SendMessageInput {
    conversationId: ID!
    content: String!
    mediaUrl: String
    mediaType: String
  }
`;
