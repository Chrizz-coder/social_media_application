"use client";

import { useState, useEffect } from "react";
import { useLazyQuery } from "@apollo/client/react";
import { SEARCH } from "@/lib/gql/queries";
import { PostCard } from "@/components/post/PostCard";
import { UserCard } from "@/components/user/UserCard";
import { SearchIcon, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function SearchPage() {
  const { data: session } = useSession();
  const viewer = session?.user as any;
  const [q, setQ] = useState("");

  const [search, { data, loading }] = useLazyQuery(SEARCH);

  // Debounce search on input
  useEffect(() => {
    if (!q.trim()) return;
    const t = setTimeout(() => search({ variables: { query: q, limit: 10 } }), 400);
    return () => clearTimeout(t);
  }, [q, search]);

  const users = (data as any)?.search?.users ?? [];
  const posts = (data as any)?.search?.posts ?? [];
  const hasResults = users.length > 0 || posts.length > 0;

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3">
        <h1 className="text-lg font-bold">Search</h1>
      </header>

      {/* Search input */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 rounded-xl border border-input bg-input px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-ring transition-all">
          <SearchIcon size={16} className="text-muted-foreground shrink-0" />
          <input
            autoFocus
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search users or posts…"
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          {loading && <Loader2 size={14} className="animate-spin text-primary shrink-0" />}
        </div>
      </div>

      {q.trim() && !loading && !hasResults && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No results for &ldquo;{q}&rdquo;
        </div>
      )}

      {/* Users */}
      {users.length > 0 && (
        <section>
          <p className="px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            People
          </p>
          {users.map((u: any) => (
            <UserCard key={u.id} user={u} viewerId={viewer?.id ?? viewer?._id} />
          ))}
        </section>
      )}

      {/* Posts */}
      {posts.length > 0 && (
        <section>
          <p className="px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground border-t border-border">
            Posts
          </p>
          {posts.map((p: any) => (
            <PostCard key={p.id} post={p} viewerId={viewer?.id ?? viewer?._id} />
          ))}
        </section>
      )}

      {!q.trim() && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Start typing to search users and posts.
        </div>
      )}
    </div>
  );
}
