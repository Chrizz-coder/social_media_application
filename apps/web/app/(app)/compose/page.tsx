"use client";

import { ComposeForm } from "@/components/post/ComposeForm";
import { useSession } from "next-auth/react";
import { Avatar } from "@/components/common/Avatar";

export default function ComposePage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md px-4 py-3">
        <h1 className="text-lg font-bold">New Post</h1>
      </header>

      <div className="p-4">
        <div className="flex gap-3">
          <Avatar src={user?.image} alt={user?.name ?? "You"} size={44} />
          <div className="flex-1">
            <ComposeForm autoFocus />
          </div>
        </div>
      </div>
    </div>
  );
}
