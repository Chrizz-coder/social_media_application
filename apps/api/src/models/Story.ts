import mongoose, { Schema } from 'mongoose';

const StorySchema = new Schema(
  {
    author:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mediaUrl:  { type: String, required: true },
    mediaType: { type: String, enum: ['image', 'video'], required: true },
    caption:   { type: String },
    viewers: [
      {
        user:     { type: Schema.Types.ObjectId, ref: 'User' },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

StorySchema.index({ author: 1, expiresAt: 1 });
StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Story = mongoose.model('Story', StorySchema);
