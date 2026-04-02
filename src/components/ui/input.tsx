import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-zinc-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-lg border bg-card px-4 py-2.5 text-white placeholder:text-zinc-500 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-orange/50",
            error ? "border-brand-red" : "border-zinc-700 focus:border-brand-orange",
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-brand-red">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
