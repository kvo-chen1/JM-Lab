import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface CommandProps {
  children: React.ReactNode
  className?: string
}

export function Command({ children, className }: CommandProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
        className
      )}
    >
      {children}
    </div>
  )
}

interface CommandInputProps {
  placeholder?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
}

export function CommandInput({ placeholder, value, onValueChange, className }: CommandInputProps) {
  return (
    <div className="flex items-center border-b px-3">
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <input
        type="text"
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />
    </div>
  )
}

interface CommandListProps {
  children: React.ReactNode
  className?: string
}

export function CommandList({ children, className }: CommandListProps) {
  return (
    <div className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}>
      {children}
    </div>
  )
}

interface CommandEmptyProps {
  children: React.ReactNode
  className?: string
}

export function CommandEmpty({ children, className }: CommandEmptyProps) {
  return (
    <div className={cn("py-6 text-center text-sm", className)}>
      {children}
    </div>
  )
}

interface CommandGroupProps {
  children: React.ReactNode
  heading?: string
  className?: string
}

export function CommandGroup({ children, heading, className }: CommandGroupProps) {
  return (
    <div className={cn("overflow-hidden p-1 text-foreground", className)}>
      {heading && (
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          {heading}
        </div>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  )
}

interface CommandItemProps {
  children: React.ReactNode
  onSelect?: () => void
  className?: string
  disabled?: boolean
}

export function CommandItem({ children, onSelect, className, disabled }: CommandItemProps) {
  return (
    <div
      onClick={disabled ? undefined : onSelect}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground hover:bg-accent hover:text-accent-foreground",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      {children}
    </div>
  )
}
