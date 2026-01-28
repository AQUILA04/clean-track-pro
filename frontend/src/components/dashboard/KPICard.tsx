import React from 'react';

interface KPICardProps {
    label: string;
    value: string | number;
    subValue?: string;
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
}

export const KPICard: React.FC<KPICardProps> = ({ label, value, subValue, icon }) => {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
            <div>
                <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{label}</h3>
                <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
                {subValue && <p className="mt-1 text-sm text-gray-500">{subValue}</p>}
            </div>
            {icon && <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                {icon}
            </div>}
        </div>
    );
};
