"use client";

import { useQuery, useMutation } from "@apollo/client/react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { GET_CONVERSATIONS, GET_MESSAGES } from "@/lib/gql/queries";
import { SEND_MESSAGE, MARK_CONVERSATION_READ, CREATE_OR_GET_CONVERSATION } from "@/lib/gql/mutations";
import { ON_NEW_MESSAGE } from "@/lib/gql/subscriptions";
import { Avatar } from "@/components/common/Avatar";
import { Loader2, Send, Edit, ArrowLeft, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { SEARCH } from "@/lib/gql/queries";
import { useLazyQuery } from "@apollo/client/react";

function relTime(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

// ── New DM search sheet ─────────────────────────────────────────────────────
function NewDMSheet({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (user: any) => void }) {
  const [q, setQ] = useState("");
  const [search, { data, loading }] = useLazyQuery(SEARCH);
  useEffect(() => {
    if (!q.trim()) return;
    const t = setTimeout(() => search({ variables: { query: q, limit: 8 } }), 350);
    return () => clearTimeout(t);
  }, [q, search]);
  const users: any[] = (data as any)?.search?.users ?? [];
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-t-2xl md:rounded-2xl z-10 overflow-hidden" style={{ background: "var(--color-surface)", maxHeight: "60vh" }}>
        <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search users…" className="flex-1 bg-transparent text-sm focus:outline-none" style={{ color: "var(--color-text-primary)" }} />
          {loading && <Loader2 size={14} className="animate-spin" />}
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "calc(60vh - 64px)" }}>
          {users.map((u: any) => (
            <button key={u.id} onClick={() => { onSelect(u); onClose(); }} className="flex w-full items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors">
              <Avatar src={u.avatarUrl} alt={u.displayName} size={36} />
              <div className="min-w-0 text-left">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{u.displayName}</p>
                <p className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>@{u.username}</p>
              </div>
            </button>
          ))}
          {!loading && q && users.length === 0 && <p className="p-4 text-sm text-center" style={{ color: "var(--color-text-secondary)" }}>No users found</p>}
        </div>
      </div>
    </div>
  );
}

