
// Map of ArticleID -> ServiceID -> Price
export interface PricingEntry {
    articleId: string;
    serviceId: string;
    price: number | null; // null for N/A or not set
    isFixed?: boolean; // If true, maybe N/A or non-editable
}

// Generate some initial mock pricing
export const MOCK_PRICING: PricingEntry[] = [
    // Chemise (1)
    { articleId: '1', serviceId: '1', price: 5.00 }, // Lavage
    { articleId: '1', serviceId: '2', price: 3.00 }, // Repassage
    { articleId: '1', serviceId: '3', price: 8.00 }, // Nettoyage à sec
    { articleId: '1', serviceId: '4', price: 1.00 }, // Retouche (using '4' as Pliage/Retouche equivalent)

    // Pantalon (2)
    { articleId: '2', serviceId: '1', price: 6.00 },
    { articleId: '2', serviceId: '2', price: 4.00 },
    { articleId: '2', serviceId: '3', price: 9.00 },
    { articleId: '2', serviceId: '4', price: 1.00 },

    // Robe de soirée (3)
    { articleId: '3', serviceId: '1', price: 12.00 },
    { articleId: '3', serviceId: '2', price: 8.00 },
    { articleId: '3', serviceId: '3', price: 15.00 },
    { articleId: '3', serviceId: '4', price: 2.00 },

    // Couette Double (4)
    { articleId: '4', serviceId: '1', price: 25.00 },
    { articleId: '4', serviceId: '2', price: null }, // N/A
    { articleId: '4', serviceId: '3', price: 35.00 },
    { articleId: '4', serviceId: '4', price: 5.00 },

    // Veste de Costume (5)
    { articleId: '5', serviceId: '1', price: null }, // N/A
    { articleId: '5', serviceId: '2', price: 10.00 },
    { articleId: '5', serviceId: '3', price: 18.00 },
    { articleId: '5', serviceId: '4', price: null },
];
