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
  },
  { timestamps: true }
);

// Text index for search
UserSchema.index({ username: 'text', displayName: 'text' });

export const User = mongoose.model('User', UserSchema);
