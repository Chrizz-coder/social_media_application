import mongoose, { Schema } from 'mongoose';

const ConversationSchema = new Schema(
  {
    participants: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      required: true,
      validate: {
        validator: (v: any[]) => v.length >= 2 && v.length <= 2,
        message: 'A conversation must have exactly 2 participants.',
      },
    },
    lastMessage:   { type: Schema.Types.ObjectId, ref: 'Message' },
    lastMessageAt: { type: Date },
  },
  { timestamps: true }
);

// Unique compound index so two users can only have one conversation
ConversationSchema.index({ participants: 1 }, { unique: true });

export const Conversation = mongoose.model('Conversation', ConversationSchema);
