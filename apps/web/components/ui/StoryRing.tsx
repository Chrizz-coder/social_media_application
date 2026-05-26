"use client";

interface StoryRingProps {
  children: React.ReactNode;
  hasStory?: boolean;
  hasUnviewed?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { outer: 56, inner: 48, padding: 2 },
  md: { outer: 64, inner: 56, padding: 3 },
  lg: { outer: 80, inner: 70, padding: 4 },
};

export function StoryRing({
  children,
  hasStory = false,
  hasUnviewed = false,
  size = "md",
  className = "",
}: StoryRingProps) {
  const { outer, inner, padding } = sizeMap[size];

  if (!hasStory) {
    return (
      <div
        className={className}
        style={{ width: outer, height: outer, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      >
        {children}
      </div>
    );
  }

  const gradientStyle = hasUnviewed
    ? {
        background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)",
        padding,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: outer,
        height: outer,
      }
    : {
        background: "#DBDBDB",
        padding,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: outer,
        height: outer,
      };

  return (
    <div className={`cursor-pointer transition-opacity hover:opacity-80 ${className}`} style={gradientStyle}>
      <div
        style={{
          width: inner,
          height: inner,
          borderRadius: "50%",
          background: "var(--background)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 2,
        }}
      >
        {children}
      </div>
    </div>
  );
}
