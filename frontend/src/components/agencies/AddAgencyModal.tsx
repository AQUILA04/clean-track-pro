import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Building2, MapPin, UploadCloud } from 'lucide-react';

interface AddAgencyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const AddAgencyModal: React.FC<AddAgencyModalProps> = ({ isOpen, onClose, onSuccess }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            {/* Custom Header Section inside Modal Body for now or leverage Title if we refactor heavily. 
                Given current Modal structure, we'll put the custom header visuals here and leave title empty or use it for the main text.
            */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                    <div className="p-1 bg-primary/10 rounded">
                        <Building2 size={16} className="text-primary" />
                    </div>
                    <span className="text-xs font-bold text-gray-500 tracking-wider uppercase">Admin Panel</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Ajouter une nouvelle agence</h2>
                <p className="text-sm text-gray-500 mt-1">Configurez les détails de votre nouveau point de service.</p>
            </div>

            <div className="space-y-4">
                {/* Agency Name */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Nom de l'agence</label>
                    <Input placeholder="Ex: Agence Centre-Ville" className="w-full" />
                </div>

                {/* Address */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Adresse complète</label>
                    <div className="relative">
                        <Input placeholder="Saisissez l'adresse..." className="w-full pr-10" />
                        <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    </div>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Téléphone</label>
                    <Input placeholder="+33 0 00 00 00 00" className="w-full" />
                </div>

                {/* Logo Upload */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Logo de l'agence</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group">
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                            <UploadCloud className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold text-primary">Cliquez pour parcourir</span> ou glissez-déposez le logo ici
                        </p>
                        <p className="text-xs text-gray-400 mt-1">PNG, JPG ou SVG (max. 2MB)</p>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-8 flex justify-end gap-3 border-t pt-4">
                <Button variant="ghost" className="text-gray-700 hover:bg-gray-100 hover:text-gray-900" onClick={onClose}>
                    Annuler
                </Button>
                <Button
                    className="bg-primary hover:bg-blue-700 text-white min-w-[100px]"
                    onClick={() => {
                        // Simulate API call success
                        if (onSuccess) onSuccess();
                        onClose();
                    }}
                >
                    Ajouter
                </Button>
            </div>
        </Modal>
    );
};
