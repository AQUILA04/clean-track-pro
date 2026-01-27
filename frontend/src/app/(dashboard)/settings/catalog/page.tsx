'use client';

import React, { useState } from 'react';
import { ArticleTypesTab } from './components/ArticleTypesTab';
import { ServicesTab } from './components/ServicesTab';
import { PricingTab } from './components/PricingTab';

type Tab = 'articles' | 'services' | 'pricing';

export default function CatalogPage() {
    const [currentTab, setCurrentTab] = useState<Tab>('articles');

    const tabs = [
        { id: 'articles', name: 'Article Types', component: ArticleTypesTab },
        { id: 'services', name: 'Services', component: ServicesTab },
        { id: 'pricing', name: 'Pricing', component: PricingTab },
    ];

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Catalog Configuration
                    </h1>
                </div>
            </div>

            <div className="mb-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setCurrentTab(tab.id as Tab)}
                                className={`
                  ${currentTab === tab.id
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                    }
                  whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
                `}
                                aria-current={currentTab === tab.id ? 'page' : undefined}
                            >
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="mt-4">
                {currentTab === 'articles' && <ArticleTypesTab />}
                {currentTab === 'services' && <ServicesTab />}
                {currentTab === 'pricing' && <PricingTab />}
            </div>
        </div>
    );
}
