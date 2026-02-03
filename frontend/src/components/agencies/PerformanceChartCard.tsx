'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChevronDown } from 'lucide-react';

const data = [
    { name: 'LUN', value: 400 },
    { name: 'MAR', value: 650 },
    { name: 'MER', value: 300 },
    { name: 'JEU', value: 900 },
    { name: 'VEN', value: 800 },
    { name: 'SAM', value: 500 },
    { name: 'DIM', value: 200 },
];

export const PerformanceChartCard = () => {
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm col-span-1 md:col-span-2">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-bold text-gray-900">Performance hebdomadaire</h3>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                    7 derniers jours
                    <ChevronDown size={14} />
                </button>
            </div>

            <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 600 }}
                            dy={10}
                        />
                        {/* Hidden YAxis for clean look or customize */}
                        <Tooltip
                            cursor={{ fill: '#F3F4F6' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        {/* Bars with rounded tops */}
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="#1A5AD7" />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-primary" />
                    <span className="text-sm text-gray-600 font-medium">Revenus (k€)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-100" />
                    <span className="text-sm text-gray-600 font-medium">Volume</span>
                </div>
            </div>
        </div>
    );
};
