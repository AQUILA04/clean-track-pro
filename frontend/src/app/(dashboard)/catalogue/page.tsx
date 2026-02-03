'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus } from 'lucide-react';
import { CatalogueTabs } from '@/components/catalogue/CatalogueTabs';
import { ArticleTable } from '@/components/catalogue/ArticleTable';
import { CatalogueStats } from '@/components/catalogue/CatalogueStats';
import { articleTypeService, ArticleType } from '@/services/article-type.service';
import { AddArticleModal } from '@/components/catalogue/AddArticleModal';
import { CreateArticleTypeDto } from '@/types/article-type';
import { MOCK_STATS } from '@/data/mock-articles';
import { UserFilters } from '@/components/users/UserFilters';
import { ServiceTable, LaundryService } from '@/components/catalogue/ServiceTable';
import { MOCK_SERVICES } from '@/data/mock-services';
import { AddServiceModal } from '@/components/catalogue/AddServiceModal';
import { PricingMatrix } from '@/components/catalogue/PricingMatrix';
import { MOCK_PRICING, PricingEntry } from '@/data/mock-pricing';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { ExpressMode } from '@/components/catalogue/ExpressMode';


const USE_MOCK_DATA = true;

const TABS = [
    { id: 'types', label: "Types d'Articles" },
    { id: 'services', label: 'Services' },
    { id: 'pricing', label: 'Grille Tarifaire' },
    { id: 'express', label: 'Mode Express' },
];

