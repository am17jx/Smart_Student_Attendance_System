import * as React from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onKeyDown, ...props }, ref) => {
    const { toast } = useToast();

    // Determine effective maxLength if not explicitly provided
    let effectiveMaxLength = props.maxLength;
    if (effectiveMaxLength === undefined) {
      if (type === "email") effectiveMaxLength = 100;
      else if (type === "password") effectiveMaxLength = 50;
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (effectiveMaxLength && e.currentTarget.value.length >= effectiveMaxLength) {
        // Allow if there is text selected (it will be overwritten)
        if (e.currentTarget.selectionStart !== e.currentTarget.selectionEnd) {
          if (onKeyDown) onKeyDown(e);
          return;
        }

        const allowedKeys = [
          "Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", 
          "Tab", "Enter", "Home", "End", "Escape"
        ];
        
        // Prevent typing if the key is a printable character
        if (!allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
          e.preventDefault();
          toast({
            title: "تم الوصول للحد الأقصى",
            description: `لقد وصلت للحد الأقصى المسموح به (${effectiveMaxLength} حرف)`,
            variant: "destructive",
          });
        }
      }
      if (onKeyDown) {
        onKeyDown(e);
      }
    };

    return (
      <input
        type={type}
        maxLength={effectiveMaxLength}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
