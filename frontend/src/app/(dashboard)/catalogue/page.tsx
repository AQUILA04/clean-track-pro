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
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { ExpressMode } from '@/components/catalogue/ExpressMode';
import { pricingService } from '@/services/pricing.service';
import { PricingEntry } from '@/types/pricing';
import { useToast } from '@/components/ui/simple-toast';
import { TenantService } from '@/services/tenant.service';
import { DEFAULT_TENANT_CURRENCY } from '@/lib/currencies';
import { useTenantConfig } from '@/context/tenant-config.context';
import { ContentLoader } from '@/components/ui/loading';


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
    const { toast } = useToast();
    const { setCurrency, refresh: refreshTenantConfig } = useTenantConfig();
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

    const [pricingState, setPricingState] = useState<PricingEntry[]>([]);
    // Deep copy for initial state comparison effectively
    const [initialPricingState, setInitialPricingState] = useState<string>('[]');
    const [isPricingDirty, setIsPricingDirty] = useState(false);
    const [pricingLoading, setPricingLoading] = useState(false);

    // Express Mode State
    const [expressConfig, setExpressConfig] = useState<any>(null);
    const [expressLoading, setExpressLoading] = useState(false);

    const [confirmationModal, setConfirmationModal] = useState<{
        isOpen: boolean;
        pendingTab: string | null;
    }>({
        isOpen: false,
        pendingTab: null
    });

    const [deleteConfirm, setDeleteConfirm] = useState<{
        type: 'article' | 'service';
        id: string;
        name: string;
    } | null>(null);

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

    // Load pricing logic
    useEffect(() => {
        if (activeTab === 'pricing') {
            fetchPrices();
        }
    }, [activeTab]);

    const fetchPrices = async () => {
        setPricingLoading(true);
        try {
            const prices = await pricingService.findAll();
            // Map ServicePrice to PricingEntry
            const mappedPrices: PricingEntry[] = prices.map(p => ({
                articleId: p.article_type_id,
                serviceId: p.service_definition_id,
                price: typeof p.price === 'string' ? parseFloat(p.price) : p.price,
            }));

            setPricingState(mappedPrices);
            setInitialPricingState(JSON.stringify(mappedPrices));
        } catch (error) {
            console.error('Failed to fetch prices:', error);
        } finally {
            setPricingLoading(false);
        }
    };

    const handleSavePricing = async () => {
        if (!isPricingDirty) return;

        try {
            setPricingLoading(true);

            // Find changed items by comparing with initial state
            const initial: PricingEntry[] = JSON.parse(initialPricingState);

            // Identify items to upsert
            const itemsToUpsert = pricingState.filter(current => {
                const init = initial.find(i => i.articleId === current.articleId && i.serviceId === current.serviceId);
                // If it didn't exist and now has a value, or if value changed
                if (!init) return current.price !== null;
                return init.price !== current.price;
            });

            // Execute upserts in parallel (or sequential if one-by-one is safer, but parallel is faster)
            // Ideally backend supports bulk update, but service has upsert single.
            // We'll use Promise.all
            const upsertPromises = itemsToUpsert.map(item => {
                if (item.price === null) {
                    return pricingService.delete(item.articleId, item.serviceId);
                }

                return pricingService.upsert({
                    article_type_id: item.articleId,
                    service_definition_id: item.serviceId,
                    price: item.price
                });
            });

            await Promise.all(upsertPromises);

            // Refresh state
            setInitialPricingState(JSON.stringify(pricingState));

            toast({
                title: 'Succès',
                description: 'Tarifs mis à jour avec succès.',
                variant: 'success',
            });

        } catch (error) {
            console.error('Failed to save prices:', error);
            toast({
                title: 'Erreur',
                description: 'Une erreur est survenue lors de la sauvegarde.',
                variant: 'destructive',
            });
        } finally {
            setPricingLoading(false);
        }
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
            const data = await articleTypeService.findAll(query);
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

    const handleDeleteArticle = async (article: ArticleType) => {
        setDeleteConfirm({ type: 'article', id: article.id, name: article.label });
    };

    const handleDeleteService = async (service: LaundryService) => {
        setDeleteConfirm({ type: 'service', id: service.id, name: service.name });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        const pending = deleteConfirm;
        setDeleteConfirm(null);

        try {
            if (pending.type === 'article') {
                setArticlesLoading(true);
                await articleTypeService.delete(pending.id);
                setArticles((prev) => prev.filter((a) => a.id !== pending.id));
            } else {
                setServicesLoading(true);
                await laundryServiceService.delete(pending.id);
                setServices((prev) => prev.filter((s) => s.id !== pending.id));
            }
        } catch (error) {
            console.error(`Failed to delete ${pending.type}`, error);
        } finally {
            if (pending.type === 'article') setArticlesLoading(false);
            else setServicesLoading(false);
        }
    };

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

    // Express Mode Logic
    useEffect(() => {
        if (activeTab === 'express') {
            fetchExpressConfig();
        }
    }, [activeTab]);

    const fetchExpressConfig = async () => {
        setExpressLoading(true);
        try {
            const config = await TenantService.getCurrentTenant();
            setExpressConfig(config);
        } catch (error) {
            console.error('Failed to fetch express config:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible de charger la configuration.',
                variant: 'destructive',
            });
        } finally {
            setExpressLoading(false);
        }
    };

    const handleSaveExpressConfig = async (data: any) => {
        setExpressLoading(true);
        try {
            await TenantService.updateConfig({
                express_enabled: data.enabled,
                express_multiplier: parseFloat(data.multiplier),
                express_sla_hours: parseInt(data.guaranteedDelivery),
                currency: data.currency,
                weight_unit: data.weightUnit,
                express_visibility: data.visibility
            });

            toast({
                title: 'Succès',
                description: 'Configuration mise à jour avec succès.',
                variant: 'success',
            });

            setCurrency(data.currency);
            await refreshTenantConfig();
            // Refresh config
            fetchExpressConfig();
        } catch (error) {
            console.error('Failed to save express config:', error);
            toast({
                title: 'Erreur',
                description: 'Erreur lors de la sauvegarde.',
                variant: 'destructive',
            });
        } finally {
            setExpressLoading(false);
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

            <ConfirmationModal
                isOpen={Boolean(deleteConfirm)}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={confirmDelete}
                title={
                    deleteConfirm?.type === 'service'
                        ? 'Supprimer ce service ?'
                        : 'Supprimer cet article ?'
                }
                message={
                    deleteConfirm
                        ? `« ${deleteConfirm.name} » sera retiré définitivement du catalogue.`
                        : ''
                }
                confirmLabel="Supprimer"
                cancelLabel="Annuler"
                variant="danger"
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
                    <h1 className="text-2xl font-bold text-foreground">Gestion du Catalogue</h1>
                    <p className="text-muted-foreground mt-1">Gérez les types d'articles et les catégories de votre réseau de blanchisserie.</p>
                </div>
                {renderActionButtons()}
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
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
                            searchPlaceholder="Rechercher un article ou un service..."
                            onFilterClick={() => { }}
                            onExportClick={() => { }}
                        />
                    </div>
                )}

                {/* Content */}
                {activeTab === 'types' && (
                    articlesLoading ? (
                        <ContentLoader label="Chargement des articles…" />
                    ) : (
                        <>
                            <ArticleTable
                                articles={filteredArticles}
                                onEdit={(article) => handleEditArticle(article)}
                                onDelete={(article) => handleDeleteArticle(article)}
                            />
                            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                                <div>
                                    Affichage de {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-1 rounded hover:bg-muted" disabled>&lt;</button>
                                    <button className="px-3 py-1 bg-primary text-white rounded-md">1</button>
                                    <button className="p-1 rounded hover:bg-muted">&gt;</button>
                                </div>
                            </div>
                        </>
                    )
                )}

                {activeTab === 'services' && (
                    servicesLoading ? (
                        <ContentLoader label="Chargement des services…" />
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
                            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                                <div>
                                    Affichage de {services.length} service{services.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </>
                    )
                )}

                {activeTab === 'pricing' && (
                    pricingLoading ? (
                        <ContentLoader label="Chargement de la grille tarifaire…" />
                    ) : (
                        <PricingMatrix
                            articles={filteredArticles}
                            services={services}
                            pricingData={pricingState}
                            onPriceChange={handlePriceChange}
                            isDirty={isPricingDirty}
                            onSave={handleSavePricing}
                        />
                    )
                )}



                {activeTab === 'express' && (
                    expressLoading ? (
                        <ContentLoader label="Chargement du mode express…" />
                    ) : (
                        <ExpressMode
                            initialData={expressConfig ? {
                                enabled: expressConfig.express_enabled,
                                multiplier: expressConfig.express_multiplier?.toString() || '1.5',
                                guaranteedDelivery: expressConfig.express_sla_hours?.toString() || '24',
                                currency: expressConfig.currency || DEFAULT_TENANT_CURRENCY,
                                weightUnit: expressConfig.weight_unit || 'Kilogrammes (kg)',
                                visibility: expressConfig.express_visibility || {
                                    showTTC: true,
                                    allowDiscounts: true,
                                    showInventory: false
                                }
                            } : undefined}
                            onSave={handleSaveExpressConfig}
                        />
                    )
                )}

                {activeTab !== 'types' && activeTab !== 'services' && activeTab !== 'pricing' && activeTab !== 'express' && (
                    <div className="py-12 text-center text-muted-foreground">
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
