"use client";

import { useQuery, useMutation } from "@apollo/client/react";
import { useSession } from "next-auth/react";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { GET_NOTIFICATIONS } from "@/lib/gql/queries";
import { MARK_NOTIFICATIONS_READ } from "@/lib/gql/mutations";
import { ON_NOTIFICATION_RECEIVED } from "@/lib/gql/subscriptions";
import { Loader2, CheckCheck } from "lucide-react";
import { useEffect } from "react";

export default function NotificationsPage() {
  const { data: session } = useSession();
  const viewer = session?.user as any;

  const { data, loading, fetchMore, subscribeToMore } = useQuery(GET_NOTIFICATIONS, {
    variables: { limit: 20 },
    skip: !viewer,
  });

  const [markRead] = useMutation(MARK_NOTIFICATIONS_READ, {
    refetchQueries: [{ query: GET_NOTIFICATIONS, variables: { limit: 20 } }],
  });

  // Live subscription for new notifications
  useEffect(() => {
    if (!viewer) return;
    return subscribeToMore({
      document: ON_NOTIFICATION_RECEIVED,
      updateQuery(prev: any, { subscriptionData }: any) {
        const newNotif = (subscriptionData.data as any).notificationReceived;
        return {
          ...prev,
          notifications: {
            ...prev.notifications,
            edges: [newNotif, ...(prev.notifications?.edges ?? [])],
            unreadCount: (prev.notifications?.unreadCount ?? 0) + 1,
          },
        };
      },
    });
  }, [viewer, subscribeToMore]);

  const { edges = [], pageInfo, unreadCount = 0 } = (data as any)?.notifications ?? {};

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <button
              onClick={() => markRead()}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-accent transition-colors"
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
          )}
        </div>
      </header>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      )}

      {edges.map((n: any) => (
        <NotificationItem key={n.id} notification={n} />
      ))}

      {pageInfo?.hasNextPage && (
        <button
          onClick={() =>
            fetchMore({ variables: { limit: 20, cursor: pageInfo.endCursor } })
          }
          className="w-full py-4 text-sm text-primary hover:underline"
        >
          Load more
        </button>
      )}

      {!loading && edges.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-muted-foreground text-sm">No notifications yet.</p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            When someone follows or likes your posts, it&apos;ll show up here.
          </p>
        </div>
      )}
    </div>
  );
}
