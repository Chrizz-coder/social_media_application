"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, alt, size = 40, className }: AvatarProps) {
  const initials = alt
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-semibold overflow-hidden select-none",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes={`${size}px`}
        />
      ) : (
        initials
      )}
    </div>
  );
}
