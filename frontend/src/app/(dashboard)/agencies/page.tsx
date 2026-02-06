'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AgencyCard, Agency } from '@/components/agencies/AgencyCard';
import { AddAgencyCard } from '@/components/agencies/AddAgencyCard';
import { AgencyFilters } from '@/components/agencies/AgencyFilters';
import { AgencyFormModal } from '@/components/agencies/AddAgencyModal'; // Updated export name
import { SuccessModal } from '@/components/ui/SuccessModal';
import { SiteService, Site } from '@/services/site.service';

export default function AgenciesPage() {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'>('ALL');

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    useEffect(() => {
        fetchAgencies();
    }, [debouncedQuery]);

    const fetchAgencies = async () => {
        try {
            setLoading(true);
            const sites = await SiteService.getAll(debouncedQuery);
            // Transform Site data to Agency UI model
            const mappedAgencies: Agency[] = sites.map((site: Site) => ({
                id: site.id,
                name: site.name,
                city: site.city || (site.location ? site.location.split(',').pop()?.trim() : 'Unknown') || 'Unknown',
                postalCode: site.postal_code || '00000',
                status: (site.status as any) || 'ACTIVE', // Ensure status is mapped
                revenue: 0,
                revenueTrend: 0,
                orders: 0,
                image: site.logoUrl,
                managers: []
            }));
            setAgencies(mappedAgencies);
        } catch (error) {
            console.error('Failed to fetch agencies', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAgencyAdded = () => {
        setIsSuccessModalOpen(true);
        fetchAgencies(); // Refresh list
    };

    // Client-side status filtering on the already searched results
    // Or should we move status filtering to backend too? 
    // For now, let's keep status filtering client-side as it is fast on the result set
    const filteredAgencies = agencies.filter(agency => {
        if (filter === 'ALL') return true;
        return agency.status === filter;
    });

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
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
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
                            Mis à jour à l'instant
                        </p>
                    </div>

                </div>

                <div className="h-8" /> {/* Spacer */}

                {/* Filters */}
                <AgencyFilters
                    currentFilter={filter}
                    onFilterChange={setFilter}
                    totalCount={agencies.length}
                />

                {/* Grid */}
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Chargement des agences...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredAgencies.map((agency) => (
                            <AgencyCard key={agency.id} agency={agency} />
                        ))}
                        <AddAgencyCard onClick={() => setIsAddModalOpen(true)} />
                    </div>
                )}
            </div>

            {/* Modals */}
            <AgencyFormModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={handleAgencyAdded}
            />

            <SuccessModal
                isOpen={isSuccessModalOpen}
                onClose={() => setIsSuccessModalOpen(false)}
                title="Agence créée avec succès"
                message="La nouvelle agence a été ajoutée à votre réseau. Vous pouvez maintenant configurer ses services."
                secondaryMessage="Action terminée"
                actionLabel="Fermer"
                onAction={() => setIsSuccessModalOpen(false)}
            />
        </div>
    );
}
