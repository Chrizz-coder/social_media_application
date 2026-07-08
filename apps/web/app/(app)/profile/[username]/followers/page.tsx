"use client";

import { useQuery } from "@apollo/client/react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { GET_FOLLOWERS } from "@/lib/gql/queries";
import { UserCard } from "@/components/user/UserCard";
import { Loader2, ArrowLeft } from "lucide-react";

export default function FollowersPage() {
  const { username } = useParams<{ username: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const viewer = session?.user as any;

  const { data, loading, error } = useQuery<any>(GET_FOLLOWERS, {
    variables: { username, limit: 30 },
  });

  const followers = data?.followers?.edges ?? [];

  return (
    <div>
      <header className="sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-md flex items-center gap-3" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        <button onClick={() => router.back()} className="hover:opacity-75 transition-opacity">
          <ArrowLeft size={20} style={{ color: "var(--color-text-primary)" }} />
        </button>
        <div>
          <h1 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>Followers</h1>
          <p className="text-xs text-muted-foreground">@{username}</p>
        </div>
      </header>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <p className="text-sm text-center py-12 text-muted-foreground">
          Failed to load followers.
        </p>
      )}

      {!loading && !error && followers.length === 0 && (
        <p className="text-sm text-center py-12 text-muted-foreground">
          No followers yet.
        </p>
      )}

      {!loading && !error && followers.length > 0 && (
        <div className="flex flex-col">
          {followers.map((u: any) => (
            <UserCard key={u.id} user={u} viewerId={viewer?.id ?? viewer?._id} />
          ))}
        </div>
      )}
    </div>
  );
}
