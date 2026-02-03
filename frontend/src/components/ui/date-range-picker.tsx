"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerWithRangeProps {
    className?: string
    date?: DateRange
    setDate?: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({
    className,
    date,
    setDate,
}: DatePickerWithRangeProps) {
    // Default Internal State if not controlled
    const [internalDate, setInternalDate] = React.useState<DateRange | undefined>(
        date || {
            from: new Date(2023, 0, 20),
            to: addDays(new Date(2023, 0, 20), 20),
        }
    )

    const effectiveDate = date || internalDate
    const effectiveSetDate = setDate || setInternalDate

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"secondary"}
                        className={cn(
                            "w-[260px] justify-start text-left font-normal bg-white dark:bg-gray-800 border-0 shadow-sm",
                            !effectiveDate && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                        {effectiveDate?.from ? (
                            effectiveDate.to ? (
                                <>
                                    {format(effectiveDate.from, "LLL dd, y", { locale: fr })} -{" "}
                                    {format(effectiveDate.to, "LLL dd, y", { locale: fr })}
                                </>
                            ) : (
                                format(effectiveDate.from, "LLL dd, y", { locale: fr })
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={effectiveDate?.from}
                        selected={effectiveDate}
                        onSelect={effectiveSetDate}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
