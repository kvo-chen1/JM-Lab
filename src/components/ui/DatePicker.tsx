import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  date?: Date
  onSelect?: (date: Date) => void
  placeholder?: string
  className?: string
}

export function DatePicker({ date, onSelect, placeholder = "选择日期", className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  // 简化的日历实现
  const generateDays = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: (number | null)[] = []
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const days = generateDays()
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"]

  const handleSelect = (day: number) => {
    const today = new Date()
    const selected = new Date(today.getFullYear(), today.getMonth(), day)
    onSelect?.(selected)
    setOpen(false)
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          !date && "text-muted-foreground"
        )}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          <span>{date ? formatDate(date) : placeholder}</span>
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 rounded-md border bg-popover p-3 text-popover-foreground shadow-md">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long" })}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {weekDays.map((day) => (
                <div key={day} className="text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => (
                <button
                  key={index}
                  type="button"
                  disabled={day === null}
                  onClick={() => day && handleSelect(day)}
                  className={cn(
                    "h-8 w-8 rounded-md text-sm",
                    day === null && "invisible",
                    day !== null && "hover:bg-accent hover:text-accent-foreground",
                    date && day === date.getDate() && "bg-primary text-primary-foreground"
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
