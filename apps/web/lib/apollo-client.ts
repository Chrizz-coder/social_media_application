"use client";

import { ApolloClient, InMemoryCache, createHttpLink, split, from } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { getMainDefinition } from "@apollo/client/utilities";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/graphql";
const WS_URL = API_URL.replace(/^https?/, (p) => (p === "https" ? "wss" : "ws"));

export function makeApolloClient(token: string | null) {
  const httpLink = createHttpLink({ uri: API_URL });

  const authLink = setContext((_, { headers }) => ({
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  }));

  // WebSocket link — only instantiated client-side
  const wsLink = new GraphQLWsLink(
    createClient({
      url: WS_URL,
      connectionParams: token ? { authorization: `Bearer ${token}` } : undefined,
    })
  );

  // Route subscriptions → WS, everything else → HTTP
  const splitLink = split(
    ({ query }) => {
      const def = getMainDefinition(query);
      return def.kind === "OperationDefinition" && def.operation === "subscription";
    },
    wsLink,
    from([authLink, httpLink])
  );

  return new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            feed:          { keyArgs: [], merge: connectionMerge },
            posts:         { keyArgs: [], merge: connectionMerge },
            userPosts:     { keyArgs: ["username"], merge: connectionMerge },
            likedPosts:    { keyArgs: ["username"], merge: connectionMerge },
            comments:      { keyArgs: ["postId"],   merge: connectionMerge },
            followers:     { keyArgs: ["username"], merge: connectionMerge },
            following:     { keyArgs: ["username"], merge: connectionMerge },
            notifications: { keyArgs: [],           merge: connectionMerge },
            reels:         { keyArgs: [],           merge: connectionMerge },
            userReels:     { keyArgs: ["username"], merge: connectionMerge },
            bookmarks:     { keyArgs: [],           merge: connectionMerge },
            explore:       { keyArgs: [],           merge: connectionMerge },
            messages:      { keyArgs: ["conversationId"], merge: connectionMerge },
          },
        },
      },
    }),
    defaultOptions: {
      watchQuery: { fetchPolicy: "cache-and-network" },
    },
  });
}

/** Generic cursor-pagination merge for Connection types */
function connectionMerge(
  existing: { edges: unknown[]; pageInfo: unknown } | undefined,
  incoming: { edges: unknown[]; pageInfo: unknown }
) {
  return {
    ...incoming,
    edges: [...(existing?.edges ?? []), ...incoming.edges],
  };
}
