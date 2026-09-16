import { cn } from "./cn";
import { Wallet } from "lucide-react";

interface AddressInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  isError?: boolean;
  errorText?: string;
  className?: string;
}

export function AddressInput({
  label,
  value,
  onChange,
  onBlur,
  placeholder = "0x... / 接收地址",
  isError = false,
  errorText,
  className,
}: AddressInputProps) {
  const inputBaseClass =
    "w-full h-[50px] bg-[#FAFBFD] dark:bg-[#1A1E26] rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center px-3.5 transition-all duration-200 focus-within:border-[#0066FF] focus-within:ring-2 focus-within:ring-[#0066FF]/15 group gap-2.5";

  return (
    <div className={cn("w-full flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
          {label}
        </span>
      </div>
      <div
        className={cn(
          inputBaseClass,
          isError
            ? "border-red-500/80 focus-within:border-red-500 focus-within:ring-red-500/20"
            : ""
        )}
      >
        <div className="w-7 h-7 flex-shrink-0 bg-[#EEF4FF] dark:bg-[#0066FF]/20 text-[#0066FF] rounded-xl flex items-center justify-center transition-transform group-focus-within:scale-105">
          <Wallet className="w-3.5 h-3.5" />
        </div>
        <input
          className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white text-sm font-mono placeholder:text-gray-400 p-0 focus:ring-0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>
      {isError && errorText && (
        <p className="text-xs text-red-500 font-medium px-1">
          {errorText}
        </p>
      )}
    </div>
  );
}

