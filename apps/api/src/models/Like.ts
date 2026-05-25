import mongoose, { Schema } from 'mongoose';

const LikeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  },
  { timestamps: true }
);

LikeSchema.index({ user: 1, post: 1 }, { unique: true });
LikeSchema.index({ post: 1 }); // count / list likes per post
LikeSchema.index({ user: 1, createdAt: -1 }); // posts liked by a user

export const Like = mongoose.model('Like', LikeSchema);
