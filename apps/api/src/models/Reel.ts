import mongoose, { Schema } from 'mongoose';

const ReelSchema = new Schema(
  {
    author:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    videoUrl:     { type: String, required: true },
    thumbnailUrl: { type: String },
    caption:      { type: String, maxlength: 2200 },
    duration:     { type: Number, required: true }, // seconds
    likeCount:    { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    viewCount:    { type: Number, default: 0 },
    hashtags:     [{ type: String }],
  },
  { timestamps: true }
);

ReelSchema.index({ author: 1, createdAt: -1 });
ReelSchema.index({ createdAt: -1 });
ReelSchema.index({ hashtags: 1 });

export const Reel = mongoose.model('Reel', ReelSchema);
