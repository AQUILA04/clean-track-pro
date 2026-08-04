import React from 'react';
import { Store } from 'lucide-react';

interface AddAgencyCardProps {
    onClick?: () => void;
}

export const AddAgencyCard: React.FC<AddAgencyCardProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="h-full w-full min-h-[380px] rounded-xl border-2 border-dashed border-border bg-card/50 hover:bg-card hover:border-primary/50 transition-all duration-200 group flex flex-col items-center justify-center p-8 text-center cursor-pointer"
        >
            <div className="w-16 h-16 rounded-full bg-muted group-hover:bg-primary/10 flex items-center justify-center mb-6 transition-colors duration-150">
                <Store size={32} className="text-muted-foreground group-hover:text-primary transition-colors duration-150" />
            </div>

            <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors duration-150">
                Ajouter une<br />nouvelle agence
            </h3>

            <p className="text-sm text-muted-foreground max-w-[200px]">
                Développez votre réseau CleanTrack Pro
            </p>
        </button>
    );
};
