import mongoose, { Schema } from 'mongoose';

const MessageSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    sender:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content:      { type: String, required: true, maxlength: 2000 },
    mediaUrl:     { type: String },
    mediaType:    { type: String, enum: ['image', 'video'] },
    readBy: [
      {
        user:   { type: Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

MessageSchema.index({ conversation: 1, createdAt: 1 });
MessageSchema.index({ sender: 1, createdAt: 1 });

export const Message = mongoose.model('Message', MessageSchema);
