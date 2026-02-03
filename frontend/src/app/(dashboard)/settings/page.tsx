"use client";

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Image as ImageIcon,
    Building2,
    FileText,
    Upload,
    Globe,
    ArrowUpRight
} from 'lucide-react';
import { BrandPreview } from '@/components/settings/BrandPreview';
import { HelpCard } from '@/components/settings/HelpCard';
import { FileUploader } from '@/components/settings/FileUploader';

export default function SettingsPage() {
    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Paramètres Généraux & Branding</h1>
                    <p className="text-gray-500 mt-2 text-lg">
                        Gérez votre image de marque en marque blanche et les informations de votre entreprise.
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="secondary" className="bg-white hover:bg-gray-50 text-gray-700 border-gray-200">
                        Annuler
                    </Button>
                    <Button className="bg-primary hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30">
                        Enregistrer les modifications
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Left Column */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Identité Visuelle */}
                    <Card className="border-none shadow-sm">
                        <div className="flex items-center space-x-2 mb-6">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <ImageIcon className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Identité Visuelle</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FileUploader
                                title="Logo Principal du Réseau"
                                icon={Upload}
                                label="Cliquer pour uploader"
                                sublabel="Recommandé : 500x200px PNG ou SVG transparent"
                            />
                            <FileUploader
                                title="Favicon du site"
                                icon={Globe}
                                label="Choisir un fichier"
                                sublabel="32x32px (ICO ou PNG)"
                                aspectRatio="square"
                            />
                        </div>
                    </Card>

                    {/* Informations Entreprise */}
                    <Card className="border-none shadow-sm">
                        <div className="flex items-center space-x-2 mb-6">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Informations Entreprise</h2>
                        </div>

                        <div className="space-y-6">
                            <Input
                                label="Nom de l'entreprise"
                                defaultValue="CleanTrack Solutions SARL"
                                className="border-gray-200"
                            />

                            <div className="w-full">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Adresse du siège social
                                </label>
                                <textarea
                                    className="w-full p-4 bg-white border border-gray-200 rounded-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all min-h-[100px]"
                                    defaultValue="15 Rue de l'Innovation, 75008 Paris, France"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Branding Information */}
                    <Card className="border-none shadow-sm">
                        <div className="flex items-center space-x-2 mb-6">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Informations de facturation & Légales</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Numéro de SIRET"
                                defaultValue="123 456 789 00012"
                                className="border-gray-200 font-mono text-gray-600"
                            />
                            <Input
                                label="Numéro de TVA Intracommunautaire"
                                defaultValue="FR 12 345678901"
                                className="border-gray-200 font-mono text-gray-600"
                            />
                        </div>
                    </Card>
                </div>

                {/* Sidebar - Right Column */}
                <div className="space-y-6">
                    <BrandPreview />
                    <HelpCard />
                </div>
            </div>
        </div>
    );
}
