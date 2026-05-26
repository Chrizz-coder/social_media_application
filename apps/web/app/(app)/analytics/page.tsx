"use client";

import { useQuery } from "@apollo/client/react";
import { useSession } from "next-auth/react";
import { GET_POST_ANALYTICS, GET_USER_POSTS } from "@/lib/gql/queries";
import { useState } from "react";
import { Loader2, TrendingUp, Eye, Users, Bookmark, Heart, MessageCircle, ChevronDown } from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: any; color: string }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-2"
      style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>{label}</span>
        <Icon size={16} style={{ color }} />
      </div>
      <span className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{value}</span>
    </div>
  );
}

function ChartCard({ title, data, dataKey }: { title: string; data: any[]; dataKey: string }) {
  const chartData = data.map(d => ({ ...d, date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) }));
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)" }}
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>{title}</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} />
          <YAxis tick={{ fontSize: 11, fill: "var(--color-text-secondary)" }} />
          <Tooltip
            contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: "var(--color-text-primary)", fontWeight: 600 }}
          />
          <Line type="monotone" dataKey="count" stroke="var(--color-brand)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const viewer = session?.user as any;
  const viewerId = viewer?.id ?? viewer?._id;
  const username = viewer?.username ?? viewer?.name;

  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const { data: postsData, loading: postsLoading } = useQuery(GET_USER_POSTS, {
    variables: { username, limit: 20 },
    skip: !username,
  });
  const posts: any[] = (postsData as any)?.userPosts?.edges ?? [];

  const { data: analyticsData, loading: analyticsLoading } = useQuery(GET_POST_ANALYTICS, {
    variables: { postId: selectedPostId },
    skip: !selectedPostId,
  });
  const analytics = (analyticsData as any)?.postAnalytics;

  const isCreator = ["creator", "admin"].includes(viewer?.role);

  if (status === "loading") {
    return <div className="flex h-64 items-center justify-center"><Loader2 size={24} className="animate-spin" /></div>;
  }

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-md" style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>Analytics</h1>
          {isCreator && (
            <span className="text-xs font-semibold rounded-full px-2.5 py-1" style={{ background: "rgba(225,48,108,0.12)", color: "var(--color-brand)" }}>
              Creator Dashboard
            </span>
          )}
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Post selector */}
        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: "var(--color-text-secondary)" }}>Select a post</label>
          <div className="relative">
            <select
              value={selectedPostId ?? ""}
              onChange={e => setSelectedPostId(e.target.value || null)}
              className="w-full appearance-none rounded-xl px-4 py-3 pr-10 text-sm border focus:outline-none"
              style={{
                background: "var(--color-surface-elevated)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            >
              <option value="">Choose a post…</option>
              {posts.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.content.slice(0, 60)}{p.content.length > 60 ? "…" : ""}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--color-text-secondary)" }} />
          </div>
          {postsLoading && <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>Loading your posts…</p>}
        </div>

        {/* Loading analytics */}
        {analyticsLoading && (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="animate-spin" style={{ color: "var(--color-text-secondary)" }} />
          </div>
        )}

        {/* Analytics content */}
        {analytics && !analyticsLoading && (
          <>
            {/* Post preview */}
            <div className="flex items-start gap-3 rounded-2xl p-4" style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)" }}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{analytics.post.content.slice(0, 120)}</p>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  {new Date(analytics.post.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Impressions"  value={analytics.impressions.toLocaleString()}      icon={Eye}            color="var(--color-interactive)" />
              <StatCard label="Reach"         value={analytics.reach.toLocaleString()}             icon={Users}          color="var(--color-brand)" />
              <StatCard label="Saves"         value={analytics.saves.toLocaleString()}             icon={Bookmark}       color="#833AB4" />
              <StatCard label="Engagement"    value={`${(analytics.engagementRate * 100).toFixed(1)}%`} icon={TrendingUp} color="#f09433" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Likes"         value={analytics.likeCount.toLocaleString()}         icon={Heart}          color="var(--color-danger)" />
              <StatCard label="Comments"      value={analytics.commentCount.toLocaleString()}       icon={MessageCircle}  color="var(--color-text-secondary)" />
            </div>

            {/* Charts */}
            <div className="space-y-4">
              <ChartCard title="Reach by Day"     data={analytics.reachByDay}    dataKey="count" />
              <ChartCard title="Likes by Day"     data={analytics.likesByDay}    dataKey="count" />
              <ChartCard title="Comments by Day"  data={analytics.commentsByDay} dataKey="count" />
            </div>
          </>
        )}

        {/* Empty state */}
        {!selectedPostId && !analyticsLoading && (
          <div className="flex flex-col items-center py-16 gap-3">
            <TrendingUp size={48} style={{ color: "var(--color-text-secondary)", opacity: 0.4 }} />
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Select a post to view analytics</p>
            <p className="text-xs text-center" style={{ color: "var(--color-text-secondary)" }}>Track impressions, reach, saves, and engagement over time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