// ── Chat panel ──────────────────────────────────────────────────────────────
function ChatPanel({ conversationId, viewer, participants }: { conversationId: string; viewer: any; participants?: any[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const viewerId = viewer?.id ?? viewer?._id;

  const recipient = participants?.find((p: any) => p.id !== viewerId);

  const { data, loading, fetchMore, subscribeToMore } = useQuery(GET_MESSAGES, {
    variables: { conversationId, limit: 30 },
    skip: !conversationId,
  });

  const [markRead] = useMutation(MARK_CONVERSATION_READ);
  const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE, {
    onCompleted: () => setText(""),
  });

  const messages: any[] = [...((data as any)?.messages?.edges ?? [])].reverse();
  const pageInfo = (data as any)?.messages?.pageInfo;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  useEffect(() => {
    if (conversationId) markRead({ variables: { conversationId } });
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    return subscribeToMore({
      document: ON_NEW_MESSAGE,
      variables: { conversationId },
      updateQuery(prev: any, { subscriptionData }: any) {
        const newMsg = subscriptionData.data?.newMessage;
        if (!newMsg) return prev;
        const existing = prev.messages?.edges ?? [];
        if (existing.find((m: any) => m.id === newMsg.id)) return prev;
        return { ...prev, messages: { ...prev.messages, edges: [newMsg, ...existing] } };
      },
    });
  }, [conversationId, subscribeToMore]);

  const send = () => {
    if (!text.trim() || sending) return;
    sendMessage({ variables: { input: { conversationId, content: text.trim() } } });
  };

  const grouped: { date: string; msgs: any[] }[] = [];
  let lastDate = "";
  for (const m of messages) {
    const d = new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (d !== lastDate) { grouped.push({ date: d, msgs: [] }); lastDate = d; }
    grouped[grouped.length - 1].msgs.push(m);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0" style={{ borderColor: "var(--color-border)" }}>
        <Link href="/messages" className="md:hidden mr-1"><ArrowLeft size={20} style={{ color: "var(--color-text-primary)" }} /></Link>
        {recipient && (
          <Link href={`/profile/${recipient.username}`}>
            <Avatar src={recipient.avatarUrl} alt={recipient.displayName} size={36} />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          {recipient ? (
            <Link href={`/profile/${recipient.username}`}>
              <p className="font-semibold text-sm truncate hover:underline" style={{ color: "var(--color-text-primary)" }}>{recipient.displayName}</p>
            </Link>
          ) : (
            <p className="font-semibold text-sm truncate" style={{ color: "var(--color-text-primary)" }}>Loading…</p>
          )}
          <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>Active now</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {pageInfo?.hasNextPage && (
          <button onClick={() => fetchMore({ variables: { conversationId, limit: 30, cursor: pageInfo.endCursor } })}
            className="w-full text-xs py-2 text-center" style={{ color: "var(--color-interactive)" }}>
            Load older messages
          </button>
        )}
        {loading && <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin" /></div>}

        {grouped.map(({ date, msgs }) => (
          <div key={date}>
            <div className="flex items-center justify-center py-3">
              <span className="text-xs px-3" style={{ color: "var(--color-text-secondary)" }}>{date}</span>
            </div>
            {msgs.map((m: any, i: number) => {
              const isMe = m.sender.id === viewerId;
              const showAvatar = !isMe && (i === 0 || msgs[i - 1]?.sender.id !== m.sender.id);
              return (
                <div key={m.id} className={cn("flex items-end gap-2 mb-1", isMe ? "justify-end" : "justify-start")}>
                  {!isMe && (
                    <div style={{ width: 28 }}>
                      {showAvatar && <Avatar src={m.sender.avatarUrl} alt={m.sender.displayName} size={28} />}
                    </div>
                  )}
                  <div
                    className="max-w-[70%] rounded-2xl px-3 py-2 text-sm break-words"
                    style={{
                      background: isMe ? "var(--color-interactive)" : "var(--color-border)",
                      color: isMe ? "#fff" : "var(--color-text-primary)",
                      borderBottomRightRadius: isMe ? 4 : undefined,
                      borderBottomLeftRadius: !isMe ? 4 : undefined,
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-t" style={{ borderColor: "var(--color-border)" }}>
        <button style={{ color: "var(--color-text-secondary)" }}><ImageIcon size={22} /></button>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Message…"
          className="flex-1 rounded-full px-4 py-2 text-sm focus:outline-none"
          style={{ background: "var(--color-surface-elevated)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
        />
        <button onClick={send} disabled={!text.trim() || sending} style={{ color: "var(--color-interactive)" }}>
          {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
}

// ── Main messages layout ────────────────────────────────────────────────────
export default function MessagesPage() {
  const { data: session } = useSession();
  const viewer = session?.user as any;
  const router = useRouter();
  const [newDMOpen, setNewDMOpen] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);

  const { data, loading } = useQuery(GET_CONVERSATIONS, { skip: !viewer });
  const conversations: any[] = (data as any)?.conversations ?? [];

  const [createConv] = useMutation(CREATE_OR_GET_CONVERSATION, {
    onCompleted: (d: any) => {
      const id = d.createOrGetConversation.id;
      setActiveConvId(id);
    },
  });

  const viewerId = viewer?.id ?? viewer?._id;

  const activeConv = conversations.find(c => c.id === activeConvId);
  const activeParticipants = activeConv?.participants;

  return (
    <>
      <div className="flex h-[calc(100vh-0px)]" style={{ borderRight: "1px solid var(--color-border)" }}>
        {/* Left panel — conversation list */}
        <div
          className={cn("flex flex-col border-r shrink-0", activeConvId ? "hidden md:flex" : "flex")}
          style={{ width: 350, borderColor: "var(--color-border)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
            <span className="font-bold text-base" style={{ color: "var(--color-text-primary)" }}>
              {viewer?.username ?? viewer?.name ?? "Messages"}
            </span>
            <button onClick={() => setNewDMOpen(true)} style={{ color: "var(--color-text-primary)" }}>
              <Edit size={22} />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading && <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin" /></div>}
            {conversations
              .slice()
              .sort((a, b) => new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime())
              .map((conv: any) => {
                const other = conv.participants.find((p: any) => p.id !== viewerId) ?? conv.participants[0];
                const isActive = conv.id === activeConvId;
                const lastMsg = conv.lastMessage;
                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={cn("flex w-full items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors", isActive && "bg-secondary")}
                  >
                    <Avatar src={other?.avatarUrl} alt={other?.displayName ?? "?"} size={48} />
                    <div className="min-w-0 flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span className={cn("text-sm truncate", conv.unreadCount > 0 ? "font-bold" : "font-normal")} style={{ color: "var(--color-text-primary)" }}>
                          {other?.displayName}
                        </span>
                        {lastMsg && <span className="text-xs shrink-0 ml-2" style={{ color: "var(--color-text-secondary)" }}>{relTime(lastMsg.createdAt)}</span>}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={cn("text-xs truncate", conv.unreadCount > 0 ? "font-semibold" : "")} style={{ color: "var(--color-text-secondary)", maxWidth: "80%" }}>
                          {lastMsg ? (lastMsg.sender.id === viewerId ? `You: ${lastMsg.content}` : lastMsg.content) : "No messages yet"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="shrink-0 h-2.5 w-2.5 rounded-full" style={{ background: "var(--color-interactive)" }} />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            {!loading && conversations.length === 0 && (
              <div className="flex flex-col items-center py-16 gap-2">
                <p className="font-bold" style={{ color: "var(--color-text-primary)" }}>Your messages</p>
                <p className="text-sm text-center px-8" style={{ color: "var(--color-text-secondary)" }}>Send private photos and messages to a friend or group.</p>
                <button onClick={() => setNewDMOpen(true)} className="mt-4 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--color-interactive)" }}>
                  Send message
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right panel — chat */}
        <div className={cn("flex-1 min-w-0", !activeConvId ? "hidden md:flex items-center justify-center" : "flex flex-col")}>
          {activeConvId ? (
            <ChatPanel conversationId={activeConvId} viewer={viewer} participants={activeParticipants} />
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full p-4 border-2" style={{ borderColor: "var(--color-text-primary)" }}>
                <Send size={36} style={{ color: "var(--color-text-primary)" }} />
              </div>
              <p className="font-bold text-lg" style={{ color: "var(--color-text-primary)" }}>Your messages</p>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Send a message to start a conversation</p>
              <button onClick={() => setNewDMOpen(true)} className="mt-2 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--color-interactive)" }}>
                Send message
              </button>
            </div>
          )}
        </div>
      </div>

      <NewDMSheet
        open={newDMOpen}
        onClose={() => setNewDMOpen(false)}
        onSelect={(user) => createConv({ variables: { userId: user.id } })}
      />
    </>
  );
}
