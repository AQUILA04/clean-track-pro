import React from 'react';
import { Info, MapPin } from 'lucide-react';

interface AgencyInfoCardProps {
    address: string;
    city: string;
    postalCode: string;
    phone: string;
    email: string;
    image?: string;
}

export const AgencyInfoCard: React.FC<AgencyInfoCardProps> = ({
    address,
    city,
    postalCode,
    phone,
    email,
    image,
}) => {
    const cityLine = [postalCode, city].filter(Boolean).join(' ');
    const hasLocation = Boolean(address || cityLine);
    const mapsQuery = [address, postalCode, city, hasLocation ? 'France' : '']
        .filter(Boolean)
        .join(', ');
    const mapsUrl = hasLocation
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`
        : undefined;

    return (
        <div className="bg-card p-6 rounded-xl border border-border">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-foreground">Informations générales</h3>
                <Info size={18} className="text-muted-foreground" />
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-border">
                    {image ? (
                        <img src={image} alt="Logo agence" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-muted-foreground text-xs text-center p-2">Logo</div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 w-full">
                    <div className="space-y-1">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Adresse
                        </span>
                        {hasLocation ? (
                            <p className="text-sm font-medium text-foreground">
                                {address && (
                                    <>
                                        {address}
                                        <br />
                                    </>
                                )}
                                {cityLine}
                                {cityLine || address ? ', France' : null}
                            </p>
                        ) : (
                            <p className="text-sm font-medium text-muted-foreground">—</p>
                        )}
                        {mapsUrl && (
                            <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-primary text-sm font-semibold mt-1 hover:underline"
                            >
                                <MapPin size={14} className="mr-1" />
                                Voir sur Google Maps
                            </a>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Téléphone
                            </span>
                            <p className="text-sm font-medium text-foreground">{phone || '—'}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Email de contact
                            </span>
                            <p className="text-sm font-medium text-foreground break-all">{email || '—'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
