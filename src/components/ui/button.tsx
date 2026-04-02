import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-brand-orange text-white hover:bg-orange-600 active:bg-orange-700":
              variant === "primary",
            "bg-card text-white hover:bg-zinc-600 active:bg-zinc-700":
              variant === "secondary",
            "border border-zinc-600 text-white hover:bg-card active:bg-zinc-700":
              variant === "outline",
            "text-zinc-400 hover:text-white hover:bg-card":
              variant === "ghost",
            "bg-brand-red text-white hover:bg-red-600":
              variant === "danger",
          },
          {
            "px-3 py-1.5 text-sm": size === "sm",
            "px-4 py-2 text-sm": size === "md",
            "px-6 py-3 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export { Button };
