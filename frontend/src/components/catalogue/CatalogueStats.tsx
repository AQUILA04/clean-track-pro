import React from 'react';
import { Shirt, Shapes, Zap } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, colorClass }) => (
    <div className="bg-card rounded-xl p-6 border border-border shadow-sm flex items-center space-x-4">
        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${colorClass}`}>
            {icon}
        </div>
        <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
            <div className="text-2xl font-bold text-foreground">{value}</div>
        </div>
    </div>
);

interface CatalogueStatsProps {
    stats: {
        totalArticles: number;
        categories: number;
        activeServices: number;
    }
}

export const CatalogueStats: React.FC<CatalogueStatsProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <StatCard
                label="Total Articles"
                value={stats.totalArticles}
                icon={<Shirt className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
                colorClass="bg-blue-500/10"
            />
            <StatCard
                label="Catégories"
                value={stats.categories}
                icon={<Shapes className="h-6 w-6 text-green-600 dark:text-green-400" />}
                colorClass="bg-green-500/10"
            />
            <StatCard
                label="Services Actifs"
                value={stats.activeServices}
                icon={<Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />}
                colorClass="bg-purple-500/10"
            />
        </div>
    );
};
