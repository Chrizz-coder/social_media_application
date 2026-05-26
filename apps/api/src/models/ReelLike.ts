import mongoose, { Schema } from 'mongoose';

const ReelLikeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reel: { type: Schema.Types.ObjectId, ref: 'Reel', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ReelLikeSchema.index({ user: 1, reel: 1 }, { unique: true });
ReelLikeSchema.index({ reel: 1 }); // count / list likes per reel

export const ReelLike = mongoose.model('ReelLike', ReelLikeSchema);
