import React, { useState } from 'react';
import { Modal } from '../ui/modal';
import { CreateStorageSlotDto, StorageSlotStatus, SlotType } from '../../services/storage.service';

interface CreateSlotModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateStorageSlotDto) => Promise<void>;
    siteId: string;
}

export const CreateSlotModal: React.FC<CreateSlotModalProps> = ({ isOpen, onClose, onSubmit, siteId }) => {
    const [name, setName] = useState('');
    const [status, setStatus] = useState<StorageSlotStatus>(StorageSlotStatus.FREE);
    const [slotType, setSlotType] = useState<SlotType>(SlotType.RECEPTION);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await onSubmit({ name, status, slot_type: slotType, site_id: siteId });
            setName('');
            setStatus(StorageSlotStatus.FREE);
            setSlotType(SlotType.RECEPTION);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Échec de la création du rayon');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ajouter un rayon">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                        <p className="text-sm font-medium text-red-400">{error}</p>
                    </div>
                )}

                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                        Nom du rayon (ex. A-03, B-02)
                    </label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value.toUpperCase())}
                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                        placeholder="A-03"
                    />
                </div>

                <div>
                    <label htmlFor="slot_type" className="block text-sm font-medium text-foreground mb-2">
                        Type de rayon
                    </label>
                    <select
                        id="slot_type"
                        name="slot_type"
                        value={slotType}
                        onChange={(e) => setSlotType(e.target.value as SlotType)}
                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                        <option value={SlotType.RECEPTION}>Réception — entrée des commandes</option>
                        <option value={SlotType.DELIVERY}>Livraison — prêt pour le client</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-foreground mb-2">
                        Statut initial
                    </label>
                    <select
                        id="status"
                        name="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as StorageSlotStatus)}
                        className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                        {Object.values(StorageSlotStatus).map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-muted/50 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || !name.trim()}
                        className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                        {isSubmitting ? 'Création...' : 'Créer le rayon'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
