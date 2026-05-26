"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@apollo/client/react";
import { Avatar } from "@/components/common/Avatar";
import { StoryRing } from "@/components/ui/StoryRing";
import { GET_STORIES } from "@/lib/gql/queries";
import { useState } from "react";
import { StoryViewer } from "./StoryViewer";
import { CreateStorySheet } from "./CreateStorySheet";
import { PlusCircle } from "lucide-react";

export function StoryBar() {
  const { data: session } = useSession();
  const viewer = session?.user as any;

  const { data } = useQuery(GET_STORIES, { skip: !viewer });
  const groups: any[] = (data as any)?.stories ?? [];

  const [viewingGroup, setViewingGroup] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [pressTimer, setPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const myGroup = groups.find((g: any) => g.user.id === (viewer?.id ?? viewer?._id));
  const otherGroups = groups
    .filter((g: any) => g.user.id !== (viewer?.id ?? viewer?._id))
    .sort((a: any, b: any) => (b.hasUnviewed ? 1 : 0) - (a.hasUnviewed ? 1 : 0));

  const allGroups = myGroup ? [myGroup, ...otherGroups] : otherGroups;

  const handlePointerDown = () => {
    const t = setTimeout(() => setCreateOpen(true), 500);
    setPressTimer(t);
  };
  const handlePointerUp = () => {
    if (pressTimer) clearTimeout(pressTimer);
  };

  return (
    <>
      <div
        className="flex gap-4 overflow-x-auto px-4 py-3 border-b"
        style={{
          borderColor: "var(--color-border)",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* My story */}
        {viewer && (
          <button
            className="flex flex-col items-center gap-1.5 shrink-0"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onClick={() => myGroup ? setViewingGroup(0) : setCreateOpen(true)}
          >
            <div className="relative">
              <StoryRing
                hasStory={!!myGroup}
                hasUnviewed={myGroup?.hasUnviewed ?? false}
                size="md"
              >
                <Avatar src={viewer.image} alt={viewer.name ?? "You"} size={56} />
              </StoryRing>
              {!myGroup && (
                <span
                  className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full text-white"
                  style={{ background: "var(--color-interactive)", border: "2px solid var(--color-surface)" }}
                >
                  <PlusCircle size={12} />
                </span>
              )}
            </div>
            <span className="text-[11px] text-center w-14 truncate" style={{ color: "var(--color-text-secondary)" }}>
              Your story
            </span>
          </button>
        )}

        {/* Others' stories */}
        {otherGroups.map((group: any, i: number) => (
          <button
            key={group.user.id}
            className="flex flex-col items-center gap-1.5 shrink-0"
            onClick={() => setViewingGroup(myGroup ? i + 1 : i)}
          >
            <StoryRing hasStory hasUnviewed={group.hasUnviewed} size="md">
              <Avatar src={group.user.avatarUrl} alt={group.user.displayName} size={56} />
            </StoryRing>
            <span className="text-[11px] text-center w-14 truncate" style={{ color: "var(--color-text-secondary)" }}>
              {group.user.username}
            </span>
          </button>
        ))}

        {/* Empty state */}
        {groups.length === 0 && viewer && (
          <div className="flex items-center gap-2 text-sm py-1" style={{ color: "var(--color-text-secondary)" }}>
            <span>No stories yet. Be the first to share!</span>
          </div>
        )}
      </div>

      {viewingGroup !== null && (
        <StoryViewer
          groups={allGroups}
          initialGroupIndex={viewingGroup}
          onClose={() => setViewingGroup(null)}
        />
      )}

      <CreateStorySheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
