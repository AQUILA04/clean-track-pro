import React from 'react';
import { Info, Map, Phone, Mail, MapPin } from 'lucide-react';

interface AgencyInfoCardProps {
    address: string;
    city: string;
    postalCode: string;
    phone: string;
    email: string;
    image?: string;
}

export const AgencyInfoCard: React.FC<AgencyInfoCardProps> = ({ address, city, postalCode, phone, email, image }) => {
    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900">Informations Générales</h3>
                <Info size={18} className="text-gray-400" />
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Image / Logo */}
                <div className="w-24 h-24 bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    {/* Placeholder Logic matching design which shows a logo box */}
                    {image ? (
                        <img src={image} alt="Agency" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                        <div className="text-white text-xs text-center p-2 opacity-50">AGENCY LOGO</div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 w-full">
                    {/* Address */}
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Adresse</span>
                        <p className="text-sm font-medium text-gray-900">
                            {address}<br />
                            {postalCode} {city}, France
                        </p>
                        <a href="#" className="inline-flex items-center text-primary text-sm font-semibold mt-1 hover:underline">
                            <MapPin size={14} className="mr-1" />
                            Voir sur Google Maps
                        </a>
                    </div>

                    {/* Contact */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Téléphone</span>
                            <p className="text-sm font-medium text-gray-900">{phone}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Email de contact</span>
                            <p className="text-sm font-medium text-gray-900">{email}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
