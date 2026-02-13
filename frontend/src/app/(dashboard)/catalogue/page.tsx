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
import { AddServiceModal } from '@/components/catalogue/AddServiceModal';
import { laundryServiceService, LaundryServiceItem } from '@/services/laundry-service.service';
import { PricingMatrix } from '@/components/catalogue/PricingMatrix';
import { MOCK_PRICING, PricingEntry } from '@/data/mock-pricing';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { ExpressMode } from '@/components/catalogue/ExpressMode';


const USE_MOCK_DATA = false;

const TABS = [
    { id: 'types', label: "Types d'Articles" },
    { id: 'services', label: 'Services' },
    { id: 'pricing', label: 'Grille Tarifaire' },
    { id: 'express', label: 'Mode Express' },
];

// Helper to map ServiceItem to Table format
const mapServiceToTable = (s: LaundryServiceItem): LaundryService => ({
    id: s.id,
    name: s.name,
    description: s.description,
    icon: s.icon,
    color: s.color,
});

export default function CataloguePage() {
    const [activeTab, setActiveTab] = useState('types');

    // Articles State
    const [articles, setArticles] = useState<ArticleType[]>([]);
    const [articlesLoading, setArticlesLoading] = useState(true);
    const [isAddArticleModalOpen, setIsAddArticleModalOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState<ArticleType | null>(null);

    // Services State
    const [services, setServices] = useState<LaundryService[]>([]);
    const [servicesLoading, setServicesLoading] = useState(false);
    const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<LaundryService | null>(null);

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


    // Debounce search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (activeTab === 'types') {
                fetchArticles(searchQuery);
            } else if (activeTab === 'services') {
                fetchServices(searchQuery);
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, activeTab]);

    const fetchArticles = async (query?: string) => {
        console.log('Fetching articles with query:', query);
        setArticlesLoading(true);
        try {
            const data = USE_MOCK_DATA
                ? await articleTypeService.getMockArticles()
                : await articleTypeService.findAll(query);
            console.log('Fetched articles:', data);
            setArticles(data);
        } catch (error) {
            console.error('Failed to fetch articles:', error);
        } finally {
            setArticlesLoading(false);
        }
    };

    // Load services logic
    useEffect(() => {
        if (activeTab === 'services') {
            fetchServices(searchQuery);
        }
    }, [activeTab]);

    const fetchServices = async (query?: string) => {
        setServicesLoading(true);
        try {
            const data = await laundryServiceService.findAll(query);
            setServices(data.map(mapServiceToTable));
        } catch (error) {
            console.error('Failed to fetch services:', error);
        } finally {
            setServicesLoading(false);
        }
    };

    const handleAddArticle = async (data: CreateArticleTypeDto) => {
        try {
            setArticlesLoading(true);
            const newArticle = await articleTypeService.create(data);
            setArticles([...articles, newArticle]);
        } catch (error) {
            console.error("Failed to create article type", error);
        } finally {
            setArticlesLoading(false);
        }
    };

    const handleDeleteArticle = async (article: ArticleType, confirmed: boolean = false) => {
        if (!confirmed) {
            if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
                handleDeleteArticle(article, true);
            }
            return;
        }

        try {
            setArticlesLoading(true);
            await articleTypeService.delete(article.id);
            setArticles(articles.filter(a => a.id !== article.id));
        } catch (error) {
            console.error("Failed to delete article", error);
        } finally {
            setArticlesLoading(false);
        }
    }

    const handleSaveService = async (data: { name: string; description: string }) => {
        try {
            setServicesLoading(true);
            if (editingService) {
                const updated = await laundryServiceService.update(editingService.id, {
                    label: data.name,
                    description: data.description,
                });
                setServices(services.map(s => s.id === editingService.id ? mapServiceToTable(updated) : s));
            } else {
                const newService = await laundryServiceService.create({
                    label: data.name,
                    description: data.description,
                });
                setServices([...services, mapServiceToTable(newService)]);
            }
        } catch (error) {
            console.error("Failed to save service", error);
        } finally {
            setServicesLoading(false);
            setEditingService(null);
            setIsAddServiceModalOpen(false); // Ensure modal closes
        }
    };

    const handleDeleteService = async (service: LaundryService) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
            try {
                setServicesLoading(true);
                await laundryServiceService.delete(service.id);
                setServices(services.filter(s => s.id !== service.id));
            } catch (error) {
                console.error("Failed to delete service", error);
            } finally {
                setServicesLoading(false);
            }
        }
    };

    // Articles are already filtered by backend
    const filteredArticles = articles;
    // Services also filtered by backend
    const filteredServices = services;

    const handleEditArticle = (article: ArticleType) => {
        setEditingArticle(article);
        setIsAddArticleModalOpen(true);
    }

    const handleSaveArticle = async (data: CreateArticleTypeDto) => {
        if (editingArticle) {
            try {
                setArticlesLoading(true);
                const updated = await articleTypeService.update(editingArticle.id, data);
                setArticles(articles.map(a => a.id === editingArticle.id ? updated : a));
            } catch (error) {
                console.error("Failed to update article", error);
            } finally {
                setArticlesLoading(false);
                setEditingArticle(null);
            }
        } else {
            await handleAddArticle(data);
        }
    };


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
                onClose={() => {
                    setIsAddArticleModalOpen(false);
                    setEditingArticle(null);
                }}
                onSubmit={handleSaveArticle}
                initialData={editingArticle}
            />

            <AddServiceModal
                isOpen={isAddServiceModalOpen}
                onClose={() => {
                    setIsAddServiceModalOpen(false);
                    setEditingService(null);
                }}
                onSubmit={handleSaveService}
                initialData={editingService}
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
                                onEdit={(article) => handleEditArticle(article)}
                                onDelete={(article) => handleDeleteArticle(article)}
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
                    servicesLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : (
                        <>
                            <ServiceTable
                                services={services}
                                onEdit={(service) => {
                                    setEditingService(service);
                                    setIsAddServiceModalOpen(true);
                                }}
                                onDelete={(service) => handleDeleteService(service)}
                            />
                            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                                <div>
                                    Affichage de {services.length} service{services.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </>
                    )
                )}

                {activeTab === 'pricing' && (
                    <PricingMatrix
                        articles={filteredArticles}
                        services={services}
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
            {activeTab !== 'express' && (
                <CatalogueStats
                    stats={{
                        totalArticles: articles.length,
                        categories: new Set(articles.map(a => a.category)).size,
                        activeServices: services.length || MOCK_STATS.activeServices
                    }}
                />
            )}
        </div>
    );
}
