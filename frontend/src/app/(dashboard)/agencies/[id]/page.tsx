'use client';

// Note: Using 'use client' because we might interact or use hooks, 
// though the params are server-side. Next.js 15+ async params handling is key.

import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AgencyHeader } from '@/components/agencies/AgencyHeader';
import { AgencyStatsRow } from '@/components/agencies/AgencyStatsRow';
import { AgencyInfoCard } from '@/components/agencies/AgencyInfoCard';
import { TeamListCard } from '@/components/agencies/TeamListCard';
import { PerformanceChartCard } from '@/components/agencies/PerformanceChartCard';

// MOCK DATA FETCHING
const getAgencyData = (id: string) => {
    // Simulate finding the mock agency
    // In real app, this would be an API call
    return {
        id,
        name: 'Agence Paris Étoile',
        city: 'Paris',
        postalCode: '75008',
        status: 'ACTIVE' as const,
        revenue: 1240,
        revenueTrend: 12,
        orders: 42,
        occupancyRate: 84,
        address: '15 Avenue de la Grande Armée',
        phone: '+33 1 45 67 89 00',
        email: 'etoile@cleantrack.pro',
        managers: [
            { id: '1', name: 'Jean S.', role: 'Admin_Site' as const, initials: 'JS' },
            { id: '2', name: 'Marie L.', role: 'User_Site' as const, initials: 'ML' },
            { id: '3', name: 'Thomas B.', role: 'User_Site' as const, initials: 'TB' },
            { id: '4', name: 'Claire D.', role: 'User_Site' as const, initials: 'CD' },
        ]
    };
};

export default function AgencyDetailsPage({ params }: { params: { id: string } }) {
    // Directly access id since we are in a simple client component context where params is an object
    const { id } = params;

    const agency = getAgencyData(id);

    if (!agency) {
        notFound();
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
                name={agency.name}
                city={agency.city}
                postalCode={agency.postalCode}
                status={agency.status}
            />

            <AgencyStatsRow
                revenue={agency.revenue}
                revenueTrend={agency.revenueTrend}
                activeOrders={agency.orders}
                occupancyRate={agency.occupancyRate}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    <AgencyInfoCard
                        address={agency.address}
                        city={agency.city}
                        postalCode={agency.postalCode}
                        phone={agency.phone}
                        email={agency.email}
                    />

                    <PerformanceChartCard />
                </div>

                {/* Right Column (1/3 width) */}
                <div className="lg:col-span-1">
                    <TeamListCard members={agency.managers} />
                </div>
            </div>
        </div>
    );
}
