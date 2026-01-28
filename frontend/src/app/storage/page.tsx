'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { StorageService, StorageSlot, CreateStorageSlotDto } from '../../services/storage.service';
import { StorageSlotList } from '../../components/storage/StorageSlotList';
import { CreateSlotModal } from '../../components/storage/CreateSlotModal';

export default function StoragePage() {
    const { data: session } = useSession();
    const [slots, setSlots] = useState<StorageSlot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Default to first site or empty string if not available
    const siteId = (session?.user as any)?.site_ids?.[0] || '';

    const fetchSlots = async () => {
        if (!siteId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const data = await StorageService.getAll(siteId);
            setSlots(data);
        } catch (error) {
            console.error('Failed to fetch slots', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session?.user) {
            fetchSlots();
        }
    }, [session, siteId]);

    const handleCreate = async (data: CreateStorageSlotDto) => {
        await StorageService.create(data);
        fetchSlots();
    };

    // Check for admin role
    const userRoles = (session?.user as any)?.roles || [];
    const isAdmin = userRoles.includes('realm:Admin_Site') || userRoles.includes('realm:Super_Admin') || userRoles.includes('Admin_Site'); // Flexible check

    if (!session) {
        return <div className="p-8 text-center">Please log in to manage storage.</div>;
    }

    if (!siteId) {
        return <div className="p-8 text-center">No site assigned to your account. Please contact administrator.</div>;
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-base font-semibold leading-6 text-gray-900">Storage Configuration</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Manage physical storage slots for your facility.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            Add Slot
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-8 flow-root">
                <StorageSlotList slots={slots} isLoading={isLoading} />
            </div>

            <CreateSlotModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreate}
                siteId={siteId}
            />
        </div>
    );
}
