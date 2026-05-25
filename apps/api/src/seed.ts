import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from './db';
import { User } from './models/User';
import { Post } from './models/Post';
import { Comment } from './models/Comment';

async function seed() {
  try {
    await connectDB();
    
    console.log('Dropping collections...');
    await User.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});
    
    console.log('Creating users...');
    const users = await User.create([
      { email: 'alice@example.com', username: 'alice', displayName: 'Alice' },
      { email: 'bob@example.com', username: 'bob', displayName: 'Bob' },
      { email: 'charlie@example.com', username: 'charlie', displayName: 'Charlie' }
    ]);
    
    console.log('Creating posts...');
    const posts = await Post.create([
      { author: users[0]._id, content: 'Hello world from Alice!' },
      { author: users[0]._id, content: 'Alice dropping another post.' },
      { author: users[1]._id, content: 'Bob checkin in.' },
      { author: users[2]._id, content: 'Charlie in the building.' },
      { author: users[2]._id, content: 'Charlie out.' }
    ]);
    
    console.log('Creating comments...');
    const comments = await Comment.create([
      { post: posts[0]._id, author: users[1]._id, content: 'Great first post!' },
      { post: posts[0]._id, author: users[2]._id, content: 'I completely agree.' },
      { post: posts[0]._id, author: users[0]._id, content: 'Thanks!' }
    ]);
    
    console.log('Seed completed successfully.');
    console.log('Inserted Users:', users.map(u => u._id));
    console.log('Inserted Posts:', posts.map(p => p._id));
    console.log('Inserted Comments:', comments.map(c => c._id));
    
  } catch (error) {
    console.error('Seed failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
