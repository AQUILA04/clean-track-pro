'use client';

import React, { useEffect, useState } from 'react';
import { ArticleType } from '@/types/article-type';
import { ServiceDefinition } from '@/types/service-definition';
import { ServicePrice } from '@/types/service-price';
import { articleTypeService } from '@/services/article-type.service';
import { serviceDefinitionService } from '@/services/service-definition.service';
import { pricingService } from '@/services/pricing.service';
import { ContentLoader } from '@/components/ui/loading';

export function PricingTab() {
    const [articleTypes, setArticleTypes] = useState<ArticleType[]>([]);
    const [services, setServices] = useState<ServiceDefinition[]>([]);
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [articlesData, servicesData, pricesData] = await Promise.all([
                    articleTypeService.findAll(),
                    serviceDefinitionService.findAll(),
                    pricingService.findAll(),
                ]);

                setArticleTypes(articlesData.filter((a) => a.is_active));
                setServices(servicesData.filter((s) => s.is_active));

                const priceMap: Record<string, number> = {};
                pricesData.forEach((p) => {
                    const key = `${p.article_type_id}-${p.service_definition_id}`;
                    priceMap[key] = typeof p.price === 'string' ? parseFloat(p.price) : p.price;
                });
                setPrices(priceMap);
            } catch (error) {
                console.error('Failed to load pricing data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handlePriceChange = (articleTypeId: string, serviceId: string, value: string) => {
        const key = `${articleTypeId}-${serviceId}`;
        const numValue = parseFloat(value);
        if (!isNaN(numValue) || value === '') {
            // We update local state immediately for responsiveness
            // Ideally we store strings in state to allow typing "10."
            // For simplicity, treating as number but handling updates on blur or specific save button is better.
            // Here, let's keep it simple: Just update state. But since we need to UPSERT on change/blur, 
            // let's use a "Save" button or Auto-save on blur. 
            // Auto-save on blur is better UX for large grids.
        }
    };

    const handleBlur = async (articleTypeId: string, serviceId: string, value: string) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return;
        if (numValue < 0) return; // Validation

        const key = `${articleTypeId}-${serviceId}`;
        // Optimistic update? We already have the value from input.

        try {
            // Check if value changed?
            // Since we don't store "current input value" exactly in `prices` state (it stores numbers), 
            // verifying against `prices[key]` is tricky if user deleted and retyped.
            // But we can just UPSERT.

            await pricingService.upsert({
                article_type_id: articleTypeId,
                service_definition_id: serviceId,
                price: numValue,
            });

            // Update reference state
            setPrices(prev => ({ ...prev, [key]: numValue }));

        } catch (error) {
            console.error('Failed to save price:', error);
            // Revert UI?
        }
    };

    if (loading) return <ContentLoader label="Chargement de la grille tarifaire…" />;

    if (services.length === 0 || articleTypes.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500">
                Please define both active Article Types and Services to configure pricing.
            </div>
        );
    }

    return (
        <div>
            <div className="sm:flex sm:items-center mb-6">
                <div className="sm:flex-auto">
                    <h2 className="text-base font-semibold leading-6 text-gray-900">Pricing Matrix</h2>
                    <p className="mt-2 text-sm text-gray-700">
                        Set the base prices for each Article Type and Service combination. Changes save automatically when you click away.
                    </p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                        <tr className="bg-gray-50">
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 sticky left-0 bg-gray-50 z-10">
                                Article Type
                            </th>
                            {services.map((service) => (
                                <th key={service.id} scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 min-w-[120px]">
                                    {service.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {articleTypes.map((article) => (
                            <tr key={article.id}>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 sticky left-0 bg-white z-10 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    {article.label}
                                    <div className="text-xs text-gray-500 font-normal">{article.category}</div>
                                </td>
                                {services.map((service) => {
                                    const key = `${article.id}-${service.id}`;
                                    const price = prices[key];

                                    return (
                                        <td key={service.id} className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            <div className="relative rounded-md shadow-sm">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
                                                    <span className="text-gray-500 sm:text-sm">$</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="block w-full rounded-md border-0 py-1.5 pl-7 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                                    placeholder="0.00"
                                                    defaultValue={price !== undefined ? price : ''}
                                                    onBlur={(e) => handleBlur(article.id, service.id, e.target.value)}
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
        </div>
    );
}
