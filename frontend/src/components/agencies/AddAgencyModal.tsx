import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Building2, MapPin, UploadCloud, X, Edit2, Mail, Phone, Globe } from 'lucide-react';
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
        if (!file) return;

        setUploading(true);
        try {
            const url = await StorageService.uploadFile(file);
            setFormData(prev => ({ ...prev, logoUrl: url }));
        } catch (error) {
            console.error('Upload failed', error);
            alert('Failed to upload logo');
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

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-1 bg-primary/10 rounded">
                        <Building2 size={16} className="text-primary" />
                    </div>
                    <span className="text-xs font-bold text-gray-500 tracking-wider uppercase">Admin Panel</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                    {isEditMode ? "Modifier l'agence" : "Ajouter une nouvelle agence"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    {isEditMode ? "Mettez à jour les informations de ce point de service." : "Configurez les détails de votre nouveau point de service."}
                </p>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {/* Agency Name */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Nom de l'agence</label>
                    <Input
                        placeholder="Ex: Agence Centre-Ville"
                        className="w-full"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </div>

                {/* Status Selection (Only if Edit, or allowed on Create?) */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Statut</label>
                    <select
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                        <option value="ACTIVE">Actif</option>
                        <option value="INACTIVE">Inactif</option>
                        <option value="MAINTENANCE">Maintenance</option>
                    </select>
                </div>

                {/* Address Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-sm font-medium text-gray-700">Adresse</label>
                        <div className="relative">
                            <Input
                                placeholder="Numéro et rue..."
                                className="w-full pr-10"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                            <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Ville</label>
                        <Input
                            placeholder="Ex: Paris"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Code Postal</label>
                        <Input
                            placeholder="Ex: 75001"
                            value={formData.postal_code}
                            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        />
                    </div>
                </div>

                {/* Contact Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Téléphone</label>
                        <div className="relative">
                            <Input
                                placeholder="+33 ..."
                                className="w-full pr-10"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <div className="relative">
                            <Input
                                placeholder="agence@..."
                                className="w-full pr-10"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                        </div>
                    </div>
                </div>

                {/* Logo Upload */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Logo de l'agence</label>
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
                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group"
                        >
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                                {uploading ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                                ) : (
                                    <UploadCloud className="h-5 w-5 text-primary" />
                                )}
                            </div>
                            <p className="text-sm text-gray-600">
                                <span className="font-semibold text-primary">Cliquez pour parcourir</span> ou glissez-déposez
                            </p>
                        </div>
                    ) : (
                        <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                            <img src={formData.logoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 text-gray-700"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
                                    className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 text-red-600"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-8 flex justify-end gap-3 border-t pt-4">
                <Button variant="ghost" className="text-gray-700 hover:bg-gray-100 hover:text-gray-900" onClick={onClose}>
                    Annuler
                </Button>
                <Button
                    className="bg-primary hover:bg-blue-700 text-white min-w-[100px]"
                    onClick={handleSubmit}
                    disabled={loading || uploading || !formData.name}
                >
                    {loading ? (isEditMode ? 'Modification...' : 'Ajout...') : (isEditMode ? 'Enregistrer' : 'Ajouter')}
                </Button>
            </div>
        </Modal>
    );
};
