import React, { useState, useEffect } from 'react';
import { ArticleType } from '@/services/article-type.service';
import { LaundryService } from '@/components/catalogue/ServiceTable';
import { PricingEntry } from '@/types/pricing';
import { Shirt, Ticket, Bed, Briefcase, Gem, Droplets, Wind, SprayCan, Scissors } from 'lucide-react';

interface PricingGridProps {
    articles: ArticleType[];
    services: LaundryService[];
    initialPricing: PricingEntry[];
    onPriceChange: (articleId: string, serviceId: string, newPrice: number | null) => void;
}

const IconMap: Record<string, React.ReactNode> = {
    'Shirt': <Shirt className="h-4 w-4 text-blue-500" />,
    'Ticket': <Ticket className="h-4 w-4 text-purple-500" />,
    'Bed': <Bed className="h-4 w-4 text-green-500" />,
    'Briefcase': <Briefcase className="h-4 w-4 text-orange-500" />,
    'Gem': <Gem className="h-4 w-4 text-pink-500" />,
    'Droplets': <Droplets className="h-3 w-3" />,
    'Wind': <Wind className="h-3 w-3" />,
    'SprayCan': <SprayCan className="h-3 w-3" />,
    'Scissors': <Scissors className="h-3 w-3" />,
};

export const PricingGrid: React.FC<PricingGridProps> = ({ articles, services, initialPricing, onPriceChange }) => {
    const [pricingMap, setPricingMap] = useState<Record<string, number | null>>({});

    useEffect(() => {
        const map: Record<string, number | null> = {};
        initialPricing.forEach(p => {
            map[`${p.articleId}-${p.serviceId}`] = p.price;
        });
        setPricingMap(map);
    }, [initialPricing]);

    const handleInputChange = (articleId: string, serviceId: string, value: string) => {
        const numValue = value === '' ? null : parseFloat(value);
        const key = `${articleId}-${serviceId}`;
        setPricingMap(prev => ({ ...prev, [key]: numValue }));
        onPriceChange(articleId, serviceId, numValue);
    };

    const getPrice = (articleId: string, serviceId: string) => {
        const val = pricingMap[`${articleId}-${serviceId}`];
        return val === undefined ? null : val;
    };

    return (
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r border-gray-200 min-w-[200px]">
                            Type d'article
                            <span className="ml-1 text-gray-400">↕</span>
                        </th>
                        {services.map(service => (
                            <th key={service.id} scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[140px]">
                                <div className="flex flex-col items-center gap-1">
                                    <span>{service.name}</span>
                                    {service.color && (
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${service.color.replace('text-', 'bg-').replace('bg-', 'text-opacity-20 ')} bg-opacity-10`}>
                                            {/* Logic to extract simple badge style if needed, or just use hardcoded classes for now */}
                                            {service.name === 'Lavage' ? 'Automatisé' :
                                                service.name === 'Repassage' ? 'Manuel' :
                                                    service.name === 'Nettoyage à sec' ? 'Spécialisé' : 'Add-on'}
                                        </span>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {articles.map((article) => (
                        <tr key={article.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-9 w-9 bg-blue-50 rounded-lg flex items-center justify-center">
                                        {IconMap[article.icon || 'Shirt'] || <Shirt className="h-4 w-4 text-gray-400" />}
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-bold text-gray-900">{article.name}</div>
                                    </div>
                                </div>
                            </td>
                            {services.map(service => {
                                const price = getPrice(article.id, service.id);
                                const isNA = price === null && pricingMap[`${article.id}-${service.id}`] === null; // Explicit nullcheck from init

                                return (
                                    <td key={service.id} className="px-4 py-4 whitespace-nowrap text-center">
                                        <div className="relative flex items-center justify-center group">
                                            <span className={`text-gray-400 text-sm absolute left-6 ${price === null ? 'opacity-30' : ''}`}>€</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className={`block w-24 pl-6 pr-2 py-1.5 text-sm font-bold text-gray-900 border-0 border-b border-transparent bg-transparent text-center focus:ring-0 focus:border-primary hover:bg-gray-50 rounded transition-colors ${price === null ? 'text-gray-400' : ''}`}
                                                value={price ?? ''}
                                                placeholder="-"
                                                onChange={(e) => handleInputChange(article.id, service.id, e.target.value)}
                                            />
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
