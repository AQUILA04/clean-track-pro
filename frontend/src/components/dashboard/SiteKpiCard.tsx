import React from 'react';
import { Card } from '@/components/ui/Card';

interface SiteKpiCardProps {
    label: string;
    value: string | number;
    icon?: React.ElementType;
    subValue?: string;
    trend?: 'up' | 'down' | 'neutral' | 'alert';
    /** Amber border for action-required KPIs (e.g. delayed orders). */
    alert?: boolean;
    progress?: number;
}

export function SiteKpiCard({
    label,
    value,
    icon: Icon,
    subValue,
    trend = 'neutral',
    alert = false,
    progress,
}: SiteKpiCardProps) {
    const trendClass =
        trend === 'up'
            ? 'bg-emerald-500/10 text-emerald-400'
            : trend === 'alert'
              ? 'bg-amber-500/10 text-amber-400'
              : trend === 'down'
                ? 'bg-muted text-muted-foreground'
                : 'bg-muted/50 text-muted-foreground';

    return (
        <Card
            padding="lg"
            className={`flex flex-col justify-between border-border hover:border-primary/30 transition-all duration-150 ${
                alert ? 'border-amber-500/50' : ''
            }`}
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <h3 className="text-3xl font-bold text-foreground mt-1">{value}</h3>
                </div>
                {Icon && (
                    <div className="p-2 bg-muted rounded-full">
                        <Icon className="h-5 w-5 text-primary" />
                    </div>
                )}
            </div>

            {typeof progress === 'number' && (
                <div className="mt-4 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full ${
                            progress >= 90 ? 'bg-amber-500' : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                </div>
            )}

            {subValue && (
                <span
                    className={`inline-flex self-start mt-4 px-2 py-0.5 rounded-full text-xs font-semibold ${trendClass}`}
                >
                    {subValue}
                </span>
            )}
        </Card>
    );
}
