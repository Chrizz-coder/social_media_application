// Environment variables are loaded by --env-file in the dev/start scripts
// before any module is evaluated — no dotenv import needed here.


import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { connectDB } from './db';
import { schema } from './schema';
import { createContext, resolveViewerFromToken } from './context';
import { createLoaders } from './schema/loaders';

async function main() {
  await connectDB();

  const app = express();
  const port = process.env.PORT || 4000;

  app.use(cors<cors.CorsRequest>());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const httpServer = createServer(app);

  const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });

  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx) => {
        const params = ctx.connectionParams as Record<string, unknown> | undefined;
        const rawToken =
          (params?.authorization as string)?.replace?.('Bearer ', '') ||
          (params?.token as string) ||
          null;

        const { viewer } = await resolveViewerFromToken(rawToken);
        return { viewer, loaders: createLoaders() };
      },
    },
    wsServer
  );

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

  app.use(
    '/graphql',
    expressMiddleware(apollo, {
      context: async ({ req }) => {
        const base = await createContext({ req });
        return { ...base, loaders: createLoaders() };
      },
    })
  );

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
