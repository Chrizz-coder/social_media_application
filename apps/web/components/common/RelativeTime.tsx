"use client";

import { useEffect, useState, useMemo } from "react";

interface RelativeTimeProps {
  date: string | Date;
  className?: string;
}

function formatRelative(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.floor(diff / 86_400_000);
  if (days < 30) return rtf.format(-days, "day");
  const months = Math.floor(diff / 2_592_000_000);
  if (months < 12) return rtf.format(-months, "month");
  return rtf.format(-Math.floor(diff / 31_536_000_000), "year");
}

export function RelativeTime({ date, className }: RelativeTimeProps) {
  const d = useMemo(() => typeof date === "string" ? new Date(date) : date, [date]);
  const [text, setText] = useState(() => formatRelative(d));

  useEffect(() => {
    setText(formatRelative(d));
    const timer = setInterval(() => setText(formatRelative(d)), 30_000);
    return () => clearInterval(timer);
  }, [d]);

  return (
    <time
      dateTime={d.toISOString()}
      title={d.toLocaleString()}
      className={className}
    >
      {text}
    </time>
  );
}
