import mongoose, { Schema } from 'mongoose';

const PostSchema = new Schema(
  {
    author:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content:      { type: String, required: true, maxlength: 500 },
    imageUrl:     { type: String },
    likeCount:    { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    hashtags:     [{ type: String }],
    bookmarkCount:{ type: Number, default: 0 },
    viewCount:    { type: Number, default: 0 },
    isArchived:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });
// Text index for search
PostSchema.index({ content: 'text' });

export const Post = mongoose.model('Post', PostSchema);
