import React from 'react';
import { Store } from 'lucide-react';

interface AddAgencyCardProps {
    onClick?: () => void;
}

export const AddAgencyCard: React.FC<AddAgencyCardProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="h-full w-full min-h-[380px] rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-primary/50 transition-all group flex flex-col items-center justify-center p-8 text-center cursor-pointer"
        >
            <div className="w-16 h-16 rounded-full bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center mb-6 transition-colors">
                <Store size={32} className="text-gray-400 group-hover:text-primary transition-colors" />
                <div className="absolute ml-8 mb-8">
                    {/* Small Plus Icon overlay if needed, or just keep it clean */}
                </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                Ajouter une<br />nouvelle agence
            </h3>

            <p className="text-sm text-gray-500 max-w-[200px]">
                Développez votre réseau CleanTrack Pro
            </p>
        </button>
    );
};
