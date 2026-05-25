"use client";

import { ApolloProvider } from "@apollo/client/react";
import { useMemo } from "react";
import { makeApolloClient } from "./apollo-client";

interface Props {
  token: string | null;
  children: React.ReactNode;
}

export function ApolloClientProvider({ token, children }: Props) {
  const client = useMemo(() => makeApolloClient(token), [token]);
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
