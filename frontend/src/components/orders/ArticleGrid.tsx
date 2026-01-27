'use client';

import React, { useEffect, useState } from 'react';
import { articleTypeService } from '../../services/article-type.service';
import { ArticleType } from '../../types/article-type';
import { useOrderDraft } from '../../context/order-draft.context';
import { pricingService } from '../../services/pricing.service';
import { ServicePrice } from '../../types/service-price'; // Assuming locally accessible if not exported from service file

interface ArticleGridProps {
    className?: string;
}

export const ArticleGrid: React.FC<ArticleGridProps> = ({ className }) => {
    const [articleTypes, setArticleTypes] = useState<ArticleType[]>([]);
    const [loading, setLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [servicePrices, setServicePrices] = useState<any[]>([]); // Cache prices
    const [touchedArticleId, setTouchedArticleId] = useState<string | null>(null); // For visual feedback
    const { addItem } = useOrderDraft();

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [types, prices] = await Promise.all([
                    articleTypeService.findAll(),
                    pricingService.findAll()
                ]);

                setArticleTypes(types.filter(t => t.is_active));
                setServicePrices(prices);
            } catch (error) {
                console.error('Failed to load data', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const handleArticleClick = async (article: ArticleType) => {
        // Find default service/price for this article
        // Strategy: find prices for this article, pick the first one (or preferably one marked default if we had that config)
        // If no price configured, fallback to manual mock for now but warn

        const pricesForArticle = servicePrices.filter(sp => sp.article_type_id === article.id);

        if (pricesForArticle.length === 0) {
            console.warn(`No service prices configured for article ${article.label}`);
            // Fallback or alert user? For now, we shouldn't add invalid items.
            // But to not block UI if config is missing, maybe add a default with 0 price?
            // "Acceptance Criteria... added ... immediately".
            // Let's create a placeholder if missing so it at least works, but ideally config exists.

            // For now, allow adding but maybe show handling logic
            /* 
            addItem({
                articleId: article.id,
                articleName: article.label,
                serviceId: 'missing-config',
                serviceName: 'No Service Configured',
                price: 0,
                icon: article.icon
            });
            */
            alert(`No services configured for ${article.label}. Please configure prices in settings.`);
            return;
        }

        // Pick the first one as default
        // Improvement: Look for a "Standard" or "Wash" service preference if possible
        const defaultPrice = pricesForArticle[0];

        addItem({
            articleId: article.id,
            articleName: article.label,
            serviceId: defaultPrice.service_definition_id,
            serviceName: defaultPrice.service_definition?.label || 'Service', // Assuming joined data or we need to lookup label
            // Note: servicePrices from findAll usually includes relations? 
            // pricingService.findAll returns existing entities. 
            // We might need to ensure the backend returns relations.
            price: Number(defaultPrice.price),
            icon: article.icon
        });

        // Visual feedback
        setTouchedArticleId(article.id);
        setTimeout(() => setTouchedArticleId(null), 200);
    };

    if (loading) {
        return <div className="p-4 text-center">Loading articles...</div>;
    }

    return (
        <div className={`grid grid-cols-3 gap-4 p-4 ${className}`}>
            {articleTypes.map((article) => (
                <button
                    key={article.id}
                    onClick={() => handleArticleClick(article)}
                    className={`flex flex-col items-center justify-center p-6 bg-white border rounded-lg shadow-sm transition-all aspect-square
                        ${touchedArticleId === article.id ? 'scale-95 bg-blue-50 ring-2 ring-blue-300' : 'hover:shadow-md hover:bg-blue-50'}
                    `}
                >
                    <div className="text-3xl mb-2">
                        {article.icon || '📦'}
                    </div>
                    <span className="font-medium text-center text-gray-800">{article.label}</span>
                </button>
            ))}
        </div>
    );
};
