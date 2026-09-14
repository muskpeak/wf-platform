import React from "react";
import { cn } from "@wf-platform/utils";

export interface EmptyProps {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function Empty({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      {icon && <div className="text-[#a1a1aa] mb-4">{icon}</div>}
      
      {title && (
        <h3 className="text-[14px] font-medium text-[#18181b] dark:text-zinc-100">
          {title}
        </h3>
      )}
      
      {description && (
        <p className="text-[13px] text-[#71717a] mt-1 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
