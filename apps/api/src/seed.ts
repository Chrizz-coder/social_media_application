// Environment variables are loaded by --env-file in the seed script.


import mongoose from 'mongoose';
import { connectDB } from './db';
import { User } from './models/User';
import { Post } from './models/Post';
import { Comment } from './models/Comment';
import { Story } from './models/Story';
import { Reel } from './models/Reel';
import { Hashtag } from './models/Hashtag';
import { upsertUserNode } from './services/neo4jUserService';
import { getDriver } from './neo4j';

async function seed() {
  try {
    await connectDB();
    
    console.log('Dropping collections...');
    await User.deleteMany({});
    await Post.deleteMany({});
    await Comment.deleteMany({});
    await Story.deleteMany({});
    await Reel.deleteMany({});
    await Hashtag.deleteMany({});
    
    console.log('Creating users...');
    const users = await User.create([
      { email: 'alice@example.com', username: 'alice', displayName: 'Alice' },
      { email: 'bob@example.com', username: 'bob', displayName: 'Bob' },
      { email: 'charlie@example.com', username: 'charlie', displayName: 'Charlie' }
    ]);

    // Development only — mirrors MongoDB users into the Neo4j social graph.
    // Wrapped in try/catch so seed succeeds even if Neo4j is unavailable.
    try {
      console.log('Syncing users to Neo4j...');
      await Promise.all(
        users.map((u) =>
          upsertUserNode(
            (u._id as { toString(): string }).toString(),
            u.username
          )
        )
      );
      console.log('Neo4j sync completed.');
    } catch (neo4jErr) {
      console.warn('Neo4j sync failed (non-fatal):', neo4jErr);
    }
    
    console.log('Creating posts...');
    const posts = await Post.create([
      { author: users[0]._id, content: 'Hello world from Alice!', hashtags: ['hello', 'firstpost'] },
      { author: users[0]._id, content: 'Alice dropping another post.' },
      { author: users[1]._id, content: 'Bob checkin in.', hashtags: ['vibes'] },
      { author: users[2]._id, content: 'Charlie in the building.' },
      { author: users[2]._id, content: 'Charlie out.' }
    ]);
    
    console.log('Creating comments...');
    const comments = await Comment.create([
      { post: posts[0]._id, author: users[1]._id, content: 'Great first post!' },
      { post: posts[0]._id, author: users[2]._id, content: 'I completely agree.' },
      { post: posts[0]._id, author: users[0]._id, content: 'Thanks!' }
    ]);

    console.log('Creating stories...');
    const stories = await Story.create([
      {
        author: users[0]._id,
        mediaUrl: 'https://picsum.photos/seed/story1/1080/1920',
        mediaType: 'image',
        caption: 'Good morning everyone ☀️',
      },
      {
        author: users[1]._id,
        mediaUrl: 'https://picsum.photos/seed/story2/1080/1920',
        mediaType: 'image',
        caption: 'Sunset vibes 🌅',
      },
    ]);

    console.log('Creating reels...');
    const reels = await Reel.create([
      {
        author: users[0]._id,
        videoUrl: 'https://example.com/videos/reel1.mp4',
        thumbnailUrl: 'https://picsum.photos/seed/reel1/1080/1920',
        caption: 'Check out this cool trick! #trending #cool',
        duration: 30,
        hashtags: ['trending', 'cool'],
      },
      {
        author: users[2]._id,
        videoUrl: 'https://example.com/videos/reel2.mp4',
        thumbnailUrl: 'https://picsum.photos/seed/reel2/1080/1920',
        caption: 'Day in my life 🎬 #vlog #dayinmylife',
        duration: 60,
        hashtags: ['vlog', 'dayinmylife'],
      },
    ]);

    console.log('Creating hashtags...');
    const hashtags = await Hashtag.create([
      { name: 'trending', postCount: 0, reelCount: 1 },
    ]);
    
    console.log('Seed completed successfully.');
    console.log('Inserted Users:', users.map(u => u._id));
    console.log('Inserted Posts:', posts.map(p => p._id));
    console.log('Inserted Comments:', comments.map(c => c._id));
    console.log('Inserted Stories:', stories.map(s => s._id));
    console.log('Inserted Reels:', reels.map(r => r._id));
    console.log('Inserted Hashtags:', hashtags.map(h => h._id));
    
  } catch (error) {
    console.error('Seed failed:', error);
  } finally {
    try { await getDriver().close(); } catch { /* already warned above */ }
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
