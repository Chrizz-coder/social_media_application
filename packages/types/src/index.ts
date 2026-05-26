export interface IUser {
  _id: string;
  email: string;
  username: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  followerCount: number;
  followingCount: number;
  isVerified: boolean;
  role: 'user' | 'creator' | 'admin';
  verifiedAt?: Date;
  bookmarksCount: number;
  storiesCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPost {
  _id: string;
  author: IUser | string;
  content: string;
  imageUrl?: string;
  likeCount: number;
  commentCount: number;
  hashtags: string[];
  bookmarkCount: number;
  viewCount: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IComment {
  _id: string;
  post: IPost | string;
  author: IUser | string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFollow {
  _id: string;
  follower: string;
  following: string;
  createdAt: Date;
}

export interface ILike {
  _id: string;
  user: string;
  post: string;
  createdAt: Date;
}

export interface INotification {
  _id: string;
  recipient: string;
  actor: IUser | string;
  type: 'follow' | 'like' | 'comment';
  post?: string;
  read: boolean;
  createdAt: Date;
}
