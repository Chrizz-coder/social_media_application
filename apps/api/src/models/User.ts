import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema(
  {
    email:          { type: String, required: true, unique: true },
    username:       { type: String, required: true, unique: true },
    displayName:    { type: String, required: true },
    bio:            { type: String },
    avatarUrl:      { type: String },
    followerCount:  { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    isVerified:     { type: Boolean, default: false },
    role:           { type: String, enum: ['user', 'creator', 'admin'], default: 'user' },
    verifiedAt:     { type: Date },
    bookmarksCount: { type: Number, default: 0 },
    storiesCount:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Text index for search
UserSchema.index({ username: 'text', displayName: 'text' });

export const User = mongoose.model('User', UserSchema);
