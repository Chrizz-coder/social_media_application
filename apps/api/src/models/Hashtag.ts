import mongoose, { Schema } from 'mongoose';

const HashtagSchema = new Schema(
  {
    name:       { type: String, required: true, unique: true, lowercase: true },
    postCount:  { type: Number, default: 0 },
    reelCount:  { type: Number, default: 0 },
    storyCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

HashtagSchema.index({ name: 1 }, { unique: true });
HashtagSchema.index({ postCount: -1 });

export const Hashtag = mongoose.model('Hashtag', HashtagSchema);
