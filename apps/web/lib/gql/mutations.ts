import { gql } from "@apollo/client";
import { POST_FRAGMENT, COMMENT_FRAGMENT, USER_FRAGMENT } from "./fragments";

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id username displayName bio avatarUrl
    }
  }
`;

export const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) { ...PostFragment }
  }
  ${POST_FRAGMENT}
`;

export const UPDATE_POST = gql`
  mutation UpdatePost($id: ID!, $input: UpdatePostInput!) {
    updatePost(id: $id, input: $input) { ...PostFragment }
  }
  ${POST_FRAGMENT}
`;

export const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
`;

export const CREATE_COMMENT = gql`
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(input: $input) { ...CommentFragment }
  }
  ${COMMENT_FRAGMENT}
`;

export const DELETE_COMMENT = gql`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id)
  }
`;

export const LIKE_POST = gql`
  mutation LikePost($postId: ID!) {
    likePost(postId: $postId) { id likeCount likedByMe }
  }
`;

export const UNLIKE_POST = gql`
  mutation UnlikePost($postId: ID!) {
    unlikePost(postId: $postId) { id likeCount likedByMe }
  }
`;

export const FOLLOW_USER = gql`
  mutation FollowUser($username: String!) {
    followUser(username: $username) {
      id username followerCount isFollowedByMe
    }
  }
`;

export const UNFOLLOW_USER = gql`
  mutation UnfollowUser($username: String!) {
    unfollowUser(username: $username) {
      id username followerCount isFollowedByMe
    }
  }
`;

export const MARK_NOTIFICATIONS_READ = gql`
  mutation MarkNotificationsRead {
    markNotificationsRead
  }
`;

export const CREATE_STORY = gql`
  mutation CreateStory($input: CreateStoryInput!) {
    createStory(input: $input) {
      id mediaUrl mediaType caption viewerCount hasViewedByMe expiresAt createdAt
      author { id username displayName avatarUrl }
    }
  }
`;

export const VIEW_STORY = gql`
  mutation ViewStory($id: ID!) {
    viewStory(id: $id)
  }
`;

export const DELETE_STORY = gql`
  mutation DeleteStory($id: ID!) {
    deleteStory(id: $id)
  }
`;

export const BOOKMARK_POST = gql`
  mutation BookmarkPost($postId: ID!) {
    bookmarkPost(postId: $postId)
  }
`;

export const UNBOOKMARK_POST = gql`
  mutation UnbookmarkPost($postId: ID!) {
    unbookmarkPost(postId: $postId)
  }
`;

// ── DMs ─────────────────────────────────────────────────────────────────────
export const SEND_MESSAGE = gql`
  mutation SendMessage($input: SendMessageInput!) {
    sendMessage(input: $input) {
      id content mediaUrl isRead createdAt
      sender { id username displayName avatarUrl }
      conversation { id }
    }
  }
`;

export const CREATE_OR_GET_CONVERSATION = gql`
  mutation CreateOrGetConversation($userId: ID!) {
    createOrGetConversation(userId: $userId) {
      id
      participants { id username displayName avatarUrl }
    }
  }
`;

export const MARK_CONVERSATION_READ = gql`
  mutation MarkConversationRead($conversationId: ID!) {
    markConversationRead(conversationId: $conversationId)
  }
`;

// ── Reels ───────────────────────────────────────────────────────────────────
export const CREATE_REEL = gql`
  mutation CreateReel($input: CreateReelInput!) {
    createReel(input: $input) {
      id videoUrl thumbnailUrl caption duration likeCount commentCount
      hashtags likedByMe bookmarkedByMe createdAt
      author { id username displayName avatarUrl }
    }
  }
`;

export const LIKE_REEL = gql`
  mutation LikeReel($id: ID!) {
    likeReel(id: $id) { id likeCount likedByMe }
  }
`;

export const UNLIKE_REEL = gql`
  mutation UnlikeReel($id: ID!) {
    unlikeReel(id: $id) { id likeCount likedByMe }
  }
`;

