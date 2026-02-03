import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
    children,
    padding = 'md',
    className = '',
    ...props
}) => {
    const paddings = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
    };

    return (
        <div
            className={`bg-white border border-gray-200 rounded-sm shadow-sm ${paddings[padding]} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

interface KPICardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: {
        value: number; // percentage
        direction: 'up' | 'down';
        label: string; // e.g. "vs last week"
    };
    className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    icon: Icon,
    trend,
    className = ''
}) => {
    return (
        <Card className={`flex flex-col justify-between ${className}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-700">{title}</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
                </div>
                <div className="p-3 bg-secondary rounded-full">
                    <Icon className="h-6 w-6 text-primary" />
                </div>
            </div>

            {trend && (
                <div className="mt-4 flex items-center text-sm">
                    <span
                        className={`flex items-center font-semibold ${trend.direction === 'up' ? 'text-success' : 'text-error'
                            }`}
                    >
                        {trend.direction === 'up' ? (
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                        ) : (
                            <ArrowDownRight className="h-4 w-4 mr-1" />
                        )}
                        {Math.abs(trend.value)}%
                    </span>
                    <span className="text-gray-500 ml-2">{trend.label}</span>
                </div>
            )}
        </Card>
    );
};
