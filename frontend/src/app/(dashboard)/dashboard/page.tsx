'use client';

import React, { useEffect, useState } from 'react';
import { OrdersService } from '@/services/orders.service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ShoppingBag, CreditCard, Clock, Store, Plus, Search, Bell, AlertCircle, MoreHorizontal } from 'lucide-react';
import { subDays, format } from 'date-fns';
import { Input } from '@/components/ui/Input';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { AgencySelector } from '@/components/ui/agency-selector';

export default function DashboardPage() {
    const [dateRange, setDateRange] = useState({
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd')
    });
    const [rangeLabel, setRangeLabel] = useState('Today');

    const [stats, setStats] = useState({
        ordersToday: 0,
        revenueToday: 0,
        pendingOrders: 0
    });
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [agencies, setAgencies] = useState<any[]>([]); // Mocked or fetched
    const [loading, setLoading] = useState(true);
    const [selectedAgency, setSelectedAgency] = useState<string>('all');

    // Mock Chart Data
    const chartData = [
        { name: 'Paris 08', revenue: 4500 },
        { name: 'Lyon Sud', revenue: 3200 },
        { name: 'Bordeaux', revenue: 2800 },
        { name: 'Marseille', revenue: 2100 },
        { name: 'Nantes', revenue: 1900 },
        { name: 'Lille', revenue: 1500 },
    ];

    const handleDateChange = (range: DateRange | undefined) => {
        if (range?.from) {
            setDateRange({
                startDate: format(range.from, 'yyyy-MM-dd'),
                endDate: range.to ? format(range.to, 'yyyy-MM-dd') : format(range.from, 'yyyy-MM-dd')
            });
        }
    };

    const handleAgencyChange = (value: string) => {
        console.log('Agency selected:', value);
        setSelectedAgency(value);
        // In a real app, you would fetch dashboard data for this specific agency
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                const [statsData, ordersData] = await Promise.all([
                    OrdersService.getDashboardStats(dateRange.startDate, dateRange.endDate, timezone),
                    OrdersService.findAll(1, 5, 'all')
                ]);
                setStats(statsData);
                setRecentOrders(Array.isArray(ordersData) ? ordersData : ordersData.data || []);

                // MOCK Agencies if service not ready
                setAgencies([
                    { id: 1, name: 'CleanTrack Paris 08', activeOrders: 42, capacity: 65, staff: '4/6', status: 'OPERATIONNEL' },
                    { id: 2, name: 'CleanTrack Bordeaux', activeOrders: 89, capacity: 92, staff: '8/8', status: 'SURCHARGÉ' },
                    { id: 3, name: 'CleanTrack Lyon Sud', activeOrders: 21, capacity: 32, staff: '2/4', status: 'OPERATIONNEL' },
                ]);

            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [dateRange]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Aperçu du Réseau</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Bienvenue, voici les performances de vos agences aujourd'hui.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="secondary" size="icon" className="rounded-full shadow-sm">
                        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </Button>
                    <Button icon={<Plus className="h-4 w-4" />}>
                        Nouvelle Commande
                    </Button>
                </div>
            </div>

            {/* Filters Bar - Mocked Visual */}
            <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-100 dark:border-gray-800 shadow-sm">
                <DatePickerWithRange
                    date={{
                        from: new Date(dateRange.startDate),
                        to: new Date(dateRange.endDate)
                    }}
                    setDate={handleDateChange}
                />
                <AgencySelector
                    defaultValue={selectedAgency}
                    onSelect={handleAgencyChange}
                />
                <div className="flex-1 relative min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher une transaction..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-md text-sm border-0 focus:ring-2 focus:ring-primary/20 dark:text-white"
                    />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Chiffre d'Affaires", value: formatCurrency(stats.revenueToday), sub: "+12% vs mois dernier", icon: CreditCard, color: "text-green-600", trend: "up" },
                    { label: "Dépenses", value: "€12,450", sub: "+5% vs mois dernier", icon: ShoppingBag, color: "text-gray-600", trend: "down" }, // Mocked
                    { label: "Marge Nette", value: "€32,830", sub: "+15% vs mois dernier", icon: Store, color: "text-blue-600", trend: "up" }, // Mocked
                    { label: "Nouvelles Commandes", value: stats.ordersToday, sub: "+8% vs hier", icon: ShoppingBag, color: "text-gray-600", trend: "up" },
                ].map((kpi, idx) => (
                    <Card key={idx} padding="lg" className="flex flex-col justify-between border-0 shadow-sm hover:shadow-md transition-shadow dark:bg-gray-900 dark:border dark:border-gray-800">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{kpi.label}</p>
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{kpi.value}</h3>
                            </div>
                            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full">
                                <kpi.icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                            </div>
                        </div>
                        <div className={`mt-4 text-xs font-semibold ${kpi.trend === 'up' ? 'text-green-600' : 'text-gray-500'}`}>
                            {kpi.sub}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <Card className="lg:col-span-2 border-0 shadow-sm dark:bg-gray-900 dark:border dark:border-gray-800">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Comparatif CA par Agence</h3>
                        <Button variant="secondary" size="sm" className="text-primary border-0 bg-transparent hover:bg-transparent p-0">Détails complets ›</Button>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} barSize={40}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} dy={10} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#1A5AD7' : '#E5E7EB'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Occupancy Side Widget */}
                <Card className="border-0 shadow-sm dark:bg-gray-900 dark:border dark:border-gray-800">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Taux d'Occupation</h3>
                    <div className="space-y-6">
                        {[
                            { label: "Étagères Zone A (Lavage)", val: 85, color: "bg-primary" },
                            { label: "Étagères Zone B (Séchage)", val: 42, color: "bg-primary" },
                            { label: "Casiers de retrait", val: 92, color: "bg-accent" },
                        ].map((item, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                                    <span className="text-gray-500">{item.val}%</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.val}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-semibold text-red-800 dark:text-red-300 uppercase tracking-wide">Alertes Opérationnelles</p>
                            <p className="text-sm text-red-600 dark:text-red-400 mt-1">Capacité de retrait quasi-saturée à Bordeaux (92%).</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Operational Summary Table */}
            <Card className="border-0 shadow-sm overflow-hidden dark:bg-gray-900 dark:border dark:border-gray-800" padding="none">
                <div className="p-6 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Résumé Opérationnel des Agences</h3>
                    <Button variant="secondary" size="sm" className="text-gray-600 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700">Exporter rapport</Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Nom de l'Agence</th>
                                <th className="px-6 py-4">Commandes Actives</th>
                                <th className="px-6 py-4">Occupation Rayon</th>
                                <th className="px-6 py-4">Livreurs Dispo</th>
                                <th className="px-6 py-4">Statut</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {agencies.map((agency) => (
                                <tr key={agency.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                                                <Store className="h-4 w-4" />
                                            </div>
                                            <span className="font-semibold text-gray-900 dark:text-white">{agency.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">
                                        {agency.activeOrders}
                                    </td>
                                    <td className="px-6 py-4 w-48">
                                        <div className="flex items-center gap-3">
                                            <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${agency.capacity > 90 ? 'bg-orange-500' : 'bg-primary'}`}
                                                    style={{ width: `${agency.capacity}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-gray-500">{agency.capacity}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                        {agency.staff}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${agency.status === 'SURCHARGÉ'
                                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                            }`}>
                                            {agency.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                            <MoreHorizontal className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
