import { gql } from "@apollo/client";
import { POST_FRAGMENT, COMMENT_FRAGMENT, USER_FRAGMENT } from "./fragments";

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