export default function CataloguePage() {
    const [activeTab, setActiveTab] = useState('types');

    // Articles State
    const [articles, setArticles] = useState<ArticleType[]>([]);
    const [articlesLoading, setArticlesLoading] = useState(true);
    const [isAddArticleModalOpen, setIsAddArticleModalOpen] = useState(false);

    // Services State
    const [services, setServices] = useState<LaundryService[]>([]);
    const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');

    const [pricingState, setPricingState] = useState<PricingEntry[]>(MOCK_PRICING);
    // Deep copy for initial state comparison effectively
    const [initialPricingState, setInitialPricingState] = useState<string>(JSON.stringify(MOCK_PRICING));
    const [isPricingDirty, setIsPricingDirty] = useState(false);

    const [confirmationModal, setConfirmationModal] = useState<{
        isOpen: boolean;
        pendingTab: string | null;
    }>({
        isOpen: false,
        pendingTab: null
    });

    useEffect(() => {
        setIsPricingDirty(JSON.stringify(pricingState) !== initialPricingState);
    }, [pricingState, initialPricingState]);

    // Protect against closing window/refreshing when dirty
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isPricingDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isPricingDirty]);

    const handleTabChange = (newTab: string) => {
        if (isPricingDirty && activeTab === 'pricing') {
            setConfirmationModal({
                isOpen: true,
                pendingTab: newTab
            });
        } else {
            setActiveTab(newTab);
        }
    };

    const confirmTabChange = () => {
        if (confirmationModal.pendingTab) {
            // Reset state to initial
            setPricingState(JSON.parse(initialPricingState));
            setActiveTab(confirmationModal.pendingTab);
        }
        setConfirmationModal({ isOpen: false, pendingTab: null });
    };

    const cancelTabChange = () => {
        setConfirmationModal({ isOpen: false, pendingTab: null });
    };

    const handlePriceChange = (articleId: string, serviceId: string, newPrice: number | null) => {
        setPricingState(prev => {
            const exists = prev.find(p => p.articleId === articleId && p.serviceId === serviceId);
            if (exists) {
                return prev.map(p =>
                    p.articleId === articleId && p.serviceId === serviceId
                        ? { ...p, price: newPrice }
                        : p
                );
            }
            return [...prev, { articleId, serviceId, price: newPrice }];
        });
    };

    const handleSavePricing = async () => {
        console.log('Saving pricing data...', pricingState);
        await new Promise(resolve => setTimeout(resolve, 800));
        setInitialPricingState(JSON.stringify(pricingState)); // Update initial state
    };

    // ... (rest of logic) ...

    const renderActionButtons = () => {
        if (activeTab === 'types') {
            return (
                <Button
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => setIsAddArticleModalOpen(true)}
                >
                    Ajouter un article
                </Button>
            );
        } else if (activeTab === 'services') {
            return (
                <Button
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => setIsAddServiceModalOpen(true)}
                >
                    Ajouter un service
                </Button>
            );
        }
        return null;
    };

    const fetchArticles = async () => {
        setArticlesLoading(true);
        try {
            const data = USE_MOCK_DATA
                ? await articleTypeService.getMockArticles()
                : await articleTypeService.findAll();
            setArticles(data);
        } catch (error) {
            console.error('Failed to fetch articles:', error);
        } finally {
            setArticlesLoading(false);
        }
    };

    // Load services logic
    useEffect(() => {
        if (activeTab === 'services' && services.length === 0) {
            setServices(MOCK_SERVICES);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchArticles();
    }, []);

    const handleAddArticle = async (data: CreateArticleTypeDto) => {
        const newArticle: ArticleType = {
            id: Math.random().toString(),
            name: (data as any).name || data.label,
            articleId: (data as any).articleId || 'ART-XXX',
            category: data.category,
            icon: data.icon
        };
        setArticles([...articles, newArticle]);
    };

    const handleAddService = async (data: { name: string; description: string }) => {
        const newService: LaundryService = {
            id: Math.random().toString(),
            name: data.name,
            description: data.description,
            icon: 'Droplets',
            color: 'bg-blue-50 text-blue-600'
        };
        setServices([...services, newService]);
    };

    const filteredArticles = articles.filter(article =>
        article.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.articleId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase())
    );



    return (
        <div className="space-y-6">
            <ConfirmationModal
                isOpen={confirmationModal.isOpen}
                onClose={cancelTabChange}
                onConfirm={confirmTabChange}
                title="Modifications non enregistrées"
                message="Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter cette page ? Toutes les modifications seront perdues."
                confirmLabel="Quitter sans sauver"
                cancelLabel="Annuler"
                variant="warning"
            />

            <AddArticleModal
                isOpen={isAddArticleModalOpen}
                onClose={() => setIsAddArticleModalOpen(false)}
                onSubmit={handleAddArticle}
            />

            <AddServiceModal
                isOpen={isAddServiceModalOpen}
                onClose={() => setIsAddServiceModalOpen(false)}
                onSubmit={handleAddService}
            />

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestion du Catalogue</h1>
                    <p className="text-gray-500 mt-1">Gérez les types d'articles et les catégories de votre réseau de blanchisserie.</p>
                </div>
                {renderActionButtons()}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <CatalogueTabs
                    tabs={TABS}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                />

                {/* Filters (Reusing UserFilters logic for search layout) */}
                {activeTab !== 'pricing' && (
                    <div className="mb-6">
                        <UserFilters
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            onFilterClick={() => { }}
                            onExportClick={() => { }}
                        />
                    </div>
                )}

                {/* Content */}
                {activeTab === 'types' && (
                    articlesLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <>
                            <ArticleTable
                                articles={filteredArticles}
                                onEdit={(article) => console.log('Edit', article)}
                                onDelete={(article) => console.log('Delete', article)}
                            />
                            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                                <div>
                                    Affichage de {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-1 rounded hover:bg-gray-100" disabled>&lt;</button>
                                    <button className="px-3 py-1 bg-primary text-white rounded-md">1</button>
                                    <button className="p-1 rounded hover:bg-gray-100">&gt;</button>
                                </div>
                            </div>
                        </>
                    )
                )}

                {activeTab === 'services' && (
                    <>
                        <ServiceTable
                            services={filteredServices}
                            onEdit={(service) => console.log('Edit', service)}
                            onDelete={(service) => console.log('Delete', service)}
                        />
                        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                            <div>
                                Affichage de {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'pricing' && (
                    <PricingMatrix
                        articles={filteredArticles}
                        services={services.length > 0 ? services : MOCK_SERVICES}
                        pricingData={pricingState}
                        onPriceChange={handlePriceChange}
                        isDirty={isPricingDirty}
                        onSave={handleSavePricing}
                    />
                )}

                {activeTab === 'express' && (
                    <ExpressMode
                        onSave={async (data) => {
                            console.log('Saving express settings:', data);
                            await new Promise(resolve => setTimeout(resolve, 800));
                        }}
                    />
                )}

                {activeTab !== 'types' && activeTab !== 'services' && activeTab !== 'pricing' && activeTab !== 'express' && (
                    <div className="py-12 text-center text-gray-500">
                        Contenu de l'onglet {TABS.find(t => t.id === activeTab)?.label} en cours de développement.
                    </div>
                )}
            </div>

            {/* Bottom Stats */}
            {activeTab !== 'express' && <CatalogueStats stats={MOCK_STATS} />}
        </div>
    );
}
