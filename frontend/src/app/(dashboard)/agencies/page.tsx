'use client';

import React, { useState } from 'react';
import { Bell, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AgencyCard, Agency } from '@/components/agencies/AgencyCard';
import { AddAgencyCard } from '@/components/agencies/AddAgencyCard';
import { AgencyFilters } from '@/components/agencies/AgencyFilters';
import { AddAgencyModal } from '@/components/agencies/AddAgencyModal';
import { SuccessModal } from '@/components/ui/SuccessModal';

// MOCK DATA
const MOCK_AGENCIES: Agency[] = [
    {
        id: '1',
        name: 'CleanTrack - Paris Centre',
        city: 'Paris',
        postalCode: '75001',
        status: 'ACTIVE',
        revenue: 1250,
        revenueTrend: 4,
        orders: 42,
        image: 'https://images.unsplash.com/photo-1545173168-9f1947eebb8f?q=80&w=2071&auto=format&fit=crop', // Laundry shop interior
        managers: [
            { name: 'Jean Dupont', initials: 'JD' },
            { name: 'Alice Martin', initials: 'AM' }
        ]
    },
    {
        id: '2',
        name: 'CleanTrack - Lyon Est',
        city: 'Lyon',
        postalCode: '69003',
        status: 'ACTIVE',
        revenue: 890,
        revenueTrend: -2,
        orders: 28,
        image: 'https://images.unsplash.com/photo-1517677208171-0bc67995f396?q=80&w=2070&auto=format&fit=crop', // Modern laundry
        managers: [
            { name: 'Thomas Leroy', initials: 'TL' }
        ]
    },
    {
        id: '3',
        name: 'CleanTrack - Marseille Sud',
        city: 'Marseille',
        postalCode: '13008',
        status: 'MAINTENANCE',
        revenue: 1100,
        revenueTrend: 8,
        orders: 35,
        image: 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?q=80&w=2070&auto=format&fit=crop',
        managers: [
            { name: 'Sophie Moreau', initials: 'SM' }
        ]
    },
    {
        id: '4',
        name: 'CleanTrack - Bordeaux Nord',
        city: 'Bordeaux',
        postalCode: '33000',
        status: 'ACTIVE',
        revenue: 750,
        revenueTrend: 1,
        orders: 22,
        image: 'https://images.unsplash.com/photo-1521656693074-0ef32e80a5d5?q=80&w=2070&auto=format&fit=crop',
        managers: [
            { name: 'Paul Richard', initials: 'PR' }
        ]
    }
];

export default function AgenciesPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

    const handleAgencyAdded = () => {
        setIsSuccessModalOpen(true);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Agencies Management</h1>

                {/* Search & Actions */}
                <div className="flex items-center gap-4 flex-1 justify-end">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Rechercher une agence ou une ville..."
                            className="pl-10 bg-gray-100 border-none rounded-full h-10 w-full focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-white transition-colors"
                        />
                    </div>

                    <button className="text-gray-500 hover:text-gray-700 relative p-2">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
                    </button>

                    <Button
                        className="rounded-full px-6 bg-primary hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30"
                        onClick={() => setIsAddModalOpen(true)}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter une agence
                    </Button>
                </div>
            </div>

            {/* Page Content */}
            <div>
                <div className="mb-2">
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Agencies Network Overview</h2>
                    <div className="flex items-center justify-between">
                        <p className="text-gray-500 max-w-2xl">
                            Manage and monitor performance metrics across all active laundry locations in your network.
                        </p>
                        <p className="text-sm text-gray-400 flex items-center gap-1">
                            <span className="inline-block w-4 h-4 rounded-full border-2 border-gray-300 border-t-gray-500 animate-spin mr-1 opacity-0" /> {/* Placeholder for sync icon */}
                            Mis à jour il y a 5 min
                        </p>
                    </div>

                </div>

                <div className="h-8" /> {/* Spacer */}

                {/* Filters */}
                <AgencyFilters />

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {MOCK_AGENCIES.map((agency) => (
                        <AgencyCard key={agency.id} agency={agency as Agency} />
                    ))}
                    <AddAgencyCard onClick={() => setIsAddModalOpen(true)} />
                </div>
            </div>

            {/* Modals */}
            <AddAgencyModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={handleAgencyAdded}
            />

            <SuccessModal
                isOpen={isSuccessModalOpen}
                onClose={() => setIsSuccessModalOpen(false)}
                title="Agence créée avec succès"
                message="L'agence 'Agence Centre-Ville' a été ajoutée à votre réseau. Vous pouvez maintenant configurer ses services."
                secondaryMessage="Identifiant #AG-2024-005"
                actionLabel="Voir les détails"
                onAction={() => setIsSuccessModalOpen(false)} // Later navigate
            />
        </div>
    );
}
