"use client";

import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface AvatarProps {
  src?: string | null;
  firstName?: string;
  lastInitial?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-20 h-20 text-2xl",
};

const ICON_SIZES = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-10 h-10",
};

export function Avatar({
  src,
  firstName,
  lastInitial,
  size = "md",
  className,
}: AvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={firstName ? `${firstName} ${lastInitial ?? ""}.` : "Avatar"}
        className={cn(
          "rounded-full object-cover bg-zinc-700",
          SIZES[size],
          className
        )}
      />
    );
  }

  if (firstName) {
    return (
      <div
        className={cn(
          "rounded-full bg-zinc-700 flex items-center justify-center font-black text-zinc-400",
          SIZES[size],
          className
        )}
      >
        {firstName[0]}
        {lastInitial ?? ""}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-zinc-700 flex items-center justify-center",
        SIZES[size],
        className
      )}
    >
      <User className={cn("text-zinc-400", ICON_SIZES[size])} />
    </div>
  );
}
