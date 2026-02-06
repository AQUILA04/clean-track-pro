'use client';

import React, { useEffect, useState, use } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AgencyHeader } from '@/components/agencies/AgencyHeader';
import { AgencyStatsRow } from '@/components/agencies/AgencyStatsRow';
import { AgencyInfoCard } from '@/components/agencies/AgencyInfoCard';
import { TeamListCard } from '@/components/agencies/TeamListCard';
import { PerformanceChartCard } from '@/components/agencies/PerformanceChartCard';
import { AgencyFormModal } from '@/components/agencies/AddAgencyModal'; // Renamed export, same file
import { SiteService, Site } from '@/services/site.service';
import { UserService, User } from '@/services/user.service';
import { OrdersService } from '@/services/orders.service';

export default function AgencyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [site, setSite] = useState<Site | null>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // 1. Fetch Site Details
                // If this fails, it might throw, catching to show error or notFound
                const siteData = await SiteService.getById(id);
                setSite(siteData);

                // 2. Fetch Users for this Site
                const siteUsersData = await UserService.getUsers(id);
                const siteUsers = siteUsersData.map(u => ({
                    id: u.id,
                    name: u.username || u.email,
                    role: (u.attributes?.role?.[0] || 'User_Site') as any, // Simple casting for display
                    initials: (u.username || u.email).substring(0, 2).toUpperCase()
                }));
                setUsers(siteUsers);

                // 3. Fetch Dashboard Stats for this Site
                // timezone, startDate, endDate are optional, defaulting to backend defaults (UTC, today)
                // We might want to add a date picker later, but for now default is fine or we can match the one on the main dashboard if improved
                const dashboardStats = await OrdersService.getDashboardStats(undefined, undefined, undefined, id);
                setStats(dashboardStats);

            } catch (err) {
                console.error('Failed to fetch agency details:', err);
                setError('Failed to load agency details.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Chargement des détails de l'agence...</div>;
    }

    if (error || !site) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500 mb-4">{error || 'Agence introuvable'}</p>
                <Link href="/agencies" className="text-blue-600 hover:underline">Retour à la liste</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 pb-8">
            <div className="mb-6">
                <Link
                    href="/agencies"
                    className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={16} className="mr-2" />
                    Retour à la liste
                </Link>
            </div>

            <AgencyHeader
                name={site.name}
                city={site.city || ''}
                postalCode={site.postal_code || ''}
                status={site.status}
                onEdit={() => setIsEditModalOpen(true)}
            />

            <AgencyStatsRow
                revenue={stats?.revenueToday || 0}
                revenueTrend={0}
                activeOrders={stats?.ordersToday || 0}
                occupancyRate={0}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    <AgencyInfoCard
                        address={site.location || ''}
                        city={site.city || ''}
                        postalCode={site.postal_code || ''}
                        phone={site.phone || ''}
                        email={site.email || ''}
                    />

                    <PerformanceChartCard />
                </div>

                {/* Right Column (1/3 width) */}
                <div className="lg:col-span-1">
                    <TeamListCard members={users} />
                </div>
            </div>

            {/* Edit Modal */}
            <AgencyFormModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={() => {
                    // Refresh data
                    setIsEditModalOpen(false);
                    // Re-fetch site details
                    SiteService.getById(site.id).then(setSite);
                }}
                initialData={site}
            />
        </div>
    );
}
