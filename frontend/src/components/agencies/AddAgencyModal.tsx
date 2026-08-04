import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Building2, MapPin, UploadCloud, X, Edit2, Mail, Phone } from 'lucide-react';
import { SiteService, Site } from '@/services/site.service';
import { StorageService } from '@/services/storage.service';

interface AgencyFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialData?: Site | null; // If provided, we are in Edit Mode
}

export const AgencyFormModal: React.FC<AgencyFormModalProps> = ({ isOpen, onClose, onSuccess, initialData }) => {
    const isEditMode = !!initialData;

    // Initial State
    const defaultState = {
        name: '',
        location: '', // Address
        city: '',
        postal_code: '',
        email: '',
        phone: '',
        status: 'ACTIVE',
        logoUrl: ''
    };

    const [formData, setFormData] = useState(defaultState);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Populate form when initialData changes
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                location: initialData.location || '',
                city: initialData.city || '',
                postal_code: initialData.postal_code || '',
                email: initialData.email || '',
                phone: initialData.phone || '',
                status: initialData.status || 'ACTIVE',
                logoUrl: initialData.logoUrl || ''
            });
        } else {
            setFormData(defaultState);
        }
    }, [initialData, isOpen]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // Allow re-selecting the same file later
        e.target.value = '';
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Veuillez sélectionner une image (PNG, JPEG ou SVG).');
            return;
        }

        const localPreview = URL.createObjectURL(file);
        setFormData((prev) => ({ ...prev, logoUrl: localPreview }));
        setUploading(true);

        try {
            const url = await StorageService.uploadFile(file);
            URL.revokeObjectURL(localPreview);
            setFormData((prev) => ({ ...prev, logoUrl: url }));
        } catch (error) {
            console.error('Upload failed', error);
            URL.revokeObjectURL(localPreview);
            setFormData((prev) => ({ ...prev, logoUrl: initialData?.logoUrl || '' }));
            alert(error instanceof Error ? error.message : 'Échec du téléversement du logo');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Map "address" field from UI to "location" if needed, OR keep consistent naming.
            // Backend expects "location", "city", "postal_code", etc.
            const payload = {
                ...formData,
                status: formData.status as 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
            };

            if (isEditMode && initialData) {
                await SiteService.update(initialData.id, payload);
            } else {
                await SiteService.create(payload);
            }

            if (onSuccess) onSuccess();
            onClose();
            if (!isEditMode) setFormData(defaultState); // Reset if create
        } catch (error) {
            console.error('Failed to save agency', error);
            alert(`Failed to ${isEditMode ? 'update' : 'create'} agency`);
        } finally {
            setLoading(false);
        }
    };

    const labelClass = 'text-sm font-medium text-muted-foreground';
    const iconClass = 'absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4';

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-1 bg-primary/10 rounded">
                        <Building2 size={16} className="text-primary" />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase">Admin Panel</span>
                </div>
                <h2 className="text-xl font-bold text-foreground">
                    {isEditMode ? "Modifier l'agence" : 'Ajouter une nouvelle agence'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                    {isEditMode
                        ? 'Mettez à jour les informations de ce point de service.'
                        : 'Configurez les détails de votre nouveau point de service.'}
                </p>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="space-y-1">
                    <label className={labelClass}>Nom de l&apos;agence</label>
                    <Input
                        placeholder="Ex: Agence Centre-Ville"
                        className="w-full"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>Statut</label>
                    <select
                        className="w-full rounded-md border border-border bg-card text-foreground px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                        <option value="ACTIVE">Actif</option>
                        <option value="INACTIVE">Inactif</option>
                        <option value="MAINTENANCE">Maintenance</option>
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-1">
                        <label className={labelClass}>Adresse</label>
                        <div className="relative">
                            <Input
                                placeholder="Numéro et rue..."
                                className="w-full pr-10"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                            <MapPin className={iconClass} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className={labelClass}>Ville</label>
                        <Input
                            placeholder="Ex: Paris"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className={labelClass}>Code Postal</label>
                        <Input
                            placeholder="Ex: 75001"
                            value={formData.postal_code}
                            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className={labelClass}>Téléphone</label>
                        <div className="relative">
                            <Input
                                placeholder="+33 ..."
                                className="w-full pr-10"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                            <Phone className={iconClass} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className={labelClass}>Email</label>
                        <div className="relative">
                            <Input
                                placeholder="agence@..."
                                className="w-full pr-10"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                            <Mail className={iconClass} />
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className={labelClass}>Logo de l&apos;agence</label>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/png, image/jpeg, image/svg+xml"
                        onChange={handleFileChange}
                    />

                    {!formData.logoUrl ? (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                        >
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                                {uploading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                                ) : (
                                    <UploadCloud className="h-5 w-5 text-primary" />
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                <span className="font-semibold text-primary">Cliquez pour parcourir</span> ou glissez-déposez
                            </p>
                        </div>
                    ) : (
                        <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden border border-border group">
                            <img src={formData.logoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                            {uploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                                </div>
                            )}
                            {!uploading && (
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 bg-card rounded-full border border-border hover:bg-muted text-foreground"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData((prev) => ({ ...prev, logoUrl: '' }))}
                                        className="p-2 bg-card rounded-full border border-border hover:bg-red-500/10 text-red-400"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t border-border pt-4">
                <Button
                    variant="ghost"
                    className="text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    onClick={onClose}
                >
                    Annuler
                </Button>
                <Button
                    className="bg-primary hover:bg-blue-600 text-white min-w-[100px]"
                    onClick={handleSubmit}
                    disabled={loading || uploading || !formData.name}
                >
                    {loading
                        ? isEditMode
                            ? 'Modification...'
                            : 'Ajout...'
                        : isEditMode
                          ? 'Enregistrer'
                          : 'Ajouter'}
                </Button>
            </div>
        </Modal>
    );
};
