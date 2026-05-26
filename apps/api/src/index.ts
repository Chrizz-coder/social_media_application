import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import jwt from 'jsonwebtoken';
import { connectDB } from './db';
import { schema } from './schema';
import { createContext } from './context';
import { createLoaders } from './schema/loaders';
import { User } from './models/User';
import type { IUser } from '@social/types';

async function main() {
  // ── 1. Connect to MongoDB ────────────────────────────────────────────────
  await connectDB();

  // ── 2. Express app ───────────────────────────────────────────────────────
  const app = express();
  const port = process.env.PORT || 4000;

  app.use(cors<cors.CorsRequest>());
  app.use(express.json());

  // ── 3. Health check ──────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // ── 4. Shared HTTP server (required for WebSocket + Express together) ────
  const httpServer = createServer(app);

  // ── 5. WebSocket server for GraphQL subscriptions ───────────────────────
  const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });

  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx) => {
        // connectionParams is how the client sends the JWT over WS
        const token = (ctx.connectionParams as any)?.authorization?.replace?.('Bearer ', '');
        if (!token) return { viewer: null, loaders: createLoaders() };
        try {
          const secret = process.env.JWT_SECRET;
          if (!secret) return { viewer: null, loaders: createLoaders() };
          const decoded = jwt.verify(token, secret) as { userId: string };
          const user = await User.findById(decoded.userId).lean<IUser>();
          return { viewer: user ?? null, loaders: createLoaders() };
        } catch {
          return { viewer: null, loaders: createLoaders() };
        }
      },
    },
    wsServer
  );

  // ── 6. Apollo Server 4 ───────────────────────────────────────────────────
  const apollo = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await apollo.start();

  // ── 7. Mount GraphQL at /graphql ─────────────────────────────────────────
  app.use(
    '/graphql',
    expressMiddleware(apollo, {
      context: async ({ req }) => {
        const base = await createContext({ req });
        return { ...base, loaders: createLoaders() };
      },
    })
  );

  // ── 8. Start ─────────────────────────────────────────────────────────────
  httpServer.listen(Number(port), '0.0.0.0', () => {
    console.log(`🚀 GraphQL ready  → http://0.0.0.0:${port}/graphql`);
    console.log(`📡 WebSocket ready → ws://0.0.0.0:${port}/graphql`);
    console.log(`❤️  Health check   → http://0.0.0.0:${port}/health`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
