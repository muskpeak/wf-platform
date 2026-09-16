"use client";

import { useState } from "react";
import { cn } from "./cn";

export function TokenImg({
  src,
  className,
}: {
  src?: string | null;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  if (!src) {
    return (
      <div className={cn("shrink-0 rounded-full bg-muted", className)} />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      onLoad={() => setLoaded(true)}
      className={cn(
        "shrink-0 object-contain transition-opacity duration-300",
        loaded ? "opacity-100" : "opacity-0",
        className
      )}
    />
  );
}
