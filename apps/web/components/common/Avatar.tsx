"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { StoryRing } from "@/components/ui/StoryRing";

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
  hasStory?: boolean;
  hasUnviewed?: boolean;
}

export function Avatar({ src, alt, size = 40, className, hasStory = false, hasUnviewed = false }: AvatarProps) {
  const initials = alt
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatarEl = (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full overflow-hidden select-none",
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        fontWeight: 600,
        background: "linear-gradient(45deg, #833AB4, #E1306C)",
        color: "#fff",
        flexShrink: 0,
      }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover rounded-full"
          sizes={`${size}px`}
        />
      ) : (
        initials
      )}
    </div>
  );

  if (!hasStory) return avatarEl;

  const storySize = size <= 40 ? "sm" : size <= 56 ? "md" : "lg";

  return (
    <StoryRing hasStory={hasStory} hasUnviewed={hasUnviewed} size={storySize}>
      {avatarEl}
    </StoryRing>
  );
}
