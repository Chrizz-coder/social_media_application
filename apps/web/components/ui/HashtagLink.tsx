"use client";

import Link from "next/link";

interface HashtagLinkProps {
  tag: string; // without the # symbol
  className?: string;
}

export function HashtagLink({ tag, className = "" }: HashtagLinkProps) {
  return (
    <Link
      href={`/hashtag/${encodeURIComponent(tag.toLowerCase())}`}
      className={`font-semibold hover:underline ${className}`}
      style={{ color: "var(--color-interactive)" }}
    >
      #{tag}
    </Link>
  );
}

/**
 * Parses a string and replaces #hashtags with <HashtagLink> components.
 * Usage: <ParsedContent text={post.content} />
 */
export function ParsedContent({ text, className = "" }: { text: string; className?: string }) {
  const parts = text.split(/(#\w+)/g);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (/^#\w+$/.test(part)) {
          return <HashtagLink key={i} tag={part.slice(1)} />;
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
