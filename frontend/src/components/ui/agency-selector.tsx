"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Store } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

const agencies = [
    {
        value: "all",
        label: "Toutes les agences",
    },
    {
        value: "paris-08",
        label: "CleanTrack Paris 08",
    },
    {
        value: "bordeaux",
        label: "CleanTrack Bordeaux",
    },
    {
        value: "lyon-sud",
        label: "CleanTrack Lyon Sud",
    },
    {
        value: "marseille",
        label: "CleanTrack Marseille",
    },
    {
        value: "nantes",
        label: "CleanTrack Nantes",
    },
    {
        value: "lille",
        label: "CleanTrack Lille",
    }
]

interface AgencySelectorProps {
    onSelect?: (value: string) => void
    defaultValue?: string
}

export function AgencySelector({ onSelect, defaultValue = "all" }: AgencySelectorProps) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState(defaultValue)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="secondary"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[240px] justify-between bg-white dark:bg-gray-800 border-0 shadow-sm text-gray-700 dark:text-gray-200"
                >
                    <div className="flex items-center gap-2 truncate">
                        <Store className="h-4 w-4 text-primary shrink-0" />
                        {value
                            ? agencies.find((agency) => agency.value === value)?.label
                            : "Sélectionner une agence..."}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-0">
                <Command>
                    <CommandInput placeholder="Rechercher une agence..." />
                    <CommandEmpty>Aucune agence trouvée.</CommandEmpty>
                    <CommandList>
                        <CommandGroup>
                            {agencies.map((agency) => (
                                <CommandItem
                                    key={agency.value}
                                    value={agency.value}
                                    onSelect={(currentValue) => {
                                        setValue(currentValue === value ? "" : currentValue)
                                        setOpen(false)
                                        if (onSelect) onSelect(currentValue)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === agency.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {agency.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
