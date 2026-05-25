import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('REDIS_URL environment variable is not defined.');
}

export const redis = new Redis(redisUrl, {
  lazyConnect: true // Prevent immediate connection upon import if needed, or simply let it connect
});

// Using event listeners here to log status
redis.on('connect', () => {
  console.log('Redis connected');
});

redis.on('error', (err) => {
  console.error('Redis connection failed:', err);
});
