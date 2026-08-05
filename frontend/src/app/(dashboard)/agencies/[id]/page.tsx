'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AgencyHeader } from '@/components/agencies/AgencyHeader';
import { AgencyStatsRow } from '@/components/agencies/AgencyStatsRow';
import { AgencyInfoCard } from '@/components/agencies/AgencyInfoCard';
import { TeamListCard } from '@/components/agencies/TeamListCard';
import { PerformanceChartCard } from '@/components/agencies/PerformanceChartCard';
import { AgencyFormModal } from '@/components/agencies/AddAgencyModal';
import { AgencyLocalitiesCard } from '@/components/agencies/AgencyLocalitiesCard';
import { SiteService, Site } from '@/services/site.service';
import { UserService } from '@/services/user.service';
import { OrdersService } from '@/services/orders.service';
import { PageLoader } from '@/components/ui/loading';
import { StorageService, StorageSlotStatus } from '@/services/storage.service';

interface TeamMember {
    id: string;
    name: string;
    role: string;
    initials: string;
}

interface AgencyStats {
    revenue: number;
    revenueTrend: number;
    activeOrders: number;
    occupancyRate: number;
}

function computeRevenueTrend(weekly: Array<{ revenue: number }>): number {
    if (!weekly || weekly.length < 2) return 0;
    const today = weekly[weekly.length - 1]?.revenue ?? 0;
    const yesterday = weekly[weekly.length - 2]?.revenue ?? 0;
    if (yesterday === 0) return today > 0 ? 100 : 0;
    return Math.round(((today - yesterday) / yesterday) * 100);
}

function resolveUserName(u: {
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
}): string {
    const full = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
    return full || u.username || u.email || 'Utilisateur';
}

function resolveInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase() || '?';
}

export default function AgencyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [site, setSite] = useState<Site | null>(null);
    const [users, setUsers] = useState<TeamMember[]>([]);
    const [stats, setStats] = useState<AgencyStats>({
        revenue: 0,
        revenueTrend: 0,
        activeOrders: 0,
        occupancyRate: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const refreshSite = async () => {
        const siteData = await SiteService.getById(id);
        setSite(siteData);
        return siteData;
    };

    const loadSecondaryData = async (siteId: string) => {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const [usersResult, dashboardResult, weeklyResult, slotsResult] = await Promise.allSettled([
            UserService.getUsers({ siteId }),
            OrdersService.getDashboardStats(undefined, undefined, timezone, siteId),
            OrdersService.getWeeklyStats(siteId),
            StorageService.getAll(siteId),
        ]);

        if (usersResult.status === 'fulfilled') {
            setUsers(
                usersResult.value.map((u) => {
                    const name = resolveUserName(u);
                    return {
                        id: u.id,
                        name,
                        role: u.role || u.attributes?.role?.[0] || 'User_Site',
                        initials: resolveInitials(name),
                    };
                }),
            );
        } else {
            console.warn('Failed to fetch agency team members:', usersResult.reason);
            setUsers([]);
        }

        const dashboard =
            dashboardResult.status === 'fulfilled' ? dashboardResult.value : null;
        const weekly =
            weeklyResult.status === 'fulfilled' && Array.isArray(weeklyResult.value)
                ? weeklyResult.value
                : [];
        const slots =
            slotsResult.status === 'fulfilled' && Array.isArray(slotsResult.value)
                ? slotsResult.value
                : [];

        if (dashboardResult.status === 'rejected') {
            console.warn('Failed to fetch agency stats:', dashboardResult.reason);
        }
        if (weeklyResult.status === 'rejected') {
            console.warn('Failed to fetch weekly stats:', weeklyResult.reason);
        }
        if (slotsResult.status === 'rejected') {
            console.warn('Failed to fetch storage slots:', slotsResult.reason);
        }

        const occupied = slots.filter((s) => s.status === StorageSlotStatus.OCCUPIED).length;
        const occupancyRate =
            slots.length > 0 ? Math.round((occupied / slots.length) * 100) : 0;

        setStats({
            revenue: dashboard?.revenueToday ?? 0,
            revenueTrend: computeRevenueTrend(weekly),
            activeOrders: dashboard?.pendingOrders ?? 0,
            occupancyRate,
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;

            setLoading(true);
            setError(null);

            try {
                await refreshSite();
            } catch (err) {
                console.error('Failed to fetch agency details:', err);
                setError("Impossible de charger les détails de l'agence.");
                setSite(null);
                setLoading(false);
                return;
            }

            setLoading(false);
            await loadSecondaryData(id);
        };

        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when route id changes
    }, [id]);

    if (loading) {
        return <PageLoader label="Chargement des détails de l'agence…" />;
    }

    if (error || !site) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-400 mb-4">{error || 'Agence introuvable'}</p>
                <Link href="/agencies" className="text-primary hover:underline">
                    Retour à la liste
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-8">
            <div className="mb-6">
                <Link
                    href="/agencies"
                    className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150"
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
                revenue={stats.revenue}
                revenueTrend={stats.revenueTrend}
                activeOrders={stats.activeOrders}
                occupancyRate={stats.occupancyRate}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <AgencyInfoCard
                        address={site.location || ''}
                        city={site.city || ''}
                        postalCode={site.postal_code || ''}
                        phone={site.phone || ''}
                        email={site.email || ''}
                        image={site.logoUrl}
                    />

                    <PerformanceChartCard siteId={site.id} />
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <TeamListCard members={users} siteId={site.id} />
                    <AgencyLocalitiesCard siteId={site.id} />
                </div>
            </div>

            <AgencyFormModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={async () => {
                    setIsEditModalOpen(false);
                    try {
                        await refreshSite();
                        await loadSecondaryData(id);
                    } catch (err) {
                        console.error('Failed to refresh agency after edit:', err);
                    }
                }}
                initialData={site}
            />
        </div>
    );
}
