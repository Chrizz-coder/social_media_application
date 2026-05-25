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
