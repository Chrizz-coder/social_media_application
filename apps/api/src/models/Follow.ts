import mongoose, { Schema } from 'mongoose';

const FollowSchema = new Schema(
  {
    follower:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    following: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

FollowSchema.index({ follower: 1, following: 1 }, { unique: true });
FollowSchema.index({ following: 1, createdAt: -1 }); // who follows a user?
FollowSchema.index({ follower:  1, createdAt: -1 }); // who does a user follow?

export const Follow = mongoose.model('Follow', FollowSchema);
