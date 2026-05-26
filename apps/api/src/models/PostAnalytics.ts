import mongoose, { Schema } from 'mongoose';

const DayCountSchema = new Schema(
  {
    date:  { type: Date, required: true },
    count: { type: Number, default: 0 },
  },
  { _id: false }
);

const PostAnalyticsSchema = new Schema(
  {
    post:                   { type: Schema.Types.ObjectId, ref: 'Post', required: true, unique: true },
    impressions:            { type: Number, default: 0 },
    profileVisitsFromPost:  { type: Number, default: 0 },
    saves:                  { type: Number, default: 0 },
    reachByDay:             [DayCountSchema],
    likesByDay:             [DayCountSchema],
    commentsByDay:          [DayCountSchema],
  },
  { timestamps: true }
);

PostAnalyticsSchema.index({ post: 1 }, { unique: true });

export const PostAnalytics = mongoose.model('PostAnalytics', PostAnalyticsSchema);
