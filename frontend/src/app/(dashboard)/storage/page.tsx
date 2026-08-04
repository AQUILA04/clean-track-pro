'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
    StorageService,
    StorageSlot,
    CreateStorageSlotDto,
} from '@/services/storage.service';
import { StorageSlotGrid } from '@/components/storage/StorageSlotGrid';
import { SlotContentsModal } from '@/components/storage/SlotContentsModal';
import { CreateSlotModal } from '@/components/storage/CreateSlotModal';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { canManageStorageSlots, getSiteIdFromSession, getSessionRoles } from '@/lib/roles';
import { useToast } from '@/components/ui/simple-toast';

export default function StoragePage() {
    const { data: session } = useSession();
    const { toast } = useToast();
    const [slots, setSlots] = useState<StorageSlot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<StorageSlot | null>(null);

    const siteId = getSiteIdFromSession(session?.user as Record<string, unknown> | undefined);
    const userRoles = getSessionRoles(session?.user);
    const canManage = canManageStorageSlots(userRoles);

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
            toast({
                title: 'Erreur',
                description: 'Impossible de charger les rayons de stockage.',
                variant: 'destructive',
            });
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
        toast({
            title: 'Rayon créé',
            description: `Le rayon ${data.name} a été ajouté.`,
            variant: 'success',
        });
        fetchSlots();
    };

    if (!session) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Connectez-vous pour gérer le stockage.
            </div>
        );
    }

    if (!siteId) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Aucun site associé à votre compte. Contactez l&apos;administrateur.
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="sm:flex sm:items-center sm:justify-between gap-4">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-bold text-foreground">Occupation visuelle des rayons</h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Suivi en temps réel de la capacité de stockage de l&apos;agence.
                    </p>
                </div>
                {canManage && (
                    <div className="mt-4 sm:mt-0 shrink-0">
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            icon={<Plus className="h-4 w-4" />}
                        >
                            Créer un rayon
                        </Button>
                    </div>
                )}
            </div>

            <div className="mt-8">
                <StorageSlotGrid
                    slots={slots}
                    isLoading={isLoading}
                    onOccupiedClick={setSelectedSlot}
                />
            </div>

            <CreateSlotModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleCreate}
                siteId={siteId}
            />

            <SlotContentsModal
                slot={selectedSlot}
                isOpen={!!selectedSlot}
                onClose={() => setSelectedSlot(null)}
            />
        </div>
    );
}
