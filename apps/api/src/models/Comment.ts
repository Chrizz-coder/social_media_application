import mongoose, { Schema } from 'mongoose';

const CommentSchema = new Schema({
  post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 300 },
}, { timestamps: true });

CommentSchema.index({ post: 1, createdAt: 1 });

export const Comment = mongoose.model('Comment', CommentSchema);
