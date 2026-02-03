import React from 'react';
import { Button } from '@/components/ui/Button';
import { Info } from 'lucide-react';

export const HelpCard = () => {
    return (
        <div className="bg-primary rounded-2xl p-6 text-white shadow-lg shadow-blue-900/20">
            <div className="flex items-center space-x-3 mb-4">
                <div className="bg-white rounded-full p-1 h-8 w-8 flex items-center justify-center">
                    <Info className="h-5 w-5 text-primary stroke-[3]" />
                </div>
                <h3 className="font-bold text-lg">Besoin d'aide ?</h3>
            </div>

            <p className="text-blue-50 mb-8 text-sm leading-relaxed font-medium">
                Si vous avez besoin d'assistance pour configurer votre identité visuelle,
                consultez notre guide de marque ou contactez le support.
            </p>

            <Button
                variant="secondary"
                className="w-full bg-white/20 hover:bg-white/30 text-white border-none justify-center font-semibold backdrop-blur-sm"
            >
                Consulter la documentation
            </Button>
        </div>
    );
};
