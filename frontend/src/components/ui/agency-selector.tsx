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

export type AgencyOption = {
    value: string
    label: string
}

interface AgencySelectorProps {
    onSelect?: (value: string) => void
    defaultValue?: string
    value?: string
    agencies?: AgencyOption[]
}

const DEFAULT_AGENCIES: AgencyOption[] = [{ value: "all", label: "Toutes les agences" }]

export function AgencySelector({
    onSelect,
    defaultValue = "all",
    value: controlledValue,
    agencies = DEFAULT_AGENCIES,
}: AgencySelectorProps) {
    const [open, setOpen] = React.useState(false)
    const [internalValue, setInternalValue] = React.useState(defaultValue)
    const value = controlledValue ?? internalValue

    const selectedLabel =
        agencies.find((agency) => agency.value === value)?.label || "Sélectionner une agence..."

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
                        {selectedLabel}
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
                                    value={agency.label}
                                    onSelect={() => {
                                        setInternalValue(agency.value)
                                        setOpen(false)
                                        onSelect?.(agency.value)
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
