import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, label, ...props }, ref) => {
    return (
      <div className="relative">
        {label && (
          <label className="block text-sm font-medium mb-1.5">{label}</label>
        )}
        <div className="relative">
          <select
            className={cn(
              "flex h-9 w-full appearance-none rounded-md border border-input bg-transparent px-3 py-1 pr-8 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
