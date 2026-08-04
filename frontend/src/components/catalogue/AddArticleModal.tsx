import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Shirt, Ticket, Bed, Briefcase, Gem, X, Plus } from 'lucide-react';
import { ArticleType } from '@/services/article-type.service';
import { CreateArticleTypeDto } from '@/types/article-type';

interface AddArticleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateArticleTypeDto) => Promise<void>;
    initialData?: ArticleType | null;
}

const AVAILABLE_ICONS = [
    { id: 'Shirt', component: <Shirt className="h-6 w-6" /> },
    { id: 'Ticket', component: <Ticket className="h-6 w-6" /> },
    { id: 'Bed', component: <Bed className="h-6 w-6" /> },
    { id: 'Briefcase', component: <Briefcase className="h-6 w-6" /> },
    { id: 'Gem', component: <Gem className="h-6 w-6" /> },
    // Add more placeholders to match grid 
    { id: 'Home', component: <div className="h-6 w-6 border-2 border-current rounded-sm" /> },
    { id: 'Box', component: <div className="h-6 w-6 bg-current rounded-sm opacity-50" /> },
    { id: 'Tag', component: <div className="h-6 w-6 rounded-full border-2 border-current" /> },
];

export const AddArticleModal: React.FC<AddArticleModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('Shirt');
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name || initialData.label || '');
            setCategory(initialData.category || '');
            setSelectedIcon(initialData.icon || 'Shirt');
        } else if (isOpen && !initialData) {
            setName('');
            setCategory('');
            setSelectedIcon('Shirt');
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSubmit({
                label: name,
                category,
                icon: selectedIcon,
                articleId: `ART-${Math.floor(Math.random() * 1000)}`
            });
            onClose();
            setName('');
            setCategory('');
            setSelectedIcon('Shirt');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-[600px] p-6 relative">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center text-white">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 4V20H20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-foreground">
                            {initialData ? 'Modifier l\'article' : 'Ajouter un nouvel article'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Nom de l'article</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Chemise"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Catégorie</label>
                        <div className="relative">
                            <select
                                className="w-full appearance-none rounded-lg border border-border py-3 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-card"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                required
                            >
                                <option value="" disabled>Choisir une catégorie</option>
                                <option value="VÊTEMENTS">VÊTEMENTS</option>
                                <option value="LINGE DE MAISON">LINGE DE MAISON</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Sélecteur d'icône</label>
                        <div className="bg-muted/50 rounded-xl p-6 border border-border">
                            <div className="grid grid-cols-6 gap-4">
                                {AVAILABLE_ICONS.map((icon) => (
                                    <button
                                        key={icon.id}
                                        type="button"
                                        onClick={() => setSelectedIcon(icon.id)}
                                        className={`
                                            h-12 w-12 flex items-center justify-center rounded-lg transition-all
                                            ${selectedIcon === icon.id
                                                ? 'bg-primary/10 text-primary ring-2 ring-primary ring-offset-2 ring-offset-card'
                                                : 'text-muted-foreground hover:text-foreground hover:bg-card'
                                            }
                                        `}
                                    >
                                        {icon.component}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Annuler
                        </button>
                        <Button
                            type="submit"
                            isLoading={loading}
                        >
                            {initialData ? 'Modifier' : 'Ajouter l\'article'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
