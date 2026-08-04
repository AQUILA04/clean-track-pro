'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Infinity, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import {
    OPERATION_REGISTRY,
    PERIOD_LABELS,
    parsePlanLimits,
    serializePlanLimits,
    type PlanLimits,
} from '@/lib/plan-limits';

interface PlanLimitsEditorProps {
    limits: Record<string, unknown>;
    disabled?: boolean;
    onSave: (limits: Record<string, unknown>) => Promise<void>;
}

export function PlanLimitsEditor({ limits, disabled, onSave }: PlanLimitsEditorProps) {
    const [expanded, setExpanded] = useState(false);
    const [draft, setDraft] = useState<PlanLimits>(() => parsePlanLimits(limits));
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    useEffect(() => {
        setDraft(parsePlanLimits(limits));
        setDirty(false);
    }, [limits]);

    const setWindowLimit = (operationKey: string, period: string, unlimited: boolean, value?: number) => {
        setDraft((prev) => {
            const next = { ...prev };
            const config = { ...next[operationKey] };
            config.windows = config.windows.map((window) => {
                if (window.period !== period) return window;
                return {
                    ...window,
                    limit: unlimited ? null : Math.max(0, value ?? 0),
                };
            });
            next[operationKey] = config;
            return next;
        });
        setDirty(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(serializePlanLimits(draft));
            setDirty(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mt-4 border-t border-border pt-4">
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="flex w-full items-center justify-between text-left"
            >
                <div>
                    <p className="text-sm font-semibold text-foreground">Quotas et limites</p>
                    <p className="text-xs text-muted-foreground">
                        Définissez les plafonds par opération. Laissez illimité pour ne pas bloquer.
                    </p>
                </div>
                {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {expanded && (
                <div className="mt-4 space-y-5">
                    {OPERATION_REGISTRY.map((operation) => {
                        const config = draft[operation.key];
                        if (!config) return null;

                        return (
                            <div key={operation.key} className="rounded-lg border border-border p-4">
                                <div className="mb-3">
                                    <p className="font-medium text-sm">{operation.label}</p>
                                    <p className="text-xs text-muted-foreground">{operation.description}</p>
                                </div>

                                <div className="space-y-3">
                                    {config.windows.map((window) => {
                                        const unlimited = window.limit === null;
                                        return (
                                            <div
                                                key={`${operation.key}-${window.period}`}
                                                className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-md bg-muted/30 p-3"
                                            >
                                                <span className="text-sm font-medium min-w-[120px]">
                                                    {PERIOD_LABELS[window.period]}
                                                </span>

                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={unlimited}
                                                        disabled={disabled || saving}
                                                        onCheckedChange={(checked) =>
                                                            setWindowLimit(operation.key, window.period, checked, 0)
                                                        }
                                                    />
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Infinity className="h-3.5 w-3.5" />
                                                        Illimité
                                                    </span>
                                                </div>

                                                {!unlimited && (
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={window.limit ?? 0}
                                                        disabled={disabled || saving}
                                                        onChange={(e) =>
                                                            setWindowLimit(
                                                                operation.key,
                                                                window.period,
                                                                false,
                                                                parseInt(e.target.value, 10) || 0,
                                                            )
                                                        }
                                                        className="max-w-[140px]"
                                                        label="Limite"
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    <Button
                        onClick={handleSave}
                        disabled={disabled || saving || !dirty}
                        isLoading={saving}
                        className="w-full sm:w-auto"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        Enregistrer les limites
                    </Button>
                </div>
            )}
        </div>
    );
}
