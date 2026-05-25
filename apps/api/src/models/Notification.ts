import mongoose, { Schema } from 'mongoose';

const NotificationSchema = new Schema(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actor:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type:      { type: String, enum: ['follow', 'like', 'comment'], required: true },
    post:      { type: Schema.Types.ObjectId, ref: 'Post' },
    read:      { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, read: 1 });

export const Notification = mongoose.model('Notification', NotificationSchema);
