import mongoose, { Schema } from 'mongoose';

const BookmarkSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      validate: {
        validator: function (this: any) {
          return !!(this.post || this.reel);
        },
        message: 'A bookmark must reference either a post or a reel.',
      },
    },
    reel: { type: Schema.Types.ObjectId, ref: 'Reel' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

BookmarkSchema.index({ user: 1, post: 1 }, { unique: true, sparse: true });
BookmarkSchema.index({ user: 1, reel: 1 }, { unique: true, sparse: true });
BookmarkSchema.index({ user: 1, createdAt: -1 });

export const Bookmark = mongoose.model('Bookmark', BookmarkSchema);
