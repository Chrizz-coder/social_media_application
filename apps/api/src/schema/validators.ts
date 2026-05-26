import { z } from 'zod';

export const CreatePostInputSchema = z.object({
  content: z.string().min(1, 'Content is required').max(500, 'Content must be at most 500 characters'),
  imageUrl: z
    .string()
    .url('imageUrl must be a valid URL')
    .or(z.literal(''))
    .optional(),
});

export const UpdatePostInputSchema = z.object({
  content: z
    .string()
    .min(1, 'Content must not be empty')
    .max(500, 'Content must be at most 500 characters')
    .optional(),
  imageUrl: z.string().optional(),
});

export const CreateCommentInputSchema = z.object({
  postId: z.string().min(1, 'postId is required'),
  content: z.string().min(1, 'Content is required').max(300, 'Content must be at most 300 characters'),
});

export const CreateStoryInputSchema = z.object({
  mediaUrl: z.string().url('mediaUrl must be a valid URL'),
  mediaType: z.enum(['image', 'video'], {
    error: 'mediaType must be "image" or "video"',
  }),
  caption: z.string().max(500, 'Caption must be at most 500 characters').optional(),
});

export const CreateReelInputSchema = z.object({
  videoUrl: z.string().url('videoUrl must be a valid URL'),
  thumbnailUrl: z
    .string()
    .url('thumbnailUrl must be a valid URL')
    .or(z.literal(''))
    .optional(),
  caption: z.string().max(2200, 'Caption must be at most 2200 characters').optional(),
  duration: z
    .number()
    .int('Duration must be an integer')
    .positive('Duration must be positive'),
  hashtags: z
    .array(z.string().min(1).max(100))
    .max(30, 'Maximum 30 hashtags allowed')
    .optional(),
});

export const SendMessageInputSchema = z.object({
  conversationId: z.string().min(1, 'conversationId is required'),
  content: z.string().min(1, 'Content is required').max(2000, 'Content must be at most 2000 characters'),
  mediaUrl: z
    .string()
    .url('mediaUrl must be a valid URL')
    .or(z.literal(''))
    .optional(),
  mediaType: z.enum(['image', 'video']).optional(),
});
